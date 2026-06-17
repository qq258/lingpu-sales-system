import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { storeScopeMiddleware } from '../middleware/store-scope';
import { generateOrderNo } from '../utils/order-no';

const router = Router();

router.use(authMiddleware);
router.use(storeScopeMiddleware);

function getStoreId(req: Request): number | null {
  return (req as any).effectiveStoreId ?? null;
}

// POST /api/v1/after-sales — 创建工单
router.post('/', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }

    const { imei_id, customer_name, customer_phone, customer_address, fault_description,
      detection_result, process_type, repair_level, cost, cost_remark,
      supplier_contact, supplier_status, supplier_result } = req.body;

    if (!imei_id) {
      const r: ApiResponse = { code: 400, message: '请选择手机' };
      return res.status(400).json(r);
    }
    if (!fault_description) {
      const r: ApiResponse = { code: 400, message: '请描述故障或售后原因' };
      return res.status(400).json(r);
    }

    // 验证 IMEI 存在
    const imei = await prisma.wh_inventory_imei.findUnique({ where: { id: imei_id } });
    if (!imei) {
      const r: ApiResponse = { code: 404, message: '未找到该手机' };
      return res.status(404).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
    const orderNo = await generateOrderNo('AS', store!.code);

    // 如果指定了处理方式且设定了检测结果，自动将状态推进到 detecting
    let initialStatus = 'pending';
    if (detection_result) {
      initialStatus = 'detecting';
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.after_sale_order.create({
        data: {
          order_no: orderNo,
          store_id: storeId,
          imei_id,
          customer_name: customer_name || '',
          customer_phone: customer_phone || '',
          customer_address: customer_address || '',
          fault_description,
          detection_result: detection_result || '',
          process_type: process_type || '',
          repair_level: repair_level || '',
          cost: cost || 0,
          cost_remark: cost_remark || '',
          supplier_contact: supplier_contact || '',
          supplier_status: supplier_status || 'none',
          supplier_result: supplier_result || '',
          handler_id: req.user!.userId,
          status: initialStatus,
        },
        include: {
          handler: { select: { id: true, real_name: true } },
        },
      });

      // 创建初始日志
      let logContent = `创建售后工单，故障描述：${fault_description}`;
      if (detection_result) logContent += `，检测结果：${detection_result}`;
      if (process_type) {
        const ptLabels: Record<string, string> = { repair: '维修', exchange: '换货', refund: '退款' };
        logContent += `，处理方式：${ptLabels[process_type] || process_type}`;
      }
      await tx.after_sale_log.create({
        data: {
          order_id: order.id,
          action: 'created',
          operator_id: req.user!.userId,
          content: logContent,
        },
      });

      return order;
    });

    const r: ApiResponse = { code: 200, message: '工单创建成功', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// GET /api/v1/after-sales — 工单列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    const { keyword, status, process_type, start_date, end_date, page = '1', pageSize = '20' } = req.query;

    const where: any = {};

    if (storeId) {
      where.store_id = storeId;
    }
    if (status) where.status = status;
    if (process_type) where.process_type = process_type;

    if (keyword) {
      where.OR = [
        { order_no: { contains: keyword as string } },
        { customer_name: { contains: keyword as string } },
        { customer_phone: { contains: keyword as string } },
      ];
    }

    if (start_date) {
      where.created_at = { ...where.created_at, gte: new Date(start_date as string) };
    }
    if (end_date) {
      where.created_at = { ...where.created_at, lte: new Date(end_date as string + 'T23:59:59.999Z') };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    const [list, total] = await Promise.all([
      prisma.after_sale_order.findMany({
        where,
        skip,
        take: parseInt(pageSize as string),
        orderBy: { created_at: 'desc' },
        include: {
          handler: { select: { id: true, real_name: true } },
        },
      }),
      prisma.after_sale_order.count({ where }),
    ]);

    // 手动附加 IMEI 信息
    const listWithImei = await Promise.all(list.map(async (item) => {
      const imei = item.imei_id ? await prisma.wh_inventory_imei.findUnique({
        where: { id: item.imei_id },
        include: { model: { include: { brand: { select: { name: true } } } } },
      }) : null;
      return { ...item, imei };
    }));

    const r: ApiResponse = { code: 200, message: 'ok', data: { list: listWithImei, total } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// GET /api/v1/after-sales/:id — 工单详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.after_sale_order.findUnique({
      where: { id },
      include: {
        handler: { select: { id: true, real_name: true } },
        logs: {
          include: { operator: { select: { id: true, real_name: true } } },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!order) {
      const r: ApiResponse = { code: 404, message: '工单不存在' };
      return res.status(404).json(r);
    }

    // 手动查询 IMEI 信息
    const imei = await prisma.wh_inventory_imei.findUnique({
      where: { id: order.imei_id },
      include: {
        model: { include: { brand: { select: { name: true } } } },
      },
    });

    const r: ApiResponse = { code: 200, message: 'ok', data: { ...order, imei } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// PUT /api/v1/after-sales/:id — 更新工单
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { detection_result, process_type, repair_level, status, cost, cost_remark, supplier_contact, supplier_status, supplier_result, exchange_model_id, exchange_imei_id, result } = req.body;

    const existing = await prisma.after_sale_order.findUnique({ where: { id } });
    if (!existing) {
      const r: ApiResponse = { code: 404, message: '工单不存在' };
      return res.status(404).json(r);
    }

    const updateData: any = {};
    if (detection_result !== undefined) updateData.detection_result = detection_result;
    if (process_type !== undefined) updateData.process_type = process_type;
    if (repair_level !== undefined) updateData.repair_level = repair_level;
    if (status !== undefined) updateData.status = status;
    if (cost !== undefined) updateData.cost = cost;
    if (cost_remark !== undefined) updateData.cost_remark = cost_remark;
    if (supplier_contact !== undefined) updateData.supplier_contact = supplier_contact;
    if (supplier_status !== undefined) updateData.supplier_status = supplier_status;
    if (supplier_result !== undefined) updateData.supplier_result = supplier_result;
    if (exchange_model_id !== undefined) updateData.exchange_model_id = exchange_model_id;
    if (exchange_imei_id !== undefined) updateData.exchange_imei_id = exchange_imei_id;
    if (result !== undefined) updateData.result = result;

    const resultData = await prisma.$transaction(async (tx) => {
      // 更新工单
      const updated = await tx.after_sale_order.update({
        where: { id },
        data: updateData,
        include: {
          handler: { select: { id: true, real_name: true } },
        },
      });

      // 状态变更时创建日志
      if (status && status !== existing.status) {
        const statusLabels: Record<string, string> = {
          pending: '待处理', detecting: '检测中', repairing: '维修中',
          repaired: '已维修', exchanging: '换货中', exchanged: '已换货',
          refunding: '退款中', refunded: '已退款', completed: '已完成', cancelled: '已取消',
        };
        const oldLabel = statusLabels[existing.status] || existing.status;
        const newLabel = statusLabels[status] || status;
        await tx.after_sale_log.create({
          data: {
            order_id: id,
            action: status,
            operator_id: req.user!.userId,
            content: `状态变更：${oldLabel} → ${newLabel}`,
          },
        });
      }

      // 处理方式变更日志
      if (process_type && process_type !== existing.process_type) {
        const ptLabels: Record<string, string> = {
          repair: '维修', exchange: '换货', refund: '退款',
        };
        await tx.after_sale_log.create({
          data: {
            order_id: id,
            action: process_type === 'repair' ? 'repairing' : process_type === 'exchange' ? 'exchanging' : 'refunding',
            operator_id: req.user!.userId,
            content: `处理方式设为：${ptLabels[process_type] || process_type}`,
          },
        });
      }

      // 检测结果日志
      if (detection_result !== undefined && detection_result !== existing.detection_result) {
        await tx.after_sale_log.create({
          data: {
            order_id: id,
            action: 'detected',
            operator_id: req.user!.userId,
            content: `检测结果：${detection_result}`,
          },
        });
      }

      // 换货逻辑：更新原手机 IMEI 状态，新手机出库
      if (exchange_imei_id && (process_type === 'exchange' || existing.process_type === 'exchange')) {
        // 原手机标记为 exchanged
        await tx.wh_inventory_imei.update({
          where: { id: existing.imei_id },
          data: { status: 'exchanged', after_sale_order_id: id },
        });
        // 新手机标记为 sold（从库存出库）
        if (exchange_imei_id && exchange_imei_id !== existing.imei_id) {
          await tx.wh_inventory_imei.update({
            where: { id: exchange_imei_id },
            data: { status: 'sold' },
          });
          // 库存扣减
          const modelId = exchange_model_id || existing.exchange_model_id;
          if (modelId) {
            const inv = await tx.wh_inventory.findUnique({
              where: { model_id_store_id: { model_id: modelId, store_id: existing.store_id } },
            });
            if (inv && inv.quantity > 0) {
              await tx.wh_inventory.update({
                where: { model_id_store_id: { model_id: modelId, store_id: existing.store_id } },
                data: { quantity: { decrement: 1 } },
              });
              await tx.wh_inventory_log.create({
                data: {
                  model_id: modelId,
                  store_id: existing.store_id,
                  change_type: 'exchange_out',
                  qty_before: inv.quantity,
                  qty_change: -1,
                  qty_after: inv.quantity - 1,
                  ref_type: 'after_sale',
                  ref_id: id,
                  remark: `换货出库：工单 ${existing.order_no}`,
                  operator_id: req.user!.userId,
                },
              });
            }
          }
        }
      }

      // 退款逻辑：将原手机 IMEI 状态改为 returned
      if (process_type === 'refund' && status === 'refunded') {
        await tx.wh_inventory_imei.update({
          where: { id: existing.imei_id },
          data: { status: 'returned', after_sale_order_id: id },
        });
      }

      // 维修逻辑：设置 IMEI 状态
      if (process_type === 'repair') {
        if (status === 'repairing') {
          await tx.wh_inventory_imei.update({
            where: { id: existing.imei_id },
            data: { status: 'repairing', after_sale_order_id: id },
          });
        } else if (status === 'completed' || status === 'repaired') {
          await tx.wh_inventory_imei.update({
            where: { id: existing.imei_id },
            data: { status: 'sold' },
          });
        }
      }

      // 供应商状态变更日志
      if (supplier_status && supplier_status !== existing.supplier_status) {
        const slLabels: Record<string, string> = {
          none: '无需供应商', pending: '待联系供应商', in_progress: '供应商处理中', completed: '供应商已处理',
        };
        const action = supplier_status === 'completed' ? 'supplier_done' : 'supplier_contact';
        await tx.after_sale_log.create({
          data: {
            order_id: id,
            action,
            operator_id: req.user!.userId,
            content: `供应商状态：${slLabels[supplier_status] || supplier_status}`,
          },
        });
      }

      return updated;
    });

    const r: ApiResponse = { code: 200, message: '更新成功', data: resultData };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// POST /api/v1/after-sales/:id/log — 添加操作日志
router.post('/:id/log', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { action, content } = req.body;

    if (!content) {
      const r: ApiResponse = { code: 400, message: '日志内容不能为空' };
      return res.status(400).json(r);
    }

    const order = await prisma.after_sale_order.findUnique({ where: { id: orderId } });
    if (!order) {
      const r: ApiResponse = { code: 404, message: '工单不存在' };
      return res.status(404).json(r);
    }

    const log = await prisma.after_sale_log.create({
      data: {
        order_id: orderId,
        action: action || 'remark',
        operator_id: req.user!.userId,
        content,
      },
      include: {
        operator: { select: { id: true, real_name: true } },
      },
    });

    const r: ApiResponse = { code: 200, message: 'ok', data: log };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// GET /api/v1/after-sales/:id/logs — 获取工单日志列表
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const logs = await prisma.after_sale_log.findMany({
      where: { order_id: orderId },
      include: {
        operator: { select: { id: true, real_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const r: ApiResponse = { code: 200, message: 'ok', data: logs };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// DELETE /api/v1/after-sales/:id — 删除工单
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.after_sale_order.findUnique({ where: { id } });
    if (!existing) {
      const r: ApiResponse = { code: 404, message: '工单不存在' };
      return res.status(404).json(r);
    }

    await prisma.$transaction(async (tx) => {
      // 先删日志
      await tx.after_sale_log.deleteMany({ where: { order_id: id } });
      // 再删工单
      await tx.after_sale_order.delete({ where: { id } });
    });

    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// POST /api/v1/after-sales/:id/complete — 完成工单
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.after_sale_order.findUnique({ where: { id } });
    if (!existing) {
      const r: ApiResponse = { code: 404, message: '工单不存在' };
      return res.status(404).json(r);
    }
    if (existing.status === 'completed') {
      const r: ApiResponse = { code: 400, message: '工单已完成，无需重复操作' };
      return res.status(400).json(r);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.after_sale_order.update({
        where: { id },
        data: { status: 'completed' },
        include: { handler: { select: { id: true, real_name: true } } },
      });

      // 根据处理方式更新 IMEI 状态
      if (existing.process_type === 'refund') {
        await tx.wh_inventory_imei.update({
          where: { id: existing.imei_id },
          data: { status: 'returned', after_sale_order_id: id },
        });
      } else if (existing.process_type === 'exchange' && existing.exchange_imei_id) {
        await tx.wh_inventory_imei.update({
          where: { id: existing.imei_id },
          data: { status: 'exchanged', after_sale_order_id: id },
        });
      } else if (existing.process_type === 'repair') {
        await tx.wh_inventory_imei.update({
          where: { id: existing.imei_id },
          data: { status: 'sold' },
        });
      }

      await tx.after_sale_log.create({
        data: {
          order_id: id,
          action: 'completed',
          operator_id: req.user!.userId,
          content: '工单已完成',
        },
      });

      return updated;
    });

    const r: ApiResponse = { code: 200, message: '工单已完成', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;

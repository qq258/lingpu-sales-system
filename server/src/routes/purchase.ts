import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { storeScopeMiddleware } from '../middleware/store-scope';
import { generateOrderNo } from '../utils/order-no';
import * as XLSX from 'xlsx';

const router = Router();

router.use(authMiddleware);
router.use(storeScopeMiddleware);

// ==================== 供应商管理 ====================

router.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { contact_person: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
      ];
    }
    const suppliers = await prisma.pch_supplier.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    const r: ApiResponse = { code: 200, message: 'success', data: suppliers };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const supplier = await prisma.pch_supplier.findUnique({ where: { id } });
    if (!supplier) {
      const r: ApiResponse = { code: 404, message: '供应商不存在' };
      return res.status(404).json(r);
    }
    const r: ApiResponse = { code: 200, message: 'success', data: supplier };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const { name, contact_person, phone, address, remark } = req.body;
    if (!name) {
      const r: ApiResponse = { code: 400, message: '供应商名称不能为空' };
      return res.status(400).json(r);
    }
    const supplier = await prisma.pch_supplier.create({
      data: { name, contact_person, phone, address, remark },
    });
    const r: ApiResponse = { code: 200, message: '创建成功', data: supplier };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, contact_person, phone, address, remark, status } = req.body;
    const supplier = await prisma.pch_supplier.update({
      where: { id },
      data: { name, contact_person, phone, address, remark, status },
    });
    const r: ApiResponse = { code: 200, message: '更新成功', data: supplier };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.pch_supplier.delete({ where: { id } });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导出供应商
router.get('/suppliers/export', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { contact_person: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
      ];
    }
    const suppliers = await prisma.pch_supplier.findMany({ where, orderBy: { id: 'desc' } });
    const data = suppliers.map((r) => ({
      '编号': r.id,
      '供应商名称': r.name,
      '联系人': r.contact_person || '',
      '联系电话': r.phone || '',
      '地址': r.address || '',
      '备注': r.remark || '',
      '状态': r.status === 1 ? '启用' : '禁用',
      '创建时间': r.created_at?.toISOString().slice(0, 16).replace('T', ' ') || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '供应商');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=suppliers_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// ==================== 入库单管理 ====================

function getStoreId(req: Request): number | null {
  return (req as any).effectiveStoreId ?? null;
}

router.get('/purchase-entries', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', pageSize = '20' } = req.query;
    const storeId = getStoreId(req);
    const where: any = { deleted_at: null };
    if (storeId) where.store_id = storeId;
    if (status) where.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [list, total] = await Promise.all([
      prisma.pch_purchase_entry.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take,
        include: {
          supplier: { select: { id: true, name: true } },
          operator: { select: { id: true, real_name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.pch_purchase_entry.count({ where }),
    ]);

    const r: ApiResponse = { code: 200, message: 'success', data: { list, total, page: parseInt(page as string), pageSize: parseInt(pageSize as string) } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/purchase-entries/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const entry = await prisma.pch_purchase_entry.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        operator: { select: { id: true, real_name: true } },
        items: {
          include: { model: { include: { brand: { select: { id: true, name: true } } } } },
        },
      },
    });
    if (!entry) {
      const r: ApiResponse = { code: 404, message: '入库单不存在' };
      return res.status(404).json(r);
    }
    const r: ApiResponse = { code: 200, message: 'success', data: entry };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/purchase-entries', async (req: Request, res: Response) => {
  try {
    const { supplier_id, remark } = req.body;
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
    const entryNo = await generateOrderNo('PO', store!.code);

    const entry = await prisma.pch_purchase_entry.create({
      data: {
        entry_no: entryNo,
        store_id: storeId,
        supplier_id: supplier_id || null,
        operator_id: req.user!.userId,
        remark,
      },
    });
    const r: ApiResponse = { code: 200, message: '创建成功', data: entry };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/purchase-entries/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { supplier_id, remark } = req.body;
    const entry = await prisma.pch_purchase_entry.update({
      where: { id },
      data: { supplier_id, remark },
    });
    const r: ApiResponse = { code: 200, message: '更新成功', data: entry };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/purchase-entries/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const entry = await prisma.pch_purchase_entry.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!entry) {
      const r: ApiResponse = { code: 404, message: '入库单不存在' };
      return res.status(404).json(r);
    }
    if (entry.deleted_at) {
      const r: ApiResponse = { code: 400, message: '入库单已删除' };
      return res.status(400).json(r);
    }
    await prisma.pch_purchase_entry.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 逐台添加手机（IMEI 级别）
router.post('/purchase-entries/:id/add-item', async (req: Request, res: Response) => {
  try {
    const entryId = parseInt(req.params.id);
    const { model_id, imei, imei2, sn_code, unit_price } = req.body;

    if (!model_id || !imei) {
      const r: ApiResponse = { code: 400, message: '型号和IMEI不能为空' };
      return res.status(400).json(r);
    }

    const entry = await prisma.pch_purchase_entry.findUnique({ where: { id: entryId } });
    if (!entry) {
      const r: ApiResponse = { code: 404, message: '入库单不存在' };
      return res.status(404).json(r);
    }
    if (entry.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '入库单已确认，无法添加商品' };
      return res.status(400).json(r);
    }

    const item = await prisma.$transaction(async (tx) => {
      // IMEI 唯一性检查在事务内执行，避免并发重复
      const existingImei = await tx.wh_inventory_imei.findUnique({ where: { imei } });
      if (existingImei) {
        throw new Error(`IMEI ${imei} 已存在于系统中`);
      }

      return tx.pch_purchase_item.create({
        data: {
          entry_id: entryId,
          model_id,
          imei,
          imei2: imei2 || null,
          sn_code: sn_code || null,
          unit_price: unit_price || 0,
          subtotal: unit_price || 0,
        },
        include: { model: { include: { brand: { select: { id: true, name: true } } } } },
      });
    });

    const itemCount = await prisma.pch_purchase_item.count({ where: { entry_id: entryId } });
    const totalAmountRes = await prisma.pch_purchase_item.aggregate({
      where: { entry_id: entryId },
      _sum: { subtotal: true },
    });
    await prisma.pch_purchase_entry.update({
      where: { id: entryId },
      data: { total_amount: totalAmountRes._sum.subtotal || 0 },
    });

    const r: ApiResponse = { code: 200, message: '添加成功', data: { ...item, total_items: itemCount } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 批量粘贴 IMEI（同型号）
router.post('/purchase-entries/:id/imei/batch', async (req: Request, res: Response) => {
  try {
    const entryId = parseInt(req.params.id);
    const { model_id, imei_list, imei2_list, sn_code_list, unit_price } = req.body;

    if (!model_id || !imei_list || !Array.isArray(imei_list) || imei_list.length === 0) {
      const r: ApiResponse = { code: 400, message: '型号和IMEI列表不能为空' };
      return res.status(400).json(r);
    }

    const entry = await prisma.pch_purchase_entry.findUnique({ where: { id: entryId } });
    if (!entry) {
      const r: ApiResponse = { code: 404, message: '入库单不存在' };
      return res.status(404).json(r);
    }
    if (entry.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '入库单已确认，无法添加商品' };
      return res.status(400).json(r);
    }

    const result = await prisma.$transaction(async (tx) => {
      const successItems: any[] = [];
      const failedItems: any[] = [];

      for (let i = 0; i < imei_list.length; i++) {
        const imei = imei_list[i];
        const imei2 = imei2_list?.[i] || null;
        const sn_code = sn_code_list?.[i] || null;

        const existing = await tx.wh_inventory_imei.findUnique({ where: { imei } });
        if (existing) {
          failedItems.push({ imei, reason: 'IMEI 已存在' });
          continue;
        }
        const item = await tx.pch_purchase_item.create({
          data: {
            entry_id: entryId,
            model_id,
            imei,
            imei2,
            sn_code,
            unit_price: unit_price || 0,
            subtotal: unit_price || 0,
          },
        });
        successItems.push(item);
      }
      return { successItems, failedItems };
    });

    const itemCount = await prisma.pch_purchase_item.count({ where: { entry_id: entryId } });
    const totalAmountRes = await prisma.pch_purchase_item.aggregate({
      where: { entry_id: entryId },
      _sum: { subtotal: true },
    });
    await prisma.pch_purchase_entry.update({
      where: { id: entryId },
      data: { total_amount: totalAmountRes._sum.subtotal || 0 },
    });

    const r: ApiResponse = {
      code: 200,
      message: '批量添加完成',
      data: {
        entry_id: entryId,
        success_count: result.successItems.length,
        failed_count: result.failedItems.length,
        failed_items: result.failedItems,
        total_items: itemCount,
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 删除入库单项
router.delete('/purchase-entries/:entryId/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { entryId, itemId } = req.params;
    const entry = await prisma.pch_purchase_entry.findUnique({ where: { id: parseInt(entryId) } });
    if (!entry || entry.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '无法删除已确认入库单的商品' };
      return res.status(400).json(r);
    }

    const deleted = await prisma.pch_purchase_item.delete({ where: { id: parseInt(itemId) } });

    const totalAmountRes = await prisma.pch_purchase_item.aggregate({
      where: { entry_id: parseInt(entryId) },
      _sum: { subtotal: true },
    });
    await prisma.pch_purchase_entry.update({
      where: { id: parseInt(entryId) },
      data: { total_amount: totalAmountRes._sum.subtotal || 0 },
    });

    const r: ApiResponse = { code: 200, message: '删除成功', data: { deleted_imei: deleted.imei } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 快捷确认入库
router.post('/purchase-entries/quick-confirm', async (req: Request, res: Response) => {
  try {
    const { supplier_id, remark, items } = req.body;
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      const r: ApiResponse = { code: 400, message: '入库商品不能为空' };
      return res.status(400).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
    const entryNo = await generateOrderNo('PO', store!.code);

    await prisma.$transaction(async (tx) => {
      const entry = await tx.pch_purchase_entry.create({
        data: {
          entry_no: entryNo,
          store_id: storeId,
          supplier_id: supplier_id || null,
          operator_id: req.user!.userId,
          remark,
          status: 'pending',
        },
      });

      let totalAmount = 0;

      for (const item of items) {
        const { model_id, imei, imei2, sn_code, unit_price } = item;
        if (!model_id || !imei) {
          throw new Error('型号和IMEI不能为空');
        }

        const existing = await tx.wh_inventory_imei.findUnique({ where: { imei } });
        if (existing) {
          throw new Error(`IMEI ${imei} 已存在于系统中`);
        }

        const subtotal = unit_price || 0;
        totalAmount += subtotal;

        await tx.pch_purchase_item.create({
          data: {
            entry_id: entry.id,
            model_id,
            imei,
            imei2: imei2 || null,
            sn_code: sn_code || null,
            unit_price: unit_price || 0,
            subtotal,
          },
        });

        await tx.wh_inventory_imei.create({
          data: {
            model_id,
            store_id: storeId,
            imei,
            imei2: imei2 || null,
            sn_code: sn_code || null,
            status: 'in_stock',
            entry_id: entry.id,
          },
        });
      }

      await tx.pch_purchase_entry.update({
        where: { id: entry.id },
        data: { status: 'confirmed', total_amount: totalAmount },
      });

      const modelGroups: Record<number, typeof items> = {};
      for (const item of items) {
        if (!modelGroups[item.model_id]) modelGroups[item.model_id] = [];
        modelGroups[item.model_id].push(item);
      }

      for (const [modelIdStr, groupItems] of Object.entries(modelGroups)) {
        const modelId = parseInt(modelIdStr);
        const count = groupItems.length;

        const inventory = await tx.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id: modelId, store_id: storeId } },
        });

        const qtyBefore = inventory?.quantity || 0;
        const qtyAfter = qtyBefore + count;

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: { quantity: qtyAfter },
          });
        } else {
          const model = await tx.pdt_model.findUnique({ where: { id: modelId }, include: { brand: { select: { name: true } } } });
          await tx.wh_inventory.create({
            data: {
              model_id: modelId, store_id: storeId, quantity: count,
              brand_name: model?.brand?.name || '',
              model_name: model?.name || '',
              color: model?.color || '',
              storage: [model?.ram, model?.rom].filter(Boolean).join('/') || '',
              cost_price: model?.cost_price || 0,
              sale_price: model?.sale_price || 0,
            },
          });
        }

        await tx.wh_inventory_log.create({
          data: {
            model_id: modelId,
            store_id: storeId,
            change_type: 'purchase_in',
            qty_before: qtyBefore,
            qty_change: count,
            qty_after: qtyAfter,
            ref_type: 'purchase_entry',
            ref_id: entry.id,
            operator_id: req.user!.userId,
            remark: `入库单确认: ${entryNo}`,
          },
        });
      }
    });

    const r: ApiResponse = { code: 200, message: '入库成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 确认入库
router.put('/purchase-entries/:id/confirm', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const entry = await prisma.pch_purchase_entry.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!entry) {
      const r: ApiResponse = { code: 404, message: '入库单不存在' };
      return res.status(404).json(r);
    }
    if (entry.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '入库单已确认' };
      return res.status(400).json(r);
    }
    if (entry.items.length === 0) {
      const r: ApiResponse = { code: 400, message: '入库单无商品，无法确认' };
      return res.status(400).json(r);
    }

    await prisma.$transaction(async (tx) => {
      for (const item of entry.items) {
        const existing = await tx.wh_inventory_imei.findUnique({ where: { imei: item.imei } });
        if (existing) {
          throw new Error(`IMEI ${item.imei} 已存在于系统中`);
        }

        await tx.wh_inventory_imei.create({
          data: {
            model_id: item.model_id,
            store_id: entry.store_id,
            imei: item.imei,
            imei2: item.imei2 || null,
            sn_code: item.sn_code || null,
            status: 'in_stock',
            entry_id: id,
          },
        });
      }

      const totalAmount = entry.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
      await tx.pch_purchase_entry.update({
        where: { id },
        data: { status: 'confirmed', total_amount: totalAmount },
      });

      const modelGroups: Record<number, typeof entry.items> = {};
      for (const item of entry.items) {
        if (!modelGroups[item.model_id]) modelGroups[item.model_id] = [];
        modelGroups[item.model_id].push(item);
      }

      for (const [modelIdStr, groupItems] of Object.entries(modelGroups)) {
        const modelId = parseInt(modelIdStr);
        const count = groupItems.length;

        const inventory = await tx.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id: modelId, store_id: entry.store_id } },
        });

        const qtyBefore = inventory?.quantity || 0;
        const qtyAfter = qtyBefore + count;

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: { quantity: qtyAfter },
          });
        } else {
          const model = await tx.pdt_model.findUnique({ where: { id: modelId }, include: { brand: { select: { name: true } } } });
          await tx.wh_inventory.create({
            data: {
              model_id: modelId, store_id: entry.store_id, quantity: count,
              brand_name: model?.brand?.name || '',
              model_name: model?.name || '',
              color: model?.color || '',
              storage: [model?.ram, model?.rom].filter(Boolean).join('/') || '',
              cost_price: model?.cost_price || 0,
              sale_price: model?.sale_price || 0,
            },
          });
        }

        await tx.wh_inventory_log.create({
          data: {
            model_id: modelId,
            store_id: entry.store_id,
            change_type: 'purchase_in',
            qty_before: qtyBefore,
            qty_change: count,
            qty_after: qtyAfter,
            ref_type: 'purchase_entry',
            ref_id: id,
            operator_id: req.user!.userId,
            remark: `入库单确认: ${entry.entry_no}`,
          },
        });
      }
    });

    const r: ApiResponse = { code: 200, message: '确认成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;

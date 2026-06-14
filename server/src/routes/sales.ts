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

router.post('/sales', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }

    const { items, actual_amount, customer_name, customer_address, customer_phone, remark } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      const r: ApiResponse = { code: 400, message: '商品列表不能为空' };
      return res.status(400).json(r);
    }
    if (actual_amount === undefined) {
      const r: ApiResponse = { code: 400, message: '实收金额不能为空' };
      return res.status(400).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
    if (!store) {
      const r: ApiResponse = { code: 404, message: '门店不存在' };
      return res.status(404).json(r);
    }

    const orderNo = await generateOrderNo('SA', store.code);

    const result = await prisma.$transaction(async (tx) => {
      interface ImeiRecord {
        imei: string;
        modelId: number;
        brandName: string;
        modelName: string;
        color: string;
        storage: string;
        unitPrice: number;
      }

      const imeiRecords: ImeiRecord[] = [];
      let totalAmount = 0;

      for (const item of items) {
        const { imei, unit_price } = item;
        if (!imei) {
          throw new Error('IMEI不能为空');
        }

        // IMEI 校验在事务内执行，避免并发重复售卖
        const record = await tx.wh_inventory_imei.findUnique({
          where: { imei },
          include: {
            model: {
              include: { brand: { select: { name: true } } },
            },
          },
        });

        if (!record) {
          throw new Error(`IMEI ${imei} 不存在`);
        }
        if (record.status !== 'in_stock') {
          throw new Error(`IMEI ${imei} 已售出`);
        }
        if (record.store_id !== storeId) {
          throw new Error(`IMEI ${imei} 不属于当前门店`);
        }

        const price = unit_price || record.model?.sale_price || 0;
        totalAmount += price;

        const brandName = record.model?.brand?.name || '';
        const modelName = record.model?.name || '';
        const color = record.model?.color || '';
        const storage = [record.model?.ram, record.model?.rom].filter(Boolean).join('/') || '';

        imeiRecords.push({ imei, modelId: record.model_id, brandName, modelName, color, storage, unitPrice: price });
      }

      const firstItem = imeiRecords[0];
      const firstModelName = `${firstItem.brandName} ${firstItem.modelName} - ${firstItem.color}/${firstItem.storage}`.trim();

      const saleOrder = await tx.sale_order.create({
        data: {
          order_no: orderNo,
          store_id: storeId,
          model_id: firstItem.modelId,
          model_name: firstModelName,
          quantity: imeiRecords.length,
          unit_price: firstItem.unitPrice || 0,
          total_amount: totalAmount,
          actual_amount,
          change_amount: Math.max(0, actual_amount - totalAmount),
          customer_name,
          customer_address,
          customer_phone,
          remark,
          operator_id: req.user!.userId,
        },
      });

      for (const rec of imeiRecords) {
        const modelNameStr = `${rec.brandName} ${rec.modelName} - ${rec.color}/${rec.storage}`.trim();

        await tx.sale_order_item.create({
          data: {
            sale_order_id: saleOrder.id,
            model_id: rec.modelId,
            model_name: modelNameStr,
            imei: rec.imei,
            quantity: 1,
            unit_price: rec.unitPrice,
            total_price: rec.unitPrice,
          },
        });

        await tx.wh_inventory_imei.update({
          where: { imei: rec.imei },
          data: { status: 'sold', sold_at: new Date() },
        });
      }

      // 按型号分组更新汇总库存
      const modelGroups: Record<number, number> = {};
      for (const rec of imeiRecords) {
        modelGroups[rec.modelId] = (modelGroups[rec.modelId] || 0) + 1;
      }

      for (const [modelIdStr, count] of Object.entries(modelGroups)) {
        const modelId = parseInt(modelIdStr);

        const inventory = await tx.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id: modelId, store_id: storeId } },
        });

        const qtyBefore = inventory?.quantity || 0;
        const qtyAfter = Math.max(0, qtyBefore - count);

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: { quantity: qtyAfter },
          });
        }

        const modelRec = imeiRecords.find(r => r.modelId === modelId);
        const modelNameStr2 = modelRec ? `${modelRec.brandName} ${modelRec.modelName}`.trim() : '';

        await tx.wh_inventory_log.create({
          data: {
            model_id: modelId,
            store_id: storeId,
            change_type: 'sale_out',
            qty_before: qtyBefore,
            qty_change: -count,
            qty_after: qtyAfter,
            ref_type: 'sale_order',
            ref_id: saleOrder.id,
            operator_id: req.user!.userId,
            remark: `销售出库: ${orderNo} - ${modelNameStr2}`,
          },
        });
      }

      const updatedOrder = await tx.sale_order.update({
        where: { id: saleOrder.id },
        data: {
          model_name: imeiRecords.map(r => `${r.brandName} ${r.modelName} - ${r.color}/${r.storage}`.trim()).join('; '),
        },
      });

      return updatedOrder;
    });

    const r: ApiResponse = { code: 200, message: '开单成功', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '开单失败' };
    return res.status(500).json(r);
  }
});

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', start_date, end_date } = req.query;
    const storeId = getStoreId(req);

    const where: any = { status: 'active' };
    if (storeId) where.store_id = storeId;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date as string);
      if (end_date) where.created_at.lte = new Date(end_date as string + 'T23:59:59.999Z');
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [list, total] = await Promise.all([
      prisma.sale_order.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          store: { select: { id: true, name: true } },
          model: { select: { id: true, name: true, color: true, ram: true, rom: true } },
          operator: { select: { id: true, real_name: true } },
        },
      }),
      prisma.sale_order.count({ where }),
    ]);

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: { list, total, page: parseInt(page as string), pageSize: parseInt(pageSize as string) },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/sales/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await prisma.sale_order.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, code: true } },
        model: { include: { brand: { select: { id: true, name: true } } } },
        operator: { select: { id: true, real_name: true } },
        items: true,
      },
    });
    if (!sale) {
      const r: ApiResponse = { code: 404, message: '销售记录不存在' };
      return res.status(404).json(r);
    }
    const r: ApiResponse = { code: 200, message: 'success', data: sale };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/sales/:id/print-data', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await prisma.sale_order.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, code: true, address: true, phone: true } },
        operator: { select: { id: true, real_name: true } },
        items: true,
      },
    });
    if (!sale) {
      const r: ApiResponse = { code: 404, message: '销售记录不存在' };
      return res.status(404).json(r);
    }

    const printData = {
      order_no: sale.order_no,
      created_at: sale.created_at,
      store: (sale as any).store,
      operator: (sale as any).operator,
      customer_name: sale.customer_name,
      customer_address: sale.customer_address,
      customer_phone: sale.customer_phone,
      total_amount: sale.total_amount,
      actual_amount: sale.actual_amount,
      change_amount: sale.change_amount,
      remark: sale.remark,
      items: ((sale as any).items || []).map((item: any) => ({
        id: item.id,
        model_id: item.model_id,
        model_name: item.model_name,
        imei: item.imei,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
    };

    const r: ApiResponse = { code: 200, message: 'success', data: printData };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/sales/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await prisma.sale_order.findUnique({ where: { id } });
    if (!sale) {
      const r: ApiResponse = { code: 404, message: '销售记录不存在' };
      return res.status(404).json(r);
    }
    await prisma.sale_order.update({
      where: { id },
      data: { status: 'deleted' },
    });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;

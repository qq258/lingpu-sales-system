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
    let totalAmount = 0;

    // 按 IMEI 逐条校验并收集信息
    const imeiRecords: Array<{ imei: string; skuId: number; brandName: string; modelName: string; color: string; storage: string; unitPrice: number }> = [];
    for (const item of items) {
      const { imei, unit_price } = item;
      if (!imei) {
        throw new Error('IMEI不能为空');
      }

      const record = await prisma.wh_inventory_imei.findUnique({
        where: { imei },
        include: {
          sku: { include: { model: { include: { brand: { select: { name: true } } } } } },
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

      const price = unit_price || record.sku?.sale_price || 0;
      totalAmount += price;

      const brandName = record.sku?.model?.brand?.name || '';
      const modelName = record.sku?.model?.name || '';
      const color = record.sku?.color || '';
      const storage = [record.sku?.ram, record.sku?.rom].filter(Boolean).join('/') || '';

      imeiRecords.push({ imei, skuId: record.sku_id, brandName, modelName, color, storage, unitPrice: price });
    }

    const result = await prisma.$transaction(async (tx) => {
      const firstItem = imeiRecords[0];
      const firstSkuName = `${firstItem.brandName} ${firstItem.modelName} - ${firstItem.color}/${firstItem.storage}`.trim();

      const saleOrder = await tx.sale_order.create({
        data: {
          order_no: orderNo,
          store_id: storeId,
          sku_id: firstItem.skuId,
          sku_name: firstSkuName,
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
        const skuName = `${rec.brandName} ${rec.modelName} - ${rec.color}/${rec.storage}`.trim();

        await tx.sale_order_item.create({
          data: {
            sale_order_id: saleOrder.id,
            sku_id: rec.skuId,
            sku_name: skuName,
            imei: rec.imei,
            quantity: 1,
            unit_price: rec.unitPrice,
            total_price: rec.unitPrice,
          },
        });

        // 标记 IMEI 为已售出
        await tx.wh_inventory_imei.update({
          where: { imei: rec.imei },
          data: { status: 'sold', sold_at: new Date() },
        });
      }

      // 按 SKU 分组更新汇总库存
      const skuGroups: Record<number, number> = {};
      for (const rec of imeiRecords) {
        skuGroups[rec.skuId] = (skuGroups[rec.skuId] || 0) + 1;
      }

      for (const [skuIdStr, count] of Object.entries(skuGroups)) {
        const skuId = parseInt(skuIdStr);

        const inventory = await tx.wh_inventory.findUnique({
          where: { sku_id_store_id: { sku_id: skuId, store_id: storeId } },
        });

        const qtyBefore = inventory?.quantity || 0;
        const qtyAfter = Math.max(0, qtyBefore - count);

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: { quantity: qtyAfter },
          });
        }

        const skuRec = imeiRecords.find(r => r.skuId === skuId);
        const skuName = skuRec ? `${skuRec.brandName} ${skuRec.modelName}`.trim() : '';

        await tx.wh_inventory_log.create({
          data: {
            sku_id: skuId,
            store_id: storeId,
            change_type: 'sale_out',
            qty_before: qtyBefore,
            qty_change: -count,
            qty_after: qtyAfter,
            ref_type: 'sale_order',
            ref_id: saleOrder.id,
            operator_id: req.user!.userId,
            remark: `销售出库: ${orderNo} - ${skuName}`,
          },
        });
      }

      const updatedOrder = await tx.sale_order.update({
        where: { id: saleOrder.id },
        data: {
          sku_name: imeiRecords.map(r => `${r.brandName} ${r.modelName} - ${r.color}/${r.storage}`.trim()).join('; '),
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
          sku: { select: { id: true, sku_code: true, color: true, ram: true, rom: true } },
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
        sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } } } },
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

    // 组装打印数据：以 items（sale_order_item）为主，每条 item 包含 IMEI
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
        sku_id: item.sku_id,
        sku_name: item.sku_name,
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

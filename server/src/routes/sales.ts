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

    const { items, total_amount, actual_amount, customer_name, remark } = req.body;
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
      const firstItem = items[0];
      const firstSku = await tx.pdt_sku.findUnique({
        where: { id: firstItem.sku_id },
        include: { model: { include: { brand: { select: { name: true } } } } },
      });
      const firstSkuName = firstSku ? `${firstSku.model?.brand?.name || ''} ${firstSku.model?.name || ''} ${firstSku.color || ''} ${[firstSku.ram, firstSku.rom].filter(Boolean).join('/') || ''}`.trim() : '';

      const saleOrder = await tx.sale_order.create({
        data: {
          order_no: orderNo,
          store_id: storeId,
          sku_id: firstItem.sku_id,
          sku_name: firstSkuName,
          quantity: items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
          unit_price: firstItem.unit_price || 0,
          total_amount: total_amount || 0,
          actual_amount,
          customer_name,
          remark,
          operator_id: req.user!.userId,
        },
      });

      for (const item of items) {
        const { sku_id, quantity, unit_price } = item;
        if (!sku_id || !quantity || unit_price === undefined) {
          throw new Error('SKU、数量和单价不能为空');
        }

        const sku = await tx.pdt_sku.findUnique({
          where: { id: sku_id },
          include: { model: { include: { brand: { select: { name: true } } } } },
        });
        if (!sku) {
          throw new Error(`SKU(ID=${sku_id})不存在`);
        }

        const inventory = await tx.wh_inventory.findUnique({
          where: { sku_id_store_id: { sku_id, store_id: storeId } },
        });

        if (!inventory || inventory.quantity < quantity) {
          throw new Error(`"${sku.model?.brand?.name || ''} ${sku.model?.name || ''} ${sku.color || ''}" 库存不足`);
        }

        await tx.wh_inventory.update({
          where: { id: inventory.id },
          data: { quantity: inventory.quantity - quantity },
        });

        const skuName = `${sku.model?.brand?.name || ''} ${sku.model?.name || ''} ${sku.color || ''} ${[sku.ram, sku.rom].filter(Boolean).join('/') || ''}`.trim();

        await tx.sale_order_item.create({
          data: {
            sale_order_id: saleOrder.id,
            sku_id,
            sku_name: skuName,
            quantity,
            unit_price,
            total_price: unit_price * quantity,
          },
        });

        await tx.wh_inventory_log.create({
          data: {
            sku_id,
            store_id: storeId,
            change_type: 'sale_out',
            qty_before: inventory.quantity,
            qty_change: -quantity,
            qty_after: inventory.quantity - quantity,
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
          sku_name: (await tx.sale_order_item.findMany({
            where: { sale_order_id: saleOrder.id },
            select: { sku_name: true, quantity: true },
          })).map(i => `${i.sku_name} x${i.quantity}`).join('; '),
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

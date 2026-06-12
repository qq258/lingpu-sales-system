import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { storeScopeMiddleware } from '../middleware/store-scope';
import { generateOrderNo } from '../utils/order-no';
import { getSkuInfo } from '../utils/sku-info';

const router = Router();

router.use(authMiddleware);
router.use(storeScopeMiddleware);

router.post('/transfers', async (req: Request, res: Response) => {
  try {
    const { to_store_id, sku_id, quantity, remark } = req.body;
    const fromStoreId = (req as any).effectiveStoreId;
    if (!fromStoreId) {
      const r: ApiResponse = { code: 400, message: '无法确定来源门店' };
      return res.status(400).json(r);
    }
    if (!to_store_id || !sku_id || !quantity) {
      const r: ApiResponse = { code: 400, message: '目标门店、SKU和数量不能为空' };
      return res.status(400).json(r);
    }
    if (fromStoreId === to_store_id) {
      const r: ApiResponse = { code: 400, message: '来源门店和目标门店不能相同' };
      return res.status(400).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: fromStoreId } });
    const transferNo = await generateOrderNo('TF', store!.code);

    const transfer = await prisma.wh_transfer.create({
      data: {
        transfer_no: transferNo,
        from_store_id: fromStoreId,
        to_store_id,
        sku_id,
        quantity,
        applicant_id: req.user!.userId,
        remark,
      },
      include: {
        from_store: { select: { id: true, name: true } },
        to_store: { select: { id: true, name: true } },
        sku: { select: { id: true, sku_code: true, color: true, ram: true, rom: true } },
        applicant: { select: { id: true, real_name: true } },
      },
    });

    const r: ApiResponse = { code: 200, message: '调货申请已提交', data: transfer };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/transfers', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', pageSize = '20' } = req.query;
    const storeId = (req as any).effectiveStoreId;

    const where: any = {};
    if (status) where.status = status;

    if (storeId) {
      where.OR = [
        { from_store_id: storeId },
        { to_store_id: storeId },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [list, total] = await Promise.all([
      prisma.wh_transfer.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          from_store: { select: { id: true, name: true } },
          to_store: { select: { id: true, name: true } },
          sku: { select: { id: true, sku_code: true, color: true, ram: true, rom: true } },
          applicant: { select: { id: true, real_name: true } },
          outbound_operator: { select: { id: true, real_name: true } },
          inbound_operator: { select: { id: true, real_name: true } },
        },
      }),
      prisma.wh_transfer.count({ where }),
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

router.get('/transfers/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const transfer = await prisma.wh_transfer.findUnique({
      where: { id },
      include: {
        from_store: { select: { id: true, name: true } },
        to_store: { select: { id: true, name: true } },
        sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } } } },
        applicant: { select: { id: true, real_name: true } },
        outbound_operator: { select: { id: true, real_name: true } },
        inbound_operator: { select: { id: true, real_name: true } },
      },
    });
    if (!transfer) {
      const r: ApiResponse = { code: 404, message: '调货单不存在' };
      return res.status(404).json(r);
    }
    const r: ApiResponse = { code: 200, message: 'success', data: transfer };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/transfers/:id/outbound', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const transfer = await prisma.wh_transfer.findUnique({ where: { id } });

    if (!transfer) {
      const r: ApiResponse = { code: 404, message: '调货单不存在' };
      return res.status(404).json(r);
    }
    if (transfer.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '调货单状态异常，无法出库' };
      return res.status(400).json(r);
    }

    await prisma.$transaction(async (tx) => {
      const inventory = await tx.wh_inventory.findUnique({
        where: { sku_id_store_id: { sku_id: transfer.sku_id, store_id: transfer.from_store_id } },
      });

      if (!inventory || inventory.quantity < transfer.quantity) {
        throw new Error('库存不足');
      }

      await tx.wh_inventory.update({
        where: { id: inventory.id },
        data: { quantity: inventory.quantity - transfer.quantity },
      });

      await tx.wh_inventory_log.create({
        data: {
          sku_id: transfer.sku_id,
          store_id: transfer.from_store_id,
          change_type: 'transfer_out',
          qty_before: inventory.quantity,
          qty_change: -transfer.quantity,
          qty_after: inventory.quantity - transfer.quantity,
          ref_type: 'transfer',
          ref_id: id,
          operator_id: req.user!.userId,
          remark: `调货出库: ${transfer.transfer_no}`,
        },
      });

      await tx.wh_transfer.update({
        where: { id },
        data: {
          status: 'outbound',
          outbound_operator_id: req.user!.userId,
          outbound_at: new Date(),
        },
      });
    });

    const r: ApiResponse = { code: 200, message: '出库成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '出库失败' };
    return res.status(500).json(r);
  }
});

router.put('/transfers/:id/inbound', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const transfer = await prisma.wh_transfer.findUnique({ where: { id } });

    if (!transfer) {
      const r: ApiResponse = { code: 404, message: '调货单不存在' };
      return res.status(404).json(r);
    }
    if (transfer.status !== 'outbound') {
      const r: ApiResponse = { code: 400, message: '调货单状态异常，无法收货' };
      return res.status(400).json(r);
    }

    await prisma.$transaction(async (tx) => {
      const skuInfo = await getSkuInfo(transfer.sku_id);
      const inventory = await tx.wh_inventory.findUnique({
        where: { sku_id_store_id: { sku_id: transfer.sku_id, store_id: transfer.to_store_id } },
      });

      if (inventory) {
        await tx.wh_inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: inventory.quantity + transfer.quantity,
            brand_name: skuInfo?.brand_name || inventory.brand_name,
            model_name: skuInfo?.model_name || inventory.model_name,
            sku_code: skuInfo?.sku_code || inventory.sku_code,
            color: skuInfo?.color || inventory.color,
            storage: skuInfo?.storage || inventory.storage,
            cost_price: skuInfo?.cost_price || inventory.cost_price,
            sale_price: skuInfo?.sale_price || inventory.sale_price || 0,
          },
        });
      } else {
        await tx.wh_inventory.create({
          data: {
            sku_id: transfer.sku_id, store_id: transfer.to_store_id, quantity: transfer.quantity,
            brand_name: skuInfo?.brand_name || '',
            model_name: skuInfo?.model_name || '',
            sku_code: skuInfo?.sku_code || '',
            color: skuInfo?.color || '',
            storage: skuInfo?.storage || '',
            cost_price: skuInfo?.cost_price || 0,
            sale_price: skuInfo?.sale_price || 0,
          },
        });
      }

      await tx.wh_inventory_log.create({
        data: {
          sku_id: transfer.sku_id,
          store_id: transfer.to_store_id,
          change_type: 'transfer_in',
          qty_before: inventory?.quantity || 0,
          qty_change: transfer.quantity,
          qty_after: (inventory?.quantity || 0) + transfer.quantity,
          ref_type: 'transfer',
          ref_id: id,
          operator_id: req.user!.userId,
          remark: `调货入库: ${transfer.transfer_no}`,
        },
      });

      await tx.wh_transfer.update({
        where: { id },
        data: {
          status: 'completed',
          inbound_operator_id: req.user!.userId,
          inbound_at: new Date(),
        },
      });
    });

    const r: ApiResponse = { code: 200, message: '收货成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '收货失败' };
    return res.status(500).json(r);
  }
});

router.put('/transfers/:id/cancel', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const transfer = await prisma.wh_transfer.findUnique({ where: { id } });

    if (!transfer) {
      const r: ApiResponse = { code: 404, message: '调货单不存在' };
      return res.status(404).json(r);
    }
    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
      const r: ApiResponse = { code: 400, message: '该调货单无法取消' };
      return res.status(400).json(r);
    }

    if (transfer.status === 'outbound') {
      await prisma.$transaction(async (tx) => {
        const skuInfo = await getSkuInfo(transfer.sku_id);
        const inventory = await tx.wh_inventory.findUnique({
          where: { sku_id_store_id: { sku_id: transfer.sku_id, store_id: transfer.from_store_id } },
        });

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity + transfer.quantity,
              brand_name: skuInfo?.brand_name || inventory.brand_name,
              model_name: skuInfo?.model_name || inventory.model_name,
              sku_code: skuInfo?.sku_code || inventory.sku_code,
              color: skuInfo?.color || inventory.color,
              storage: skuInfo?.storage || inventory.storage,
              cost_price: skuInfo?.cost_price || inventory.cost_price,
              sale_price: skuInfo?.sale_price || inventory.sale_price || 0,
            },
          });
        } else {
          await tx.wh_inventory.create({
            data: {
              sku_id: transfer.sku_id, store_id: transfer.from_store_id, quantity: transfer.quantity,
              brand_name: skuInfo?.brand_name || '',
              model_name: skuInfo?.model_name || '',
              sku_code: skuInfo?.sku_code || '',
              color: skuInfo?.color || '',
              storage: skuInfo?.storage || '',
              cost_price: skuInfo?.cost_price || 0,
              sale_price: skuInfo?.sale_price || 0,
            },
          });
        }

        await tx.wh_inventory_log.create({
          data: {
            sku_id: transfer.sku_id,
            store_id: transfer.from_store_id,
            change_type: 'transfer_cancel',
            qty_before: inventory?.quantity || 0,
            qty_change: transfer.quantity,
            qty_after: (inventory?.quantity || 0) + transfer.quantity,
            ref_type: 'transfer',
            ref_id: id,
            operator_id: req.user!.userId,
            remark: `调货取消回滚: ${transfer.transfer_no}`,
          },
        });

        await tx.wh_transfer.update({
          where: { id },
          data: { status: 'cancelled' },
        });
      });
    } else {
      await prisma.wh_transfer.update({
        where: { id },
        data: { status: 'cancelled' },
      });
    }

    const r: ApiResponse = { code: 200, message: '调货已取消' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '取消失败' };
    return res.status(500).json(r);
  }
});

export default router;

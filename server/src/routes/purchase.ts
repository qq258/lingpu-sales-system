import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { storeScopeMiddleware } from '../middleware/store-scope';
import { generateOrderNo } from '../utils/order-no';

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
          include: { sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } } } } },
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
    const { sku_id, imei, unit_price } = req.body;

    if (!sku_id || !imei) {
      const r: ApiResponse = { code: 400, message: 'SKU和IMEI不能为空' };
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

    // 校验 IMEI 全局唯一
    const existingImei = await prisma.wh_inventory_imei.findUnique({ where: { imei } });
    if (existingImei) {
      const r: ApiResponse = { code: 409, message: `IMEI ${imei} 已存在于系统中` };
      return res.status(409).json(r);
    }

    const item = await prisma.pch_purchase_item.create({
      data: {
        entry_id: entryId,
        sku_id,
        imei,
        unit_price: unit_price || 0,
        subtotal: unit_price || 0,
      },
      include: { sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } } } } },
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

// 批量粘贴 IMEI（同 SKU）
router.post('/purchase-entries/:id/imei/batch', async (req: Request, res: Response) => {
  try {
    const entryId = parseInt(req.params.id);
    const { sku_id, imei_list, unit_price } = req.body;

    if (!sku_id || !imei_list || !Array.isArray(imei_list) || imei_list.length === 0) {
      const r: ApiResponse = { code: 400, message: 'SKU和IMEI列表不能为空' };
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

    // 批量校验 IMEI 是否已存在
    const existingImeis = await prisma.wh_inventory_imei.findMany({
      where: { imei: { in: imei_list } },
      select: { imei: true },
    });
    const existingSet = new Set(existingImeis.map(i => i.imei));

    const successItems: any[] = [];
    const failedItems: any[] = [];

    for (const imei of imei_list) {
      if (existingSet.has(imei)) {
        failedItems.push({ imei, reason: 'IMEI 已存在' });
        continue;
      }
      const item = await prisma.pch_purchase_item.create({
        data: {
          entry_id: entryId,
          sku_id,
          imei,
          unit_price: unit_price || 0,
          subtotal: unit_price || 0,
        },
      });
      successItems.push(item);
    }

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
        success_count: successItems.length,
        failed_count: failedItems.length,
        failed_items: failedItems,
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

// 确认入库：校验IMEI → 写入 wh_inventory_imei → 更新库存
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
      // ① 逐条校验 IMEI 唯一性并写入 wh_inventory_imei
      for (const item of entry.items) {
        const existing = await tx.wh_inventory_imei.findUnique({ where: { imei: item.imei } });
        if (existing) {
          throw new Error(`IMEI ${item.imei} 已存在于系统中`);
        }

        await tx.wh_inventory_imei.create({
          data: {
            sku_id: item.sku_id,
            store_id: entry.store_id,
            imei: item.imei,
            status: 'in_stock',
            entry_id: id,
          },
        });
      }

      // ② 更新入库单状态和总金额
      const totalAmount = entry.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
      await tx.pch_purchase_entry.update({
        where: { id },
        data: { status: 'confirmed', total_amount: totalAmount },
      });

      // ③ 按 SKU 分组更新库存汇总
      const skuGroups: Record<number, typeof entry.items> = {};
      for (const item of entry.items) {
        if (!skuGroups[item.sku_id]) skuGroups[item.sku_id] = [];
        skuGroups[item.sku_id].push(item);
      }

      for (const [skuIdStr, groupItems] of Object.entries(skuGroups)) {
        const skuId = parseInt(skuIdStr);
        const count = groupItems.length;

        const inventory = await tx.wh_inventory.findUnique({
          where: { sku_id_store_id: { sku_id: skuId, store_id: entry.store_id } },
        });

        const qtyBefore = inventory?.quantity || 0;
        const qtyAfter = qtyBefore + count;

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: { quantity: qtyAfter },
          });
        } else {
          await tx.wh_inventory.create({
            data: { sku_id: skuId, store_id: entry.store_id, quantity: count },
          });
        }

        // ④ 写入库存流水
        await tx.wh_inventory_log.create({
          data: {
            sku_id: skuId,
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

    const r: ApiResponse = { code: 200, message: '确认入库成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;

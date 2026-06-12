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
          items: { include: { sku: { select: { id: true, sku_code: true, color: true, ram: true, rom: true } } } },
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
        supplier: true,
        operator: { select: { id: true, real_name: true } },
        items: { include: { sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } } } } } },
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

router.post('/purchase-entries/:id/scan', async (req: Request, res: Response) => {
  try {
    const entryId = parseInt(req.params.id);
    const { sku_id, quantity, unit_price } = req.body;

    const entry = await prisma.pch_purchase_entry.findUnique({ where: { id: entryId } });
    if (!entry) {
      const r: ApiResponse = { code: 404, message: '入库单不存在' };
      return res.status(404).json(r);
    }
    if (entry.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '入库单已确认，无法添加商品' };
      return res.status(400).json(r);
    }

    const item = await prisma.pch_purchase_item.create({
      data: {
        entry_id: entryId,
        sku_id,
        quantity: quantity || 1,
        unit_price: unit_price || 0,
        subtotal: (quantity || 1) * (unit_price || 0),
      },
      include: { sku: { select: { id: true, sku_code: true, color: true, ram: true, rom: true } } },
    });

    const items = await prisma.pch_purchase_item.findMany({ where: { entry_id: entryId } });
    const totalAmount = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    await prisma.pch_purchase_entry.update({ where: { id: entryId }, data: { total_amount: totalAmount } });

    const r: ApiResponse = { code: 200, message: '添加成功', data: item };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/purchase-entries/:entryId/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { entryId, itemId } = req.params;
    const entry = await prisma.pch_purchase_entry.findUnique({ where: { id: parseInt(entryId) } });
    if (!entry || entry.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '无法删除已确认入库单的商品' };
      return res.status(400).json(r);
    }

    await prisma.pch_purchase_item.delete({ where: { id: parseInt(itemId) } });

    const items = await prisma.pch_purchase_item.findMany({ where: { entry_id: parseInt(entryId) } });
    const totalAmount = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    await prisma.pch_purchase_entry.update({ where: { id: parseInt(entryId) }, data: { total_amount: totalAmount } });

    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/purchase-entries/:id/confirm', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { items: newItems, supplier_id } = req.body;
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

    const updateData: any = {};
    if (supplier_id) {
      updateData.supplier_id = supplier_id;
    }

    const allItems = [...entry.items];

    if (newItems && newItems.length > 0) {
      for (const item of newItems) {
        if (!item.modelId) continue;
        let sku = await prisma.pdt_sku.findFirst({ where: { model_id: item.modelId } });
        if (!sku) {
          const model = await prisma.pdt_model.findUnique({
            where: { id: item.modelId },
            include: { brand: true },
          });
          const skuCode = `AUTO-${item.modelId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          sku = await prisma.pdt_sku.create({
            data: {
              model_id: item.modelId,
              sku_code: skuCode,
              sale_price: 0,
            },
          });
        }
        const created = await prisma.pch_purchase_item.create({
          data: {
            entry_id: id,
            sku_id: sku.id,
            quantity: item.quantity,
            unit_price: item.costPrice,
            subtotal: item.quantity * item.costPrice,
          },
        });
        allItems.push(created);
      }
    }

    if (allItems.length === 0) {
      const r: ApiResponse = { code: 400, message: '入库单无商品，无法确认' };
      return res.status(400).json(r);
    }

    const totalAmount = allItems.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    updateData.total_amount = totalAmount;

    await prisma.$transaction(async (tx) => {
      await tx.pch_purchase_entry.update({
        where: { id },
        data: { ...updateData, status: 'confirmed' },
      });

      for (const item of allItems) {
        const skuInfo = await getSkuInfo(item.sku_id);
        const inventory = await tx.wh_inventory.findUnique({
          where: { sku_id_store_id: { sku_id: item.sku_id, store_id: entry.store_id } },
        });

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity + item.quantity,
              cost_price: item.unit_price || skuInfo?.cost_price || 0,
              brand_name: skuInfo?.brand_name || inventory.brand_name,
              model_name: skuInfo?.model_name || inventory.model_name,
              sku_code: skuInfo?.sku_code || inventory.sku_code,
              color: skuInfo?.color || inventory.color,
              storage: skuInfo?.storage || inventory.storage,
              sale_price: skuInfo?.sale_price || inventory.sale_price || 0,
            },
          });
        } else {
          await tx.wh_inventory.create({
            data: {
              sku_id: item.sku_id,
              store_id: entry.store_id,
              quantity: item.quantity,
              brand_name: skuInfo?.brand_name || '',
              model_name: skuInfo?.model_name || '',
              sku_code: skuInfo?.sku_code || '',
              color: skuInfo?.color || '',
              storage: skuInfo?.storage || '',
              cost_price: item.unit_price || skuInfo?.cost_price || 0,
              sale_price: skuInfo?.sale_price || 0,
            },
          });
        }

        await tx.wh_inventory_log.create({
          data: {
            sku_id: item.sku_id,
            store_id: entry.store_id,
            change_type: 'purchase_in',
            qty_before: inventory?.quantity || 0,
            qty_change: item.quantity,
            qty_after: (inventory?.quantity || 0) + item.quantity,
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

// 手动添加商品（按型号添加，自动取第一个SKU）
router.post('/purchase-entries/:id/items', async (req: Request, res: Response) => {
  try {
    const entryId = parseInt(req.params.id);
    const { model_id, quantity, unit_price } = req.body;

    const entry = await prisma.pch_purchase_entry.findUnique({ where: { id: entryId } });
    if (!entry) {
      const r: ApiResponse = { code: 404, message: '入库单不存在' };
      return res.status(404).json(r);
    }
    if (entry.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '入库单已确认，无法添加商品' };
      return res.status(400).json(r);
    }

    const sku = await prisma.pdt_sku.findFirst({ where: { model_id } });
    if (!sku) {
      const r: ApiResponse = { code: 400, message: '该型号下没有SKU，请先创建SKU' };
      return res.status(400).json(r);
    }

    const item = await prisma.pch_purchase_item.create({
      data: {
        entry_id: entryId,
        sku_id: sku.id,
        quantity: quantity || 1,
        unit_price: unit_price || 0,
        subtotal: (quantity || 1) * (unit_price || 0),
      },
    });

    const items = await prisma.pch_purchase_item.findMany({ where: { entry_id: entryId } });
    const totalAmount = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    await prisma.pch_purchase_entry.update({ where: { id: entryId }, data: { total_amount: totalAmount } });

    const r: ApiResponse = { code: 200, message: '添加成功', data: { ...item, sku } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;

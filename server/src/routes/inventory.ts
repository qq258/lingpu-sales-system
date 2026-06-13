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

function getStoreId(req: Request): number | null {
  return (req as any).effectiveStoreId ?? null;
}

router.post('/initial', async (req: Request, res: Response) => {
  try {
    const { sku_id, quantity } = req.body;
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }
    if (!sku_id || quantity === undefined) {
      const r: ApiResponse = { code: 400, message: 'SKU和数量不能为空' };
      return res.status(400).json(r);
    }

    const skuInfo = await getSkuInfo(sku_id);
    const existing = await prisma.wh_inventory.findUnique({
      where: { sku_id_store_id: { sku_id, store_id: storeId } },
    });

    let inventory;
    if (existing) {
      inventory = await prisma.wh_inventory.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          brand_name: skuInfo?.brand_name || existing.brand_name,
          model_name: skuInfo?.model_name || existing.model_name,
          sku_code: skuInfo?.sku_code || existing.sku_code,
          color: skuInfo?.color || existing.color,
          storage: skuInfo?.storage || existing.storage,
          cost_price: skuInfo?.cost_price || existing.cost_price,
          sale_price: skuInfo?.sale_price || existing.sale_price || 0,
        },
      });
    } else {
      inventory = await prisma.wh_inventory.create({
        data: {
          sku_id, store_id: storeId, quantity,
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

    await prisma.wh_inventory_log.create({
      data: {
        sku_id,
        store_id: storeId,
        change_type: 'initial',
        qty_before: existing?.quantity || 0,
        qty_change: quantity,
        qty_after: inventory.quantity,
        ref_type: 'initial',
        operator_id: req.user!.userId,
        remark: '期初录入',
      },
    });

    const r: ApiResponse = { code: 200, message: '录入成功', data: inventory };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/initial/batch', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      const r: ApiResponse = { code: 400, message: '商品列表不能为空' };
      return res.status(400).json(r);
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const { sku_id, quantity } = item;
        const skuInfo = await getSkuInfo(sku_id);
        const existing = await tx.wh_inventory.findUnique({
          where: { sku_id_store_id: { sku_id, store_id: storeId } },
        });

        let inventory;
        if (existing) {
          inventory = await tx.wh_inventory.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + quantity,
              brand_name: skuInfo?.brand_name || existing.brand_name,
              model_name: skuInfo?.model_name || existing.model_name,
              sku_code: skuInfo?.sku_code || existing.sku_code,
              color: skuInfo?.color || existing.color,
              storage: skuInfo?.storage || existing.storage,
              cost_price: skuInfo?.cost_price || existing.cost_price,
              sale_price: skuInfo?.sale_price || existing.sale_price || 0,
            },
          });
        } else {
          inventory = await tx.wh_inventory.create({
            data: {
              sku_id, store_id: storeId, quantity,
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
            sku_id,
            store_id: storeId,
            change_type: 'initial',
            qty_before: existing?.quantity || 0,
            qty_change: quantity,
            qty_after: inventory.quantity,
            ref_type: 'initial',
            operator_id: req.user!.userId,
            remark: '批量期初录入',
          },
        });
      }
    });

    const r: ApiResponse = { code: 200, message: '批量录入成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 扫码 IMEI 匹配库存（销售开单使用）
router.get('/scan-imei', async (req: Request, res: Response) => {
  try {
    const { imei } = req.query;
    if (!imei) {
      const r: ApiResponse = { code: 400, message: 'IMEI不能为空' };
      return res.status(400).json(r);
    }

    const record = await prisma.wh_inventory_imei.findUnique({
      where: { imei: imei as string },
      include: {
        sku: {
          include: { model: { include: { brand: { select: { id: true, name: true } } } } },
        },
        store: { select: { id: true, name: true } },
      },
    });

    if (!record) {
      const r: ApiResponse = { code: 404, message: '未找到该IMEI对应的库存记录' };
      return res.status(404).json(r);
    }

    if (record.status !== 'in_stock') {
      const r: ApiResponse = { code: 400, message: `该IMEI(${imei})已售出，无法销售` };
      return res.status(400).json(r);
    }

    const storeId = getStoreId(req);
    if (storeId && record.store_id !== storeId) {
      const r: ApiResponse = { code: 400, message: `该IMEI(${imei})不属于当前门店` };
      return res.status(400).json(r);
    }

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: {
        id: record.id,
        skuId: record.sku_id,
        imei: record.imei,
        brandName: record.sku?.model?.brand?.name || '',
        modelName: record.sku?.model?.name || '',
        color: record.sku?.color || '',
        storage: [record.sku?.ram, record.sku?.rom].filter(Boolean).join('/') || '',
        salePrice: record.sku?.sale_price || 0,
        storeName: record.store?.name || '',
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// IMEI 级别库存列表（每个手机一条记录）
router.get('/imei-list', async (req: Request, res: Response) => {
  try {
    const { keyword, brand_id, model_id, page = '1', pageSize = '20' } = req.query;
    const storeId = getStoreId(req);
    const imeiWhere: any = {};
    if (storeId) imeiWhere.store_id = storeId;

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    // Build sku-level filter
    const skuFilter: any = {};
    if (brand_id) skuFilter.model = { brand_id: parseInt(brand_id as string) };
    if (model_id) skuFilter.model_id = parseInt(model_id as string);

    // Build keyword filter (OR across imei and sku fields)
    if (keyword) {
      const keywordFilter = [
        { imei: { contains: keyword as string } },
        { sku: { model: { name: { contains: keyword as string } } } },
        { sku: { manufacturer_barcode: { contains: keyword as string } } },
      ];
      // If both brand/model filter and keyword exist, combine with AND
      if (Object.keys(skuFilter).length > 0) {
        imeiWhere.AND = [{ sku: skuFilter }, { OR: keywordFilter }];
      } else {
        imeiWhere.OR = keywordFilter;
      }
    } else if (Object.keys(skuFilter).length > 0) {
      imeiWhere.sku = skuFilter;
    }

    const [rawList, total] = await Promise.all([
      prisma.wh_inventory_imei.findMany({
        where: imeiWhere,
        skip,
        take,
        orderBy: { id: 'desc' },
        include: {
          sku: {
            include: {
              model: { include: { brand: { select: { id: true, name: true } } } },
            },
          },
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.wh_inventory_imei.count({ where: imeiWhere }),
    ]);

    const list = rawList.map((item) => ({
      id: item.id,
      skuId: item.sku_id,
      storeId: item.store_id,
      imei: item.imei,
      status: item.status,
      isSold: item.status !== 'in_stock',
      brandName: item.sku?.model?.brand?.name || '',
      modelName: item.sku?.model?.name || '',
      color: item.sku?.color || '',
      storage: [item.sku?.ram, item.sku?.rom].filter(Boolean).join('/') || '',
      storeName: item.store?.name || '',
      createdAt: item.created_at,
    }));

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

router.get('/', async (req: Request, res: Response) => {
  try {
    const { keyword, page = '1', pageSize = '20' } = req.query;
    const storeId = getStoreId(req);
    const where: any = {};
    if (storeId) where.store_id = storeId;

    const skuWhere: any = {};
    if (keyword) {
      skuWhere.OR = [
        { sku_code: { contains: keyword as string } },
        { manufacturer_barcode: { contains: keyword as string } },
        { model: { name: { contains: keyword as string } } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [rawList, total] = await Promise.all([
      prisma.wh_inventory.findMany({
        where: {
          ...where,
          ...(keyword ? { sku: skuWhere } : {}),
        },
        skip,
        take,
        orderBy: { id: 'asc' },
        include: {
          sku: {
            include: {
              model: { include: { brand: { select: { id: true, name: true } } } },
              images: { take: 1, orderBy: { sort: 'asc' } },
            },
          },
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.wh_inventory.count({
        where: {
          ...where,
          ...(keyword ? { sku: skuWhere } : {}),
        },
      }),
    ]);

    const list = rawList.map((item) => ({
      id: item.id,
      skuId: item.sku_id,
      storeId: item.store_id,
      quantity: item.quantity,
      brandName: item.brand_name || item.sku?.model?.brand?.name || '',
      modelName: item.model_name || item.sku?.model?.name || '',
      skuCode: item.sku_code || item.sku?.sku_code || '',
      color: item.color || item.sku?.color || '',
      storage: item.storage || [item.sku?.ram, item.sku?.rom].filter(Boolean).join('/') || '',
      costPrice: item.cost_price || item.sku?.cost_price || 0,
      price: item.sale_price || item.sku?.sale_price || 0,
      barcode: item.sku?.manufacturer_barcode || '',
      storeName: item.store?.name || '',
    }));

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

router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { sku_id, change_type, page = '1', pageSize = '20' } = req.query;
    const storeId = getStoreId(req);
    const where: any = {};
    if (storeId) where.store_id = storeId;
    if (sku_id) where.sku_id = parseInt(sku_id as string);
    if (change_type) where.change_type = change_type;

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [rawList, total] = await Promise.all([
      prisma.wh_inventory_log.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          sku: { select: { id: true, sku_code: true, color: true, ram: true, rom: true } },
          operator: { select: { id: true, real_name: true } },
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.wh_inventory_log.count({ where }),
    ]);

    const list = rawList.map((item) => ({
      id: item.id,
      skuId: item.sku_id,
      storeId: item.store_id,
      brandName: '',
      modelName: '',
      color: item.sku?.color || '',
      storage: [item.sku?.ram, item.sku?.rom].filter(Boolean).join('/') || '',
      barcode: '',
      storeName: item.store?.name || '',
      changeType: item.change_type,
      changeQuantity: item.qty_change,
      beforeQuantity: item.qty_before,
      afterQuantity: item.qty_after,
      remark: item.remark,
      operatorName: item.operator?.real_name || '',
      createdAt: item.created_at,
    }));

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

router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const { threshold = '10' } = req.query;
    const storeId = getStoreId(req);
    const where: any = {
      quantity: { lte: parseInt(threshold as string) },
    };
    if (storeId) where.store_id = storeId;

    const list = await prisma.wh_inventory.findMany({
      where,
      orderBy: { quantity: 'asc' },
      include: {
        sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } } } },
        store: { select: { id: true, name: true } },
      },
    });

    const r: ApiResponse = { code: 200, message: 'success', data: list };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// ==================== 按型号查询库存（供销售开单使用） ====================

router.get('/by-model', async (req: Request, res: Response) => {
  try {
    const { model_id } = req.query;
    const storeId = getStoreId(req);
    if (!model_id) {
      const r: ApiResponse = { code: 400, message: '型号ID不能为空' };
      return res.status(400).json(r);
    }

    const skus = await prisma.pdt_sku.findMany({
      where: { model_id: parseInt(model_id as string) },
      include: {
        model: { include: { brand: { select: { id: true, name: true } } } },
      },
    });

    let stockMap = new Map<number, number>();
    let priceMap = new Map<number, { sale_price: number; cost_price: number }>();
    const inventoryWhere: any = {
      sku_id: { in: skus.map(s => s.id) },
    };
    if (storeId) {
      inventoryWhere.store_id = storeId;
    }
    const inventoryRecords = await prisma.wh_inventory.findMany({
      where: inventoryWhere,
    });
    for (const inv of inventoryRecords) {
      const current = stockMap.get(inv.sku_id) || 0;
      stockMap.set(inv.sku_id, current + inv.quantity);
      priceMap.set(inv.sku_id, {
        sale_price: inv.sale_price || 0,
        cost_price: inv.cost_price || 0,
      });
    }

    const result = skus.map(sku => {
      const invPrice = priceMap.get(sku.id);
      return {
        id: sku.id,
        brandName: sku.model?.brand?.name || '',
        modelName: sku.model?.name || '',
        skuCode: sku.sku_code,
        color: sku.color || '',
        storage: [sku.ram, sku.rom].filter(Boolean).join('/') || '',
        salePrice: invPrice?.sale_price || sku.sale_price || 0,
        costPrice: invPrice?.cost_price || sku.cost_price || 0,
        stock: stockMap.get(sku.id) || 0,
      };
    });

    const r: ApiResponse = { code: 200, message: 'success', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// ==================== 盘点管理 ====================

router.get('/checks', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', pageSize = '20' } = req.query;
    const storeId = getStoreId(req);
    const where: any = {};
    if (storeId) where.store_id = storeId;
    if (status) where.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [list, total] = await Promise.all([
      prisma.wh_inventory_check.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          checker: { select: { id: true, real_name: true } },
          store: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.wh_inventory_check.count({ where }),
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

router.get('/checks/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const check = await prisma.wh_inventory_check.findUnique({
      where: { id },
      include: {
        checker: { select: { id: true, real_name: true } },
        store: { select: { id: true, name: true } },
        items: {
          include: {
            sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } } } },
          },
        },
      },
    });
    if (!check) {
      const r: ApiResponse = { code: 404, message: '盘点单不存在' };
      return res.status(404).json(r);
    }
    const r: ApiResponse = { code: 200, message: 'success', data: check };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/checks', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }

    const { items, remark } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      const r: ApiResponse = { code: 400, message: '盘点商品列表不能为空' };
      return res.status(400).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
    const checkNo = await generateOrderNo('CK', store!.code);

    const check = await prisma.wh_inventory_check.create({
      data: {
        check_no: checkNo,
        store_id: storeId,
        checker_id: req.user!.userId,
        remark,
        items: {
          create: items.map((item: any) => ({
            sku_id: item.sku_id,
            expected_qty: item.expected_qty || 0,
            actual_qty: item.actual_qty || 0,
            diff_qty: (item.actual_qty || 0) - (item.expected_qty || 0),
          })),
        },
      },
      include: {
        items: true,
        checker: { select: { id: true, real_name: true } },
      },
    });

    const r: ApiResponse = { code: 200, message: '创建成功', data: check };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/checks/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { items, remark } = req.body;

    const existingCheck = await prisma.wh_inventory_check.findUnique({ where: { id } });
    if (!existingCheck) {
      const r: ApiResponse = { code: 404, message: '盘点单不存在' };
      return res.status(404).json(r);
    }
    if (existingCheck.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '只能编辑待审核的盘点单' };
      return res.status(400).json(r);
    }

    await prisma.wh_inventory_check_item.deleteMany({ where: { check_id: id } });

    const check = await prisma.wh_inventory_check.update({
      where: { id },
      data: {
        remark,
        items: {
          create: items.map((item: any) => ({
            sku_id: item.sku_id,
            expected_qty: item.expected_qty || 0,
            actual_qty: item.actual_qty || 0,
            diff_qty: (item.actual_qty || 0) - (item.expected_qty || 0),
          })),
        },
      },
      include: { items: true },
    });

    const r: ApiResponse = { code: 200, message: '更新成功', data: check };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/checks/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const check = await prisma.wh_inventory_check.findUnique({ where: { id } });
    if (!check) {
      const r: ApiResponse = { code: 404, message: '盘点单不存在' };
      return res.status(404).json(r);
    }
    if (check.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '只能删除待审核的盘点单' };
      return res.status(400).json(r);
    }
    await prisma.wh_inventory_check_item.deleteMany({ where: { check_id: id } });
    await prisma.wh_inventory_check.delete({ where: { id } });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/checks/:id/audit', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const check = await prisma.wh_inventory_check.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!check) {
      const r: ApiResponse = { code: 404, message: '盘点单不存在' };
      return res.status(404).json(r);
    }
    if (check.status !== 'pending') {
      const r: ApiResponse = { code: 400, message: '盘点单已审核' };
      return res.status(400).json(r);
    }

    await prisma.$transaction(async (tx) => {
      await tx.wh_inventory_check.update({
        where: { id },
        data: { status: 'audited', check_time: new Date() },
      });

      for (const item of check.items) {
        const diffQty = item.diff_qty ?? 0;
        if (diffQty === 0) continue;

        const skuInfo = await getSkuInfo(item.sku_id);
        const inventory = await tx.wh_inventory.findUnique({
          where: { sku_id_store_id: { sku_id: item.sku_id, store_id: check.store_id } },
        });

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: item.actual_qty,
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
              sku_id: item.sku_id, store_id: check.store_id, quantity: item.actual_qty,
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
            sku_id: item.sku_id,
            store_id: check.store_id,
            change_type: 'check',
            qty_before: item.expected_qty,
            qty_change: diffQty,
            qty_after: item.actual_qty,
            ref_type: 'inventory_check',
            ref_id: id,
            operator_id: req.user!.userId,
            remark: `盘点审核: ${check.check_no}, 差异: ${diffQty > 0 ? '+' : ''}${diffQty}`,
          },
        });
      }
    });

    const r: ApiResponse = { code: 200, message: '审核成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// ==================== 库存维护 ====================

router.put('/item/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { sale_price } = req.body;

    const inventory = await prisma.wh_inventory.findUnique({ where: { id } });
    if (!inventory) {
      const r: ApiResponse = { code: 404, message: '库存记录不存在' };
      return res.status(404).json(r);
    }

    const updated = await prisma.wh_inventory.update({
      where: { id },
      data: { sale_price: sale_price ?? undefined },
    });

    const r: ApiResponse = { code: 200, message: '更新成功', data: updated };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/item/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const inventory = await prisma.wh_inventory.findUnique({ where: { id } });
    if (!inventory) {
      const r: ApiResponse = { code: 404, message: '库存记录不存在' };
      return res.status(404).json(r);
    }

    await prisma.wh_inventory.delete({ where: { id } });

    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;

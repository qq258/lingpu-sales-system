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

function getStoreId(req: Request): number | null {
  return (req as any).effectiveStoreId ?? null;
}

async function getModelInfo(modelId: number) {
  const model = await prisma.pdt_model.findUnique({
    where: { id: modelId },
    include: { brand: { select: { name: true } } },
  });
  if (!model) return null;
  return {
    brand_name: model.brand?.name || '',
    model_name: model.name,
    color: model.color || '',
    storage: model.memory || '',
    cost_price: model.cost_price || 0,
    sale_price: model.sale_price || 0,
  };
}

router.post('/initial', async (req: Request, res: Response) => {
  try {
    const { model_id, quantity } = req.body;
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }
    if (!model_id || quantity === undefined) {
      const r: ApiResponse = { code: 400, message: '型号和数量不能为空' };
      return res.status(400).json(r);
    }

    const result = await prisma.$transaction(async (tx) => {
      const modelInfo = await getModelInfo(model_id);
      const existing = await tx.wh_inventory.findUnique({
        where: { model_id_store_id: { model_id, store_id: storeId } },
      });

      let inventory;
      if (existing) {
        inventory = await tx.wh_inventory.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + quantity,
            brand_name: modelInfo?.brand_name || existing.brand_name,
            model_name: modelInfo?.model_name || existing.model_name,
            color: modelInfo?.color || existing.color,
            storage: modelInfo?.storage || existing.storage,
            cost_price: modelInfo?.cost_price || existing.cost_price,
            sale_price: modelInfo?.sale_price || existing.sale_price || 0,
          },
        });
      } else {
        inventory = await tx.wh_inventory.create({
          data: {
            model_id, store_id: storeId, quantity,
            brand_name: modelInfo?.brand_name || '',
            model_name: modelInfo?.model_name || '',
            color: modelInfo?.color || '',
            storage: modelInfo?.storage || '',
            cost_price: modelInfo?.cost_price || 0,
            sale_price: modelInfo?.sale_price || 0,
          },
        });
      }

      await tx.wh_inventory_log.create({
        data: {
          model_id,
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

      return inventory;
    });

    const r: ApiResponse = { code: 200, message: '录入成功', data: result };
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
        const { model_id, quantity } = item;
        const modelInfo = await getModelInfo(model_id);
        const existing = await tx.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id, store_id: storeId } },
        });

        let inventory;
        if (existing) {
          inventory = await tx.wh_inventory.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + quantity,
              brand_name: modelInfo?.brand_name || existing.brand_name,
              model_name: modelInfo?.model_name || existing.model_name,
              color: modelInfo?.color || existing.color,
              storage: modelInfo?.storage || existing.storage,
              cost_price: modelInfo?.cost_price || existing.cost_price,
              sale_price: modelInfo?.sale_price || existing.sale_price || 0,
            },
          });
        } else {
          inventory = await tx.wh_inventory.create({
            data: {
              model_id, store_id: storeId, quantity,
              brand_name: modelInfo?.brand_name || '',
              model_name: modelInfo?.model_name || '',
              color: modelInfo?.color || '',
              storage: modelInfo?.storage || '',
              cost_price: modelInfo?.cost_price || 0,
              sale_price: modelInfo?.sale_price || 0,
            },
          });
        }

        await tx.wh_inventory_log.create({
          data: {
            model_id,
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
        model: {
          include: { brand: { select: { id: true, name: true } } },
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
        modelId: record.model_id,
        imei: record.imei,
        imei2: record.imei2,
        sn_code: record.sn_code,
        brandName: record.model?.brand?.name || '',
        modelName: record.model?.name || '',
        color: record.model?.color || '',
        storage: record.model?.memory || '',
        salePrice: record.model?.sale_price || 0,
        storeName: record.store?.name || '',
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// IMEI 完整信息查询（追踪链路）
router.get('/imei-query', async (req: Request, res: Response) => {
  try {
    const { imei } = req.query;
    if (!imei) {
      const r: ApiResponse = { code: 400, message: 'IMEI不能为空' };
      return res.status(400).json(r);
    }

    // 1. 查询 IMEI 基础信息
    const record = await prisma.wh_inventory_imei.findUnique({
      where: { imei: imei as string },
      include: {
        model: {
          include: { brand: { select: { id: true, name: true } } },
        },
        store: { select: { id: true, name: true } },
      },
    });

    if (!record) {
      const r: ApiResponse = { code: 404, message: '未找到该 IMEI 对应的记录' };
      return res.status(404).json(r);
    }

    // 2. 查询入库记录（通过 entry_id）
    let entryRecord = null;
    if (record.entry_id) {
      const entry = await prisma.pch_purchase_entry.findUnique({
        where: { id: record.entry_id },
        include: {
          supplier: { select: { id: true, name: true } },
        },
      });
      if (entry) {
        entryRecord = {
          entry_no: entry.entry_no,
          supplierName: entry.supplier?.name || '-',
          created_at: entry.created_at,
        };
      }
    }

    // 3. 查询销售记录（已售状态下通过 sale_order_item 关联）
    let saleRecord = null;
    if (record.status === 'sold') {
      const saleItem = await prisma.sale_order_item.findFirst({
        where: { imei: imei as string },
        include: {
          sale_order: {
            include: {
              store: { select: { id: true, name: true } },
              operator: { select: { id: true, real_name: true } },
            },
          },
        },
      });
      if (saleItem && saleItem.sale_order) {
        const order = saleItem.sale_order;
        saleRecord = {
          order_no: order.order_no,
          storeName: order.store?.name || '-',
          created_at: order.created_at,
          total_amount: order.total_amount,
          actual_amount: order.actual_amount,
          change_amount: order.change_amount,
          customer_name: order.customer_name || '-',
          customer_phone: order.customer_phone || '',
          customer_address: order.customer_address || '',
          operatorName: order.operator?.real_name || '-',
        };
      }
    }

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: {
        id: record.id,
        modelId: record.model_id,
        imei: record.imei,
        imei2: record.imei2,
        sn_code: record.sn_code,
        brandName: record.model?.brand?.name || '',
        modelName: record.model?.name || '',
        color: record.model?.color || '',
        storage: record.model?.memory || '',
        salePrice: record.model?.sale_price || 0,
        storeName: record.store?.name || '',
        status: record.status,
        entryRecord,
        saleRecord,
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/imei-list', async (req: Request, res: Response) => {
  try {
    const { keyword, brand_id, model_id, status, page = '1', pageSize = '20' } = req.query;
    const storeId = getStoreId(req);
    const imeiWhere: any = {};
    if (storeId) imeiWhere.store_id = storeId;
    if (status) imeiWhere.status = status as string;

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const modelFilter: any = {};
    if (brand_id) modelFilter.brand_id = parseInt(brand_id as string);
    if (model_id) modelFilter.id = parseInt(model_id as string);

    if (keyword) {
      const keywordFilter = [
        { imei: { contains: keyword as string } },
        { imei2: { contains: keyword as string } },
        { sn_code: { contains: keyword as string } },
        { model: { name: { contains: keyword as string } } },
        { model: { name: { contains: keyword as string } } },
      ];
      if (Object.keys(modelFilter).length > 0) {
        imeiWhere.AND = [{ model: modelFilter }, { OR: keywordFilter }];
      } else {
        imeiWhere.OR = keywordFilter;
      }
    } else if (Object.keys(modelFilter).length > 0) {
      imeiWhere.model = modelFilter;
    }

    const [rawList, total] = await Promise.all([
      prisma.wh_inventory_imei.findMany({
        where: imeiWhere,
        skip,
        take,
        orderBy: { id: 'desc' },
        include: {
          model: {
            include: { brand: { select: { id: true, name: true } } },
          },
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.wh_inventory_imei.count({ where: imeiWhere }),
    ]);

    const list = rawList.map((item) => ({
      id: item.id,
      modelId: item.model_id,
      storeId: item.store_id,
      imei: item.imei,
      imei2: item.imei2,
      sn_code: item.sn_code,
      status: item.status,
      isSold: item.status !== 'in_stock',
      brandName: item.model?.brand?.name || '',
      modelName: item.model?.name || '',
      color: item.model?.color || '',
      storage: item.model?.memory || '',
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

router.put('/imei/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { imei2, sn_code } = req.body;

    if (!imei2 && !sn_code) {
      const r: ApiResponse = { code: 400, message: 'IMEI2 和 SN 码至少提供一个' };
      return res.status(400).json(r);
    }

    const record = await prisma.wh_inventory_imei.findUnique({ where: { id } });
    if (!record) {
      const r: ApiResponse = { code: 404, message: '记录不存在' };
      return res.status(404).json(r);
    }

    const updated = await prisma.wh_inventory_imei.update({
      where: { id },
      data: {
        ...(imei2 !== undefined ? { imei2 } : {}),
        ...(sn_code !== undefined ? { sn_code } : {}),
      },
    });

    const r: ApiResponse = { code: 200, message: '更新成功', data: updated };
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

    const modelWhere: any = {};
    if (keyword) {
      modelWhere.OR = [
        { name: { contains: keyword as string } },
        { color: { contains: keyword as string } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [rawList, total] = await Promise.all([
      prisma.wh_inventory.findMany({
        where: {
          ...where,
          ...(keyword ? { model: modelWhere } : {}),
        },
        skip,
        take,
        orderBy: { id: 'asc' },
        include: {
          model: {
            include: { brand: { select: { id: true, name: true } } },
          },
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.wh_inventory.count({
        where: {
          ...where,
          ...(keyword ? { model: modelWhere } : {}),
        },
      }),
    ]);

    const list = rawList.map((item) => ({
      id: item.id,
      modelId: item.model_id,
      storeId: item.store_id,
      quantity: item.quantity,
      brandName: item.brand_name || item.model?.brand?.name || '',
      modelName: item.model_name || item.model?.name || '',
      color: item.color || item.model?.color || '',
      storage: item.storage || item.model?.memory || '',
      costPrice: item.cost_price || item.model?.cost_price || 0,
      price: item.sale_price || item.model?.sale_price || 0,
      barcode: '',
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
    const { model_id, change_type, page = '1', pageSize = '20' } = req.query;
    const storeId = getStoreId(req);
    const where: any = {};
    if (storeId) where.store_id = storeId;
    if (model_id) where.model_id = parseInt(model_id as string);
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
          model: { select: { id: true, name: true, color: true, memory: true } },
          operator: { select: { id: true, real_name: true } },
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.wh_inventory_log.count({ where }),
    ]);

    const list = rawList.map((item) => ({
      id: item.id,
      modelId: item.model_id,
      storeId: item.store_id,
      brandName: '',
      modelName: item.model?.name || '',
      color: item.model?.color || '',
      storage: item.model?.memory || '',
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
        model: { include: { brand: { select: { id: true, name: true } } } },
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

router.get('/by-model', async (req: Request, res: Response) => {
  try {
    const { model_id } = req.query;
    const storeId = getStoreId(req);
    if (!model_id) {
      const r: ApiResponse = { code: 400, message: '型号ID不能为空' };
      return res.status(400).json(r);
    }

    const model = await prisma.pdt_model.findUnique({
      where: { id: parseInt(model_id as string) },
      include: { brand: { select: { id: true, name: true } } },
    });

    if (!model) {
      const r: ApiResponse = { code: 200, message: 'success', data: [] };
      return res.json(r);
    }

    let stock = 0;
    const inventoryWhere: any = { model_id: model.id };
    if (storeId) {
      inventoryWhere.store_id = storeId;
    }
    const inventoryRecord = await prisma.wh_inventory.findFirst({
      where: inventoryWhere,
    });
    stock = inventoryRecord?.quantity || 0;

    const result = [{
      id: model.id,
      brandName: model.brand?.name || '',
      modelName: model.name,
      color: model.color || '',
      storage: model.memory || '',
      salePrice: model.sale_price || 0,
      costPrice: model.cost_price || 0,
      stock,
    }];

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
            model: { include: { brand: { select: { id: true, name: true } } } },
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
            model_id: item.model_id,
            expected_qty: item.expected_qty || 0,
            actual_qty: item.actual_qty || 0,
            diff_qty: (item.actual_qty || 0) - (item.expected_qty || 0),
          })),
        },
      },
      include: {
        checker: { select: { id: true, real_name: true } },
        store: { select: { id: true, name: true } },
        items: {
          include: {
            model: { include: { brand: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    const r: ApiResponse = { code: 200, message: '创建成功', data: check };
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
        data: { status: 'completed', check_time: new Date() },
      });

      for (const item of check.items) {
        if (item.diff_qty === 0) continue;

        const inventory = await tx.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id: item.model_id, store_id: check.store_id } },
        });

        const qtyBefore = inventory?.quantity || 0;
        const qtyAfter = qtyBefore + (item.diff_qty || 0);

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: { quantity: Math.max(0, qtyAfter) },
          });
        } else {
          await tx.wh_inventory.create({
            data: { model_id: item.model_id, store_id: check.store_id, quantity: Math.max(0, qtyAfter) },
          });
        }

        await tx.wh_inventory_log.create({
          data: {
            model_id: item.model_id,
            store_id: check.store_id,
            change_type: 'check',
            qty_before: qtyBefore,
            qty_change: item.diff_qty || 0,
            qty_after: Math.max(0, qtyAfter),
            ref_type: 'inventory_check',
            ref_id: id,
            operator_id: req.user!.userId,
            remark: `盘点审核: ${check.check_no}`,
          },
        });
      }
    });

    const r: ApiResponse = { code: 200, message: '审核完成' };
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
      const r: ApiResponse = { code: 400, message: '仅可删除待审核的盘点单' };
      return res.status(400).json(r);
    }
    await prisma.wh_inventory_check.delete({ where: { id } });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导出库存（按 IMEI 明细，每台手机一条记录）
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const imeiWhere: any = {};
    if (keyword) {
      imeiWhere.OR = [
        { imei: { contains: keyword as string } },
        { model: { name: { contains: keyword as string } } },
      ];
    }
    const invData = await prisma.wh_inventory_imei.findMany({
      where: imeiWhere,
      orderBy: { id: 'desc' },
      include: {
        model: { include: { brand: { select: { name: true } } } },
        store: { select: { name: true } },
      },
    });
    const data = invData.map((r) => ({
      '品牌型号': `${r.model?.brand?.name || ''} ${r.model?.name || ''}`,
      'IMEI1': r.imei,
      'IMEI2': r.imei2 || '',
      'S/N码': r.sn_code || '',
      '是否售出': r.status !== 'in_stock' ? '是' : '否',
      '售出时间': r.status !== 'in_stock' && r.sold_at ? formatDate(r.sold_at) : '',
      '所在门店': r.store?.name || '',
      '状态': r.status === 'in_stock' ? '在库' : '已售',
      '创建时间': formatDate(r.created_at),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '库存');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导出库存流水
router.get('/logs/export', async (req: Request, res: Response) => {
  try {
    const { changeType, startDate, endDate } = req.query;
    const where: any = {};
    if (changeType) where.change_type = changeType as string;
    if (startDate && endDate) {
      where.created_at = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string + 'T23:59:59'),
      };
    }
    const logData = await prisma.wh_inventory_log.findMany({
      where,
      include: { model: { select: { name: true } }, store: { select: { name: true } } },
      orderBy: { id: 'desc' },
      take: 5000,
    });
    const typeMap: Record<string, string> = {
      purchase_in: '采购入库', sale_out: '销售出库', transfer_out: '调货出库',
      transfer_in: '调货入库', check_adjust: '盘点调整', initial: '期初录入',
    };
    const data = logData.map((r) => ({
      '编号': r.id,
      '门店': r.store?.name || '',
      '型号': r.model?.name || '',
      '变动类型': typeMap[r.change_type] || r.change_type,
      '变动前数量': r.qty_before,
      '变动数量': r.qty_change,
      '变动后数量': r.qty_after,
      '备注': r.remark || '',
      '时间': r.created_at?.toISOString().slice(0, 16).replace('T', ' ') || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '库存流水');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_logs_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

function formatDate(d: any): string {
  if (!d) return '';
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
}

export default router;

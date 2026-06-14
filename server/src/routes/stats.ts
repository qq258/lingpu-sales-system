import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { storeScopeMiddleware } from '../middleware/store-scope';

const router = Router();

router.use(authMiddleware);
router.use(storeScopeMiddleware);

function getStoreId(req: Request): number | null {
  return (req as any).effectiveStoreId ?? null;
}

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    const isSuperAdmin = req.user?.role === 'super_admin';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const whereStore: any = {};
    if (storeId) whereStore.store_id = storeId;

    const [todaySales, todayOrders, recentSales, topModels, lowStock, recentOrders] = await Promise.all([
      prisma.sale_order.aggregate({
        where: { ...whereStore, created_at: { gte: todayStart, lte: todayEnd } },
        _sum: { actual_amount: true },
      }),
      prisma.sale_order.count({
        where: { ...whereStore, created_at: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.sale_order.findMany({
        where: { ...whereStore, created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { created_at: 'asc' },
        select: { actual_amount: true, created_at: true },
      }),
      prisma.sale_order.groupBy({
        by: ['model_id'],
        where: whereStore,
        _sum: { quantity: true, actual_amount: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.wh_inventory.count({
        where: { ...whereStore, quantity: { lte: 10 } },
      }),
      prisma.sale_order.findMany({
        where: whereStore,
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { order_no: true, actual_amount: true, created_at: true },
      }),
    ]);

    const topProductDetails = await Promise.all(
      topModels.map(async (item) => {
        const model = await prisma.pdt_model.findUnique({
          where: { id: item.model_id },
          select: { id: true, name: true },
        });
        return {
          modelId: item.model_id,
          modelName: model?.name || '未知',
          quantity: item._sum.quantity || 0,
          amount: item._sum.actual_amount || 0,
        };
      }),
    );

    const weeklySales = recentSales.map((s) => ({
      date: s.created_at.toISOString().slice(0, 10),
      amount: s.actual_amount,
    }));

    // 按日期聚合（同一天可能有多个订单）
    const aggregatedWeekly: Record<string, number> = {};
    for (const item of weeklySales) {
      aggregatedWeekly[item.date] = (aggregatedWeekly[item.date] || 0) + item.amount;
    }
    const finalWeeklySales = Object.entries(aggregatedWeekly)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 门店销售对比（仅超级管理员）
    let storeCompare: any[] | undefined;
    if (isSuperAdmin) {
      const storeSales = await prisma.sale_order.groupBy({
        by: ['store_id'],
        where: { created_at: { gte: todayStart, lte: todayEnd } },
        _sum: { actual_amount: true },
        _count: true,
      });
      const stores = await prisma.sys_store.findMany({ select: { id: true, name: true } });
      const storeMap = new Map(stores.map((s) => [s.id, s.name]));
      storeCompare = storeSales.map((s) => ({
        storeName: storeMap.get(s.store_id) || '未知',
        sales: s._sum.actual_amount || 0,
        orders: s._count,
      }));
    }

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: {
        todaySales: todaySales._sum.actual_amount || 0,
        todayOrders,
        lowStockCount: lowStock,
        weeklySales: finalWeeklySales,
        recentOrders: recentOrders.map((o) => ({
          orderNo: o.order_no,
          totalAmount: o.actual_amount,
          createdAt: o.created_at.toISOString(),
        })),
        topProducts: topProductDetails,
        storeCompare,
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    const { start_date, end_date, group_by = 'day' } = req.query;

    const where: any = {};
    if (storeId) where.store_id = storeId;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date as string);
      if (end_date) where.created_at.lte = new Date(end_date as string + 'T23:59:59.999Z');
    }

    const sales = await prisma.sale_order.findMany({
      where,
      orderBy: { created_at: 'asc' },
      select: { actual_amount: true, quantity: true, created_at: true },
    });

    const grouped: Record<string, { totalAmount: number; totalQuantity: number; count: number }> = {};

    for (const sale of sales) {
      let key: string;
      const d = new Date(sale.created_at);

      if (group_by === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (group_by === 'week') {
        const startOfWeek = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        key = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { totalAmount: 0, totalQuantity: 0, count: 0 };
      }
      grouped[key].totalAmount += sale.actual_amount;
      grouped[key].totalQuantity += sale.quantity;
      grouped[key].count += 1;
    }

    const result = Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const r: ApiResponse = { code: 200, message: 'success', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/top-products', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    const { start_date, end_date, limit = '10' } = req.query;

    const saleWhere: any = { status: 'active' };
    if (storeId) saleWhere.store_id = storeId;
    if (start_date || end_date) {
      saleWhere.created_at = {};
      if (start_date) saleWhere.created_at.gte = new Date(start_date as string);
      if (end_date) saleWhere.created_at.lte = new Date(end_date as string + 'T23:59:59.999Z');
    }

    const topItems = await prisma.sale_order_item.groupBy({
      by: ['model_id'],
      where: {
        sale_order: saleWhere,
      },
      _sum: { quantity: true, total_price: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: parseInt(limit as string) || 10,
    });

    const modelIds = topItems.map(i => i.model_id);
    const models = await prisma.pdt_model.findMany({
      where: { id: { in: modelIds } },
      select: { id: true, name: true },
    });
    const modelMap = new Map(models.map(m => [m.id, m.name]));

    const data = topItems.map(item => ({
      modelId: item.model_id,
      modelName: modelMap.get(item.model_id) || '未知',
      quantity: item._sum.quantity || 0,
      amount: item._sum.total_price || 0,
    }));

    const r: ApiResponse = { code: 200, message: 'success', data };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/transfers', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    const { start_date, end_date } = req.query;

    const where: any = {};
    if (storeId) {
      where.OR = [{ from_store_id: storeId }, { to_store_id: storeId }];
    }
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date as string);
      if (end_date) where.created_at.lte = new Date(end_date as string + 'T23:59:59.999Z');
    }

    const [totalTransfers, statusCounts, recentTransfers] = await Promise.all([
      prisma.wh_transfer.count({ where }),
      prisma.wh_transfer.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.wh_transfer.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          from_store: { select: { id: true, name: true } },
          to_store: { select: { id: true, name: true } },
          model: { select: { id: true, name: true } },
        },
      }),
    ]);

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: {
        totalTransfers,
        statusDistribution: statusCounts,
        recentTransfers,
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;

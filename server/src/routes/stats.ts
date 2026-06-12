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

router.get('/stats/dashboard', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const whereStore: any = {};
    if (storeId) whereStore.store_id = storeId;

    const [todaySales, todayOrders, recentSales, topSkus, lowStock] = await Promise.all([
      prisma.sale_order.aggregate({
        where: { ...whereStore, created_at: { gte: todayStart, lte: todayEnd } },
        _sum: { actual_amount: true },
        _count: true,
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
        by: ['sku_id'],
        where: whereStore,
        _sum: { quantity: true, actual_amount: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.wh_inventory.findMany({
        where: { ...whereStore, quantity: { lte: 10 } },
        take: 5,
        orderBy: { quantity: 'asc' },
        include: { sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } } } } },
      }),
    ]);

    const topSkuDetails = await Promise.all(
      topSkus.map(async (item) => {
        const sku = await prisma.pdt_sku.findUnique({
          where: { id: item.sku_id },
          include: { model: { include: { brand: { select: { id: true, name: true } } } } },
        });
        return { sku, totalQuantity: item._sum.quantity, totalAmount: item._sum.actual_amount };
      }),
    );

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: {
        todaySalesAmount: todaySales._sum.actual_amount || 0,
        todayOrderCount: todayOrders,
        recent7DaysTrend: recentSales,
        topSkuSales: topSkuDetails,
        lowStockItems: lowStock,
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/stats/sales', async (req: Request, res: Response) => {
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

router.get('/stats/transfers', async (req: Request, res: Response) => {
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
          sku: { select: { id: true, sku_code: true } },
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

import request from './request'

export async function getDashboard(storeId?: number): Promise<{
  todaySales: number
  todayOrders: number
  lowStockCount: number
  weeklySales: Array<{ date: string; amount: number }>
  recentOrders: any[]
  topProducts: Array<{ modelId: number; modelName: string; quantity: number; amount: number }>
  storeCompare?: Array<{ storeName: string; sales: number; orders: number }>
}> {
  const params = storeId ? { storeId } : {}
  const res: any = await request.get('/stats/dashboard', { params })
  return res.data
}

export async function getSalesStats(params: {
  startDate?: string
  endDate?: string
  storeId?: number
  groupBy?: 'day' | 'week' | 'month'
}): Promise<any> {
  const res: any = await request.get('/stats/sales', { params })
  return res.data
}

export async function getTransferStats(params?: {
  startDate?: string
  endDate?: string
}): Promise<any> {
  const res: any = await request.get('/stats/transfers', { params })
  return res.data
}

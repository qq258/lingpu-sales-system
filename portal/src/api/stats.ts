import request from './request'

export async function getDashboard(storeId?: number) {
  const params = storeId ? { storeId } : {}
  const res: any = await request.get('/stats/dashboard', { params })
  return res.data
}

export async function getSalesStats(params: { startDate?: string; endDate?: string; storeId?: number; groupBy?: string }) {
  const query: any = {}
  if (params.startDate) query.start_date = params.startDate
  if (params.endDate) query.end_date = params.endDate
  if (params.storeId) query.store_id = params.storeId
  if (params.groupBy) query.group_by = params.groupBy
  const res: any = await request.get('/stats/sales', { params: query })
  return res.data
}

export async function getTopProducts(params: { startDate?: string; endDate?: string; storeId?: number; limit?: number }) {
  const query: any = {}
  if (params.startDate) query.start_date = params.startDate
  if (params.endDate) query.end_date = params.endDate
  if (params.storeId) query.store_id = params.storeId
  if (params.limit) query.limit = params.limit
  const res: any = await request.get('/stats/top-products', { params: query })
  return res.data
}

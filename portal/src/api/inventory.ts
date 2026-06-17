import request from './request'

export async function getInventoryImeiList(params?: { storeId?: number; keyword?: string; page?: number; pageSize?: number; brandId?: number; modelId?: number }) {
  const query: any = {}
  if (params?.keyword) query.keyword = params.keyword
  if (params?.page) query.page = params.page
  if (params?.pageSize) query.pageSize = params.pageSize
  if (params?.storeId) query.storeId = params.storeId
  if (params?.brandId) query.brand_id = params.brandId
  if (params?.modelId) query.model_id = params.modelId
  const res: any = await request.get('/inventory/imei-list', { params: query })
  return res.data
}

export async function scanImeiForSale(imei: string, storeId?: number) {
  const params: any = { imei }
  if (storeId) params.storeId = storeId
  const res: any = await request.get('/inventory/scan-imei', { params })
  return res.data
}

export async function getBrandInventory(params?: { storeId?: number; keyword?: string }) {
  const query: any = {}
  if (params?.storeId) query.storeId = params.storeId
  if (params?.keyword) query.keyword = params.keyword
  const res: any = await request.get('/inventory', { params: query })
  return res.data
}

export async function updateImeiInfo(id: number, data: { imei2?: string; sn_code?: string }) {
  const res: any = await request.put(`/inventory/imei/${id}`, data)
  return res.data
}

export async function imeiQuery(imei: string) {
  const res: any = await request.get('/inventory/imei-query', { params: { imei } })
  return res.data
}

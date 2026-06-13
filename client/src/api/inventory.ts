import request from './request'

export async function getInventory(params?: {
  storeId?: number
  skuId?: number
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/inventory', { params })
  return res.data
}

export async function scanImeiForSale(imei: string, storeId?: number): Promise<any> {
  const params: any = { imei }
  if (storeId) params.storeId = storeId
  const res: any = await request.get('/inventory/scan-imei', { params })
  return res.data
}

export async function getInventoryImeiList(params?: {
  storeId?: number
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/inventory/imei-list', { params })
  return res.data
}

export async function getInventoryLogs(params?: {
  storeId?: number
  skuId?: number
  changeType?: string
  page?: number
  pageSize?: number
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/inventory/logs', { params })
  return res.data
}

export async function initialEntry(data: { sku_id: number; quantity: number; store_id?: number }): Promise<any> {
  const res: any = await request.post('/inventory/initial', data)
  return res.data
}

export async function batchInitialEntry(data: { items: Array<{ sku_id: number; quantity: number }>; store_id?: number }): Promise<any> {
  const res: any = await request.post('/inventory/initial/batch', data)
  return res.data
}

export async function getLowStock(): Promise<any[]> {
  const res: any = await request.get('/inventory/low-stock')
  return res.data || []
}

export async function getInventoryChecks(params?: {
  page?: number
  pageSize?: number
  status?: string
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/inventory/checks', { params })
  return res.data
}

export async function createInventoryCheck(data: {
  storeId: number
  items: Array<{ skuId: number; actualQuantity: number }>
  remark?: string
}): Promise<any> {
  const res: any = await request.post('/inventory/checks', data)
  return res.data
}

export async function auditInventoryCheck(id: number): Promise<any> {
  const res: any = await request.put(`/inventory/checks/${id}/audit`)
  return res.data
}

export async function deleteInventory(id: number): Promise<void> {
  await request.delete(`/inventory/item/${id}`)
}

export async function updateInventory(id: number, data: { sale_price: number }): Promise<any> {
  const res: any = await request.put(`/inventory/item/${id}`, data)
  return res.data
}

export async function getInventoryByModel(modelId: number, storeId?: number): Promise<any[]> {
  const params: any = { model_id: modelId }
  if (storeId) params.storeId = storeId
  const res: any = await request.get('/inventory/by-model', { params })
  return res.data || []
}

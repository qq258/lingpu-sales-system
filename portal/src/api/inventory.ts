import request from './request'

export async function getInventoryImeiList(params?: { storeId?: number; keyword?: string; page?: number; pageSize?: number; brandId?: number; modelId?: number; status?: string }) {
  const query: any = {}
  if (params?.keyword) query.keyword = params.keyword
  if (params?.page) query.page = params.page
  if (params?.pageSize) query.pageSize = params.pageSize
  if (params?.storeId) query.storeId = params.storeId
  if (params?.brandId) query.brand_id = params.brandId
  if (params?.modelId) query.model_id = params.modelId
  if (params?.status) query.status = params.status
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

// 品牌→型号 库存树（合并页）
export async function getInventoryTree(params?: { storeId?: number }) {
  const query: any = {}
  if (params?.storeId) query.storeId = params.storeId
  const res: any = await request.get('/inventory/tree', { params: query })
  return res.data || []
}

// 删除单条 IMEI 库存（必须填写原因）
export async function deleteImeiInventory(id: number, deleteReason: string) {
  const res: any = await request.delete(`/inventory/imei/${id}`, { data: { delete_reason: deleteReason } })
  return res.data
}

// 删除某型号全部在库库存（必须填写原因）
export async function deleteModelInventory(modelId: number, deleteReason: string) {
  const res: any = await request.delete(`/inventory/model/${modelId}`, { data: { delete_reason: deleteReason } })
  return res.data
}

// ---- 期初库存 ----
export async function createInitialStock(modelId: number, quantity: number, storeId?: number) {
  const res: any = await request.post('/inventory/initial', { model_id: modelId, quantity, store_id: storeId })
  return res.data
}

// ---- 库存流水 ----
export async function getInventoryLogs(params?: { model_id?: number; change_type?: string; page?: number; pageSize?: number }) {
  const res: any = await request.get('/inventory/logs', { params })
  return res.data || { list: [], total: 0 }
}

export function exportInventoryLogs(): void {
  const token = localStorage.getItem('portal_token')
  fetch('/api/v1/inventory/logs/export', { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory_logs_${dateStr()}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(() => {})
}

// ---- 库存盘点 ----
export async function getInventoryChecks(params?: { status?: string; page?: number; pageSize?: number }) {
  const res: any = await request.get('/inventory/checks', { params })
  return res.data || { list: [], total: 0 }
}

export async function getInventoryCheck(id: number) {
  const res: any = await request.get(`/inventory/checks/${id}`)
  return res.data
}

export async function createInventoryCheck(items: Array<{ model_id: number; expected_qty: number; actual_qty: number }>, remark?: string) {
  const res: any = await request.post('/inventory/checks', { items, remark })
  return res.data
}

export async function auditInventoryCheck(id: number) {
  const res: any = await request.put(`/inventory/checks/${id}/audit`)
  return res.data
}

export async function deleteInventoryCheck(id: number) {
  const res: any = await request.delete(`/inventory/checks/${id}`)
  return res.data
}

function dateStr(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

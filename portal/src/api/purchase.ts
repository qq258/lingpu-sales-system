import request from './request'

export async function getSuppliers(keyword?: string) {
  const params = keyword ? { keyword } : undefined
  const res: any = await request.get('/purchase/suppliers', { params })
  return res.data || []
}

export async function createSupplier(data: { name: string; contact_person?: string; phone?: string; address?: string; remark?: string }) {
  const res: any = await request.post('/purchase/suppliers', data)
  return res.data
}

export async function updateSupplier(id: number, data: { name?: string; contact_person?: string; phone?: string; address?: string; remark?: string; status?: number }) {
  const res: any = await request.put(`/purchase/suppliers/${id}`, data)
  return res.data
}

export async function deleteSupplier(id: number) {
  const res: any = await request.delete(`/purchase/suppliers/${id}`)
  return res.data
}

export async function getPurchaseEntries(params?: { page?: number; pageSize?: number; status?: string }) {
  const res: any = await request.get('/purchase/purchase-entries', { params })
  return res.data || { list: [], total: 0 }
}

export async function getPurchaseEntry(id: number) {
  const res: any = await request.get(`/purchase/purchase-entries/${id}`)
  return res.data
}

export async function checkImeiExists(imei: string) {
  const res: any = await request.get('/purchase/check-imei', { params: { imei } })
  return res.data
}

export async function quickConfirmPurchaseEntry(data: {
  supplierId?: number | null; remark?: string; storeId?: number;
  items: Array<{ modelId: number; imei: string; imei2?: string; snCode?: string; unitPrice: number }>
}) {
  const res: any = await request.post('/purchase/purchase-entries/quick-confirm', {
    supplier_id: data.supplierId, remark: data.remark, store_id: data.storeId,
    items: data.items.map(i => ({ model_id: i.modelId, imei: i.imei, imei2: i.imei2 || null, sn_code: i.snCode || null, unit_price: i.unitPrice })),
  })
  return res.data
}

export async function deletePurchaseEntry(id: number) {
  const res: any = await request.delete(`/purchase/purchase-entries/${id}`)
  return res.data
}

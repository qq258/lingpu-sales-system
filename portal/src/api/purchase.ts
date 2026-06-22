import request from './request'

export async function getSuppliers() {
  const res: any = await request.get('/purchase/suppliers')
  return res.data || []
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

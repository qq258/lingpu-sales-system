import request from './request'

export interface SupplierData {
  id?: number
  name: string
  contact?: string
  phone?: string
  address?: string
}

export async function getSuppliers(): Promise<SupplierData[]> {
  const res: any = await request.get('/purchase/suppliers')
  return (res.data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    contact: s.contact_person || '',
    phone: s.phone || '',
    address: s.address || '',
  }))
}

export async function createSupplier(data: SupplierData): Promise<SupplierData> {
  const res: any = await request.post('/purchase/suppliers', {
    name: data.name,
    contact_person: data.contact,
    phone: data.phone,
    address: data.address,
  })
  return res.data
}

export async function updateSupplier(id: number, data: SupplierData): Promise<SupplierData> {
  const res: any = await request.put(`/purchase/suppliers/${id}`, {
    name: data.name,
    contact_person: data.contact,
    phone: data.phone,
    address: data.address,
  })
  return res.data
}

export async function deleteSupplier(id: number): Promise<void> {
  await request.delete(`/purchase/suppliers/${id}`)
}

export async function deletePurchaseEntry(id: number): Promise<void> {
  await request.delete(`/purchase/purchase-entries/${id}`)
}

export async function getPurchaseEntries(params?: {
  page?: number
  pageSize?: number
  supplierId?: number
  status?: string
  startDate?: string
  endDate?: string
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/purchase/purchase-entries', { params })
  const data = res.data || { list: [], total: 0 }
  return {
    list: (data.list || []).map((item: any) => ({
      ...item,
      supplierName: item.supplier?.name,
      itemCount: item._count?.items || 0,
      totalAmount: item.total_amount,
      storeName: item.store?.name,
      createdAt: item.created_at,
    })),
    total: data.total || 0,
  }
}

export async function getPurchaseEntry(id: number): Promise<any> {
  const res: any = await request.get(`/purchase/purchase-entries/${id}`)
  const item: any = res.data
  return {
    ...item,
    supplierName: item.supplier?.name,
    storeName: item.store?.name,
    createdAt: item.created_at,
    items: (item.items || []).map((i: any) => ({
      ...i,
      brandName: i.model?.brand?.name,
      modelName: i.model?.name,
      color: i.model?.color,
      storage: i.model?.memory || '',
      costPrice: i.unit_price,
    })),
  }
}

export async function createPurchaseEntry(data: {
  supplierId?: number | null
  remark?: string
  storeId?: number
}): Promise<any> {
  const res: any = await request.post('/purchase/purchase-entries', {
    supplier_id: data.supplierId,
    remark: data.remark,
    store_id: data.storeId,
  })
  return res.data
}

export async function addPurchaseItem(entryId: number, data: { modelId: number; imei: string; imei2?: string; snCode?: string; unitPrice: number }): Promise<any> {
  const res: any = await request.post(`/purchase/purchase-entries/${entryId}/add-item`, {
    model_id: data.modelId,
    imei: data.imei,
    imei2: data.imei2 || null,
    sn_code: data.snCode || null,
    unit_price: data.unitPrice,
  })
  return res.data
}

export async function batchAddPurchaseImei(entryId: number, data: { modelId: number; imeiList: string[]; imei2List?: string[]; snCodeList?: string[]; unitPrice: number }): Promise<any> {
  const res: any = await request.post(`/purchase/purchase-entries/${entryId}/imei/batch`, {
    model_id: data.modelId,
    imei_list: data.imeiList,
    imei2_list: data.imei2List || [],
    sn_code_list: data.snCodeList || [],
    unit_price: data.unitPrice,
  })
  return res.data
}

export async function deletePurchaseItem(entryId: number, itemId: number): Promise<any> {
  const res: any = await request.delete(`/purchase/purchase-entries/${entryId}/items/${itemId}`)
  return res.data
}

export async function confirmPurchaseEntry(entryId: number): Promise<any> {
  const res: any = await request.put(`/purchase/purchase-entries/${entryId}/confirm`)
  return res.data
}

export async function quickConfirmPurchaseEntry(data: {
  supplierId?: number | null
  remark?: string
  storeId?: number
  items: Array<{ modelId: number; imei: string; imei2?: string; snCode?: string; unitPrice: number }>
}): Promise<any> {
  const res: any = await request.post('/purchase/purchase-entries/quick-confirm', {
    supplier_id: data.supplierId,
    remark: data.remark,
    store_id: data.storeId,
    items: data.items.map(i => ({
      model_id: i.modelId,
      imei: i.imei,
      imei2: i.imei2 || null,
      sn_code: i.snCode || null,
      unit_price: i.unitPrice,
    })),
  })
  return res.data
}

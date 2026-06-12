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
  return res.data || []
}

export async function createSupplier(data: SupplierData): Promise<SupplierData> {
  const res: any = await request.post('/purchase/suppliers', data)
  return res.data
}

export async function updateSupplier(id: number, data: SupplierData): Promise<SupplierData> {
  const res: any = await request.put(`/purchase/suppliers/${id}`, data)
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
      itemCount: item.items?.length || 0,
      totalQuantity: item.items?.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) || 0,
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
      brandName: i.sku?.model?.brand?.name,
      modelName: i.sku?.model?.name,
      color: i.sku?.color,
      storage: `${i.sku?.ram || ''}${i.sku?.ram && i.sku?.rom ? '/' : ''}${i.sku?.rom || ''}`,
      barcode: i.sku?.manufacturer_barcode,
      costPrice: i.unit_price,
      quantity: i.quantity,
    })),
  }
}

export async function createPurchaseEntry(data: {
  supplierId: number
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

export async function scanPurchaseEntry(entryId: number, barcode: string): Promise<any> {
  const res: any = await request.post(`/purchase/purchase-entries/${entryId}/scan`, { barcode })
  return res.data
}

export async function confirmPurchaseEntry(entryId: number, items: Array<{ modelId: number; quantity: number; costPrice: number }>): Promise<any> {
  const res: any = await request.put(`/purchase/purchase-entries/${entryId}/confirm`, { items })
  return res.data
}

export async function addPurchaseEntryItem(entryId: number, data: { modelId: number; quantity: number; costPrice: number }): Promise<any> {
  const res: any = await request.post(`/purchase/purchase-entries/${entryId}/items`, {
    model_id: data.modelId,
    quantity: data.quantity,
    unit_price: data.costPrice,
  })
  return res.data
}

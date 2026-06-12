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
      brandName: i.sku?.model?.brand?.name,
      modelName: i.sku?.model?.name,
      color: i.sku?.color,
      storage: `${i.sku?.ram || ''}${i.sku?.ram && i.sku?.rom ? '/' : ''}${i.sku?.rom || ''}`,
      barcode: i.sku?.manufacturer_barcode,
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

export async function addPurchaseItem(entryId: number, data: { skuId: number; imei: string; unitPrice: number }): Promise<any> {
  const res: any = await request.post(`/purchase/purchase-entries/${entryId}/add-item`, {
    sku_id: data.skuId,
    imei: data.imei,
    unit_price: data.unitPrice,
  })
  return res.data
}

export async function batchAddPurchaseImei(entryId: number, data: { skuId: number; imeiList: string[]; unitPrice: number }): Promise<any> {
  const res: any = await request.post(`/purchase/purchase-entries/${entryId}/imei/batch`, {
    sku_id: data.skuId,
    imei_list: data.imeiList,
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

import request from './request'

export async function createSale(data: {
  items: Array<{ sku_id: number; quantity: number; unit_price: number }>
  total_amount: number
  actual_amount: number
  customer_name?: string
  remark?: string
  store_id?: number
}): Promise<any> {
  const res: any = await request.post('/sales/sales', data)
  return res.data
}

export async function getSales(params?: {
  page?: number
  pageSize?: number
  storeId?: number
  startDate?: string
  endDate?: string
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/sales/sales', { params })
  return res.data
}

export async function getSale(id: number): Promise<any> {
  const res: any = await request.get(`/sales/sales/${id}`)
  return res.data
}

export async function getPrintData(id: number): Promise<any> {
  const res: any = await request.get(`/sales/sales/${id}/print-data`)
  return res.data
}

export async function deleteSale(id: number): Promise<void> {
  await request.delete(`/sales/sales/${id}`)
}

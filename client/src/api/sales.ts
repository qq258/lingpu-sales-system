import request from './request'

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

export async function createSale(data: {
  items: Array<{ imei: string; unit_price: number; imei2?: string | null; sn_code?: string | null }>
  actual_amount: number
  customer_name?: string
  customer_address?: string
  customer_phone?: string
  remark?: string
}): Promise<any> {
  const res: any = await request.post('/sales/sales', data)
  return res.data
}

export async function deleteSale(id: number): Promise<void> {
  await request.delete(`/sales/sales/${id}`)
}

export async function getSalePrintData(id: number): Promise<any> {
  const res: any = await request.get(`/sales/sales/${id}/print-data`)
  return res.data
}

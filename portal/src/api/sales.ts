import request from './request'

export async function getSalesList(params?: { page?: number; pageSize?: number; storeId?: number; startDate?: string; endDate?: string; keyword?: string }) {
  const res: any = await request.get('/sales/sales', { params })
  return res.data
}

export async function createSale(data: { items: Array<{ imei: string; unit_price: number }>; actual_amount: number; customer_name?: string; customer_phone?: string; customer_address?: string; change_amount?: number; total_amount?: number }) {
  const res: any = await request.post('/sales/sales', data)
  return res.data
}

export async function getSalePrintData(id: number) {
  const res: any = await request.get(`/sales/sales/${id}/print-data`)
  return res.data
}

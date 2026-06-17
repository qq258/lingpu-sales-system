import request from './request'

export async function getAfterSalesList(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  process_type?: string
  start_date?: string
  end_date?: string
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/after-sales', { params })
  return res.data
}

export async function getAfterSaleDetail(id: number): Promise<any> {
  const res: any = await request.get(`/after-sales/${id}`)
  return res.data
}

export async function createAfterSale(data: {
  imei_id: number
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  fault_description: string
  detection_result?: string
  process_type?: string
  repair_level?: string
  cost?: number
  cost_remark?: string
  supplier_contact?: string
  supplier_status?: string
  supplier_result?: string
}): Promise<any> {
  const res: any = await request.post('/after-sales', data)
  return res.data
}

export async function updateAfterSale(id: number, data: {
  detection_result?: string
  process_type?: string
  repair_level?: string
  status?: string
  cost?: number
  supplier_contact?: string
  supplier_status?: string
  supplier_result?: string
  result?: string
}): Promise<any> {
  const res: any = await request.put(`/after-sales/${id}`, data)
  return res.data
}

export async function addAfterSaleLog(orderId: number, data: {
  action?: string
  content: string
}): Promise<any> {
  const res: any = await request.post(`/after-sales/${orderId}/log`, data)
  return res.data
}

export async function completeAfterSale(id: number): Promise<any> {
  const res: any = await request.post(`/after-sales/${id}/complete`)
  return res.data
}

export async function deleteAfterSale(id: number): Promise<void> {
  await request.delete(`/after-sales/${id}`)
}

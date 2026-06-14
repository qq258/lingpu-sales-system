import request from './request'

export async function getTransfers(params?: {
  page?: number
  pageSize?: number
  status?: string
  fromStoreId?: number
  toStoreId?: number
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/transfer/transfers', { params })
  return res.data
}

export async function getTransfer(id: number): Promise<any> {
  const res: any = await request.get(`/transfer/transfers/${id}`)
  return res.data
}

export async function createTransfer(data: {
  toStoreId: number
  items: Array<{ modelId: number; quantity: number }>
  remark?: string
}): Promise<any> {
  const res: any = await request.post('/transfer/transfers', {
    to_store_id: data.toStoreId,
    items: data.items.map(i => ({ model_id: i.modelId, quantity: i.quantity })),
    remark: data.remark,
  })
  return res.data
}

export async function outboundTransfer(id: number): Promise<any> {
  const res: any = await request.put(`/transfer/transfers/${id}/outbound`)
  return res.data
}

export async function inboundTransfer(id: number): Promise<any> {
  const res: any = await request.put(`/transfer/transfers/${id}/inbound`)
  return res.data
}

export async function cancelTransfer(id: number): Promise<any> {
  const res: any = await request.put(`/transfer/transfers/${id}/cancel`)
  return res.data
}

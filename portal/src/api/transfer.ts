import request from './request'

export async function getTransfers(params?: { page?: number; pageSize?: number; status?: string }) {
  const res: any = await request.get('/transfers/transfers', { params })
  return res.data || { list: [], total: 0 }
}

export async function getTransfer(id: number) {
  const res: any = await request.get(`/transfers/transfers/${id}`)
  return res.data
}

export async function createTransfer(data: { toStoreId: number; items: Array<{ modelId: number; quantity: number }>; remark?: string }) {
  const res: any = await request.post('/transfers/transfers', {
    to_store_id: data.toStoreId,
    items: data.items.map((i) => ({ model_id: i.modelId, quantity: i.quantity })),
    remark: data.remark,
  })
  return res.data
}

export async function outboundTransfer(id: number) {
  const res: any = await request.put(`/transfers/transfers/${id}/outbound`)
  return res.data
}

export async function inboundTransfer(id: number) {
  const res: any = await request.put(`/transfers/transfers/${id}/inbound`)
  return res.data
}

export async function cancelTransfer(id: number) {
  const res: any = await request.put(`/transfers/transfers/${id}/cancel`)
  return res.data
}

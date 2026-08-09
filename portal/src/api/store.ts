import request from './request'

export async function getStores() {
  const res: any = await request.get('/stores')
  return res.data || []
}

export async function createStore(data: { name: string; code: string; address?: string; phone?: string }) {
  const res: any = await request.post('/stores', data)
  return res.data
}

export async function updateStore(id: number, data: Partial<{ name: string; code: string; address?: string; phone?: string; status?: number }>) {
  const res: any = await request.put(`/stores/${id}`, data)
  return res.data
}

export async function deleteStore(id: number) {
  const res: any = await request.delete(`/stores/${id}`)
  return res.data
}

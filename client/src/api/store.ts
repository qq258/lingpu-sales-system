import request from './request'

export interface StoreData {
  id?: number
  name: string
  code: string
  address?: string
  phone?: string
  status?: number
  createdAt?: string
}

export async function getStores(): Promise<StoreData[]> {
  const res: any = await request.get('/stores')
  return res.data || []
}

export async function createStore(data: Partial<StoreData>): Promise<StoreData> {
  const res: any = await request.post('/stores', data)
  return res.data
}

export async function updateStore(id: number, data: Partial<StoreData>): Promise<StoreData> {
  const res: any = await request.put(`/stores/${id}`, data)
  return res.data
}

export async function deleteStore(id: number): Promise<void> {
  await request.delete(`/stores/${id}`)
}

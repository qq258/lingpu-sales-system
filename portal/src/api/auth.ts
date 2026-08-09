import request from './request'

export interface UserItem {
  id: number
  username: string
  realName: string
  role: string
  storeId: number | null
  storeName: string | null
  status: number
  createdAt: string
}

export async function getUsers() {
  const res: any = await request.get('/auth/users')
  return res.data?.list || []
}

export async function registerUser(data: { username: string; password: string; realName: string; role: string; storeId?: number }) {
  const res: any = await request.post('/auth/register', data)
  return res.data
}

export async function updateUser(id: number, data: { username?: string; realName?: string; role?: string; storeId?: number }) {
  const res: any = await request.put(`/auth/users/${id}`, data)
  return res.data
}

export async function resetUserPassword(id: number, password: string) {
  const res: any = await request.put(`/auth/users/${id}/reset-password`, { password })
  return res.data
}

export async function deleteUser(id: number) {
  const res: any = await request.delete(`/auth/users/${id}`)
  return res.data
}

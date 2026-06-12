import request from './request'

export interface LoginData {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: {
    id: number
    username: string
    realName: string
    role: 'super_admin' | 'store_admin' | 'operator'
    storeId: number | null
    storeName: string | null
  }
}

export async function login(data: LoginData): Promise<LoginResult> {
  const res: any = await request.post('/auth/login', data)
  return {
    token: res.data.token,
    user: {
      id: res.data.userInfo.id,
      username: res.data.userInfo.username,
      realName: res.data.userInfo.realName,
      role: res.data.userInfo.role,
      storeId: res.data.userInfo.storeId,
      storeName: res.data.userInfo.storeName || null,
    },
  }
}

export async function getUserInfo(): Promise<LoginResult['user']> {
  const res: any = await request.get('/auth/userinfo')
  return {
    id: res.data.id,
    username: res.data.username,
    realName: res.data.real_name,
    role: res.data.role,
    storeId: res.data.store_id,
    storeName: res.data.store?.name || null,
  }
}

export function register(data: { username: string; password: string; realName: string; role: string; storeId?: number }) {
  return request.post('/auth/register', data)
}

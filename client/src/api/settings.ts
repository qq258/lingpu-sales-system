import request from './request'

export async function getSetting(key: string) {
  const res: any = await request.get(`/settings/${key}`)
  return res.data
}

export async function updateSetting(key: string, value: string) {
  const res: any = await request.put(`/settings/${key}`, { value })
  return res.data
}

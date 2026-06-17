import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // 附上当前选中的门店 ID
  const storeId = localStorage.getItem('portal_selectedStoreId')
  if (storeId) {
    config.headers['x-store-id'] = storeId
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      const url = error.config?.url || ''
      switch (status) {
        case 401:
          if (url.includes('/auth/login')) break
          localStorage.removeItem('portal_token')
          window.location.href = '/login'
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          ElMessage.error(data?.message || '没有权限')
          break
        case 500:
          ElMessage.error('服务器错误，请稍后重试')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络开小差了，请稍后重试')
    }
    return Promise.reject(error)
  },
)

export default request

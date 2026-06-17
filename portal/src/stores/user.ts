import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api/request'

const STORE_ID_KEY = 'portal_selectedStoreId'

function getStoredStoreId(): number | null {
  const val = localStorage.getItem(STORE_ID_KEY)
  if (!val) return null
  const num = parseInt(val, 10)
  return isNaN(num) ? null : num
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('portal_token') || '')
  const userInfo = ref<any>(null)
  const currentStoreId = ref<number | null>(getStoredStoreId())
  const stores = ref<any[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => userInfo.value?.role === 'super_admin')
  const effectiveStoreId = computed(() => currentStoreId.value)

  async function login(username: string, password: string) {
    const res: any = await request.post('/auth/login', { username, password })
    token.value = res.data.token
    // 后端登录返回 userInfo（camelCase 字段: realName, storeId）
    const ui = res.data.userInfo
    userInfo.value = {
      id: ui.id,
      username: ui.username,
      realName: ui.realName || ui.real_name,
      role: ui.role,
      storeId: ui.storeId ?? ui.store_id,
    }
    stores.value = res.data.stores || []
    localStorage.setItem('portal_token', res.data.token)
    // 不在这里自动设置 currentStoreId，由登录页面根据门店数量决定是否弹出选择
    if (res.data.stores && res.data.stores.length === 1) {
      currentStoreId.value = res.data.stores[0].id
    }
    return res.data
  }

  async function fetchUserInfo() {
    const res: any = await request.get('/auth/userinfo')
    // 后端 /auth/userinfo 返回用户对象直接在 data.s 中（snake_case 字段: real_name, store_id）
    const d = res.data
    userInfo.value = {
      id: d.id,
      username: d.username,
      realName: d.real_name || d.realName,
      role: d.role,
      storeId: d.store_id ?? d.storeId,
    }
    stores.value = d.stores || []
    if (!currentStoreId.value && d.stores && d.stores.length > 0) {
      currentStoreId.value = d.stores[0].id
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    currentStoreId.value = null
    stores.value = []
    localStorage.removeItem('portal_token')
  }

  function setStore(storeId: number | null) {
    currentStoreId.value = storeId
    if (storeId) {
      localStorage.setItem(STORE_ID_KEY, String(storeId))
    } else {
      localStorage.removeItem(STORE_ID_KEY)
    }
  }

  return { token, userInfo, currentStoreId, stores, isLoggedIn, isSuperAdmin, effectiveStoreId, login, fetchUserInfo, logout, setStore }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserInfo } from '@/api/auth'
import { getStores } from '@/api/store'
import router from '@/router'

const STORE_ID_KEY = 'selectedStoreId'

function getStoredStoreId(): number | null {
  const val = localStorage.getItem(STORE_ID_KEY)
  if (!val) return null
  const num = parseInt(val, 10)
  return isNaN(num) ? null : num
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<{
    id: number
    username: string
    realName: string
    role: 'super_admin' | 'store_admin' | 'operator'
    storeId: number | null
    storeName: string | null
  } | null>(null)
  const currentStoreId = ref<number | null>(getStoredStoreId())
  const availableStores = ref<Array<{ id: number; name: string; code: string }>>([])

  const isSuperAdmin = computed(() => userInfo.value?.role === 'super_admin')
  const effectiveStoreId = computed(() => {
    if (isSuperAdmin.value) {
      return currentStoreId.value
    }
    return userInfo.value?.storeId || null
  })
  const isAllStores = computed(() => isSuperAdmin.value && !currentStoreId.value)
  const currentStoreName = computed(() => {
    if (isAllStores.value) return '全部门店'
    if (currentStoreId.value) {
      const store = availableStores.value.find(s => s.id === currentStoreId.value)
      if (store) return store.name
    }
    return userInfo.value?.storeName || '未知门店'
  })

  async function login(loginData: { username: string; password: string; storeId?: number }) {
    const result = await loginApi(loginData)
    token.value = result.token
    userInfo.value = result.user
    localStorage.setItem('token', result.token)
    availableStores.value = result.stores
    if (loginData.storeId) {
      currentStoreId.value = loginData.storeId
      localStorage.setItem(STORE_ID_KEY, String(loginData.storeId))
    } else if (result.user.storeId) {
      currentStoreId.value = result.user.storeId
      localStorage.setItem(STORE_ID_KEY, String(result.user.storeId))
    }
    return result.stores
  }

  function logout() {
    token.value = null
    userInfo.value = null
    currentStoreId.value = null
    availableStores.value = []
    localStorage.removeItem('token')
    localStorage.removeItem(STORE_ID_KEY)
    router.push('/login')
  }

  async function fetchUserInfo() {
    try {
      const info = await getUserInfo()
      userInfo.value = info
      if (info.storeId && !currentStoreId.value) {
        currentStoreId.value = info.storeId
      }
      await loadStores()
      // 恢复之前选择的门店（如果可用）
      const storedId = getStoredStoreId()
      if (storedId && availableStores.value.some(s => s.id === storedId)) {
        currentStoreId.value = storedId
      } else if (storedId) {
        // 之前选择的门店已不可用，清除
        currentStoreId.value = null
        localStorage.removeItem(STORE_ID_KEY)
      }
    } catch {
      logout()
    }
  }

  async function loadStores() {
    try {
      const stores = await getStores()
      availableStores.value = stores as Array<{ id: number; name: string; code: string }>
    } catch {
      // ignore
    }
  }

  function switchStore(storeId: number | null) {
    currentStoreId.value = storeId
    if (storeId) {
      localStorage.setItem(STORE_ID_KEY, String(storeId))
    } else {
      localStorage.removeItem(STORE_ID_KEY)
    }
  }

  return {
    token,
    userInfo,
    currentStoreId,
    availableStores,
    isSuperAdmin,
    effectiveStoreId,
    isAllStores,
    currentStoreName,
    login,
    logout,
    fetchUserInfo,
    switchStore,
    loadStores,
  }
})

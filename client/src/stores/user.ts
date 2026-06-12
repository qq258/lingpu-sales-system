import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserInfo } from '@/api/auth'
import { getStores } from '@/api/store'
import router from '@/router'

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
  const currentStoreId = ref<number | null>(null)
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
    } else if (result.user.storeId) {
      currentStoreId.value = result.user.storeId
    }
    return result.stores
  }

  function logout() {
    token.value = null
    userInfo.value = null
    currentStoreId.value = null
    availableStores.value = []
    localStorage.removeItem('token')
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

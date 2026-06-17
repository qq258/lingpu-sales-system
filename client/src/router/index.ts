import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('@/views/dashboard/Index.vue'), meta: { title: '数据看板' } },
      { path: 'store/list', component: () => import('@/views/store/StoreList.vue'), meta: { title: '门店管理', roles: ['super_admin'] } },
      { path: 'product/brand-model', component: () => import('@/views/product/ProductBrandModel.vue'), meta: { title: '品牌型号管理' } },
      { path: 'purchase/supplier', component: () => import('@/views/purchase/SupplierList.vue'), meta: { title: '供应商管理' } },
      { path: 'purchase/entry/list', component: () => import('@/views/purchase/PurchaseEntryIndex.vue'), meta: { title: '入库管理' } },
      { path: 'inventory', component: () => import('@/views/inventory/InventoryList.vue'), meta: { title: '库存查询' } },
      { path: 'inventory/initial', component: () => import('@/views/inventory/InitialEntry.vue'), meta: { title: '期初库存', roles: ['super_admin', 'store_admin'] } },
      { path: 'inventory/check', component: () => import('@/views/inventory/InventoryCheckList.vue'), meta: { title: '库存盘点' } },
      { path: 'inventory/logs', component: () => import('@/views/inventory/InventoryLogs.vue'), meta: { title: '库存流水' } },
      { path: 'transfer/list', component: () => import('@/views/transfer/TransferList.vue'), meta: { title: '调货管理' } },
      { path: 'transfer/new', component: () => import('@/views/transfer/TransferNew.vue'), meta: { title: '发起调货' } },
      { path: 'sales/new', component: () => import('@/views/sales/SaleNew.vue'), meta: { title: '销售开单' } },
      { path: 'sales/list', component: () => import('@/views/sales/SaleList.vue'), meta: { title: '销售记录' } },
      { path: 'tools', component: () => import('@/views/tools/DataTools.vue'), meta: { title: '数据工具' } },
      { path: 'system/user', component: () => import('@/views/system/UserList.vue'), meta: { title: '用户管理', roles: ['super_admin', 'store_admin'] } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth) {
    if (!userStore.token) {
      next('/login')
      return
    }

    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo()
      } catch {
        next('/login')
        return
      }
    }

    const roles = to.meta.roles as string[] | undefined
    if (roles && userStore.userInfo) {
      if (!roles.includes(userStore.userInfo.role)) {
        ElMessage.error('无权访问该页面')
        next('/dashboard')
        return
      }
    }
  }

  next()
})

export default router

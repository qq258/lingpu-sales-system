import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { requiresAuth: false } },
  {
    path: '/', component: () => import('@/views/Layout.vue'), meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '看板' } },
      { path: 'entry', component: () => import('@/views/Entry.vue'), meta: { title: '入库' } },
      { path: 'brands', component: () => import('@/views/BrandModelManage.vue'), meta: { title: '品牌型号' } },
      { path: 'inventory', component: () => import('@/views/InventoryManage.vue'), meta: { title: '库存管理' } },
      { path: 'sale', component: () => import('@/views/Sale.vue'), meta: { title: '开单' } },
      { path: 'sales-record', component: () => import('@/views/SalesRecord.vue'), meta: { title: '记录' } },
      { path: 'after-sales', component: () => import('@/views/AfterSales.vue'), meta: { title: '售后' } },
      { path: 'after-sales/:id', component: () => import('@/views/AfterSaleDetail.vue'), meta: { title: '售后详情' } },
      { path: 'tools', component: () => import('@/views/DataTools.vue'), meta: { title: '数据工具' } },
      { path: 'suppliers', component: () => import('@/views/SupplierManage.vue'), meta: { title: '供应商管理' } },
      { path: 'stores', component: () => import('@/views/StoreManage.vue'), meta: { title: '门店管理' } },
      { path: 'purchase-entries', component: () => import('@/views/PurchaseEntries.vue'), meta: { title: '入库记录' } },
      { path: 'initial-stock', component: () => import('@/views/InitialStock.vue'), meta: { title: '期初库存' } },
      { path: 'stock-check', component: () => import('@/views/StockCheck.vue'), meta: { title: '库存盘点' } },
      { path: 'stock-logs', component: () => import('@/views/StockLogs.vue'), meta: { title: '库存流水' } },
      { path: 'transfers', component: () => import('@/views/TransferManage.vue'), meta: { title: '调货管理' } },
      { path: 'users', component: () => import('@/views/UserManage.vue'), meta: { title: '用户管理' } },
      { path: 'manual', component: () => import('@/views/Manual.vue'), meta: { title: '使用手册' } },
      { path: 'settings/warranty', component: () => import('@/views/SettingsWarranty.vue'), meta: { title: '保修设置' } },
    ],
  },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth) {
    if (!userStore.token) { next('/login'); return }
    if (!userStore.userInfo) {
      try { await userStore.fetchUserInfo() } catch { next('/login'); return }
    }
  }
  next()
})

export default router

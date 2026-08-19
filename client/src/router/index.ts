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
      { path: 'dashboard', component: () => import('@/views/dashboard/Index.vue'), meta: { title: '数据看板', perm: 'dashboard' } },
      { path: 'store/list', component: () => import('@/views/store/StoreList.vue'), meta: { title: '门店管理', roles: ['super_admin'], perm: 'store_list' } },
      { path: 'product/brand-model', component: () => import('@/views/product/ProductBrandModel.vue'), meta: { title: '品牌型号管理', perm: 'product_brand' } },
      { path: 'purchase/supplier', component: () => import('@/views/purchase/SupplierList.vue'), meta: { title: '供应商管理', perm: 'purchase_supplier' } },
      { path: 'purchase/entry/list', component: () => import('@/views/purchase/PurchaseEntryIndex.vue'), meta: { title: '入库管理', perm: 'purchase_entry' } },
      { path: 'inventory', component: () => import('@/views/inventory/InventoryList.vue'), meta: { title: '库存查询', perm: 'inventory_list' } },
      { path: 'inventory/initial', component: () => import('@/views/inventory/InitialEntry.vue'), meta: { title: '期初库存', roles: ['super_admin', 'store_admin'], perm: 'inventory_initial' } },
      { path: 'inventory/check', component: () => import('@/views/inventory/InventoryCheckList.vue'), meta: { title: '库存盘点' } },
      { path: 'inventory/logs', component: () => import('@/views/inventory/InventoryLogs.vue'), meta: { title: '库存流水', perm: 'inventory_logs' } },
      { path: 'transfer/list', component: () => import('@/views/transfer/TransferList.vue'), meta: { title: '调货管理' } },
      { path: 'transfer/new', component: () => import('@/views/transfer/TransferNew.vue'), meta: { title: '发起调货' } },
      { path: 'sales/new', component: () => import('@/views/sales/SaleNew.vue'), meta: { title: '销售开单', perm: 'sales_new' } },
      { path: 'sales/list', component: () => import('@/views/sales/SaleList.vue'), meta: { title: '销售记录', perm: 'sales_list' } },
      { path: 'tools', component: () => import('@/views/tools/DataTools.vue'), meta: { title: '数据工具', perm: 'tools' } },
      // { path: 'after-sales/list', component: () => import('@/views/after-sales/AfterSaleList.vue'), meta: { title: '售后工单', perm: 'after_sales' } },
      // { path: 'after-sales/new', component: () => import('@/views/after-sales/AfterSaleNew.vue'), meta: { title: '新建工单', perm: 'after_sales' } },
      // { path: 'after-sales/:id', component: () => import('@/views/after-sales/AfterSaleDetail.vue'), meta: { title: '工单详情', perm: 'after_sales' } },
      { path: 'system/user', component: () => import('@/views/system/UserList.vue'), meta: { title: '用户管理', roles: ['super_admin', 'store_admin'], perm: 'system_user' } },
      { path: 'system/permission', component: () => import('@/views/system/PermissionManage.vue'), meta: { title: '权限管理', roles: ['super_admin'], perm: 'system_permission' } },
      { path: 'settings/warranty', component: () => import('@/views/settings/WarrantySetting.vue'), meta: { title: '保修设置', perm: 'settings_warranty' } },
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

    // 菜单权限校验
    const perm = to.meta.perm as string | undefined
    if (perm && !userStore.hasPerm(perm)) {
      ElMessage.error('无权访问该页面')
      next('/dashboard')
      return
    }
  }

  next()
})

export default router

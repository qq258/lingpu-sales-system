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
      { path: 'inventory', component: () => import('@/views/Inventory.vue'), meta: { title: '查库存' } },
      { path: 'sale', component: () => import('@/views/Sale.vue'), meta: { title: '开单' } },
      { path: 'sales-record', component: () => import('@/views/SalesRecord.vue'), meta: { title: '记录' } },
      { path: 'manual', component: () => import('@/views/Manual.vue'), meta: { title: '使用手册' } },
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

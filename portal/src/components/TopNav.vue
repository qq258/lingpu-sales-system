<template>
  <nav class="top-nav glass-dark">
    <div class="nav-inner">
      <div class="nav-left">
        <svg class="nav-logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="8" y1="2" x2="8" y2="22"/></svg>
        <span class="nav-logo">手机销售</span>
      </div>
      <div class="nav-center">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-link" active-class="nav-link--active">
          <span class="nav-link-icon" v-html="item.icon"></span>
          <span class="nav-link-label">{{ item.label }}</span>
        </router-link>
      </div>
      <div class="nav-right">
        <el-dropdown trigger="click">
          <span class="nav-user">
            <span class="nav-avatar">{{ userInitial }}</span>
            <span class="nav-username">{{ displayName }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
          <template #dropdown>
            <el-dropdown-item @click="handleLogout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;vertical-align:middle;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>退出登录
            </el-dropdown-item>
          </template>
        </el-dropdown>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const navItems = [
  { path: '/dashboard', label: '看板', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>' },
  { path: '/entry', label: '入库', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' },
  { path: '/inventory', label: '查库存', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
  { path: '/sale', label: '开单', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' },
  { path: '/sales-record', label: '记录', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
  { path: '/after-sales', label: '售后', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
  { path: '/manual', label: '手册', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
]

const displayName = computed(() => userStore.userInfo?.realName || userStore.userInfo?.username || '用户')
const userInitial = computed(() => displayName.value.charAt(0))

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.top-nav { position: fixed; top: 0; left: 0; right: 0; height: var(--nav-height); z-index: 1000; }
.nav-inner { max-width: 1400px; margin: 0 auto; height: 100%; display: flex; align-items: center; padding: 0 28px; }
.nav-left { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.nav-logo-icon { color: #60A5FA; }
.nav-logo { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
.nav-center { flex: 1; display: flex; justify-content: center; gap: 2px; margin: 0 24px; }
.nav-link { display: flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 10px; font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.55); text-decoration: none; transition: var(--transition); }
.nav-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
.nav-link--active { color: #fff !important; background: rgba(37,99,235,0.3); }
.nav-link-icon { display: flex; }
.nav-right { flex-shrink: 0; }
.nav-user { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 10px; border-radius: 10px; transition: var(--transition); color: rgba(255,255,255,0.7); }
.nav-user:hover { background: rgba(255,255,255,0.06); color: #fff; }
.nav-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nav-username { font-size: 14px; }
</style>

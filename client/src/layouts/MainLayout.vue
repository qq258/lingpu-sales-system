<template>
  <el-container class="layout-container">
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '220px'" class="layout-aside">
      <div class="logo-container">
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">手机销售管理</span>
        <el-icon v-else size="24" color="#409eff"><Phone /></el-icon>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        background-color="#001529"
        text-color="#ffffffb3"
        active-text-color="#ffffff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>

        <el-sub-menu index="store" v-if="userStore.isSuperAdmin">
          <template #title>
            <el-icon><Shop /></el-icon>
            <span>门店管理</span>
          </template>
          <el-menu-item index="/store/list">门店列表</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/product/brand-model">
          <el-icon><Goods /></el-icon>
          <template #title>品牌型号管理</template>
        </el-menu-item>

        <el-sub-menu index="purchase">
          <template #title>
            <el-icon><Download /></el-icon>
            <span>采购管理</span>
          </template>
          <el-menu-item index="/purchase/supplier">供应商管理</el-menu-item>
          <el-menu-item index="/purchase/entry/list">入库管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="inventory">
          <template #title>
            <el-icon><Coin /></el-icon>
            <span>库存管理</span>
          </template>
          <el-menu-item index="/inventory">库存查询</el-menu-item>
          <el-menu-item index="/inventory/initial" v-if="userStore.isSuperAdmin || userStore.userInfo?.role === 'store_admin'">期初库存</el-menu-item>
          <!-- <el-menu-item index="/inventory/check">库存盘点</el-menu-item> -->
          <el-menu-item index="/inventory/logs">库存流水</el-menu-item>
        </el-sub-menu>

        <!-- <el-sub-menu index="transfer">
          <template #title>
            <el-icon><RefreshRight /></el-icon>
            <span>调货管理</span>
          </template>
          <el-menu-item index="/transfer/new">发起调货</el-menu-item>
          <el-menu-item index="/transfer/list">调货记录</el-menu-item>
        </el-sub-menu> -->

        <el-sub-menu index="sales">
          <template #title>
            <el-icon><ShoppingCart /></el-icon>
            <span>销售管理</span>
          </template>
          <el-menu-item index="/sales/new">销售开单</el-menu-item>
          <el-menu-item index="/sales/list">销售记录</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/tools">
          <el-icon><Tools /></el-icon>
          <template #title>数据工具</template>
        </el-menu-item>

        <el-menu-item index="/after-sales/list">
          <el-icon><ChatDotSquare /></el-icon>
          <template #title>售后管理</template>
        </el-menu-item>

        <el-menu-item index="/system/user" v-if="userStore.isSuperAdmin || userStore.userInfo?.role === 'store_admin'">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <el-menu-item index="/settings/warranty">
          <el-icon><Document /></el-icon>
          <template #title>保修设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="appStore.toggleSidebar" size="20">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <StoreSwitcher />
          <el-divider direction="vertical" />
          <el-dropdown @command="handleUserCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><InfoFilled /></el-icon>
                  {{ userStore.userInfo?.realName }}
                  <el-tag size="small" type="info" style="margin-left: 4px;">{{ roleLabel }}</el-tag>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import StoreSwitcher from '@/components/StoreSwitcher.vue'

const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => (route.meta.title as string) || '')

const roleLabel = computed(() => {
  const roleMap: Record<string, string> = {
    super_admin: '超级管理员',
    store_admin: '门店管理员',
    operator: '操作员',
  }
  return roleMap[userStore.userInfo?.role || ''] || ''
})

function handleUserCommand(command: string) {
  if (command === 'logout') {
    userStore.logout()
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.layout-aside {
  background: #001529;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s;
}
.layout-aside::-webkit-scrollbar {
  width: 4px;
}
.layout-aside::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
}
.layout-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collapse-btn {
  cursor: pointer;
  color: #606266;
}
.collapse-btn:hover {
  color: #409eff;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
.user-info:hover {
  background: #f0f2f5;
}
.user-name {
  font-size: 14px;
  color: #303133;
}
.layout-main {
  background: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}
</style>

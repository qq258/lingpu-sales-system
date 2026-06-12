<template>
  <el-dropdown v-if="userStore.isSuperAdmin" @command="handleSwitch">
    <span class="store-switcher-btn">
      {{ userStore.currentStoreName }}
      <el-icon><ArrowDown /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item :command="null">
          <el-icon><Shop /></el-icon>
          全部门店
        </el-dropdown-item>
        <el-dropdown-item
          v-for="store in userStore.availableStores"
          :key="store.id"
          :command="store.id"
        >
          {{ store.name }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <span v-else class="store-name-label">
    {{ userStore.currentStoreName }}
  </span>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

function handleSwitch(storeId: number | null) {
  userStore.switchStore(storeId)
}
</script>

<style scoped>
.store-switcher-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #303133;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
.store-switcher-btn:hover {
  background: #f0f2f5;
}
.store-name-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
</style>

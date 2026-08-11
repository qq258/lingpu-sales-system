<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">权限管理</h1>
        <span class="pbm-subtitle">Role Permission Management</span>
      </div>
      <button class="pbm-btn-plain" @click="load">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        <span>刷新</span>
      </button>
    </header>

    <div class="pbm-body">
      <div v-loading="loading" class="pbm-roles">
        <div v-for="rp in rolePermissions" :key="rp.role" class="pbm-role-card">
          <div class="pbm-role-head">
            <div class="pbm-role-info">
              <el-tag :type="roleType(rp.role)" size="large">{{ roleLabel(rp.role) }}</el-tag>
              <span class="pbm-role-count">{{ rp.menuKeys.length }} / {{ allKeys.length }} 项</span>
            </div>
            <el-checkbox
              :model-value="isAllChecked(rp.role)"
              :indeterminate="isIndeterminate(rp.role)"
              :disabled="savingRole === rp.role"
              @change="(v: any) => toggleAll(rp.role, !!v)"
            >全选</el-checkbox>
          </div>

          <div v-for="group in groups" :key="group" class="pbm-group">
            <div class="pbm-group-title">{{ group }}</div>
            <el-checkbox-group
              :model-value="rp.menuKeys"
              :disabled="savingRole === rp.role"
              @change="(val: any) => onChange(rp.role, val)"
            >
              <el-checkbox v-for="opt in optionsByGroup[group]" :key="opt.key" :value="opt.key" class="pbm-checkbox">
                {{ opt.label }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMenuOptions, getRolePermissions, updateRolePermission } from '@/api/permission'
import type { MenuOption, RolePermission } from '@/api/permission'

const loading = ref(false)
const savingRole = ref<string | null>(null)
const menuOptions = ref<MenuOption[]>([])
const rolePermissions = ref<RolePermission[]>([])

const allKeys = computed(() => menuOptions.value.map(o => o.key))
const groups = computed(() => [...new Set(menuOptions.value.map(o => o.group))])
const optionsByGroup = computed<Record<string, MenuOption[]>>(() => {
  const map: Record<string, MenuOption[]> = {}
  for (const opt of menuOptions.value) {
    if (!map[opt.group]) map[opt.group] = []
    map[opt.group].push(opt)
  }
  return map
})

const roleLabel = (role: string) =>
  ({ super_admin: '超级管理员', store_admin: '门店管理员', operator: '操作员' }[role] || role)
const roleType = (role: string) =>
  ({ super_admin: 'danger', store_admin: 'warning', operator: 'info' }[role] || 'info')

function isAllChecked(role: string) {
  const rp = rolePermissions.value.find(r => r.role === role)
  return !!rp && allKeys.value.length > 0 && rp.menuKeys.length === allKeys.value.length
}

function isIndeterminate(role: string) {
  const rp = rolePermissions.value.find(r => r.role === role)
  return !!rp && rp.menuKeys.length > 0 && rp.menuKeys.length < allKeys.value.length
}

async function load() {
  loading.value = true
  try {
    const [options, perms] = await Promise.all([getMenuOptions(), getRolePermissions()])
    menuOptions.value = options
    rolePermissions.value = perms
  } catch {
    rolePermissions.value = []
  } finally {
    loading.value = false
  }
}

async function save(role: string, keys: string[]) {
  savingRole.value = role
  try {
    const saved = await updateRolePermission(role, keys)
    const rp = rolePermissions.value.find(r => r.role === role)
    if (rp) rp.menuKeys = saved
    ElMessage.success('权限已保存')
  } catch {
    await load() // 失败回滚为服务端状态
  } finally {
    savingRole.value = null
  }
}

function onChange(role: string, val: string[]) {
  const rp = rolePermissions.value.find(r => r.role === role)
  if (!rp) return
  rp.menuKeys = [...val]
  save(role, val)
}

async function toggleAll(role: string, checked: boolean) {
  const rp = rolePermissions.value.find(r => r.role === role)
  if (!rp) return
  const keys = checked ? [...allKeys.value] : []
  rp.menuKeys = keys
  await save(role, keys)
}

onMounted(load)
</script>

<style scoped>
.pbm-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: var(--pbm-text, #2c2418);
  font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f5f0eb;
}
.pbm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  flex-shrink: 0;
  border-bottom: 1px solid #e5ddd3;
}
.pbm-header-left { display: flex; align-items: baseline; gap: 12px; }
.pbm-title { font-size: 20px; font-weight: 600; letter-spacing: -0.3px; margin: 0; }
.pbm-subtitle { font-size: 12px; color: #8a7f72; letter-spacing: 0.4px; text-transform: uppercase; font-family: "SF Mono", "JetBrains Mono", monospace; }
.pbm-btn-plain {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: transparent;
  color: #8a7f72;
  border: 1px solid #e5ddd3;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-plain:hover { color: #2c2418; border-color: #8a7f72; }

.pbm-body { flex: 1; padding: 20px 24px; overflow-y: auto; min-height: 0; }
.pbm-roles { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.pbm-role-card {
  background: #fff;
  border: 1px solid #e5ddd3;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.pbm-role-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0ebe5;
}
.pbm-role-info { display: flex; align-items: center; gap: 10px; }
.pbm-role-count { font-size: 12px; color: #8a7f72; font-family: "SF Mono", "JetBrains Mono", monospace; }
.pbm-group { margin-bottom: 14px; }
.pbm-group-title {
  font-size: 12px;
  font-weight: 600;
  color: #8a7f72;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.pbm-checkbox { margin-right: 16px; margin-bottom: 6px; }
</style>

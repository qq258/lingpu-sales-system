<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">用户管理</h1>
      <span class="title-line"></span>
      <button class="um-btn-accent" @click="openCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增用户
      </button>
    </div>

    <div class="glass um-card">
      <el-table :data="users" v-loading="loading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
        <el-table-column type="index" label="#" width="52" align="center" />
        <el-table-column prop="username" label="用户名" min-width="140">
          <template #default="{ row }"><span class="um-name">{{ row.username }}</span></template>
        </el-table-column>
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">{{ roleLabel(row.role) }}</template>
        </el-table-column>
        <el-table-column label="门店" width="120">
          <template #default="{ row }">{{ row.storeName || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span :class="['um-badge', row.status === 1 ? 'is-on' : '']">{{ row.status === 1 ? '启用' : '停用' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <div class="um-actions">
              <button class="um-mini" @click="openEdit(row)">编辑</button>
              <button class="um-mini" @click="openReset(row)">重置密码</button>
              <button class="um-mini um-mini--danger" @click="handleDelete(row)">删除</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && !users.length" class="empty-hint">暂无用户</div>
    </div>

    <!-- 新增 -->
    <el-dialog v-model="createVisible" title="新增用户" width="460px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="用户名" required><el-input v-model="createForm.username" placeholder="登录用户名" /></el-form-item>
        <el-form-item label="密码" required><el-input v-model="createForm.password" type="password" placeholder="至少 6 位" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="createForm.realName" placeholder="真实姓名" /></el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="createForm.role" style="width:100%;">
            <el-option label="门店操作员" value="operator" />
            <el-option label="门店管理员" value="store_admin" />
            <el-option label="超级管理员" value="super_admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="门店">
          <el-select v-model="createForm.storeId" placeholder="不限门店" clearable filterable style="width:100%;">
            <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 编辑 -->
    <el-dialog v-model="editVisible" title="编辑用户" width="460px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="用户名"><el-input v-model="editForm.username" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="editForm.realName" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width:100%;">
            <el-option label="门店操作员" value="operator" />
            <el-option label="门店管理员" value="store_admin" />
            <el-option label="超级管理员" value="super_admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="门店">
          <el-select v-model="editForm.storeId" placeholder="不限门店" clearable filterable style="width:100%;">
            <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码 -->
    <el-dialog v-model="resetVisible" title="重置密码" width="420px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="新密码" required>
          <el-input v-model="resetPassword" type="password" placeholder="至少 6 位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="resetPassword.length < 6" @click="handleReset">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, registerUser, updateUser, resetUserPassword, deleteUser, type UserItem } from '@/api/auth'
import { getStores } from '@/api/store'

const users = ref<UserItem[]>([])
const stores = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

const createVisible = ref(false)
const createForm = ref({ username: '', password: '', realName: '', role: 'operator', storeId: undefined as number | undefined })
const editVisible = ref(false)
const editForm = ref({ id: 0, username: '', realName: '', role: 'operator', storeId: undefined as number | undefined })
const resetVisible = ref(false)
const resetTarget = ref<UserItem | null>(null)
const resetPassword = ref('')

const roleMap: Record<string, string> = { super_admin: '超级管理员', store_admin: '门店管理员', operator: '门店操作员' }

function roleLabel(r: string) {
  return roleMap[r] || r
}

async function load() {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
}

async function loadStores() {
  try { stores.value = await getStores() } catch { stores.value = [] }
}

function openCreate() {
  createForm.value = { username: '', password: '', realName: '', role: 'operator', storeId: undefined }
  createVisible.value = true
}

function openEdit(row: UserItem) {
  editForm.value = { id: row.id, username: row.username, realName: row.realName, role: row.role, storeId: row.storeId || undefined }
  editVisible.value = true
}

function openReset(row: UserItem) {
  resetTarget.value = row
  resetPassword.value = ''
  resetVisible.value = true
}

async function handleCreate() {
  if (!createForm.value.username.trim() || !createForm.value.password || !createForm.value.realName.trim()) {
    ElMessage.warning('请填写用户名、密码和姓名')
    return
  }
  saving.value = true
  try {
    await registerUser(createForm.value)
    ElMessage.success('创建成功')
    createVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '创建失败')
  } finally {
    saving.value = false
  }
}

async function handleEdit() {
  saving.value = true
  try {
    await updateUser(editForm.value.id, {
      username: editForm.value.username,
      realName: editForm.value.realName,
      role: editForm.value.role,
      storeId: editForm.value.storeId,
    })
    ElMessage.success('保存成功')
    editVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleReset() {
  if (!resetTarget.value) return
  saving.value = true
  try {
    await resetUserPassword(resetTarget.value.id, resetPassword.value)
    ElMessage.success('密码已重置')
    resetVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '重置失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: UserItem) {
  try {
    await ElMessageBox.confirm(`确定删除用户「${row.username}」？`, '删除确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    await load()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}

onMounted(() => {
  load()
  loadStores()
})
</script>

<style scoped>
.um-btn-accent { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.um-btn-accent:hover { background: var(--primary-dark); }
.um-card { border-radius: var(--radius); padding: 8px; }
.um-name { font-weight: 500; color: var(--text); }
.um-badge { font-size: 12px; padding: 2px 10px; border-radius: 6px; background: var(--border); color: var(--text-tertiary); }
.um-badge.is-on { background: var(--success-light); color: #16a34a; }
.um-actions { display: flex; gap: 6px; justify-content: center; }
.um-mini { height: 26px; padding: 0 10px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text-secondary); font-size: 12px; cursor: pointer; font-family: inherit; transition: var(--transition); }
.um-mini:hover { border-color: var(--primary); color: var(--primary); }
.um-mini--danger:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-light); }
</style>

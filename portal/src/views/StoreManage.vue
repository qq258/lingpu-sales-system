<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">门店管理</h1>
      <span class="title-line"></span>
      <button class="mp-btn-accent" @click="openDialog()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增门店
      </button>
    </div>

    <div class="glass mp-card">
      <el-table :data="stores" v-loading="loading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
        <el-table-column type="index" label="#" width="52" align="center" />
        <el-table-column prop="name" label="门店名称" min-width="160">
          <template #default="{ row }"><span class="mp-name">{{ row.name }}</span></template>
        </el-table-column>
        <el-table-column prop="code" label="编码" width="90" align="center" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span :class="['mp-badge', row.status === 1 ? 'is-on' : '']">{{ row.status === 1 ? '启用' : '停用' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <div class="mp-actions">
              <button class="mp-mini" @click="openDialog(row)">编辑</button>
              <button class="mp-mini mp-mini--danger" @click="handleDelete(row)">删除</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && !stores.length" class="empty-hint">暂无门店</div>
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑门店' : '新增门店'" width="480px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="门店名称" required><el-input v-model="form.name" placeholder="例：分店A" /></el-form-item>
        <el-form-item label="编码" required><el-input v-model="form.code" placeholder="唯一编码，如 A" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" placeholder="可选" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" placeholder="可选" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStores, createStore, updateStore, deleteStore } from '@/api/store'

const stores = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const form = ref({ id: null as number | null, name: '', code: '', address: '', phone: '' })

async function load() {
  loading.value = true
  try {
    stores.value = await getStores()
  } catch {
    stores.value = []
  } finally {
    loading.value = false
  }
}

function openDialog(row?: any) {
  form.value = row
    ? { id: row.id, name: row.name, code: row.code, address: row.address || '', phone: row.phone || '' }
    : { id: null, name: '', code: '', address: '', phone: '' }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.name.trim() || !form.value.code.trim()) {
    ElMessage.warning('请填写门店名称和编码')
    return
  }
  saving.value = true
  try {
    if (form.value.id) {
      await updateStore(form.value.id, { name: form.value.name, code: form.value.code, address: form.value.address, phone: form.value.phone })
    } else {
      await createStore({ name: form.value.name, code: form.value.code, address: form.value.address, phone: form.value.phone })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除门店「${row.name}」？`, '删除确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    })
    await deleteStore(row.id)
    ElMessage.success('删除成功')
    await load()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

onMounted(load)
</script>

<style scoped>
.mp-btn-accent { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.mp-btn-accent:hover { background: var(--primary-dark); }
.mp-card { border-radius: var(--radius); padding: 8px; }
.mp-name { font-weight: 500; color: var(--text); }
.mp-badge { font-size: 12px; padding: 2px 10px; border-radius: 6px; background: var(--border); color: var(--text-tertiary); }
.mp-badge.is-on { background: var(--success-light); color: #16a34a; }
.mp-actions { display: flex; gap: 6px; justify-content: center; }
.mp-mini { height: 26px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text-secondary); font-size: 12px; cursor: pointer; font-family: inherit; transition: var(--transition); }
.mp-mini:hover { border-color: var(--primary); color: var(--primary); }
.mp-mini--danger:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-light); }
</style>

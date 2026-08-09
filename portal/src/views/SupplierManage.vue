<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">供应商管理</h1>
      <span class="title-line"></span>
      <input v-model="keyword" class="sm-search" placeholder="搜索名称/联系人/电话" @keyup.enter="load" />
      <button class="sm-btn-plain" @click="load">搜索</button>
      <button class="sm-btn-accent" @click="openDialog()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增供应商
      </button>
    </div>

    <div class="glass sm-card">
      <el-table :data="list" v-loading="loading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
        <el-table-column type="index" label="#" width="52" align="center" />
        <el-table-column prop="name" label="供应商名称" min-width="160">
          <template #default="{ row }"><span class="sm-name">{{ row.name }}</span></template>
        </el-table-column>
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <div class="sm-actions">
              <button class="sm-mini" @click="openDialog(row)">编辑</button>
              <button class="sm-mini sm-mini--danger" @click="handleDelete(row)">删除</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && !list.length" class="empty-hint">暂无供应商</div>
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑供应商' : '新增供应商'" width="480px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="名称" required><el-input v-model="form.name" placeholder="供应商名称" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contact_person" placeholder="可选" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" placeholder="可选" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" placeholder="可选" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" placeholder="可选" /></el-form-item>
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
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/purchase'

const list = ref<any[]>([])
const loading = ref(false)
const keyword = ref('')
const dialogVisible = ref(false)
const saving = ref(false)
const form = ref({ id: null as number | null, name: '', contact_person: '', phone: '', address: '', remark: '' })

async function load() {
  loading.value = true
  try {
    list.value = await getSuppliers(keyword.value || undefined)
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function openDialog(row?: any) {
  form.value = row
    ? { id: row.id, name: row.name, contact_person: row.contact_person || '', phone: row.phone || '', address: row.address || '', remark: row.remark || '' }
    : { id: null, name: '', contact_person: '', phone: '', address: '', remark: '' }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请填写供应商名称')
    return
  }
  saving.value = true
  try {
    const data = { name: form.value.name, contact_person: form.value.contact_person, phone: form.value.phone, address: form.value.address, remark: form.value.remark }
    if (form.value.id) await updateSupplier(form.value.id, data)
    else await createSupplier(data)
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
    await ElMessageBox.confirm(`确定删除供应商「${row.name}」？`, '删除确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    })
    await deleteSupplier(row.id)
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
.sm-btn-accent { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.sm-btn-accent:hover { background: var(--primary-dark); }
.sm-btn-plain { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: var(--transition); }
.sm-btn-plain:hover { border-color: var(--primary); color: var(--primary); }
.sm-search { height: 36px; width: 220px; padding: 0 12px; font-size: 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; }
.sm-search:focus { border-color: var(--primary); }
.sm-card { border-radius: var(--radius); padding: 8px; }
.sm-name { font-weight: 500; color: var(--text); }
.sm-actions { display: flex; gap: 6px; justify-content: center; }
.sm-mini { height: 26px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text-secondary); font-size: 12px; cursor: pointer; font-family: inherit; transition: var(--transition); }
.sm-mini:hover { border-color: var(--primary); color: var(--primary); }
.sm-mini--danger:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-light); }
</style>

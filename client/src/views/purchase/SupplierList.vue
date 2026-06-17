<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">供应商管理</h1>
        <span class="pbm-subtitle">Supplier Management</span>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="pbm-btn-plain" @click="handleExport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>导出 Excel</span>
        </button>
        <button class="pbm-btn-accent" @click="openDialog()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>新增供应商</span>
        </button>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-main">
        <div class="pbm-main-head">
          <div class="pbm-search-group">
            <div class="pbm-search-input-wrapper">
              <svg class="pbm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                v-model="searchKeyword"
                class="pbm-search-input"
                placeholder="搜索供应商名称 / 联系人"
                @input="onSearch"
              />
            </div>
          </div>
          <span class="pbm-section-count">{{ filteredSuppliers.length }} 个供应商</span>
        </div>

        <div class="pbm-table-wrapper">
          <el-table :data="filteredSuppliers" stripe v-loading="loading" size="small" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="#" width="48" align="center" />
            <el-table-column prop="name" label="供应商名称" min-width="150">
              <template #default="{ row }">
                <span class="pbm-cell-name">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="contact" label="联系人" width="120" align="center" />
            <el-table-column prop="phone" label="联系电话" width="140" align="center" />
            <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
            <el-table-column label="" width="80" fixed="right">
              <template #default="{ row }">
                <div class="pbm-cell-actions">
                  <button class="pbm-icon-btn pbm-icon-btn--sm" title="编辑" @click="openDialog(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="handleDelete(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑供应商' : '新增供应商'" width="520px" :close-on-click-modal="false" class="pbm-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="default">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入供应商名称" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入联系人姓名" maxlength="50" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="20" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入供应商地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="pbm-btn-plain" @click="dialogVisible = false">取消</button>
        <button class="pbm-btn-accent" :disabled="submitLoading" @click="handleSubmit">{{ submitLoading ? '提交中...' : '确定' }}</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/purchase'
import type { SupplierData } from '@/api/purchase'
import { exportWithQuery } from '@/api/tools'

const loading = ref(false)
const submitLoading = ref(false)
const suppliers = ref<SupplierData[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const searchKeyword = ref('')

const form = ref<SupplierData>({ name: '', contact: '', phone: '', address: '' })
const rules: FormRules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
}

const filteredSuppliers = computed(() => {
  let list = suppliers.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(s =>
      s.name.toLowerCase().includes(kw) ||
      (s.contact || '').toLowerCase().includes(kw)
    )
  }
  return list
})

function onSearch() {}

function handleExport() {
  exportWithQuery('/purchase/suppliers/export', { keyword: searchKeyword.value })
}

async function loadSuppliers() {
  loading.value = true
  try {
    suppliers.value = await getSuppliers()
  } catch {
    suppliers.value = []
  } finally {
    loading.value = false
  }
}

function openDialog(row?: SupplierData) {
  if (row) {
    isEdit.value = true
    editId.value = row.id!
    form.value = { name: row.name, contact: row.contact || '', phone: row.phone || '', address: row.address || '' }
  } else {
    isEdit.value = false
    editId.value = null
    form.value = { name: '', contact: '', phone: '', address: '' }
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value && editId.value) {
      await updateSupplier(editId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await createSupplier(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadSuppliers()
  } catch {
    // handled by interceptor
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: SupplierData) {
  try {
    await ElMessageBox.confirm(`确定删除供应商「${row.name}」吗？`, '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteSupplier(row.id!)
    ElMessage.success('删除成功')
    await loadSuppliers()
  } catch {
    // cancelled
  }
}

onMounted(() => {
  loadSuppliers()
})
</script>

<style>
.pbm-root {
  --pbm-bg: #f5f0eb;
  --pbm-surface: #ffffff;
  --pbm-surface-hover: #f0ebe5;
  --pbm-border: #e5ddd3;
  --pbm-text: #2c2418;
  --pbm-text-dim: #8a7f72;
  --pbm-accent: #c9953c;
  --pbm-accent-glow: rgba(201,149,60,0.12);
  --pbm-blue: #3b82f6;
  --pbm-blue-dim: rgba(59,130,246,0.12);
  --pbm-red: #dc3545;
  --pbm-red-dim: rgba(220,53,69,0.12);
  --pbm-radius: 6px;
  --pbm-font: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --pbm-mono: "SF Mono", "JetBrains Mono", "Cascadia Code", monospace;
}
</style>

<style scoped>
.pbm-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: var(--pbm-text);
  font-family: var(--pbm-font);
  background: var(--pbm-bg);
}

/* ─── Header ─── */
.pbm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--pbm-border);
}
.pbm-header-left { display: flex; align-items: baseline; gap: 12px; }
.pbm-title { font-size: 20px; font-weight: 600; letter-spacing: -0.3px; color: var(--pbm-text); margin: 0; }
.pbm-subtitle { font-size: 12px; color: var(--pbm-text-dim); letter-spacing: 0.4px; text-transform: uppercase; font-family: var(--pbm-mono); }

/* ─── Buttons ─── */
.pbm-btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--pbm-accent);
  color: #fff;
  border: none;
  border-radius: var(--pbm-radius);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-accent:hover { background: #dba84a; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(201,149,60,0.3); }
.pbm-btn-accent:active { transform: translateY(0); }
.pbm-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.pbm-btn-plain {
  padding: 8px 20px;
  background: transparent;
  color: var(--pbm-text-dim);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-plain:hover { color: var(--pbm-text); border-color: var(--pbm-text-dim); }

.pbm-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--pbm-text-dim);
  cursor: pointer;
  transition: all 0.12s;
}
.pbm-icon-btn:hover { background: var(--pbm-blue-dim); color: var(--pbm-blue); }
.pbm-icon-btn--danger:hover { background: var(--pbm-red-dim); color: var(--pbm-red); }
.pbm-icon-btn--sm { width: 24px; height: 24px; }

/* ─── Body ─── */
.pbm-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.pbm-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--pbm-bg);
}

/* ─── Main Head (search bar) ─── */
.pbm-main-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 12px;
  flex-shrink: 0;
}
.pbm-search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pbm-search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  transition: border-color 0.15s;
}
.pbm-search-input-wrapper:focus-within {
  border-color: var(--pbm-accent);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow);
}
.pbm-search-icon { color: var(--pbm-text-dim); flex-shrink: 0; }
.pbm-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--pbm-text);
  width: 220px;
  font-family: var(--pbm-font);
}
.pbm-search-input::placeholder { color: rgba(138,127,114,0.4); }
.pbm-section-count {
  font-size: 12px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
}

/* ─── Table ─── */
.pbm-table-wrapper {
  flex: 1;
  padding: 0 24px 24px;
  min-height: 0;
}
.pbm-table-wrapper :deep(.el-table) {
  --el-table-border-color: var(--pbm-border);
  --el-table-header-bg-color: #f0ebe5;
  --el-table-tr-bg-color: #fff;
  --el-table-row-hover-bg-color: var(--pbm-surface-hover);
  --el-table-current-row-bg-color: rgba(201,149,60,0.06);
  --el-table-text-color: var(--pbm-text);
  --el-table-header-text-color: var(--pbm-text-dim);
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
}
.pbm-table-wrapper :deep(.el-table__header-wrapper) { border-bottom: 1px solid var(--pbm-border); }
.pbm-table-wrapper :deep(.el-table__header th) { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.pbm-table-wrapper :deep(.el-table__body tr.el-table__row--striped) { background: #faf7f4; }
.pbm-table-wrapper :deep(.el-table__inner-wrapper::before),
.pbm-table-wrapper :deep(.el-table__inner-wrapper::after) { display: none; }
.pbm-table-wrapper :deep(.el-table__body-wrapper) { overflow-y: auto; }
.pbm-table-wrapper :deep(.el-table__body-wrapper::-webkit-scrollbar) { width: 5px; }
.pbm-table-wrapper :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) { background: var(--pbm-border); border-radius: 3px; }

.pbm-cell-name { font-weight: 500; }
.pbm-cell-actions { display: flex; gap: 2px; }

/* ─── Dialog overrides ─── */
:deep(.pbm-dialog) { border-radius: 8px; overflow: hidden; }
:deep(.pbm-dialog .el-dialog) {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: 8px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.15);
}
:deep(.pbm-dialog .el-dialog__header) { padding: 16px 24px; border-bottom: 1px solid var(--pbm-border); margin: 0; }
:deep(.pbm-dialog .el-dialog__title) { font-size: 15px; font-weight: 600; color: var(--pbm-text); }
:deep(.pbm-dialog .el-dialog__body) { padding: 20px 24px; }
:deep(.pbm-dialog .el-dialog__footer) {
  padding: 12px 24px 16px;
  border-top: 1px solid var(--pbm-border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
:deep(.pbm-dialog .el-dialog__close) { color: var(--pbm-text-dim); }
:deep(.pbm-dialog .el-dialog__close:hover) { color: var(--pbm-text); }
:deep(.pbm-dialog .el-form-item__label) { color: var(--pbm-text-dim); font-size: 13px; }
:deep(.pbm-dialog .el-input__wrapper),
:deep(.pbm-dialog .el-select__wrapper),
:deep(.pbm-dialog .el-textarea__inner) {
  background: #f5f0eb;
  border: 1px solid var(--pbm-border);
  box-shadow: none;
  border-radius: var(--pbm-radius);
  color: var(--pbm-text);
}
:deep(.pbm-dialog .el-input__wrapper:hover),
:deep(.pbm-dialog .el-select__wrapper:hover),
:deep(.pbm-dialog .el-textarea__inner:hover) { border-color: var(--pbm-text-dim); }
:deep(.pbm-dialog .el-input__wrapper.is-focus),
:deep(.pbm-dialog .el-select__wrapper.is-focus),
:deep(.pbm-dialog .el-textarea__inner:focus) { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
:deep(.pbm-dialog .el-input__inner) { color: var(--pbm-text); }
:deep(.pbm-dialog .el-input__inner::placeholder) { color: rgba(138,127,114,0.4); }
:deep(.pbm-dialog .el-select-dropdown) { background: var(--pbm-surface); border: 1px solid var(--pbm-border); }
:deep(.pbm-dialog .el-select-dropdown__item) { color: var(--pbm-text); }
:deep(.pbm-dialog .el-select-dropdown__item.hover) { background: var(--pbm-surface-hover); }
:deep(.pbm-dialog .el-select-dropdown__item.selected) { color: var(--pbm-accent); background: var(--pbm-accent-glow); font-weight: 600; }

/* ─── Scrollbar ─── */
.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

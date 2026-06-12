<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">库存查询</h1>
        <span class="pbm-subtitle">Inventory Query</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-main">
        <div class="pbm-main-head">
          <div class="pbm-search-group">
            <div class="pbm-search-input-wrapper">
              <svg class="pbm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="searchKeyword" class="pbm-search-input" placeholder="搜索商品名称 / 条码" @keyup.enter="loadInventory" />
            </div>
            <button class="pbm-btn-accent" @click="loadInventory">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>查询</span>
            </button>
          </div>
          <span class="pbm-section-count">{{ total }} 条记录</span>
        </div>

        <div class="pbm-table-wrapper">
          <el-table :data="inventoryList" stripe v-loading="loading" size="small" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="#" width="48" align="center" />
            <el-table-column label="商品信息" min-width="200">
              <template #default="{ row }">
                <span class="pbm-tag-brand">{{ row.brandName }}</span>
                {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
              </template>
            </el-table-column>
            <el-table-column prop="barcode" label="条码" width="140" />
            <el-table-column prop="storeName" label="门店" width="120" />
            <el-table-column prop="quantity" label="库存数量" width="100" align="center">
              <template #default="{ row }">
                <span class="pbm-qty-badge" :class="{
                  'pbm-qty-badge--danger': (row.quantity ?? 0) <= 0,
                  'pbm-qty-badge--warn': (row.quantity ?? 0) > 0 && (row.quantity ?? 0) <= 5,
                  'pbm-qty-badge--ok': (row.quantity ?? 0) > 5
                }">{{ row.quantity ?? 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="售价" width="100" align="center">
              <template #default="{ row }">¥{{ row.price?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <div class="pbm-cell-actions">
                  <button class="pbm-icon-btn pbm-icon-btn--sm" title="编辑售价" @click="openEditDialog(row)">
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

        <div class="pbm-pagination-wrapper" v-if="total > 0">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @change="loadInventory"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="editDialogVisible" title="编辑商品售价" width="420px" :close-on-click-modal="false" class="pbm-dialog">
      <el-form :model="editForm" label-width="100px" size="default">
        <el-form-item label="商品信息">
          <span style="font-size:13px;color:var(--pbm-text);">
            <span class="pbm-tag-brand">{{ editForm.brandName }}</span>
            {{ editForm.modelName }} - {{ editForm.color }} / {{ editForm.storage }}
          </span>
        </el-form-item>
        <el-form-item label="当前售价">
          <span style="font-size:14px;font-weight:600;color:var(--pbm-text);">¥{{ editForm.oldPrice?.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="新售价" required>
          <el-input-number v-model="editForm.newPrice" :min="0" :precision="2" :step="100" controls-position="right" style="width:200px;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="pbm-btn-plain" @click="editDialogVisible = false">取消</button>
        <button class="pbm-btn-accent" :disabled="editForm.newPrice < 0 || editSaving" @click="handleSavePrice">{{ editSaving ? '保存中...' : '保存' }}</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getInventory, deleteInventory, updateInventory } from '@/api/inventory'

const userStore = useUserStore()
const loading = ref(false)
const inventoryList = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')

async function loadInventory() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (userStore.effectiveStoreId) params.storeId = userStore.effectiveStoreId
    const result = await getInventory(params)
    inventoryList.value = result.list
    total.value = result.total
  } catch {
    inventoryList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${row.brandName} ${row.modelName} - ${row.color} / ${row.storage}" 的库存记录吗？`,
      '确认删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    await deleteInventory(row.id)
    ElMessage.success('删除成功')
    await loadInventory()
  } catch {
    // cancelled
  }
}

const editDialogVisible = ref(false)
const editSaving = ref(false)
const editForm = ref<{
  id: number
  brandName: string
  modelName: string
  color: string
  storage: string
  oldPrice: number
  newPrice: number
}>({
  id: 0,
  brandName: '',
  modelName: '',
  color: '',
  storage: '',
  oldPrice: 0,
  newPrice: 0,
})

function openEditDialog(row: any) {
  editForm.value = {
    id: row.id,
    brandName: row.brandName || '',
    modelName: row.modelName || '',
    color: row.color || '',
    storage: row.storage || '',
    oldPrice: row.price || 0,
    newPrice: row.price || 0,
  }
  editDialogVisible.value = true
}

async function handleSavePrice() {
  editSaving.value = true
  try {
    await updateInventory(editForm.value.id, { sale_price: editForm.value.newPrice })
    ElMessage.success('售价更新成功')
    editDialogVisible.value = false
    await loadInventory()
  } catch {
    // handled by interceptor
  } finally {
    editSaving.value = false
  }
}

onMounted(() => {
  loadInventory()
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

.pbm-cell-actions { display: flex; gap: 2px; }

.pbm-tag-brand {
  display: inline-block;
  background: #ede7e0;
  color: var(--pbm-text);
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  margin-right: 4px;
  font-family: var(--pbm-mono);
  vertical-align: middle;
}

.pbm-qty-badge {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.pbm-qty-badge--danger { background: #fce8e8; color: #dc3545; }
.pbm-qty-badge--warn { background: #fef3e2; color: #c9953c; }
.pbm-qty-badge--ok { background: #e8f5e9; color: #2e7d32; }

.pbm-pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  flex-shrink: 0;
}
.pbm-pagination-wrapper :deep(.el-pagination) { font-family: var(--pbm-font); }
.pbm-pagination-wrapper :deep(.el-pagination button),
.pbm-pagination-wrapper :deep(.el-pager li) {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  margin: 0 2px;
  color: var(--pbm-text);
  font-size: 12px;
  min-width: 30px;
  height: 30px;
}
.pbm-pagination-wrapper :deep(.el-pagination button:hover),
.pbm-pagination-wrapper :deep(.el-pager li:hover) {
  border-color: var(--pbm-accent);
  color: var(--pbm-accent);
}
.pbm-pagination-wrapper :deep(.el-pager li.is-active) {
  background: var(--pbm-accent);
  border-color: var(--pbm-accent);
  color: #fff;
}
.pbm-pagination-wrapper :deep(.el-pagination__total) {
  font-size: 12px;
  color: var(--pbm-text-dim);
}

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

.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

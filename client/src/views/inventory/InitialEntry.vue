<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">期初库存录入</h1>
        <span class="pbm-subtitle">Initial Entry</span>
      </div>
      <button class="pbm-btn-accent" @click="switchMode">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="3" y1="3" x2="9" y2="9"/></svg>
        <span>{{ batchMode ? '切换为逐条录入' : '切换为批量录入' }}</span>
      </button>
    </header>

    <div class="pbm-body">
      <div class="pbm-main">
        <div class="pbm-main-head">
          <div class="pbm-search-group">
            <div class="pbm-select-wrapper">
              <el-select v-model="selectedStoreId" placeholder="选择门店" filterable size="small" class="pbm-select" style="width:200px;">
                <el-option v-for="s in userStore.availableStores" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </div>
          </div>
          <span v-if="pendingItems.length" class="pbm-section-count">{{ pendingItems.length }} 个待录入项</span>
        </div>

        <div class="pbm-body-content">

          <div class="pbm-section-card" v-if="!batchMode">
            <h3>逐条录入</h3>
            <el-form :model="singleForm" label-width="80px" size="small">
              <div class="pbm-form-row">
                <el-form-item label="选择SKU" style="flex:1;">
                  <el-select v-model="singleForm.skuId" placeholder="搜索并选择SKU" filterable remote
                    :remote-method="searchSku" style="width:100%;">
                    <el-option v-for="s in searchResults" :key="s.id" :label="`${s.brandName} ${s.modelName} ${s.color}/${s.storage}`" :value="s.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="数量">
                  <el-input-number v-model="singleForm.quantity" :min="1" controls-position="right" style="width:130px;" />
                </el-form-item>
                <el-form-item>
                  <button class="pbm-btn-accent" :disabled="!singleForm.skuId || singleForm.quantity <= 0" @click="addSingleItem">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>添加</span>
                  </button>
                </el-form-item>
              </div>
            </el-form>
          </div>

          <div class="pbm-section-card" v-if="batchMode">
            <h3>批量录入</h3>
            <p style="color:var(--pbm-text-dim);margin-bottom:12px;font-size:13px;">
              每行一条，格式：SKU_ID,数量（例如：1,10）
            </p>
            <el-input v-model="batchText" type="textarea" :rows="4" placeholder="1,10&#10;2,20&#10;3,15" />
            <button class="pbm-btn-accent" style="margin-top:12px;" :disabled="!batchText.trim()" @click="parseBatch">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>解析并添加</span>
            </button>
          </div>

          <div class="pbm-section-card">
            <h3>待录入列表</h3>
            <div class="pbm-table-wrapper pbm-table-wrapper--compact">
              <el-table :data="pendingItems" stripe max-height="360" size="small" element-loading-background="rgba(245,240,235,0.8)">
                <el-table-column type="index" label="#" width="48" align="center" />
                <el-table-column label="商品" min-width="200">
                  <template #default="{ row }">
                    <span class="pbm-tag-brand">{{ row.brandName }}</span>
                    {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
                  </template>
                </el-table-column>
                <el-table-column label="数量" width="130" align="center">
                  <template #default="{ row }">
                    <el-input-number v-model="row.quantity" :min="1" size="small" controls-position="right" style="width:110px;" />
                  </template>
                </el-table-column>
                <el-table-column label="" width="60" fixed="right">
                  <template #default="{ $index }">
                    <div class="pbm-cell-actions">
                      <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="removeItem($index)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-if="pendingItems.length === 0" class="pbm-empty-hint">
              暂无待录入项
            </div>
          </div>

          <div class="pbm-form-actions">
            <button class="pbm-btn-plain" @click="resetAll">重置</button>
            <button class="pbm-btn-accent" :disabled="pendingItems.length === 0 || !selectedStoreId || submitLoading" @click="handleSubmit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>{{ submitLoading ? '提交中...' : '确认录入' }}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { initialEntry, batchInitialEntry } from '@/api/inventory'
import { searchSkus } from '@/api/product'

const userStore = useUserStore()

const batchMode = ref(false)
const selectedStoreId = ref<number | null>(null)
const pendingItems = ref<Array<{
  skuId: number
  brandName: string
  modelName: string
  color: string
  storage: string
  quantity: number
}>>([])
const submitLoading = ref(false)

const singleForm = ref({ skuId: 0, quantity: 1 })
const searchResults = ref<any[]>([])
const batchText = ref('')

let searchTimer: ReturnType<typeof setTimeout> | null = null

function switchMode() {
  batchMode.value = !batchMode.value
}

async function searchSku(keyword: string) {
  if (!keyword) return
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    try {
      searchResults.value = await searchSkus(keyword)
    } catch {
      searchResults.value = []
    }
  }, 300)
}

function addSingleItem() {
  const sku = searchResults.value.find(s => s.id === singleForm.value.skuId)
  if (!sku) return

  const existing = pendingItems.value.find(i => i.skuId === sku.id)
  if (existing) {
    existing.quantity += singleForm.value.quantity
  } else {
    pendingItems.value.push({
      skuId: sku.id,
      brandName: sku.brandName || '',
      modelName: sku.modelName || '',
      color: sku.color || '',
      storage: sku.storage || '',
      quantity: singleForm.value.quantity,
    })
  }
  singleForm.value = { skuId: 0, quantity: 1 }
  ElMessage.success('已添加')
}

function parseBatch() {
  const lines = batchText.value.trim().split('\n')
  let added = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const parts = trimmed.split(',')
    if (parts.length !== 2) continue
    const skuId = parseInt(parts[0])
    const quantity = parseInt(parts[1])
    if (isNaN(skuId) || isNaN(quantity) || quantity <= 0) continue

    const existing = pendingItems.value.find(i => i.skuId === skuId)
    if (existing) {
      existing.quantity += quantity
    } else {
      pendingItems.value.push({
        skuId,
        brandName: `SKU#${skuId}`,
        modelName: '',
        color: '',
        storage: '',
        quantity,
      })
    }
    added++
  }
  ElMessage.success(`成功添加 ${added} 条记录`)
  batchText.value = ''
}

function removeItem(index: number) {
  pendingItems.value.splice(index, 1)
}

async function handleSubmit() {
  if (!selectedStoreId.value) {
    ElMessage.warning('请选择门店')
    return
  }
  if (pendingItems.value.length === 0) {
    ElMessage.warning('请添加录入项')
    return
  }

  submitLoading.value = true
  try {
    const items = pendingItems.value.map(i => ({ sku_id: i.skuId, quantity: i.quantity }))
    await batchInitialEntry({ items, store_id: selectedStoreId.value })
    ElMessage.success('期初库存录入成功')
    resetAll()
  } catch {
    // handled by interceptor
  } finally {
    submitLoading.value = false
  }
}

function resetAll() {
  pendingItems.value = []
  selectedStoreId.value = null
  singleForm.value = { skuId: 0, quantity: 1 }
  batchText.value = ''
}
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
.pbm-select-wrapper {
  display: flex;
  align-items: center;
}
.pbm-select-wrapper :deep(.el-select) { width: 200px; }
.pbm-select-wrapper :deep(.el-select__wrapper) {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  box-shadow: none;
  border-radius: var(--pbm-radius);
  color: var(--pbm-text);
  font-size: 13px;
  min-height: 34px;
}
.pbm-select-wrapper :deep(.el-select__wrapper:hover) { border-color: var(--pbm-text-dim); }
.pbm-select-wrapper :deep(.el-select__wrapper.is-focus) { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
.pbm-select-wrapper :deep(.el-select-dropdown) { background: var(--pbm-surface); border: 1px solid var(--pbm-border); }
.pbm-select-wrapper :deep(.el-select-dropdown__item) { color: var(--pbm-text); }
.pbm-select-wrapper :deep(.el-select-dropdown__item.hover) { background: var(--pbm-surface-hover); }
.pbm-select-wrapper :deep(.el-select-dropdown__item.selected) { color: var(--pbm-accent); background: var(--pbm-accent-glow); font-weight: 600; }

.pbm-section-count {
  font-size: 12px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
}

.pbm-body-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pbm-body-content::-webkit-scrollbar { width: 4px; }
.pbm-body-content::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }

.pbm-section-card {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  padding: 20px 24px;
  flex-shrink: 0;
}
.pbm-section-card h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--pbm-text);
}

.pbm-form-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.pbm-table-wrapper {
  flex: 1;
  min-height: 0;
}
.pbm-table-wrapper--compact {
  flex: none;
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

.pbm-empty-hint {
  text-align: center;
  padding: 24px;
  color: var(--pbm-text-dim);
  font-size: 13px;
}

.pbm-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
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

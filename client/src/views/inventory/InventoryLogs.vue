<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">库存流水</h1>
        <span class="pbm-subtitle">Inventory Logs</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-main">
        <div class="pbm-main-head">
          <div class="pbm-search-group">
            <div class="pbm-select-wrapper">
              <el-select v-model="searchType" placeholder="变动类型" clearable size="small" class="pbm-select">
                <el-option label="采购入库" value="purchase_in" />
                <el-option label="销售出库" value="sale_out" />
                <el-option label="调货出库" value="transfer_out" />
                <el-option label="调货入库" value="transfer_in" />
                <el-option label="盘点调整" value="check_adjust" />
                <el-option label="期初录入" value="initial" />
              </el-select>
            </div>
            <button class="pbm-btn-accent" @click="loadLogs">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>查询</span>
            </button>
          </div>
          <span class="pbm-section-count">{{ total }} 条记录</span>
        </div>

        <div class="pbm-table-wrapper">
          <el-table :data="logs" stripe v-loading="loading" size="small" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="#" width="48" align="center" />
            <el-table-column label="商品" min-width="200">
              <template #default="{ row }">
                <span class="pbm-tag-brand">{{ row.brandName }}</span>
                {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
              </template>
            </el-table-column>
            <el-table-column prop="barcode" label="条码" width="140" />
            <el-table-column prop="storeName" label="门店" width="120" />
            <el-table-column prop="changeType" label="变动类型" width="120">
              <template #default="{ row }">
                {{ changeTypeLabel(row.changeType) }}
              </template>
            </el-table-column>
            <el-table-column prop="changeQuantity" label="变动数量" width="100" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.changeQuantity > 0 ? '#2e7d32' : '#dc3545', fontWeight: 600 }">
                  {{ row.changeQuantity > 0 ? '+' : '' }}{{ row.changeQuantity }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="beforeQuantity" label="变动前" width="80" align="center" />
            <el-table-column prop="afterQuantity" label="变动后" width="80" align="center" />
            <el-table-column prop="createdAt" label="时间" width="160" />
            <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
          </el-table>
        </div>

        <div class="pbm-pagination-wrapper" v-if="total > 0">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @change="loadLogs"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getInventoryLogs } from '@/api/inventory'

const userStore = useUserStore()

const loading = ref(false)
const logs = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchType = ref<string | undefined>()

const changeTypeMap: Record<string, string> = {
  purchase_in: '采购入库',
  sale_out: '销售出库',
  transfer_out: '调货出库',
  transfer_in: '调货入库',
  check_adjust: '盘点调整',
  initial: '期初录入',
}

function changeTypeLabel(type: string) {
  return changeTypeMap[type] || type
}

async function loadLogs() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (searchType.value) params.changeType = searchType.value
    if (userStore.effectiveStoreId) params.storeId = userStore.effectiveStoreId
    const result = await getInventoryLogs(params)
    logs.value = result.list
    total.value = result.total
  } catch {
    logs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
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
.pbm-select-wrapper {
  display: flex;
  align-items: center;
}
.pbm-select-wrapper :deep(.el-select) { width: 150px; }
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

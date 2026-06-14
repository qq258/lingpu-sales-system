<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">采购管理</h1>
        <span class="pbm-subtitle">Purchase Entry</span>
      </div>
      <button class="pbm-btn-accent" @click="$emit('addEntry')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>新增入库</span>
      </button>
    </header>

    <div class="pbm-body">
      <div class="pbm-main">
        <div class="pbm-main-head">
          <div class="pbm-search-group">
            <div class="pbm-search-input-wrapper">
              <el-select v-model="searchSupplierId" placeholder="供应商" clearable filterable size="small">
                <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </div>
            <div class="pbm-search-input-wrapper">
              <el-select v-model="searchStatus" placeholder="状态" clearable size="small">
                <el-option label="待确认" value="pending" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </div>
            <button class="pbm-btn-accent pbm-btn-accent--sm" @click="loadEntries">查询</button>
          </div>
          <span class="pbm-section-count">{{ total }} 条记录</span>
        </div>

        <div class="pbm-table-wrapper">
          <el-table :data="entries" stripe v-loading="loading" size="small" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="#" width="48" align="center" />
            <el-table-column prop="id" label="入库单号" width="100" />
            <el-table-column prop="supplierName" label="供应商" min-width="150">
              <template #default="{ row }">
                <span class="pbm-cell-name">{{ row.supplierName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="itemCount" label="总数量" width="80" align="center" />
            <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
              <template #default="{ row }">
                <span class="pbm-cell-price">¥{{ row.totalAmount?.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <span :class="['pbm-status-tag', row.status === 'completed' ? 'pbm-status-tag--ok' : 'pbm-status-tag--warn']">
                  {{ row.status === 'completed' ? '已完成' : '待确认' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="" width="120" fixed="right">
              <template #default="{ row }">
                <div class="pbm-cell-actions">
                  <button class="pbm-icon-btn pbm-icon-btn--sm" title="详情" @click="showDetail(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
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
            @change="loadEntries"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="入库详情" width="700px" :close-on-click-modal="false" class="pbm-dialog">
      <template v-if="detailData">
        <div class="pbm-detail-descriptions">
          <div class="pbm-detail-row">
            <span class="pbm-detail-label">入库单号</span>
            <span class="pbm-detail-value">{{ detailData.id }}</span>
          </div>
          <div class="pbm-detail-row">
            <span class="pbm-detail-label">供应商</span>
            <span class="pbm-detail-value">{{ detailData.supplierName }}</span>
          </div>
          <div class="pbm-detail-row">
            <span class="pbm-detail-label">状态</span>
            <span class="pbm-detail-value">
              <span :class="['pbm-status-tag', detailData.status === 'completed' ? 'pbm-status-tag--ok' : 'pbm-status-tag--warn']">
                {{ detailData.status === 'completed' ? '已完成' : '待确认' }}
              </span>
            </span>
          </div>
          <div class="pbm-detail-row">
            <span class="pbm-detail-label">创建时间</span>
            <span class="pbm-detail-value">{{ detailData.createdAt }}</span>
          </div>
          <div class="pbm-detail-row" v-if="detailData.remark">
            <span class="pbm-detail-label">备注</span>
            <span class="pbm-detail-value">{{ detailData.remark }}</span>
          </div>
        </div>

        <div class="pbm-detail-items-head">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>入库商品明细</span>
        </div>
        <el-table :data="detailData?.items || []" stripe size="small">
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">
              <span class="pbm-model-cell">
                <span class="pbm-model-brand">{{ row.brandName }}</span>
                {{ row.modelName }} {{ row.color }} / {{ row.storage }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="IMEI" width="150" prop="imei" />
          <el-table-column prop="costPrice" label="单价" width="90" align="right">
            <template #default="{ row }">¥{{ row.costPrice?.toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <button class="pbm-btn-plain" @click="detailVisible = false">关闭</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSuppliers, getPurchaseEntries, getPurchaseEntry, deletePurchaseEntry } from '@/api/purchase'
import type { SupplierData } from '@/api/purchase'

const emit = defineEmits<{ addEntry: [] }>()

const loading = ref(false)
const suppliers = ref<SupplierData[]>([])
const entries = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchSupplierId = ref<number | undefined>()
const searchStatus = ref<string | undefined>()

const detailVisible = ref(false)
const detailData = ref<any>(null)

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function loadSuppliers() {
  try {
    suppliers.value = await getSuppliers()
  } catch {
    suppliers.value = []
  }
}

async function loadEntries() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (searchSupplierId.value) params.supplierId = searchSupplierId.value
    if (searchStatus.value) params.status = searchStatus.value
    const result = await getPurchaseEntries(params)
    entries.value = result.list
    total.value = result.total
  } catch {
    entries.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function showDetail(row: any) {
  try {
    detailData.value = await getPurchaseEntry(row.id)
    detailVisible.value = true
  } catch {
    // handled by interceptor
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除入库单「${row.id}」吗？`, '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deletePurchaseEntry(row.id)
    ElMessage.success('删除成功')
    await loadEntries()
  } catch {
    // cancelled
  }
}

onMounted(() => {
  loadSuppliers()
  loadEntries()
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
.pbm-header-left { display: flex; align-items: center; gap: 12px; }
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
.pbm-btn-accent--sm { padding: 6px 14px; font-size: 12px; }

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
  padding: 2px 8px;
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  transition: border-color 0.15s;
}
.pbm-search-input-wrapper:focus-within {
  border-color: var(--pbm-accent);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow);
}
.pbm-search-input-wrapper :deep(.el-select) { width: 140px; }
.pbm-search-input-wrapper :deep(.el-select .el-input__wrapper) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}
.pbm-search-input-wrapper :deep(.el-select .el-input__inner) {
  font-size: 13px;
  color: var(--pbm-text);
  font-family: var(--pbm-font);
}
.pbm-section-count {
  font-size: 12px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
}

/* ─── Table ─── */
.pbm-table-wrapper {
  flex: 1;
  padding: 0 24px;
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
.pbm-cell-price { font-family: var(--pbm-mono); font-size: 12px; }
.pbm-cell-actions { display: flex; gap: 2px; justify-content: center; }

/* ─── Status tags ─── */
.pbm-status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--pbm-mono);
}
.pbm-status-tag--ok { background: rgba(34,197,94,0.12); color: #16a34a; }
.pbm-status-tag--warn { background: rgba(234,179,8,0.12); color: #ca8a04; }

/* ─── Pagination ─── */
.pbm-pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 12px 24px 16px;
  flex-shrink: 0;
}
.pbm-pagination-wrapper :deep(.el-pagination) { font-family: var(--pbm-font); }
.pbm-pagination-wrapper :deep(.el-pagination .el-pagination__total) { color: var(--pbm-text-dim); font-size: 12px; }
.pbm-pagination-wrapper :deep(.el-pagination button) { color: var(--pbm-text-dim); }
.pbm-pagination-wrapper :deep(.el-pager li) { color: var(--pbm-text-dim); font-size: 12px; font-weight: 500; }
.pbm-pagination-wrapper :deep(.el-pager li.is-active) { color: var(--pbm-accent); font-weight: 600; }

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
:deep(.pbm-dialog .el-table) {
  --el-table-border-color: var(--pbm-border);
  --el-table-header-bg-color: #f0ebe5;
  --el-table-tr-bg-color: #fff;
  --el-table-row-hover-bg-color: var(--pbm-surface-hover);
  --el-table-text-color: var(--pbm-text);
  --el-table-header-text-color: var(--pbm-text-dim);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
}
:deep(.pbm-dialog .el-table__header-wrapper) { border-bottom: 1px solid var(--pbm-border); }
:deep(.pbm-dialog .el-table__header th) { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }

/* ─── Detail descriptions ─── */
.pbm-detail-descriptions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--pbm-border);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  overflow: hidden;
  margin-bottom: 16px;
}
.pbm-detail-row {
  display: flex;
  background: #fff;
  padding: 10px 14px;
  align-items: center;
}
.pbm-detail-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
  font-weight: 600;
  width: 80px;
  flex-shrink: 0;
}
.pbm-detail-value {
  font-size: 13px;
  color: var(--pbm-text);
}

.pbm-detail-items-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--pbm-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-family: var(--pbm-mono);
  margin-bottom: 8px;
}

.pbm-model-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.pbm-model-brand {
  display: inline-block;
  padding: 1px 6px;
  background: var(--pbm-accent-glow);
  color: var(--pbm-accent);
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--pbm-mono);
}

/* ─── Scrollbar ─── */
.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

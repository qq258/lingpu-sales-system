<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">调货记录</h1>
        <span class="pbm-subtitle">Transfer Records</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-main-head">
        <div class="pbm-search-group">
          <el-select v-model="searchStatus" placeholder="筛选状态" clearable style="width: 150px;">
            <el-option label="待调出" value="pending" />
            <el-option label="已调出" value="outbound" />
            <el-option label="已收货" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <button class="pbm-btn-ghost" @click="loadTransfers">查询</button>
        </div>
        <span class="pbm-section-count">{{ total }} 条记录</span>
      </div>

      <div class="pbm-table-wrapper">
        <el-table :data="transfers" border stripe v-loading="loading" element-loading-background="rgba(245,240,235,0.8)">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="id" label="调货单号" width="100" />
          <el-table-column prop="fromStoreName" label="来源门店" />
          <el-table-column prop="toStoreName" label="目标门店" />
          <el-table-column prop="itemCount" label="商品数" width="80" />
          <el-table-column prop="totalQuantity" label="总数量" width="80" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160" />
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <button class="pbm-icon-btn pbm-icon-btn--sm" title="详情" @click="showDetail(row)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </button>
              <button v-if="row.status === 'pending'" class="pbm-action-btn pbm-action-btn--outbound" @click="handleOutbound(row)">确认调出</button>
              <button v-if="row.status === 'outbound'" class="pbm-action-btn pbm-action-btn--inbound" @click="handleInbound(row)">确认收货</button>
              <button v-if="row.status === 'pending'" class="pbm-action-btn pbm-action-btn--cancel" @click="handleCancel(row)">取消</button>
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
          @change="loadTransfers"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="调货详情" width="700px" :close-on-click-modal="false" class="pbm-dialog">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="调货单号">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(detailData.status)">{{ statusLabel(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="来源门店">{{ detailData.fromStoreName }}</el-descriptions-item>
        <el-descriptions-item label="目标门店">{{ detailData.toStoreName }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailData?.items || []" border stripe size="small" style="margin-top: 16px;">
        <el-table-column label="商品" min-width="180">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.brandName }}</el-tag>
            {{ row.modelName }} {{ row.color }} / {{ row.storage }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="70" />
      </el-table>
      <template #footer>
        <button class="pbm-btn-plain" @click="detailVisible = false">关闭</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTransfers, getTransfer, outboundTransfer, inboundTransfer, cancelTransfer } from '@/api/transfer'

const loading = ref(false)
const transfers = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchStatus = ref<string | undefined>()

const detailVisible = ref(false)
const detailData = ref<any>(null)

function statusType(status: string) {
  const map: Record<string, string> = { pending: 'warning', outbound: 'primary', completed: 'success', cancelled: 'info' }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: '待调出', outbound: '已调出', completed: '已收货', cancelled: '已取消' }
  return map[status] || status
}

async function loadTransfers() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (searchStatus.value) params.status = searchStatus.value
    const result = await getTransfers(params)
    transfers.value = result.list
    total.value = result.total
  } catch {
    transfers.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function showDetail(row: any) {
  try {
    detailData.value = await getTransfer(row.id)
    detailVisible.value = true
  } catch {
    // handled
  }
}

async function handleOutbound(row: any) {
  try {
    await ElMessageBox.confirm('确定确认调出？调出后库存将减少。', '确认调出', { type: 'warning' })
    await outboundTransfer(row.id)
    ElMessage.success('调出成功')
    await loadTransfers()
  } catch {
    // cancelled
  }
}

async function handleInbound(row: any) {
  try {
    await ElMessageBox.confirm('确定确认收货？收货后目标门店库存将增加。', '确认收货', { type: 'warning' })
    await inboundTransfer(row.id)
    ElMessage.success('收货成功')
    await loadTransfers()
  } catch {
    // cancelled
  }
}

async function handleCancel(row: any) {
  try {
    await ElMessageBox.confirm('确定取消该调货单？', '确认取消', { type: 'warning' })
    await cancelTransfer(row.id)
    ElMessage.success('已取消')
    await loadTransfers()
  } catch {
    // cancelled
  }
}

onMounted(() => {
  loadTransfers()
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

.pbm-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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
.pbm-section-count {
  font-size: 12px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
}

.pbm-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: transparent;
  color: var(--pbm-blue);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-ghost:hover { background: var(--pbm-blue-dim); border-color: var(--pbm-blue); }
.pbm-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }
.pbm-btn-ghost:disabled:hover { background: transparent; border-color: var(--pbm-border); }

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

.pbm-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.12s;
  margin: 0 2px;
}
.pbm-action-btn--outbound {
  background: rgba(201,149,60,0.1);
  color: var(--pbm-accent);
  border-color: rgba(201,149,60,0.25);
}
.pbm-action-btn--outbound:hover {
  background: var(--pbm-accent);
  color: #fff;
  border-color: var(--pbm-accent);
}
.pbm-action-btn--inbound {
  background: rgba(46,125,50,0.08);
  color: #2e7d32;
  border-color: rgba(46,125,50,0.2);
}
.pbm-action-btn--inbound:hover {
  background: #2e7d32;
  color: #fff;
  border-color: #2e7d32;
}
.pbm-action-btn--cancel {
  background: rgba(220,53,69,0.08);
  color: var(--pbm-red);
  border-color: rgba(220,53,69,0.2);
}
.pbm-action-btn--cancel:hover {
  background: var(--pbm-red);
  color: #fff;
  border-color: var(--pbm-red);
}

.pbm-pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 12px 24px 24px;
  flex-shrink: 0;
}
.pbm-pagination-wrapper :deep(.el-pagination) {
  --el-pagination-text-color: var(--pbm-text);
  --el-pagination-hover-color: var(--pbm-accent);
  font-family: var(--pbm-font);
}
.pbm-pagination-wrapper :deep(.el-pagination button),
.pbm-pagination-wrapper :deep(.el-pagination .el-pager li) {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: 4px;
  margin: 0 2px;
  min-width: 28px;
  height: 28px;
  font-size: 12px;
  color: var(--pbm-text);
}
.pbm-pagination-wrapper :deep(.el-pagination .el-pager li.is-active) {
  background: var(--pbm-accent);
  border-color: var(--pbm-accent);
  color: #fff;
}
.pbm-pagination-wrapper :deep(.el-pagination .el-pagination__total) {
  font-size: 12px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
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

:deep(.el-descriptions) { font-family: var(--pbm-font); }
:deep(.el-descriptions__title) { font-size: 14px; color: var(--pbm-text); }
:deep(.el-descriptions__label) { color: var(--pbm-text-dim); font-size: 13px; }
:deep(.el-descriptions__content) { color: var(--pbm-text); font-size: 13px; }

.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

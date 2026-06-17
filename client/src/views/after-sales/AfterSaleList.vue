<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">售后工单</h1>
        <span class="pbm-subtitle">After-Sales Orders</span>
      </div>
      <router-link to="/after-sales/new">
        <button class="pbm-btn-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>新建工单</span>
        </button>
      </router-link>
    </header>

    <div class="pbm-body">
      <div class="pbm-main">
        <div class="pbm-main-head">
          <div class="pbm-search-group">
            <div class="pbm-search-input-wrapper">
              <svg class="pbm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="keyword" class="pbm-search-input" placeholder="搜索工单号 / 客户姓名 / 电话" @keyup.enter="doSearch" />
            </div>
            <el-select v-model="searchStatus" placeholder="筛选状态" clearable size="small" style="width:145px;">
              <el-option label="待处理" value="pending" />
              <el-option label="检测中" value="detecting" />
              <el-option label="维修中" value="repairing" />
              <el-option label="已维修" value="repaired" />
              <el-option label="换货中" value="exchanging" />
              <el-option label="已换货" value="exchanged" />
              <el-option label="退款中" value="refunding" />
              <el-option label="已退款" value="refunded" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            <el-select v-model="searchProcessType" placeholder="处理方式" clearable size="small" style="width:115px;">
              <el-option label="维修" value="repair" />
              <el-option label="换货" value="exchange" />
              <el-option label="退款" value="refund" />
            </el-select>
            <button class="pbm-btn-accent pbm-btn-accent--sm" @click="doSearch">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>查询</span>
            </button>
          </div>
          <span class="pbm-section-count">{{ total }} 条记录</span>
        </div>

        <div class="pbm-table-wrapper">
          <el-table :data="list" stripe v-loading="loading" size="small" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="#" width="48" align="center" />
            <el-table-column label="工单号" width="175">
              <template #default="{ row }">
                <router-link :to="`/after-sales/${row.id}`" class="pbm-link-order">{{ row.order_no }}</router-link>
              </template>
            </el-table-column>
            <el-table-column label="客户" width="110">
              <template #default="{ row }">{{ row.customer_name || '-' }}</template>
            </el-table-column>
            <el-table-column label="客户电话" width="125">
              <template #default="{ row }">{{ row.customer_phone || '-' }}</template>
            </el-table-column>
            <el-table-column label="处理方式" width="95">
              <template #default="{ row }">
                <span class="pbm-process-tag">{{ ({ repair: '维修', exchange: '换货', refund: '退款' } as Record<string, string>)[row.process_type] || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="95">
              <template #default="{ row }">
                <span :class="['pbm-status-tag', `pbm-status-tag--${row.status}`]">{{ statusLabel(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="供应商" width="90">
              <template #default="{ row }">
                <span v-if="row.supplier_status !== 'none'" :class="['pbm-status-tag', row.supplier_status === 'completed' ? 'pbm-status-tag--ok' : 'pbm-status-tag--warn']">{{ supplierLabel(row.supplier_status) }}</span>
                <span v-else class="pbm-dim">-</span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="155">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="" width="80" fixed="right">
              <template #default="{ row }">
                <div class="pbm-cell-actions">
                  <router-link :to="`/after-sales/${row.id}`">
                    <button class="pbm-icon-btn pbm-icon-btn--sm" title="详情">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </button>
                  </router-link>
                  <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="handleDelete(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pbm-pagination-wrapper" v-if="total > 0">
          <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next" @change="loadData" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAfterSalesList, deleteAfterSale } from '@/api/after-sales'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const searchStatus = ref<string | undefined>()
const searchProcessType = ref<string | undefined>()

function statusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning', detecting: 'warning', repairing: 'warning', repaired: 'success',
    exchanging: 'warning', exchanged: 'success', refunding: 'warning', refunded: 'success',
    completed: 'success', cancelled: 'info',
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待处理', detecting: '检测中', repairing: '维修中', repaired: '已维修',
    exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
    completed: '已完成', cancelled: '已取消',
  }
  return map[status] || status
}

function supplierLabel(status: string) {
  const map: Record<string, string> = {
    none: '无需', pending: '待联系', in_progress: '处理中', completed: '已处理',
  }
  return map[status] || status
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function doSearch() { page.value = 1; loadData() }

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (searchStatus.value) params.status = searchStatus.value
    if (searchProcessType.value) params.process_type = searchProcessType.value
    const result = await getAfterSalesList(params)
    list.value = result.list
    total.value = result.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除工单 ${row.order_no}？`, '确认删除', { type: 'warning' })
    await deleteAfterSale(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch {
    // cancelled
  }
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

.pbm-body { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.pbm-main { flex: 1; display: flex; flex-direction: column; min-height: 0; }

.pbm-main-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 12px;
  flex-shrink: 0;
}
.pbm-search-group { display: flex; align-items: center; gap: 10px; }

.pbm-search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.pbm-search-icon {
  position: absolute;
  left: 10px;
  color: var(--pbm-text-dim);
  pointer-events: none;
}
.pbm-search-input {
  padding: 7px 10px 7px 30px;
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  background: var(--pbm-surface);
  color: var(--pbm-text);
  font-size: 13px;
  font-family: inherit;
  width: 240px;
  outline: none;
  transition: border-color 0.15s;
}
.pbm-search-input:focus { border-color: var(--pbm-accent); }
.pbm-search-input::placeholder { color: var(--pbm-text-dim); }

.pbm-section-count {
  font-size: 12px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
}

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
  text-decoration: none;
}
.pbm-btn-accent:hover { background: #dba84a; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(201,149,60,0.3); }
.pbm-btn-accent:active { transform: translateY(0); }
.pbm-btn-accent--sm { padding: 6px 14px; font-size: 12px; }

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
  --el-table-text-color: var(--pbm-text);
  --el-table-header-text-color: var(--pbm-text-dim);
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
}
.pbm-table-wrapper :deep(.el-table__header-wrapper) { border-bottom: 1px solid var(--pbm-border); }
.pbm-table-wrapper :deep(.el-table__header th) { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.pbm-table-wrapper :deep(.el-table__body tr.el-table__row--striped) { background: #faf7f4; }

.pbm-link-order { color: var(--pbm-blue); text-decoration: none; font-weight: 500; }
.pbm-link-order:hover { text-decoration: underline; }

.pbm-status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.pbm-status-tag--pending, .pbm-status-tag--detecting, .pbm-status-tag--repairing, .pbm-status-tag--exchanging, .pbm-status-tag--refunding { background: rgba(250,173,20,0.12); color: #b8860b; }
.pbm-status-tag--repaired, .pbm-status-tag--exchanged, .pbm-status-tag--refunded, .pbm-status-tag--completed { background: rgba(46,125,50,0.08); color: #2e7d32; }
.pbm-status-tag--cancelled { background: rgba(0,0,0,0.05); color: var(--pbm-text-dim); }
.pbm-status-tag--ok { background: rgba(46,125,50,0.08); color: #2e7d32; }
.pbm-status-tag--warn { background: rgba(250,173,20,0.12); color: #b8860b; }

.pbm-process-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(59,130,246,0.08);
  color: var(--pbm-blue);
}

.pbm-dim { color: var(--pbm-text-dim); }

.pbm-cell-actions { display: flex; gap: 4px; align-items: center; }

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
.pbm-icon-btn--sm { width: 24px; height: 24px; }

.pbm-pagination-wrapper {
  padding: 16px 24px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}
.pbm-pagination-wrapper :deep(.el-pagination) { font-family: var(--pbm-font); }
.pbm-pagination-wrapper :deep(.el-pager li) { background: transparent; color: var(--pbm-text-dim); border-radius: var(--pbm-radius); font-size: 13px; min-width: 30px; }
.pbm-pagination-wrapper :deep(.el-pager li.active) { background: var(--pbm-accent); color: #fff; font-weight: 600; }
.pbm-pagination-wrapper :deep(.el-pager li:hover) { color: var(--pbm-text); }
.pbm-pagination-wrapper :deep(.btn-prev), .pbm-pagination-wrapper :deep(.btn-next) { background: transparent; color: var(--pbm-text-dim); }
</style>

<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">销售记录</h1>
        <span class="pbm-subtitle">Sales Records</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-main">
        <div class="pbm-main-head">
          <div class="pbm-search-group">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
            <button class="pbm-btn-accent" @click="loadSales">查询</button>
            <button class="pbm-btn-plain" @click="handleExport">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>导出 Excel</span>
            </button>
          </div>
        </div>

        <div class="pbm-table-wrapper">
          <el-table :data="sales" border stripe v-loading="loading" size="small" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="#" width="48" align="center" />
            <el-table-column label="单号" width="80" align="center">
              <template #default="{ row }">{{ row.id }}</template>
            </el-table-column>
            <el-table-column label="门店" width="120">
              <template #default="{ row }">{{ row.store?.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="商品信息" min-width="200">
              <template #default="{ row }">{{ row.model_name || '-' }}</template>
            </el-table-column>
            <el-table-column label="应收" width="100" align="right">
              <template #default="{ row }">¥{{ (row.total_amount || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="实收" width="100" align="right">
              <template #default="{ row }">¥{{ (row.actual_amount || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="时间" width="120" align="center">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="" width="90" fixed="right">
              <template #default="{ row }">
                <div class="pbm-cell-actions">
                  <button class="pbm-icon-btn pbm-icon-btn--sm" title="详情" @click="showDetail(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  </button>
                  <button class="pbm-icon-btn pbm-icon-btn--sm" title="补打" @click="reprint(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
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
            @change="loadSales"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="销售详情" width="700px" :close-on-click-modal="false" class="pbm-dialog">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="单号">{{ detailData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ detailData.storeName }}</el-descriptions-item>
        <el-descriptions-item label="收银员">{{ detailData.cashier }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detailData.customerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="应收金额">¥{{ detailData.totalAmount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="实收金额">¥{{ detailData.paidAmount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="时间" :span="2">{{ detailData.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div class="pbm-detail-table">
        <el-table :data="detailData?.items || []" border stripe size="small" element-loading-background="rgba(245,240,235,0.8)">
          <el-table-column label="商品" min-width="160">
            <template #default="{ row }">
              {{ row.modelName }}
            </template>
          </el-table-column>
          <el-table-column label="IMEI" width="140">
            <template #default="{ row }">{{ row.imei || '-' }}</template>
          </el-table-column>
          <el-table-column label="IMEI2" width="130">
            <template #default="{ row }">{{ row.imei2 || '-' }}</template>
          </el-table-column>
          <el-table-column label="S/N" width="120">
            <template #default="{ row }">{{ row.snCode || '-' }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="60" align="center" />
          <el-table-column label="单价" width="90" align="right">
            <template #default="{ row }">¥{{ (row.price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="小计" width="100" align="right">
            <template #default="{ row }">
              ¥{{ ((row.totalPrice ?? (row.price * row.quantity)) || 0).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <button class="pbm-btn-plain" @click="detailVisible = false">关闭</button>
      </template>
    </el-dialog>

    <PrintReceipt ref="printReceiptRef" :data="printData" :store-name="userStore.currentStoreName" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getSales, getSale, getSalePrintData, deleteSale } from '@/api/sales'
import PrintReceipt from '@/components/PrintReceipt.vue'
import { exportWithQuery } from '@/api/tools'

const userStore = useUserStore()
const printReceiptRef = ref()

const loading = ref(false)
const sales = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref<string[] | null>(null)

const detailVisible = ref(false)
const detailData = ref<any>(null)
const printData = ref<any>(null)

function handleExport() {
  exportWithQuery('/sales/sales/export', {
    startDate: dateRange.value?.[0] || undefined,
    endDate: dateRange.value?.[1] || undefined,
    storeId: userStore.effectiveStoreId || undefined,
  })
}

async function loadSales() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    if (userStore.effectiveStoreId) params.storeId = userStore.effectiveStoreId
    const result = await getSales(params)
    sales.value = result.list
    total.value = result.total
  } catch {
    sales.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function showDetail(row: any) {
  try {
    const d = await getSale(row.id)
    detailData.value = {
      orderNo: d.order_no,
      storeName: d.store?.name || '',
      cashier: d.operator?.real_name || '',
      customerName: d.customer_name || '',
      totalAmount: d.total_amount || 0,
      paidAmount: d.actual_amount || 0,
      createdAt: d.created_at,
      remark: d.remark || '',
      items: (d.items || []).map((item: any) => ({
        modelId: item.model_id,
        modelName: item.model_name,
        imei: item.imei,
        imei2: item.imei2,
        snCode: item.sn_code,
        quantity: item.quantity,
        price: item.unit_price || 0,
        totalPrice: item.total_price || item.unit_price * item.quantity || 0,
      })),
    }
    detailVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '获取详情失败')
  }
}

async function reprint(row: any) {
  try {
    const d = await getSalePrintData(row.id)
    console.log("reprint", d)
    printData.value = {
      storeName: d.store?.name || '',
      storeAddress: d.store?.address || '',
      storePhone: d.store?.phone || '',
      orderNo: d.order_no,
      createdAt: formatDateTime(d.created_at),
      cashier: d.operator?.real_name || '',
      customerName: d.customer_name || undefined,
      customerAddress: d.customer_address || undefined,
      customerPhone: d.customer_phone || undefined,
      totalAmount: d.total_amount || 0,
      paidAmount: d.actual_amount || 0,
      changeAmount: d.change_amount || 0,
      remark: d.remark || '',
      items: (d.items || []).map((item: any) => ({
        modelId: item.model_id,
        modelName: item.model_name,
        imei: item.imei || '',
        imei2: item.imei2,
        snCode: item.sn_code,
        quantity: item.quantity,
        price: item.unit_price || 0,
      })),
    }
    await nextTick()
    printReceiptRef.value?.open()
  } catch (e: any) {
    console.error('补打失败:', e)
    ElMessage.error(e?.response?.data?.message || e?.message || '获取打印数据失败')
  }
}

function formatDateTime(dateStr: string | Date): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  const secs = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除单号 #${row.id} 的销售记录吗？`,
      '确认删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    await deleteSale(row.id)
    ElMessage.success('删除成功')
    await loadSales()
  } catch {
    // cancelled
  }
}

onMounted(() => {
  loadSales()
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
.pbm-table-wrapper :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) { background: #d5ccc0; border-radius: 3px; }

.pbm-cell-actions { display: flex; gap: 2px; }

/* ─── Pagination ─── */
.pbm-pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 12px 24px 24px;
  flex-shrink: 0;
}
.pbm-pagination-wrapper :deep(.el-pagination) { font-family: var(--pbm-font); }
.pbm-pagination-wrapper :deep(.el-pagination button) { color: var(--pbm-text-dim); }
.pbm-pagination-wrapper :deep(.el-pager li) { color: var(--pbm-text-dim); font-weight: 500; min-width: 28px; height: 28px; line-height: 28px; border-radius: 4px; }
.pbm-pagination-wrapper :deep(.el-pager li.active) { color: var(--pbm-accent); background: var(--pbm-accent-glow); font-weight: 600; }
.pbm-pagination-wrapper :deep(.el-pagination .el-pagination__total) { color: var(--pbm-text-dim); font-family: var(--pbm-mono); font-size: 12px; }

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
:deep(.pbm-dialog .el-descriptions) { font-size: 13px; }
:deep(.pbm-dialog .el-descriptions__title) { font-size: 13px; font-weight: 600; color: var(--pbm-text); }
:deep(.pbm-dialog .el-descriptions__label) { color: var(--pbm-text-dim); }
:deep(.pbm-dialog .el-descriptions__content) { color: var(--pbm-text); }

.pbm-detail-table {
  margin-top: 16px;
}
.pbm-detail-table :deep(.el-table) {
  --el-table-border-color: var(--pbm-border);
  --el-table-header-bg-color: #f0ebe5;
  --el-table-tr-bg-color: #fff;
  --el-table-row-hover-bg-color: var(--pbm-surface-hover);
  --el-table-text-color: var(--pbm-text);
  --el-table-header-text-color: var(--pbm-text-dim);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
}
.pbm-detail-table :deep(.el-table__header th) { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.pbm-detail-table :deep(.el-table__body tr.el-table__row--striped) { background: #faf7f4; }

/* ─── Scrollbar ─── */
.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

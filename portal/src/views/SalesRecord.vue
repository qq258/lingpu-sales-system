<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">销售记录</h1>
      <span class="title-line"></span>
    </div>

    <div class="search-section">
      <div class="search-row">
        <div class="search-input-wrap">
          <input ref="searchRef" v-model="keyword" class="search-input" placeholder="搜索 IMEI / 单号 / 商品名称..." @keyup.enter="doSearch" />
        </div>
        <button class="search-btn" @click="doSearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          搜索
        </button>
      </div>

      <div class="filter-row">
        <el-date-picker v-model="startDate" type="date" placeholder="开始日期" size="large" style="width:155px;" value-format="YYYY-MM-DD" />
        <span class="date-sep">—</span>
        <el-date-picker v-model="endDate" type="date" placeholder="结束日期" size="large" style="width:155px;" value-format="YYYY-MM-DD" />
        <button class="glass filter-btn" @click="doSearch">查询</button>
        <span class="result-count">共 {{ total }} 条记录</span>
      </div>
    </div>

    <div v-if="loading" class="loading-list">
      <div v-for="i in 5" :key="i" class="skeleton-row" :style="{ animationDelay: (i * 0.06) + 's' }"></div>
    </div>
    <div v-else-if="list.length" class="record-list">
      <SaleRecordCard v-for="item in list" :key="item.id" :record="item" @print="handlePrint" />
    </div>
    <div v-else class="empty-hint">暂无销售记录</div>

    <div v-if="total > pageSize" class="pagination-row">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="prev, pager, next" size="large" @change="loadData" />
    </div>

    <PrintReceipt ref="printReceiptRef" :data="printData" :store-name="storeName" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getSalesList, getSalePrintData } from '@/api/sales'
import SaleRecordCard from '@/components/SaleRecordCard.vue'
import PrintReceipt from '@/components/PrintReceipt.vue'

const userStore = useUserStore()
const searchRef = ref<HTMLInputElement>()
const keyword = ref('')
const startDate = ref('')
const endDate = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const printData = ref<any>(null)
const printReceiptRef = ref()

const storeName = ref('')

onMounted(() => {
  nextTick(() => searchRef.value?.focus())
  loadData()
  // 获取门店名
  const sid = userStore.effectiveStoreId
  const s = userStore.stores.find((x: any) => x.id === sid)
  if (s) storeName.value = s.name
})

function doSearch() { page.value = 1; loadData() }

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (startDate.value) params.start_date = startDate.value
    if (endDate.value) params.end_date = endDate.value
    if (userStore.effectiveStoreId) params.storeId = userStore.effectiveStoreId
    const result = await getSalesList(params)
    list.value = (result.list || []).map((item: any) => ({
      ...item, orderNo: item.order_no, order_no: undefined,
      createdAt: item.created_at, created_at: undefined,
      actualAmount: item.actual_amount, actual_amount: undefined,
      modelName: item.model_name, model_name: undefined,
      customerName: item.customer_name, customer_name: undefined,
      itemCount: item.items?.length || 1,
    }))
    total.value = result.total || 0
  } catch { list.value = []; total.value = 0 }
  finally { loading.value = false }
}

async function handlePrint(record: any) {
  try {
    const data = await getSalePrintData(record.id)
    printData.value = data
    nextTick(() => { printReceiptRef.value?.open() })
  } catch { ElMessage.error('获取打印数据失败') }
}
</script>

<style scoped>
.search-section { margin-bottom: 24px; }
.search-row { display: flex; gap: 12px; margin-bottom: 16px; }
.search-input-wrap { flex: 1; }
.search-input { width: 100%; height: 52px; padding: 0 20px; font-size: 18px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.search-input::placeholder { color: var(--text-tertiary); font-size: 17px; }
.search-btn { display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 28px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 17px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.search-btn:hover { background: var(--primary-dark); }
.filter-row { display: flex; align-items: center; gap: 10px; }
.filter-btn { display: inline-flex; align-items: center; height: 42px; padding: 0 20px; border-radius: var(--radius-sm); font-size: 15px; cursor: pointer; font-family: inherit; color: var(--text-secondary); transition: var(--transition); }
.filter-btn:hover { border-color: var(--primary); color: var(--primary); }
.date-sep { font-size: 14px; color: var(--text-tertiary); }
.result-count { font-size: 14px; color: var(--text-tertiary); margin-left: auto; }
.record-list { display: flex; flex-direction: column; gap: 14px; }
.loading-list { display: flex; flex-direction: column; gap: 14px; }
.skeleton-row { height: 110px; border-radius: var(--radius); background: linear-gradient(90deg, #E2E8F0 25%, #CBD5E1 50%, #E2E8F0 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.pagination-row { display: flex; justify-content: center; margin-top: 28px; }
:deep(.el-date-editor) { --el-component-size: 42px; }
:deep(.el-date-editor .el-input__inner) { font-size: 14px; }
</style>

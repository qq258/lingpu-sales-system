<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">数据看板</h1>
      <span class="title-line"></span>
    </div>

    <!-- 快捷按钮 -->
    <div class="quick-bar-row">
      <button class="quick-btn" @click="$router.push('/entry')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>入库</span>
      </button>
      <button class="quick-btn" @click="$router.push('/inventory')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>查库存</span>
      </button>
      <button class="quick-btn" @click="$router.push('/manual')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span>使用手册</span>
      </button>
      <button class="quick-btn" @click="showImeiQuery = true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        <span>IMEI查询</span>
      </button>
    </div>

    <!-- 快速开单区 -->
    <div class="sale-section glass">
      <div class="sale-section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        快速开单
      </div>

      <div class="scan-row">
        <div class="scan-input-wrap">
          <input ref="scanRef" v-model="scanInput" class="scan-input" placeholder="扫码枪扫描或输入 IMEI 后按回车" @keyup.enter="handleScan" />
        </div>
        <button class="scan-btn" @click="handleScan">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
          扫描
        </button>
      </div>
      <div v-if="scanning" class="scan-status"><span class="spinner"></span> 正在查询...</div>
      <div v-if="scanError" class="scan-error">{{ scanError }}</div>

      <div v-if="cart.length" class="cart-area">
        <div class="cart-header">
          <span>已选商品 · {{ cart.length }} 件</span>
          <button class="cart-clear" @click="cart = []; paidAmount = totalAmount"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>清空</button>
        </div>
        <div class="cart-list">
          <div v-for="(item, i) in cart" :key="i" class="cart-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/></svg>
            <div class="cart-item-info">
              <div class="cart-item-name">{{ item.brandName }} {{ item.modelName }}</div>
              <div class="cart-item-imei">{{ item.imei }}</div>
            </div>
            <el-input-number v-model="item.price" :min="0" :precision="2" :step="100" size="large" controls-position="right" style="width:150px;" />
            <button class="cart-item-del" @click="cart.splice(i, 1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="checkout-area">
          <div class="checkout-row">
            <span class="checkout-label">合计</span>
            <span class="checkout-total">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
          <div class="checkout-row">
            <span class="checkout-label">收款金额</span>
            <el-input-number v-model="paidAmount" :min="0" :precision="2" size="large" controls-position="right" style="width:180px;" />
          </div>
          <div class="checkout-row">
            <span class="checkout-label">找零</span>
            <span :class="['checkout-change', changeAmount < 0 ? 'change-err' : '']">¥{{ Math.abs(changeAmount).toFixed(2) }}{{ changeAmount < 0 ? ' (不足)' : '' }}</span>
          </div>
          <div class="checkout-row">
            <div class="customer-field">
              <span class="checkout-label">客户</span>
              <el-input v-model="customerName" placeholder="选填" size="large" style="width:160px;" />
            </div>
            <div class="customer-field">
              <span class="checkout-label">电话</span>
              <el-input v-model="customerPhone" placeholder="选填" size="large" style="width:160px;" />
            </div>
            <div class="customer-field">
              <span class="checkout-label">地址</span>
              <el-input v-model="customerAddress" placeholder="选填" size="large" style="width:200px;" />
            </div>
          </div>
        </div>

        <button class="pay-btn" @click="showPayConfirm = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          确认收款  ¥{{ totalAmount.toFixed(2) }}
        </button>
      </div>
      <div v-else class="cart-empty">扫码添加商品开始开单</div>
    </div>

    <!-- 数据网格 -->
    <div class="data-grid">
      <!-- 左侧 -->
      <div class="data-grid-left">
        <!-- 趋势图 -->
        <div class="data-card glass">
          <div class="data-card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            销售额趋势
          </div>
          <div class="data-card-body" style="height:180px;">
            <LineChart :data="trendData" color="#2563EB" height="180px" />
          </div>
        </div>

        <!-- 品牌库存 -->
        <div class="data-card glass">
          <div class="data-card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            品牌库存
          </div>
          <div class="brand-cards">
            <div v-for="b in brandStockList" :key="b.name" class="brand-card">
              <span class="brand-name">{{ b.name }}</span>
              <span class="brand-qty">{{ b.qty }} 台</span>
            </div>
            <div v-if="!brandStockList.length" class="empty-data">暂无库存数据</div>
          </div>
        </div>

      </div>

      <!-- 右侧：排行 -->
      <div class="data-grid-right">
        <div class="data-card glass" style="height:100%;">
          <div class="data-card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            售出排行
          </div>
          <div class="data-card-body" style="flex:1;">
            <HorizontalBarChart :data="topProductsData" color="#F97316" />
          </div>
        </div>
      </div>
    </div>

    <!-- 双列记录（独立一行） -->
    <div class="dual-records">
      <div class="data-card glass">
        <div class="data-card-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          今日售出
        </div>
        <div class="record-list">
          <div v-for="ord in recentOrders" :key="ord.orderNo || ord.order_no" class="record-item">
            <div class="record-left">
              <svg width="5" height="5" viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2.5" fill="#F97316"/></svg>
              <span class="record-info">{{ ord.orderNo || ord.order_no || '' }}</span>
            </div>
            <span class="record-amount">¥{{ (ord.totalAmount || 0).toFixed(2) }}</span>
          </div>
          <div v-if="!recentOrders.length" class="empty-data">暂无售出记录</div>
        </div>
      </div>
      <div class="data-card glass">
        <div class="data-card-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          最近入库
        </div>
        <div class="record-list">
          <div v-for="e in recentEntries" :key="e.id" class="record-item">
            <div class="record-left">
              <svg width="5" height="5" viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2.5" fill="#3B82F6"/></svg>
              <span class="record-info">{{ e.entry_no || '' }}</span>
            </div>
            <span class="record-qty">x{{ e._count?.items || e.itemCount || 0 }}</span>
          </div>
          <div v-if="!recentEntries.length" class="empty-data">暂无入库记录</div>
        </div>
      </div>
    </div>

    <!-- 确认收款弹窗 -->
    <ConfirmDialog
      :visible="showPayConfirm" title="确认收款"
      :message="`共 ${cart.length} 件商品，应收 ¥${totalAmount.toFixed(2)}，实收 ¥${paidAmount.toFixed(2)}`"
      type="success" confirm-text="确认收款" cancel-text="再想想"
      @confirm="handlePay" @cancel="showPayConfirm = false"
    />

    <!-- IMEI查询弹窗 -->
    <ImeiQueryDialog v-model:visible="showImeiQuery" />

    <!-- 小票打印 -->
    <PrintReceipt ref="printReceiptRef" :data="printData" :store-name="storeName" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { scanImeiForSale, getBrandInventory } from '@/api/inventory'
import { getPurchaseEntries } from '@/api/purchase'
import { getDashboard, getSalesStats, getTopProducts } from '@/api/stats'
import { createSale, getSalePrintData } from '@/api/sales'
import LineChart from '@/components/LineChart.vue'
import HorizontalBarChart from '@/components/HorizontalBarChart.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ImeiQueryDialog from '@/components/ImeiQueryDialog.vue'
import PrintReceipt from '@/components/PrintReceipt.vue'

const userStore = useUserStore()
const scanRef = ref<HTMLInputElement>()

// 开单
const scanInput = ref('')
const scanning = ref(false)
const scanError = ref('')
const cart = ref<Array<{ brandName: string; modelName: string; imei: string; price: number }>>([])
const paidAmount = ref(0)
const customerName = ref('')
const customerPhone = ref('')
const customerAddress = ref('')
const showPayConfirm = ref(false)
const showImeiQuery = ref(false)
const printData = ref<any>(null)
const printReceiptRef = ref()

const totalAmount = computed(() => cart.value.reduce((s, i) => s + (i.price || 0), 0))
const changeAmount = computed(() => paidAmount.value - totalAmount.value)
const storeName = computed(() => {
  const sid = userStore.effectiveStoreId
  const s = userStore.stores.find((x: any) => x.id === sid)
  return s?.name || ''
})

// 数据
const timeRange = ref('3m')
const trendRaw = ref<any[]>([])
const topRaw = ref<any[]>([])
const recentOrders = ref<any[]>([])
const brandStockRaw = ref<any[]>([])
const recentEntries = ref<any[]>([])

const trendData = computed(() => trendRaw.value.map((i: any) => ({ label: (i.date || '').slice(5), value: i.totalAmount || i.amount || 0 })))
const topProductsData = computed(() => topRaw.value.map((i: any) => ({ label: i.modelName || '', value: i.quantity || 0 })))

// 品牌库存聚合
const brandStockList = computed(() => {
  const map: Record<string, number> = {}
  for (const item of brandStockRaw.value) {
    const name = item.brandName || item.brand_name || '未知'
    map[name] = (map[name] || 0) + (item.quantity || item.stock || 0)
  }
  return Object.entries(map)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)
})

onMounted(() => {
  nextTick(() => scanRef.value?.focus())
  loadAll()
})

watch(timeRange, loadAllDataOnly)

async function loadAll() {
  const storeId = userStore.effectiveStoreId || undefined
  try {
    const d = await getDashboard(storeId)
    recentOrders.value = d?.recentOrders || []
  } catch {}
  await loadAllDataOnly()
}

async function loadAllDataOnly() {
  const storeId = userStore.effectiveStoreId || undefined
  const range = getDateRange()
  try { trendRaw.value = await getSalesStats({ ...range, storeId }) } catch { trendRaw.value = [] }
  try { topRaw.value = await getTopProducts({ startDate: range.start_date, endDate: range.end_date, storeId, limit: 10 }) } catch { topRaw.value = [] }
  try {
    const inv = await getBrandInventory({ storeId })
    brandStockRaw.value = inv?.list || []
  } catch { brandStockRaw.value = [] }
  try {
    const entries = await getPurchaseEntries({ page: 1, pageSize: 5 })
    recentEntries.value = entries?.list?.slice(0, 5) || []
  } catch { recentEntries.value = [] }
}

function getDateRange() {
  const now = new Date(); const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0'); const d = String(now.getDate()).padStart(2, '0')
  const today = `${y}-${m}-${d}`
  let start = ''; let groupBy = 'day'
  switch (timeRange.value) {
    case '3m': { const d3 = new Date(now); d3.setDate(d3.getDate() - 90); start = d3.toISOString().slice(0, 10); break }
    case 'thisMonth': { start = `${y}-${m}-01`; break }
    case 'thisYear': { start = `${y}-01-01`; groupBy = 'month'; break }
  }
  return { start_date: start, end_date: today, groupBy }
}

// 扫码
async function handleScan() {
  const imei = scanInput.value.trim()
  if (!imei) { scanError.value = '请输入 IMEI'; return }
  scanning.value = true; scanError.value = ''
  try {
    const item = await scanImeiForSale(imei, userStore.effectiveStoreId || undefined)
    if (!item) { scanError.value = '未找到该 IMEI'; return }
    if (item.isSold || item.status === 'sold') { scanError.value = '该手机已售出'; return }
    if (cart.value.some(c => c.imei === imei)) { scanError.value = '已在购物车中'; return }
    cart.value.push({
      brandName: item.brandName || '',
      modelName: item.modelName || '',
      imei: item.imei,
      price: item.salePrice || 0,
    })
    paidAmount.value = totalAmount.value
    scanInput.value = ''; scanError.value = ''
    nextTick(() => scanRef.value?.focus())
  } catch (e: any) {
    scanError.value = e?.response?.data?.message || e?.message || '查询失败'
  } finally { scanning.value = false }
}

// 收款
async function handlePay() {
  showPayConfirm.value = false
  let saleId: number | null = null
  try {
    const result = await createSale({
      items: cart.value.map(i => ({ imei: i.imei, unit_price: i.price })),
      actual_amount: totalAmount.value,
      customer_name: customerName.value || undefined,
      customer_phone: customerPhone.value || undefined,
      customer_address: customerAddress.value || undefined,
    })
    saleId = result?.id
    const msg = `开单成功！共 ${cart.value.length} 件 ¥${totalAmount.value.toFixed(2)}`
    ElMessage.success({ message: msg, duration: 3000 })
    cart.value = []; paidAmount.value = 0; customerName.value = ''; customerPhone.value = ''; customerAddress.value = ''
    scanInput.value = ''
    nextTick(() => scanRef.value?.focus())
    loadAll()
    // 弹窗询问是否打印小票
    if (saleId) {
      ElMessageBox.confirm('是否打印小票？', '开单成功', {
        confirmButtonText: '打印',
        cancelButtonText: '关闭',
        type: 'success',
      }).then(async () => {
        try {
          const d = await getSalePrintData(saleId)
          printData.value = d
          nextTick(() => { printReceiptRef.value?.open() })
        } catch { ElMessage.error('获取打印数据失败') }
      }).catch(() => {})
    }
  } catch (e: any) { ElMessage.error(e?.message || '开单失败') }
}
</script>

<style scoped>
.page-container { width: 100%; }
/* 页面标题 */
.page-title-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: var(--text); margin: 0; white-space: nowrap; }
.title-line { flex: 1; height: 0; border-top: 1px dashed var(--border); }

/* 快捷按钮 */
.quick-bar-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.quick-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 88px; border: none; border-radius: 16px; cursor: pointer; font-family: inherit; color: var(--text); background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)); border: 1px solid var(--glass-border); transition: var(--transition); font-size: 16px; font-weight: 600; }
.quick-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.quick-btn:active { transform: translateY(0); }
.quick-btn svg { color: var(--primary); }

/* 开单区 */
.sale-section { padding: 22px 24px; border-radius: var(--radius); margin-bottom: 24px; }
.sale-section-header { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; color: var(--text); margin-bottom: 18px; }
.sale-section-header svg { color: var(--primary); }
.scan-row { display: flex; gap: 12px; }
.scan-input-wrap { flex: 1; }
.scan-input { width: 100%; height: 50px; padding: 0 18px; font-size: 18px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.scan-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.scan-input::placeholder { color: var(--text-tertiary); font-size: 16px; }
.scan-btn { display: inline-flex; align-items: center; gap: 6px; height: 50px; padding: 0 24px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.scan-btn:hover { background: var(--primary-dark); }
.scan-status { margin-top: 10px; font-size: 14px; color: var(--text-tertiary); display: flex; align-items: center; gap: 8px; }
.scan-error { margin-top: 10px; font-size: 14px; color: var(--danger); padding: 8px 12px; background: var(--danger-light); border-radius: var(--radius-sm); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.cart-area { margin-top: 18px; }
.cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 15px; font-weight: 600; color: var(--text); }
.cart-clear { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border: 1px solid var(--border); border-radius: 8px; background: transparent; font-size: 13px; cursor: pointer; font-family: inherit; color: var(--text-tertiary); transition: var(--transition); }
.cart-clear:hover { border-color: var(--danger); color: var(--danger); }
.cart-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; max-height: 240px; overflow-y: auto; }
.cart-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,0.5); border-radius: var(--radius-sm); }
.cart-item-info { flex: 1; min-width: 0; }
.cart-item-name { font-size: 15px; font-weight: 500; color: var(--text); }
.cart-item-imei { font-size: 13px; color: var(--text-tertiary); font-family: monospace; margin-top: 1px; }
.cart-item-del { width: 30px; height: 30px; border: none; border-radius: 50%; background: rgba(239,68,68,0.1); display: flex; align-items: center; justify-content: center; color: var(--danger); cursor: pointer; transition: var(--transition); flex-shrink: 0; }
.cart-item-del:hover { background: var(--danger); color: #fff; }
.cart-empty { text-align: center; padding: 24px 0; font-size: 15px; color: var(--text-tertiary); }
.checkout-area { border-top: 1px solid var(--border); padding-top: 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 12px; }
.checkout-row { display: flex; align-items: center; gap: 16px; }
.checkout-label { font-size: 14px; color: var(--text-secondary); min-width: 70px; }
.checkout-total { font-size: 24px; font-weight: 700; color: var(--text); font-family: 'SF Mono', monospace; }
.checkout-change { font-size: 18px; font-weight: 700; font-family: monospace; color: var(--success); }
.change-err { color: var(--danger); font-size: 15px; }
.customer-field { display: flex; align-items: center; gap: 8px; }
.pay-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 56px; border: none; border-radius: var(--radius); background: var(--success); color: #fff; font-size: 20px; font-weight: 700; cursor: pointer; font-family: inherit; transition: var(--transition); }
.pay-btn:hover { filter: brightness(0.92); box-shadow: 0 4px 16px rgba(34,197,94,0.3); }

/* 数据网格 */
.data-grid { display: grid; grid-template-columns: 3fr 1fr; gap: 20px; }
.data-grid-left { display: flex; flex-direction: column; gap: 20px; }
.data-grid-right { display: flex; }
.data-grid-right > .data-card { flex: 1; min-height: 0; }
.data-card { padding: 20px 22px; border-radius: var(--radius); display: flex; flex-direction: column; }
.data-card-header { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 14px; }
.data-card-body { flex: 1; }

/* 品牌库存卡片 */
.brand-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.brand-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; background: rgba(255,255,255,0.5); border-radius: var(--radius-sm); }
.brand-name { font-size: 14px; font-weight: 600; color: var(--text); }
.brand-qty { font-size: 20px; font-weight: 700; color: var(--primary); font-family: 'SF Mono', monospace; }

/* 双列记录 */
.dual-records { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
.record-list { display: flex; flex-direction: column; gap: 4px; }
.record-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
.record-item:last-child { border-bottom: none; }
.record-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.record-info { font-size: 14px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-amount { font-size: 14px; font-weight: 600; color: var(--text); font-family: monospace; flex-shrink: 0; }
.record-qty { font-size: 14px; font-weight: 600; color: var(--primary); font-family: monospace; flex-shrink: 0; }
.empty-data { font-size: 13px; color: var(--text-tertiary); padding: 12px 0; text-align: center; }

/* 统一样式覆盖 */
:deep(.el-input-number) { --el-component-size: 38px; }
:deep(.el-input) { --el-component-size: 38px; }
:deep(.el-input__inner) { font-size: 15px; }
:deep(.el-input-number .el-input__inner) { font-size: 15px; font-weight: 600; }

@media (max-width: 1100px) {
  .data-grid { grid-template-columns: 1fr; }
  .quick-bar-row { grid-template-columns: repeat(2, 1fr); }
  .brand-cards { grid-template-columns: repeat(3, 1fr); }
  .dual-records { grid-template-columns: 1fr; }
}
</style>

<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">销售开单</h1>
        <span class="pbm-subtitle">Sale Order</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-section-card">
        <h3>扫码添加商品</h3>
        <p class="pbm-section-desc">支持扫码枪扫描或手动输入 IMEI，自动匹配库存信息</p>
        <div class="pbm-scan-row">
          <div class="pbm-scan-input-wrapper">
            <svg class="pbm-scan-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
            <input
              ref="imeiInputRef"
              v-model="scanInput"
              class="pbm-scan-input"
              placeholder="扫码枪扫描或手动输入IMEI后按回车"
              @keyup.enter="handleScan"
            />
          </div>
        </div>
        <div v-if="scanning" class="pbm-scanning-hint">
          <svg class="pbm-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
          <span>正在查询 IMEI 库存...</span>
        </div>
        <div v-if="matchedItem" class="pbm-matched-card">
          <div class="pbm-matched-info">
            <div class="pbm-matched-name">
              <el-tag size="small" type="primary">{{ matchedItem.brandName }}</el-tag>
              {{ matchedItem.modelName }} - {{ matchedItem.color }} / {{ matchedItem.storage }}
            </div>
            <div class="pbm-matched-imei">{{ matchedItem.imei }}</div>
          </div>
          <div class="pbm-matched-badge">已添加</div>
        </div>
        <div v-if="matchedItem === null && queried && !scanning" class="pbm-empty-hint">未找到该IMEI对应的库存或该商品已售出</div>
      </div>

      <div class="pbm-section-card">
        <h3>购物车 <span v-if="cartItems.length" class="pbm-section-count">{{ cartItems.length }} 件商品</span></h3>
        <div class="pbm-table-wrapper">
          <el-table :data="cartItems" border stripe max-height="360" size="small">
            <el-table-column type="index" label="#" width="44" />
            <el-table-column label="商品名称" min-width="200">
              <template #default="{ row }">
                <span class="pbm-tag-brand">{{ row.brandName }}</span>
                {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
              </template>
            </el-table-column>
            <el-table-column label="IMEI" width="170" prop="imei" />
            <el-table-column label="IMEI2" width="150">
              <template #default="{ row }">
                <div v-if="row.imei2" class="pbm-cell-info">{{ row.imei2 }}</div>
                <div v-else class="pbm-cell-missing" @click="editImei2(row)">
                  <el-tag size="small" type="warning" effect="plain" style="cursor:pointer;">待补录</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="S/N" width="130">
              <template #default="{ row }">
                <div v-if="row.snCode" class="pbm-cell-info">{{ row.snCode }}</div>
                <div v-else class="pbm-cell-missing" @click="editSnCode(row)">
                  <el-tag size="small" type="warning" effect="plain" style="cursor:pointer;">待补录</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="售价" width="140">
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="2" :step="100" size="small" controls-position="right" style="width:130px;" />
              </template>
            </el-table-column>
            <el-table-column label="" width="60" fixed="right">
              <template #default="{ row, $index }">
                <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="removeCartItem($index)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-if="cartItems.length === 0" class="pbm-empty-hint">购物车为空，请扫码添加商品</div>
      </div>

      <div class="pbm-section-card">
        <h3>结算信息</h3>
        <div class="pbm-settlement-layout">
          <div class="pbm-settlement-items">
            <div class="pbm-settlement-item" v-for="(item, i) in cartItems" :key="i">
              <div class="pbm-settlement-item-info">
                <span class="pbm-tag-brand">{{ item.brandName }}</span>
                <span class="pbm-settlement-item-name">{{ item.modelName }} - {{ item.color }} / {{ item.storage }}</span>
                <span class="pbm-settlement-item-imei">{{ item.imei }}</span>
              </div>
              <div class="pbm-settlement-item-price">¥{{ item.price.toFixed(2) }}</div>
            </div>
            <div v-if="cartItems.length === 0" class="pbm-empty-hint" style="padding:12px 0;">
              暂无商品，请先扫码添加
            </div>
          </div>
          <el-form :model="settlement" label-width="100px" class="pbm-settlement-form">
            <el-form-item label="应收金额">
              <span class="pbm-amount-total">¥{{ totalAmount.toFixed(2) }}</span>
            </el-form-item>
            <el-form-item label="实收金额" required>
              <el-input-number v-model="settlement.paidAmount" :min="0" :precision="2" size="large" controls-position="right" style="width:200px;" @change="onPaidChange" />
            </el-form-item>
            <el-form-item label="找零" v-if="changeAmount > 0">
              <span class="pbm-change-amount">¥{{ changeAmount.toFixed(2) }}</span>
            </el-form-item>
            <el-form-item label="客户称呼">
              <el-input v-model="settlement.customerName" placeholder="可选" style="width:200px;" />
            </el-form-item>
            <el-form-item label="客户地址">
              <el-input v-model="settlement.customerAddress" placeholder="可选" style="width:200px;" />
            </el-form-item>
            <el-form-item label="客户电话">
              <el-input v-model="settlement.customerPhone" placeholder="可选" style="width:200px;" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="settlement.remark" type="textarea" :rows="2" style="width:280px;" placeholder="可选备注" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="pbm-form-actions">
        <button class="pbm-btn-plain" @click="resetAll">重置</button>
        <button class="pbm-btn-accent" :disabled="cartItems.length === 0 || submitLoading" @click="handleCheckout">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{{ submitLoading ? '提交中...' : `确认收款 ¥${settlement.paidAmount.toFixed(2)}` }}</span>
        </button>
      </div>
    </div>

    <PrintReceipt ref="printReceiptRef" :data="lastSaleData" :store-name="userStore.currentStoreName" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

function editImei2(row: any) {
  ElMessageBox.prompt('请输入IMEI2', '补录IMEI2', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^\d{15}$/,
    inputErrorMessage: 'IMEI2格式不正确（15位数字）'
  }).then(({ value }) => {
    row.imei2 = value
  }).catch(() => {})
}

function editSnCode(row: any) {
  ElMessageBox.prompt('请输入S/N码', '补录S/N', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    row.snCode = value
  }).catch(() => {})
}

import { getStores } from '@/api/store'
import { scanImeiForSale } from '@/api/inventory'
import { createSale } from '@/api/sales'
import { createScanner } from '@/utils/scanner'
import PrintReceipt from '@/components/PrintReceipt.vue'

const userStore = useUserStore()

const imeiInputRef = ref<HTMLInputElement>()
const scanInput = ref('')
const scanning = ref(false)
const queried = ref(false)
const matchedItem = ref<any>(null)
const matchedPrice = ref(0)

const submitLoading = ref(false)
const printReceiptRef = ref()

const storeInfo = ref({ name: '', address: '', phone: '' })

const cartItems = ref<Array<{
  modelId: number
  imei: string
  imei2: string | null
  snCode: string | null
  brandName: string
  modelName: string
  color: string
  storage: string
  price: number
}>>([])

const settlement = ref({
  paidAmount: 0,
  customerName: '',
  customerAddress: '',
  customerPhone: '',
  remark: '',
})

const paidAmountAuto = ref(true)
const lastSaleData = ref<any>(null)

const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price, 0)
})

const changeAmount = computed(() => {
  return Math.max(0, settlement.value.paidAmount - totalAmount.value)
})

watch(totalAmount, (val) => {
  if (paidAmountAuto.value) {
    settlement.value.paidAmount = val
  }
})

function onPaidChange(value: number | undefined) {
  if (value !== undefined && value !== totalAmount.value) {
    paidAmountAuto.value = false
  }
}

const scanner = createScanner({
  onScan: (code) => {
    scanInput.value = code
    handleScan()
  },
  onError: (msg) => {
    ElMessage.warning(msg)
  },
})

onMounted(async () => {
  await nextTick()
  imeiInputRef.value?.focus()
  scanner.attach()
  // 加载当前门店信息
  try {
    const stores = await getStores()
    const currentId = userStore.effectiveStoreId
    const store = stores.find((s: any) => s.id === currentId)
    if (store) {
      storeInfo.value = { name: store.name, address: store.address || '', phone: store.phone || '' }
    }
  } catch {
    // ignore
  }
})

onUnmounted(() => {
  scanner.detach()
})

async function handleScan() {
  if (scanning.value) return
  const code = scanInput.value.trim()
  if (!code) return

  scanning.value = true
  queried.value = true
  matchedItem.value = null

  try {
    const result = await scanImeiForSale(code, userStore.effectiveStoreId || undefined)
    matchedItem.value = result
    matchedPrice.value = result.salePrice || 0
    // 匹配成功后自动加入购物车
    nextTick(() => addToCart())
  } catch {
    matchedItem.value = null
  } finally {
    scanning.value = false
  }
}

function addToCart() {
  if (!matchedItem.value) return

  const existing = cartItems.value.find(i => i.imei === matchedItem.value.imei)
  if (existing) {
    ElMessage.warning(`IMEI ${matchedItem.value.imei} 已在购物车中`)
    return
  }

  cartItems.value.push({
    modelId: matchedItem.value.modelId,
    imei: matchedItem.value.imei,
    imei2: matchedItem.value.imei2 || null,
    snCode: matchedItem.value.sn_code || null,
    brandName: matchedItem.value.brandName || '',
    modelName: matchedItem.value.modelName || '',
    color: matchedItem.value.color || '',
    storage: matchedItem.value.storage || '',
    price: matchedPrice.value,
  })

  ElMessage.success(`已添加「${matchedItem.value.brandName} ${matchedItem.value.modelName}」`)
  scanInput.value = ''
  matchedItem.value = null
  matchedPrice.value = 0
  queried.value = false
  nextTick(() => imeiInputRef.value?.focus())
}

function removeCartItem(index: number) {
  cartItems.value.splice(index, 1)
}

async function handleCheckout() {
  if (cartItems.value.length === 0) {
    ElMessage.warning('请添加商品')
    return
  }

  submitLoading.value = true
  try {
    const sale = await createSale({
      items: cartItems.value.map(i => ({
        imei: i.imei,
        unit_price: i.price,
      })),
      actual_amount: settlement.value.paidAmount,
      customer_name: settlement.value.customerName || undefined,
      customer_address: settlement.value.customerAddress || undefined,
      customer_phone: settlement.value.customerPhone || undefined,
      remark: settlement.value.remark || undefined,
      store_id: userStore.effectiveStoreId || undefined,
    })

    ElMessage.success('收款成功')

    const now = new Date()
    lastSaleData.value = {
      storeName: storeInfo.value.name,
      storeAddress: storeInfo.value.address,
      storePhone: storeInfo.value.phone,
      orderNo: sale.order_no,
      createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
      cashier: userStore.userInfo?.realName || '',
      customerName: settlement.value.customerName || undefined,
      customerAddress: settlement.value.customerAddress || undefined,
      customerPhone: settlement.value.customerPhone || undefined,
      totalAmount: totalAmount.value,
      paidAmount: settlement.value.paidAmount,
      changeAmount: changeAmount.value,
      remark: settlement.value.remark || '',
      items: cartItems.value.map(i => ({
        skuId: i.modelId,
        modelName: `${i.brandName} ${i.modelName} - ${i.color}/${i.storage}`,
        imei: i.imei,
        imei2: i.imei2,
        snCode: i.snCode,
        quantity: 1,
        price: i.price,
      })),
    }

    printReceiptRef.value?.open()
    resetAll()
  } catch {
    // handled by interceptor
  } finally {
    submitLoading.value = false
  }
}

function resetAll() {
  cartItems.value = []
  settlement.value = { paidAmount: 0, customerName: '', customerAddress: '', customerPhone: '', remark: '' }
  paidAmountAuto.value = true
  scanInput.value = ''
  matchedItem.value = null
  matchedPrice.value = 0
  queried.value = false
  nextTick(() => imeiInputRef.value?.focus())
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
  --pbm-green: #22c55e;
  --pbm-green-dim: rgba(34,197,94,0.12);
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
  overflow-y: auto;
  padding: 20px 24px;
  gap: 16px;
}

.pbm-section-card {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: 6px;
  padding: 20px;
  flex-shrink: 0;
}
.pbm-section-card h3 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--pbm-text);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--pbm-border);
  display: flex;
  align-items: center;
  gap: 8px;
}
.pbm-section-count {
  font-size: 12px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
  font-weight: 400;
}

.pbm-section-desc {
  font-size: 12px;
  color: var(--pbm-text-dim);
  margin: -10px 0 14px;
}

.pbm-scan-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.pbm-scan-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--pbm-bg);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  min-width: 320px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pbm-scan-input-wrapper:focus-within {
  border-color: var(--pbm-accent);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow);
}
.pbm-scan-icon { color: var(--pbm-text-dim); flex-shrink: 0; }
.pbm-scan-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--pbm-text);
  font-family: var(--pbm-mono);
}
.pbm-scan-input::placeholder {
  color: rgba(138,127,114,0.4);
  font-family: var(--pbm-font);
}

.pbm-matched-card {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: var(--pbm-radius);
}
.pbm-scanning-hint {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
  border-radius: var(--pbm-radius);
  font-size: 13px;
  color: var(--pbm-text-dim);
}
.pbm-spinner {
  animation: pbm-spin 0.8s linear infinite;
}
.pbm-matched-info { flex: 1; }
.pbm-matched-name {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.pbm-matched-imei {
  font-size: 12px;
  font-family: var(--pbm-mono);
  color: var(--pbm-text-dim);
}
.pbm-matched-badge {
  flex-shrink: 0;
  padding: 4px 14px;
  background: rgba(34,197,94,0.12);
  color: #16a34a;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--pbm-mono);
}

.pbm-table-wrapper {
  margin-bottom: 4px;
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
.pbm-cell-info { font-family: var(--pbm-mono); font-size: 12px; color: var(--pbm-text); }
.pbm-cell-missing { cursor: pointer; }
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

.pbm-empty-hint {
  text-align: center;
  padding: 24px;
  color: var(--pbm-text-dim);
  font-size: 13px;
}

.pbm-settlement-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.pbm-settlement-items {
  flex: 1;
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  padding: 12px 16px;
  min-height: 60px;
  background: var(--pbm-bg);
}
.pbm-settlement-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--pbm-border);
}
.pbm-settlement-item:last-child { border-bottom: none; }
.pbm-settlement-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pbm-settlement-item-name { font-size: 13px; }
.pbm-settlement-item-imei { font-size: 11px; font-family: var(--pbm-mono); color: var(--pbm-text-dim); }
.pbm-settlement-item-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--pbm-red);
  font-family: var(--pbm-mono);
}
.pbm-settlement-form { width: 320px; flex-shrink: 0; }
.pbm-amount-total {
  font-size: 20px;
  font-weight: 700;
  color: var(--pbm-red);
  font-family: var(--pbm-mono);
}
.pbm-change-amount {
  font-size: 16px;
  font-weight: 600;
  color: var(--pbm-green);
  font-family: var(--pbm-mono);
}

.pbm-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 0;
}

.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }

@keyframes pbm-spin {
  to { transform: rotate(360deg); }
}
</style>

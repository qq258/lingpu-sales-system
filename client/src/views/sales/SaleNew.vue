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
        <h3>选择商品</h3>
        <div class="pbm-search-row">
          <el-select v-model="selectedBrandId" placeholder="选择品牌" filterable clearable style="width:180px;" @change="onBrandChange">
            <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
          <el-select v-model="selectedModelId" placeholder="选择型号" filterable clearable style="width:220px;" :disabled="!selectedBrandId">
            <el-option v-for="m in models" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <button class="pbm-btn-accent" :disabled="!selectedModelId || searching" @click="handleQuery">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>{{ searching ? '查询中...' : '查询' }}</span>
          </button>
        </div>

        <div v-if="skuResults.length > 0" class="pbm-sku-results">
          <div class="pbm-sku-result-header">
            <span class="pbm-section-label">库存列表（{{ skuResults.length }} 个配置）</span>
          </div>
          <div class="pbm-table-wrapper pbm-table-wrapper--compact">
            <el-table :data="skuResults" stripe size="small" max-height="280">
              <el-table-column label="商品" min-width="180">
                <template #default="{ row }">
                  <span class="pbm-tag-brand">{{ row.brandName }}</span>
                  {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
                </template>
              </el-table-column>
              <el-table-column label="售价" width="90" align="center">
                <template #default="{ row }">¥{{ row.salePrice?.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="剩余库存" width="100" align="center">
                <template #default="{ row }">
                  <span class="pbm-qty-badge" :class="{
                    'pbm-qty-badge--danger': row.stock <= 0,
                    'pbm-qty-badge--warn': row.stock > 0 && row.stock <= 5,
                    'pbm-qty-badge--ok': row.stock > 5
                  }">{{ row.stock }}</span>
                </template>
              </el-table-column>
              <el-table-column label="购买数量" width="130">
                <template #default="{ row }">
                  <el-input-number v-model="row.buyQty" :min="1" :max="Math.max(row.stock, 1)" size="small" controls-position="right" style="width:110px;" />
                </template>
              </el-table-column>
              <el-table-column label="" width="100" fixed="right">
                <template #default="{ row }">
                  <button class="pbm-btn-accent pbm-btn-accent--sm" :disabled="row.stock <= 0 || row.buyQty <= 0" @click="addToCart(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>加入购物车</span>
                  </button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <div v-if="skuResults.length === 0 && queried" class="pbm-empty-hint">该型号暂无SKU或库存为空</div>
      </div>

      <div class="pbm-section-card">
        <h3>购物车 <span v-if="cartItems.length" class="pbm-section-count">{{ cartItems.length }} 件商品</span></h3>
        <div class="pbm-table-wrapper">
          <el-table :data="cartItems" border stripe max-height="360" size="small">
            <el-table-column type="index" label="#" width="44" />
            <el-table-column label="商品" min-width="180">
              <template #default="{ row }">
                <span class="pbm-tag-brand">{{ row.brandName }}</span>
                {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
              </template>
            </el-table-column>
            <el-table-column label="单价" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="2" :step="100" size="small" controls-position="right" style="width:120px;" />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="140">
              <template #default="{ row, $index }">
                <div class="quantity-control">
                  <button class="pbm-btn-plain pbm-btn-plain--xs" :disabled="row.quantity <= 1" @click="row.quantity--">-</button>
                  <span class="quantity-value">{{ row.quantity }}</span>
                  <button class="pbm-btn-plain pbm-btn-plain--xs" @click="row.quantity++">+</button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="110" align="center">
              <template #default="{ row }">
                <span class="pbm-amount-text">¥{{ (row.price * row.quantity).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="" width="60" fixed="right">
              <template #default="{ row, $index }">
                <div class="pbm-cell-actions">
                  <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="removeCartItem($index)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-if="cartItems.length === 0" class="pbm-empty-hint">购物车为空，请在上方选择商品后点击「加入购物车」</div>
      </div>

      <div class="pbm-section-card">
        <h3>结算信息</h3>
        <div class="pbm-settlement-layout">
          <div class="pbm-settlement-items">
            <div class="pbm-settlement-item" v-for="(item, i) in cartItems" :key="i">
              <div class="pbm-settlement-item-info">
                <span class="pbm-tag-brand">{{ item.brandName }}</span>
                <span class="pbm-settlement-item-name">{{ item.modelName }} - {{ item.color }} / {{ item.storage }}</span>
              </div>
              <div class="pbm-settlement-item-qty">x{{ item.quantity }}</div>
              <div class="pbm-settlement-item-price">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
            </div>
            <div v-if="cartItems.length === 0" class="pbm-empty-hint" style="padding:12px 0;">
              暂无商品，请先添加
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
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getBrands, getModels } from '@/api/product'
import { getInventoryByModel } from '@/api/inventory'
import { createSale } from '@/api/sales'
import PrintReceipt from '@/components/PrintReceipt.vue'

const userStore = useUserStore()

const brands = ref<any[]>([])
const models = ref<any[]>([])
const selectedBrandId = ref<number | null>(null)
const selectedModelId = ref<number | null>(null)
const skuResults = ref<any[]>([])
const searching = ref(false)
const queried = ref(false)

const submitLoading = ref(false)
const printReceiptRef = ref()

const cartItems = ref<Array<{
  skuId: number
  brandName: string
  modelName: string
  color: string
  storage: string
  price: number
  quantity: number
}>>([])

const settlement = ref({
  paidAmount: 0,
  customerName: '',
  remark: '',
})

const paidAmountAuto = ref(true)
const lastSaleData = ref<any>(null)

const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
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

onMounted(async () => {
  try {
    brands.value = await getBrands()
  } catch {
    // ignore
  }
})

async function onBrandChange() {
  selectedModelId.value = null
  skuResults.value = []
  queried.value = false
  if (selectedBrandId.value) {
    try {
      models.value = await getModels(selectedBrandId.value)
    } catch {
      models.value = []
    }
  } else {
    models.value = []
  }
}

async function handleQuery() {
  if (!selectedModelId.value) return
  searching.value = true
  queried.value = true
  try {
    const result = await getInventoryByModel(selectedModelId.value, userStore.effectiveStoreId || undefined)
    skuResults.value = result.map((s: any) => ({
      ...s,
      buyQty: 1,
    }))
  } catch {
    skuResults.value = []
  } finally {
    searching.value = false
  }
}

function addToCart(sku: any) {
  const existing = cartItems.value.find(i => i.skuId === sku.id)
  if (existing) {
    existing.quantity += sku.buyQty
  } else {
    cartItems.value.push({
      skuId: sku.id,
      brandName: sku.brandName || '',
      modelName: sku.modelName || '',
      color: sku.color || '',
      storage: sku.storage || '',
      price: sku.salePrice || 0,
      quantity: sku.buyQty,
    })
  }
  ElMessage.success(`已添加「${sku.brandName} ${sku.modelName} - ${sku.color}/${sku.storage}」`)
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
        sku_id: i.skuId,
        quantity: i.quantity,
        unit_price: i.price,
      })),
      total_amount: totalAmount.value,
      actual_amount: settlement.value.paidAmount,
      customer_name: settlement.value.customerName || undefined,
      remark: settlement.value.remark || undefined,
      store_id: userStore.effectiveStoreId || undefined,
    })

    ElMessage.success('收款成功')

    const now = new Date()
    lastSaleData.value = {
      orderNo: sale.order_no,
      createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
      cashier: userStore.userInfo?.realName || '',
      customerName: settlement.value.customerName || undefined,
      totalAmount: totalAmount.value,
      paidAmount: settlement.value.paidAmount,
      changeAmount: changeAmount.value,
      remark: settlement.value.remark || '',
      items: cartItems.value.map(i => ({
        skuId: i.skuId,
        skuName: `${i.brandName} ${i.modelName} - ${i.color}/${i.storage}`,
        quantity: i.quantity,
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
  settlement.value = { paidAmount: 0, customerName: '', remark: '' }
  paidAmountAuto.value = true
  selectedBrandId.value = null
  selectedModelId.value = null
  models.value = []
  skuResults.value = []
  queried.value = false
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
.pbm-btn-accent--sm { padding: 5px 12px; font-size: 12px; gap: 4px; }

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
.pbm-btn-plain--xs { padding: 2px 8px; font-size: 12px; min-width: 28px; }
.pbm-btn-plain:disabled { opacity: 0.4; cursor: not-allowed; }

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

.pbm-search-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pbm-sku-results {
  margin-top: 16px;
}
.pbm-sku-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.pbm-section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--pbm-text-dim);
}

.pbm-table-wrapper {
  margin-bottom: 4px;
}
.pbm-table-wrapper--compact {
  margin-bottom: 0;
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

.pbm-empty-hint {
  text-align: center;
  padding: 24px;
  color: var(--pbm-text-dim);
  font-size: 13px;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}
.quantity-value {
  font-size: 15px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
  color: var(--pbm-text);
}
.pbm-amount-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--pbm-red);
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
  background: #faf8f6;
}
.pbm-settlement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--pbm-border);
}
.pbm-settlement-item:last-child {
  border-bottom: none;
}
.pbm-settlement-item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 13px;
  color: var(--pbm-text);
}
.pbm-settlement-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pbm-settlement-item-qty {
  font-size: 13px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
  white-space: nowrap;
}
.pbm-settlement-item-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--pbm-red);
  white-space: nowrap;
  min-width: 80px;
  text-align: right;
}
.pbm-settlement-form {
  width: 340px;
  flex-shrink: 0;
}
.pbm-amount-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--pbm-text);
}
.pbm-change-amount {
  color: #2e7d32;
  font-size: 18px;
  font-weight: 700;
}
.pbm-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 0 4px;
}

:deep(.el-select__wrapper) {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  box-shadow: none;
  border-radius: var(--pbm-radius);
  color: var(--pbm-text);
  font-size: 13px;
  min-height: 34px;
}
:deep(.el-select__wrapper:hover) { border-color: var(--pbm-text-dim); }
:deep(.el-select__wrapper.is-focus) { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
:deep(.el-select-dropdown) { background: var(--pbm-surface); border: 1px solid var(--pbm-border); }
:deep(.el-select-dropdown__item) { color: var(--pbm-text); }
:deep(.el-select-dropdown__item.hover) { background: var(--pbm-surface-hover); }
:deep(.el-select-dropdown__item.selected) { color: var(--pbm-accent); background: var(--pbm-accent-glow); font-weight: 600; }

:deep(.el-form-item__label) { color: var(--pbm-text-dim); font-size: 13px; }
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: #f5f0eb;
  border: 1px solid var(--pbm-border);
  box-shadow: none;
  border-radius: var(--pbm-radius);
  color: var(--pbm-text);
}
:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) { border-color: var(--pbm-text-dim); }
:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
:deep(.el-input__inner) { color: var(--pbm-text); }
:deep(.el-input__inner::placeholder) { color: rgba(138,127,114,0.4); }
:deep(.el-input-number__increase),
:deep(.el-input-number__decrease) { background: #f0ebe5; color: var(--pbm-text-dim); border-color: var(--pbm-border); }

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

.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

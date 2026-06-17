<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">销售开单</h1>
      <span class="title-line"></span>
    </div>

    <!-- 销售类型切换 -->
    <div class="glass" style="padding:16px 22px;border-radius:var(--radius);margin-bottom:16px;">
      <div class="sale-type-row">
        <span class="sale-type-label">销售类型</span>
        <label :class="['sale-type-radio', { active: saleType === 'normal' }]" @click="switchType('normal')">
          <span class="radio-dot"></span> 普通销售
        </label>
        <label :class="['sale-type-radio', { active: saleType === 'no-stock' }]" @click="switchType('no-stock')">
          <span class="radio-dot"></span> 无库存销售
        </label>
      </div>
    </div>

    <!-- 普通销售：扫码 IMEI -->
    <div v-if="saleType === 'normal'" class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <h3 class="card-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
        扫描 IMEI 码
      </h3>
      <div class="scan-row">
        <div class="scan-input-wrap">
          <input ref="scanRef" v-model="scanInput" class="scan-input" placeholder="扫码枪扫描或输入 IMEI 后按回车" @keyup.enter="handleScan" />
        </div>
      </div>
      <div v-if="scanning" class="scan-status"><span class="spinner"></span> 正在查询...</div>
      <div v-if="scanError" class="scan-error">{{ scanError }}</div>
    </div>

    <!-- 无库存销售：品牌型号搜索 + IMEI 录入 -->
    <div v-if="saleType === 'no-stock'" class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <h3 class="card-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><path d="M12 2a10 10 0 1 0 10 10"/><circle cx="12" cy="12" r="10"/></svg>
        品牌型号
      </h3>
      <div class="brand-search-wrap">
        <input
          ref="brandInputRef"
          v-model="brandInput"
          class="scan-input"
          placeholder="搜索或输入品牌型号"
          @input="onBrandInput"
          @keydown="onBrandKeydown"
          @keyup.enter="onBrandEnter"
        />
        <!-- 下拉匹配列表 -->
        <div v-if="brandSuggestions.length > 0 && brandDropdownOpen" class="brand-dropdown">
          <div
            v-for="(m, idx) in brandSuggestions"
            :key="idx"
            :class="['brand-dropdown-item', { active: brandHighlightIdx === idx }]"
            @click="selectBrandSuggestion(m)"
            @mouseenter="brandHighlightIdx = idx"
          >
            <span class="brand-dd-name">{{ m.brand?.name }} {{ m.name }}</span>
            <span class="brand-dd-spec">{{ [m.color, [m.ram, m.rom].filter(Boolean).join('/')].filter(Boolean).join(' · ') }}</span>
            <span class="brand-dd-price">¥{{ (m.sale_price || 0).toFixed(2) }}</span>
          </div>
          <div v-if="brandInput.trim() && !brandExactMatch" class="brand-dropdown-empty">
            <span>未找到匹配项，将保存为新品牌型号</span>
            <button class="brand-save-btn" @click.stop="openSaveBrandFromSearch">保存</button>
          </div>
        </div>
        <!-- 已选品牌型号标签 -->
        <div v-if="selectedModel" class="brand-selected-tag">
          <span>{{ selectedModel.brand?.name }} {{ selectedModel.name }} - {{ selectedModel.color || '' }} {{ selectedModel.ram || '' }}{{ selectedModel.rom ? '/' + selectedModel.rom : '' }}</span>
          <button class="brand-selected-clear" @click="clearSelectedModel">&times;</button>
        </div>
      </div>

      <!-- IMEI 录入区 -->
      <div v-if="selectedModel || (brandInput.trim() && !brandSuggestions.length && !brandSearching)" class="imei-entry-section" style="margin-top:16px;">
        <div class="imei-entry-row">
          <span class="settle-label">售出价格</span>
          <el-input-number v-model="noStockPrice" :min="0" :precision="2" size="large" controls-position="right" style="width:200px;" />
        </div>
        <div class="imei-entry-row" style="margin-top:12px;">
          <span class="settle-label">IMEI1</span>
          <input ref="imei1Ref" v-model="noStockImei1" class="imei-entry-input" placeholder="扫码或输入 IMEI1" @keyup.enter="focusImei2" />
        </div>
        <div class="imei-entry-row">
          <span class="settle-label">IMEI2</span>
          <input ref="imei2Ref" v-model="noStockImei2" class="imei-entry-input" placeholder="扫码或输入 IMEI2（可选）" @keyup.enter="focusSn" />
        </div>
        <div class="imei-entry-row">
          <span class="settle-label">S/N</span>
          <input ref="snRef" v-model="noStockSn" class="imei-entry-input" placeholder="扫码或输入 S/N 码（可选）" @keyup.enter="addNoStockItem" />
        </div>
        <button class="imei-add-btn" @click="addNoStockItem">添加至购物车</button>
      </div>
    </div>

    <div class="section-header">
      <span class="section-title">已选商品</span>
      <span v-if="cart.length" class="section-badge">{{ cart.length }} 件</span>
    </div>

    <div v-if="cart.length" class="cart-list">
      <CartItemCard v-for="(item, i) in cart" :key="i" :item="item" @remove="cart.splice(i, 1)" />
    </div>
    <div v-else class="empty-hint" style="margin:20px 0;">购物车为空，请扫码添加商品</div>

    <div v-if="cart.length" class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <div class="total-row">
        <span class="total-label">合计</span>
        <span class="total-value">¥{{ totalAmount.toFixed(2) }}</span>
      </div>

      <div class="settle-row">
        <span class="settle-label">收款金额</span>
        <el-input-number v-model="paidAmount" :min="0" :precision="2" size="large" controls-position="right" style="width:200px;" />
      </div>

      <div class="settle-row">
        <span class="settle-label">找零</span>
        <span :class="['change-value', changeAmount < 0 ? 'change-err' : '']">
          ¥{{ Math.abs(changeAmount).toFixed(2) }}{{ changeAmount < 0 ? ' (不足)' : '' }}
        </span>
      </div>

      <div class="customer-row">
        <div class="customer-field">
          <span class="settle-label">客户姓名</span>
          <el-input v-model="customerName" placeholder="选填" size="large" style="width:200px;" />
        </div>
        <div class="customer-field">
          <span class="settle-label">客户电话</span>
          <el-input v-model="customerPhone" placeholder="选填" size="large" style="width:200px;" />
        </div>
      </div>
      <div class="customer-row" style="margin-top:10px;">
        <div class="customer-field">
          <span class="settle-label">客户地址</span>
          <el-input v-model="customerAddress" placeholder="选填" size="large" style="width:260px;" />
        </div>
        <div class="customer-field">
          <span class="settle-label">备注</span>
          <el-input v-model="remark" placeholder="选填" size="large" style="width:260px;" />
        </div>
      </div>
    </div>

    <button v-if="cart.length" class="pay-btn" @click="handlePay">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      {{ saleType === 'no-stock' ? '确认收款（无库存）' : '确认收款' }}  ¥{{ totalAmount.toFixed(2) }}
    </button>

    <ConfirmDialog
      :visible="showConfirm" title="确认收款"
      :message="`共 ${cart.length} 件商品，应收 ¥${totalAmount.toFixed(2)}，实收 ¥${paidAmount.toFixed(2)}`"
      type="success" confirm-text="确认收款" cancel-text="再想想"
      @confirm="confirmPay" @cancel="showConfirm = false"
    />

    <SaveBrandDialog
      :visible="showSaveBrand"
      :items="pendingBrandItems"
      @confirm="onBrandSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { scanImeiForSale } from '@/api/inventory'
import { createSale, createNoStockSale } from '@/api/sales'
import { getModels } from '@/api/product'
import CartItemCard from '@/components/CartItemCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SaveBrandDialog from '@/components/SaveBrandDialog.vue'
import type { BrandModelItem } from '@/components/SaveBrandDialog.vue'

const userStore = useUserStore()

// -- 销售类型 --
const saleType = ref<'normal' | 'no-stock'>('normal')

// -- 普通销售 --
const scanRef = ref<HTMLInputElement>()
const scanInput = ref('')
const scanning = ref(false)
const scanError = ref('')

// -- 无库存销售 --
const brandInputRef = ref<HTMLInputElement>()
const brandInput = ref('')
const brandSearching = ref(false)
const brandSuggestions = ref<any[]>([])
const brandDropdownOpen = ref(false)
const brandHighlightIdx = ref(-1)
const brandExactMatch = ref(false)
const selectedModel = ref<any>(null)
const noStockPrice = ref(0)
const noStockImei1 = ref('')
const noStockImei2 = ref('')
const noStockSn = ref('')
const imei1Ref = ref<HTMLInputElement>()
const imei2Ref = ref<HTMLInputElement>()
const snRef = ref<HTMLInputElement>()
const brandSaveMarked = ref<Set<string>>(new Set())

// -- 购物车 --
interface CartItem {
  brandName: string
  modelName: string
  color: string
  storage: string
  imei: string
  imei2: string | null
  snCode: string | null
  price: number
  modelId?: number | null
  rawText?: string
  brandText?: string
  modelText?: string
}

const cart = ref<CartItem[]>([])
const paidAmount = ref(0)
const customerName = ref('')
const customerPhone = ref('')
const customerAddress = ref('')
const remark = ref('')
const showConfirm = ref(false)

// -- 品牌型号保存 --
const showSaveBrand = ref(false)
const pendingBrandItems = ref<BrandModelItem[]>([])

const totalAmount = computed(() => cart.value.reduce((s, i) => s + (i.price || 0), 0))
const changeAmount = computed(() => paidAmount.value - totalAmount.value)

onMounted(() => {
  nextTick(() => {
    if (saleType.value === 'normal') {
      scanRef.value?.focus()
    }
  })
})

// -- 销售类型切换 --
function switchType(type: 'normal' | 'no-stock') {
  if (type === saleType.value) return
  if (cart.value.length > 0) {
    ElMessageBox.confirm('切换销售类型将清空购物车，是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      doSwitch(type)
    }).catch(() => {})
  } else {
    doSwitch(type)
  }
}

function doSwitch(type: 'normal' | 'no-stock') {
  saleType.value = type
  resetAll()
  nextTick(() => {
    if (type === 'normal') {
      scanRef.value?.focus()
    } else {
      brandInputRef.value?.focus()
    }
  })
}

// -- 普通销售：扫码 --
async function handleScan() {
  const imei = scanInput.value.trim()
  if (!imei) return
  scanning.value = true
  scanError.value = ''
  try {
    const item = await scanImeiForSale(imei, userStore.effectiveStoreId || undefined)
    if (!item) {
      promptSwitchToNoStock(imei)
      return
    }
    if (item.isSold || item.status === 'sold') {
      scanError.value = '该手机已售出'
      return
    }
    if (cart.value.some(c => c.imei === imei)) {
      scanError.value = '已在购物车中'
      return
    }
    cart.value.push({
      brandName: item.brandName || '',
      modelName: item.modelName || '',
      color: item.color || '',
      storage: item.storage || '',
      imei: item.imei,
      imei2: item.imei2,
      snCode: null,
      price: item.salePrice || item.model?.salePrice || 0,
    })
    paidAmount.value = totalAmount.value
    scanInput.value = ''
    scanError.value = ''
    nextTick(() => scanRef.value?.focus())
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 404) {
      promptSwitchToNoStock(imei)
    } else {
      scanError.value = e?.response?.data?.message || e?.message || '查询失败'
    }
  } finally {
    scanning.value = false
  }
}

function promptSwitchToNoStock(imei: string) {
  ElMessageBox.confirm(
    `未找到 IMEI "${imei}" 的库存记录，是否切换到无库存销售模式？`,
    '未匹配到库存',
    {
      confirmButtonText: '切换到无库存销售',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    saleType.value = 'no-stock'
    cart.value = []
    paidAmount.value = 0
    noStockImei1.value = imei
    nextTick(() => {
      brandInputRef.value?.focus()
    })
  }).catch(() => {
    scanInput.value = ''
    nextTick(() => scanRef.value?.focus())
  })
}

// -- 无库存销售：品牌型号搜索 --
let brandSearchTimer: ReturnType<typeof setTimeout> | null = null

async function onBrandInput() {
  if (brandSearchTimer) clearTimeout(brandSearchTimer)
  const val = brandInput.value.trim()
  if (!val) {
    brandSuggestions.value = []
    brandDropdownOpen.value = false
    selectedModel.value = null
    return
  }
  brandSearchTimer = setTimeout(async () => {
    brandSearching.value = true
    try {
      const models = await getModels(undefined, val)
      const filtered = models.filter((m: any) => {
        const fullName = `${m.brand?.name || ''} ${m.name}`.toLowerCase()
        return fullName.includes(val.toLowerCase())
      })
      brandSuggestions.value = filtered
      brandExactMatch.value = filtered.some((m: any) =>
        `${m.brand?.name} ${m.name}` === val
      )
      brandDropdownOpen.value = filtered.length > 0 || val.length > 0
      brandHighlightIdx.value = -1
    } catch {
      brandSuggestions.value = []
    } finally {
      brandSearching.value = false
    }
  }, 300)
}

function onBrandKeydown(e: KeyboardEvent) {
  if (!brandDropdownOpen.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    brandHighlightIdx.value = Math.min(brandHighlightIdx.value + 1, brandSuggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    brandHighlightIdx.value = Math.max(brandHighlightIdx.value - 1, -1)
  } else if (e.key === 'Enter' && brandHighlightIdx.value >= 0) {
    e.preventDefault()
    selectBrandSuggestion(brandSuggestions.value[brandHighlightIdx.value])
  }
}

function onBrandEnter() {
  if (brandHighlightIdx.value >= 0 && brandSuggestions.value[brandHighlightIdx.value]) {
    selectBrandSuggestion(brandSuggestions.value[brandHighlightIdx.value])
  } else if (brandInput.value.trim()) {
    brandDropdownOpen.value = false
    selectedModel.value = null
    noStockPrice.value = 0
    nextTick(() => imei1Ref.value?.focus())
  }
}

function selectBrandSuggestion(model: any) {
  selectedModel.value = model
  brandInput.value = `${model.brand?.name} ${model.name}`
  brandDropdownOpen.value = false
  noStockPrice.value = model.sale_price || 0
  nextTick(() => imei1Ref.value?.focus())
}

function clearSelectedModel() {
  selectedModel.value = null
  brandInput.value = ''
  brandSuggestions.value = []
  brandDropdownOpen.value = false
  nextTick(() => brandInputRef.value?.focus())
}

// -- 无库存销售：IMEI 焦点跳转 --
function focusImei2() {
  nextTick(() => imei2Ref.value?.focus())
}
function focusSn() {
  nextTick(() => snRef.value?.focus())
}

// -- 无库存销售：添加到购物车 --
function addNoStockItem() {
  if (!brandInput.value.trim()) {
    ElMessage.warning('请输入品牌型号')
    return
  }
  if (!noStockImei1.value.trim()) {
    ElMessage.warning('请输入 IMEI1')
    return
  }

  const rawText = brandInput.value.trim()
  const brand = selectedModel.value?.brand?.name || ''
  const modelName = selectedModel.value?.name || ''

  cart.value.push({
    brandName: brand || rawText,
    modelName: modelName || '',
    color: selectedModel.value?.color || '',
    storage: [selectedModel.value?.ram, selectedModel.value?.rom].filter(Boolean).join('/') || '',
    imei: noStockImei1.value.trim(),
    imei2: noStockImei2.value.trim() || null,
    snCode: noStockSn.value.trim() || null,
    price: noStockPrice.value,
    modelId: selectedModel.value?.id || null,
    rawText: rawText,
    brandText: brand,
    modelText: modelName,
  })

  paidAmount.value = totalAmount.value

  // 清空录入区
  noStockImei1.value = ''
  noStockImei2.value = ''
  noStockSn.value = ''
  noStockPrice.value = selectedModel.value?.sale_price || 0
  if (!selectedModel.value) {
    brandInput.value = ''
  }
  nextTick(() => imei1Ref.value?.focus())
}

// -- 提前保存品牌型号 --
async function openSaveBrandFromSearch() {
  if (!brandInput.value.trim()) return
  const rawText = brandInput.value.trim()
  const spaceIdx = rawText.indexOf(' ')
  const brand = spaceIdx > 0 ? rawText.slice(0, spaceIdx) : rawText
  const model = spaceIdx > 0 ? rawText.slice(spaceIdx + 1) : ''
  pendingBrandItems.value = [{ rawText, brand, model }]
  showSaveBrand.value = true
}

// -- 确认收款 --
function handlePay() {
  if (paidAmount.value < totalAmount.value) {
    ElMessage.warning('收款金额不足')
    return
  }
  showConfirm.value = true
}

async function confirmPay() {
  showConfirm.value = false
  if (saleType.value === 'normal') {
    await doNormalPay()
  } else {
    await doNoStockPay()
  }
}

async function doNormalPay() {
  try {
    await createSale({
      items: cart.value.map(i => ({ imei: i.imei, unit_price: i.price })),
      actual_amount: totalAmount.value,
      customer_name: customerName.value || undefined,
      customer_phone: customerPhone.value || undefined,
    })
    ElMessage.success({ message: `开单成功！共 ${cart.value.length} 件 ¥${totalAmount.value.toFixed(2)}`, duration: 4000 })
    resetAll()
    nextTick(() => scanRef.value?.focus())
  } catch (e: any) {
    ElMessage.error(e?.message || '开单失败')
  }
}

// -- 无库存销售：确认收款 --
async function doNoStockPay() {
  const toSave: BrandModelItem[] = []
  for (const item of cart.value) {
    if (item.modelId) continue
    const rawText = item.rawText || `${item.brandName} ${item.modelName}`.trim()
    if (brandSaveMarked.value.has(rawText)) continue
    const spaceIdx = rawText.indexOf(' ')
    const brand = spaceIdx > 0 ? rawText.slice(0, spaceIdx) : rawText
    const model = spaceIdx > 0 ? rawText.slice(spaceIdx + 1) : ''
    toSave.push({ rawText, brand, model })
  }

  if (toSave.length > 0) {
    pendingBrandItems.value = toSave
    showSaveBrand.value = true
    return
  }

  await submitNoStockSale()
}

async function onBrandSaved(savedItems: BrandModelItem[]) {
  showSaveBrand.value = false
  for (const item of savedItems) {
    if (!item.brand.trim() || !item.model.trim()) continue
    brandSaveMarked.value.add(item.rawText)
  }
  await submitNoStockSale()
}

async function submitNoStockSale() {
  try {
    await createNoStockSale({
      items: cart.value.map(i => ({
        brand_name: i.brandName,
        model_name: i.modelName || i.brandName,
        model_id: i.modelId || null,
        color: i.color || '',
        storage: i.storage || '',
        imei: i.imei,
        imei2: i.imei2 || null,
        sn_code: i.snCode || null,
        unit_price: i.price,
      })),
      actual_amount: totalAmount.value,
      customer_name: customerName.value || undefined,
      customer_phone: customerPhone.value || undefined,
      customer_address: customerAddress.value || undefined,
      remark: remark.value || undefined,
    })
    ElMessage.success({ message: `无库存开单成功！共 ${cart.value.length} 件 ¥${totalAmount.value.toFixed(2)}`, duration: 4000 })
    resetAll()
    nextTick(() => brandInputRef.value?.focus())
  } catch (e: any) {
    ElMessage.error(e?.message || '开单失败')
  }
}

// -- 重置 --
function resetAll() {
  cart.value = []
  paidAmount.value = 0
  customerName.value = ''
  customerPhone.value = ''
  customerAddress.value = ''
  remark.value = ''
  scanInput.value = ''
  scanError.value = ''
  brandInput.value = ''
  brandSuggestions.value = []
  brandDropdownOpen.value = false
  selectedModel.value = null
  noStockPrice.value = 0
  noStockImei1.value = ''
  noStockImei2.value = ''
  noStockSn.value = ''
  brandSaveMarked.value = new Set()
}
</script>

<style scoped>
.card-section-title { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; color: var(--text); margin: 0 0 16px; }
.scan-row { display: flex; gap: 12px; }
.scan-input-wrap { flex: 1; }
.scan-input { width: 100%; height: 48px; padding: 0 16px; font-size: 17px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); box-sizing: border-box; }
.scan-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.scan-input::placeholder { color: var(--text-tertiary); font-size: 15px; }
.scan-status { margin-top: 12px; font-size: 14px; color: var(--text-tertiary); display: flex; align-items: center; gap: 8px; }
.scan-error { margin-top: 12px; font-size: 14px; color: var(--danger); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.section-title { font-size: 17px; font-weight: 600; color: var(--text); }
.section-badge { background: var(--primary-light); color: var(--primary); font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 10px; }
.cart-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.total-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 18px; border-bottom: 1px solid var(--border); margin-bottom: 18px; }
.total-label { font-size: 18px; font-weight: 600; color: var(--text); }
.total-value { font-size: 32px; font-weight: 700; color: var(--text); font-family: 'SF Mono', monospace; letter-spacing: -1px; }
.settle-row { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
.settle-label { font-size: 14px; color: var(--text-secondary); min-width: 80px; }
.change-value { font-size: 20px; font-weight: 700; font-family: monospace; color: var(--success); }
.change-err { color: var(--danger); font-size: 16px; }
.customer-row { display: flex; gap: 24px; flex-wrap: wrap; }
.customer-field { display: flex; align-items: center; gap: 12px; }
.pay-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 60px; border: none; border-radius: var(--radius); background: var(--success); color: #fff; font-size: 20px; font-weight: 700; cursor: pointer; font-family: inherit; transition: var(--transition); }
.pay-btn:hover { filter: brightness(0.92); box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
:deep(.el-input-number) { --el-component-size: 42px; }
:deep(.el-input) { --el-component-size: 42px; }
:deep(.el-input__inner) { font-size: 16px; }

/* 销售类型切换 */
.sale-type-row { display: flex; align-items: center; gap: 16px; }
.sale-type-label { font-size: 14px; color: var(--text-secondary); font-weight: 500; min-width: 60px; }
.sale-type-radio { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; color: var(--text-secondary); padding: 6px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); transition: var(--transition); user-select: none; }
.sale-type-radio:hover { border-color: var(--primary); color: var(--text); }
.sale-type-radio.active { border-color: var(--primary); color: var(--primary); background: var(--primary-light); font-weight: 600; }
.radio-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); display: inline-block; transition: var(--transition); }
.sale-type-radio.active .radio-dot { border-color: var(--primary); border-width: 5px; }

/* 品牌型号搜索 */
.brand-search-wrap { position: relative; }
.brand-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-sm); max-height: 240px; overflow-y: auto; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.brand-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background 0.1s; }
.brand-dropdown-item:hover,
.brand-dropdown-item.active { background: var(--primary-light); }
.brand-dd-name { flex: 1; font-size: 14px; font-weight: 500; color: var(--text); }
.brand-dd-spec { font-size: 12px; color: var(--text-tertiary); }
.brand-dd-price { font-size: 14px; font-weight: 600; color: var(--text); font-family: monospace; }
.brand-dropdown-empty { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; font-size: 13px; color: var(--text-tertiary); border-top: 1px solid var(--border); }
.brand-save-btn { padding: 4px 12px; font-size: 12px; border: 1px solid #2563EB; border-radius: var(--radius-sm); background: #fff; color: #2563EB; cursor: pointer; font-family: inherit; white-space: nowrap; }
.brand-save-btn:hover { background: var(--primary-light); }
.brand-selected-tag { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 14px; background: var(--primary-light); border-radius: var(--radius-sm); font-size: 14px; color: var(--primary); font-weight: 500; }
.brand-selected-clear { width: 20px; height: 20px; border: none; border-radius: 50%; background: rgba(37,99,235,0.15); color: #2563EB; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; line-height: 1; }

/* IMEI 录入区 */
.imei-entry-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.imei-entry-input { flex: 1; max-width: 300px; height: 42px; padding: 0 14px; font-size: 15px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: monospace; background: #fff; box-sizing: border-box; }
.imei-entry-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
.imei-add-btn { margin-top: 8px; padding: 10px 28px; border: none; border-radius: var(--radius-sm); background: #2563EB; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
.imei-add-btn:hover { filter: brightness(0.92); }
</style>

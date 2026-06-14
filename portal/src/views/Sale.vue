<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">销售开单</h1>
      <span class="title-line"></span>
    </div>

    <div class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <h3 class="card-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
        扫描 IMEI 码
      </h3>
      <div class="scan-row">
        <div class="scan-input-wrap">
          <input ref="scanRef" v-model="scanInput" class="scan-input" placeholder="扫码枪扫描或输入 IMEI 后按回车" @keyup.enter="handleScan" />
        </div>
      </div>
      <div v-if="scanning" class="scan-status">
        <span class="spinner"></span> 正在查询...
      </div>
      <div v-if="scanError" class="scan-error">{{ scanError }}</div>
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
    </div>

    <button v-if="cart.length" class="pay-btn" @click="showConfirm = true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      确认收款  ¥{{ totalAmount.toFixed(2) }}
    </button>

    <ConfirmDialog
      :visible="showConfirm" title="确认收款"
      :message="`共 ${cart.length} 件商品，应收 ¥${totalAmount.toFixed(2)}，实收 ¥${paidAmount.toFixed(2)}`"
      type="success" confirm-text="确认收款" cancel-text="再想想"
      @confirm="handlePay" @cancel="showConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { scanImeiForSale } from '@/api/inventory'
import { createSale } from '@/api/sales'
import CartItemCard from '@/components/CartItemCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const userStore = useUserStore()
const scanRef = ref<HTMLInputElement>()
const scanInput = ref('')
const scanning = ref(false)
const scanError = ref('')
const cart = ref<Array<{ brandName: string; modelName: string; color: string; storage: string; imei: string; imei2?: string; price: number }>>([])
const paidAmount = ref(0)
const customerName = ref('')
const customerPhone = ref('')
const showConfirm = ref(false)

const totalAmount = computed(() => cart.value.reduce((s, i) => s + (i.price || 0), 0))
const changeAmount = computed(() => paidAmount.value - totalAmount.value)

onMounted(() => { nextTick(() => scanRef.value?.focus()) })

async function handleScan() {
  const imei = scanInput.value.trim(); if (!imei) return
  scanning.value = true; scanError.value = ''
  try {
    const item = await scanImeiForSale(imei, userStore.effectiveStoreId || undefined)
    if (!item) { scanError.value = '未找到该 IMEI'; return }
    if (item.isSold || item.status === 'sold') { scanError.value = '该手机已售出'; return }
    if (cart.value.some(c => c.imei === imei)) { scanError.value = '已在购物车中'; return }
    cart.value.push({
      brandName: item.brandName || '', modelName: item.modelName || '',
      color: item.color || '', storage: item.storage || '',
      imei: item.imei, imei2: item.imei2, price: item.salePrice || item.model?.salePrice || 0,
    })
    paidAmount.value = totalAmount.value; scanInput.value = ''; scanError.value = ''
    nextTick(() => scanRef.value?.focus())
  } catch (e: any) { scanError.value = e?.message || '查询失败' }
  finally { scanning.value = false }
}

async function handlePay() {
  showConfirm.value = false
  try {
    await createSale({
      items: cart.value.map(i => ({ imei: i.imei, unit_price: i.price })),
      actual_amount: totalAmount.value,
      customer_name: customerName.value || undefined, customer_phone: customerPhone.value || undefined,
    })
    ElMessage.success({ message: `开单成功！共 ${cart.value.length} 件 ¥${totalAmount.value.toFixed(2)}`, duration: 4000 })
    cart.value = []; paidAmount.value = 0; customerName.value = ''; customerPhone.value = ''
    nextTick(() => scanRef.value?.focus())
  } catch (e: any) { ElMessage.error(e?.message || '开单失败') }
}
</script>

<style scoped>
.card-section-title { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; color: var(--text); margin: 0 0 16px; }
.scan-row { display: flex; gap: 12px; }
.scan-input-wrap { flex: 1; }
.scan-input { width: 100%; height: 48px; padding: 0 16px; font-size: 17px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
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
</style>

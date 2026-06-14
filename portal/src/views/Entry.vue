<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">采购入库</h1>
      <span class="title-line"></span>
    </div>

    <div class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <label class="field-label">供应商</label>
      <el-select v-model="supplierId" placeholder="请选择供应商" filterable size="large" style="width:100%;">
        <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
    </div>

    <div class="section-divider">添加手机</div>

    <div class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <div class="add-row">
        <el-select v-model="brandId" placeholder="品牌" filterable size="large" style="width:160px;" @change="onBrandChange">
          <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
        <el-select v-model="modelId" placeholder="型号" filterable size="large" style="width:260px;" :disabled="!brandId">
          <el-option v-for="m in models" :key="m.id" :label="`${m.name} ${m.color||''} ${m.ram||' '}/${m.rom||' '}`.trim()" :value="m.id" />
        </el-select>
        <div class="price-field">
          <span class="price-label">单价</span>
          <el-input-number v-model="unitPrice" :min="0" :precision="2" :step="100" size="large" controls-position="right" style="width:150px;" />
        </div>
      </div>
      <div class="imei-row">
        <div class="imei-input-wrap">
          <input ref="imeiRef" v-model="imeiInput" class="input-field" placeholder="扫码或输入 IMEI（必填）" />
        </div>
        <button class="action-btn" @click="handleAdd">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          添加
        </button>
      </div>
      <div class="extra-row">
        <div class="extra-field">
          <span class="extra-label">IMEI2</span>
          <input ref="imei2Ref" v-model="imei2Input" class="extra-input" placeholder="双卡 IMEI2（选填）" />
        </div>
        <div class="extra-field">
          <span class="extra-label">SN码</span>
          <input v-model="snCodeInput" class="extra-input" placeholder="序列号（选填）" />
        </div>
      </div>
    </div>

    <div class="section-divider">本次入库清单 ({{ items.length }} 台)</div>

    <div v-if="items.length" class="items-list">
      <div v-for="(item, i) in items" :key="i" class="item-row glass">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/></svg>
        <div class="item-info">
          <div class="item-name">{{ item.brandName }} {{ item.modelName }}</div>
          <div class="item-imei">{{ item.imei }}<template v-if="item.imei2"> / IMEI2: {{ item.imei2 }}</template><template v-if="item.snCode"> / SN: {{ item.snCode }}</template></div>
        </div>
        <span class="item-price">¥{{ item.unitPrice.toFixed(2) }}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        <button class="item-del" @click="items.splice(i, 1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div v-else class="empty-hint">尚未添加任何手机</div>

    <div v-if="items.length" class="summary-bar glass">
      <span>共 {{ items.length }} 台 · 合计 ¥{{ totalAmount.toFixed(2) }}</span>
    </div>

    <button v-if="items.length" class="confirm-btn" @click="showConfirm = true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      确认入库  {{ items.length }} 台 / ¥{{ totalAmount.toFixed(2) }}
    </button>

    <ConfirmDialog
      :visible="showConfirm" title="确认入库"
      :message="`共 ${items.length} 台手机，总金额 ¥${totalAmount.toFixed(2)}`"
      type="success" confirm-text="确认入库" cancel-text="再想想"
      @confirm="handleConfirm" @cancel="showConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getSuppliers, quickConfirmPurchaseEntry } from '@/api/purchase'
import { getBrands, getModels } from '@/api/product'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const userStore = useUserStore()
const imeiRef = ref<HTMLInputElement>()
const imei2Ref = ref<HTMLInputElement>()
const suppliers = ref<any[]>([])
const brands = ref<any[]>([])
const models = ref<any[]>([])
const supplierId = ref<number | null>(null)
const brandId = ref<number | null>(null)
const modelId = ref<number | null>(null)
const unitPrice = ref(0)
const imeiInput = ref('')
const imei2Input = ref('')
const snCodeInput = ref('')
const items = ref<Array<{ brandName: string; modelName: string; imei: string; imei2?: string; snCode?: string; unitPrice: number; modelId: number }>>([])
const showConfirm = ref(false)

const totalAmount = computed(() => items.value.reduce((s, i) => s + i.unitPrice, 0))

onMounted(async () => {
  try { suppliers.value = await getSuppliers() } catch {}
  try { brands.value = await getBrands() } catch {}
  nextTick(() => imeiRef.value?.focus())
})

async function onBrandChange() {
  modelId.value = null; unitPrice.value = 0
  if (!brandId.value) { models.value = []; return }
  try { models.value = await getModels(brandId.value) } catch { models.value = [] }
}

function handleAdd() {
  const imei = imeiInput.value.trim()
  if (!imei) { ElMessage.warning('请输入 IMEI'); return }
  if (!modelId.value) { ElMessage.warning('请选择品牌和型号'); return }
  const m = models.value.find((x: any) => x.id === modelId.value)
  if (!m) return
  if (items.value.some(i => i.imei === imei)) { ElMessage.warning('IMEI 已存在'); return }
  items.value.push({
    brandName: brands.value.find((b: any) => b.id === brandId.value)?.name || '',
    modelName: `${m.name} ${m.color || ''} ${m.ram||''}/${m.rom||''}`.trim(),
    imei, imei2: imei2Input.value.trim() || undefined, snCode: snCodeInput.value.trim() || undefined,
    unitPrice: unitPrice.value || m.salePrice || 0, modelId: modelId.value,
  })
  imeiInput.value = ''; imei2Input.value = ''; snCodeInput.value = ''
  nextTick(() => { imeiRef.value?.focus() })
}

async function handleConfirm() {
  showConfirm.value = false
  try {
    await quickConfirmPurchaseEntry({
      supplierId: supplierId.value, storeId: userStore.effectiveStoreId || undefined,
      items: items.value.map(i => ({ modelId: i.modelId, imei: i.imei, imei2: i.imei2, snCode: i.snCode, unitPrice: i.unitPrice })),
    })
    ElMessage.success({ message: `入库成功！共 ${items.value.length} 台`, duration: 3000 })
    items.value = []; supplierId.value = null; brandId.value = null; modelId.value = null
    unitPrice.value = 0; imeiInput.value = ''
    nextTick(() => imeiRef.value?.focus())
  } catch (e: any) { ElMessage.error(e?.message || '入库失败') }
}
</script>

<style scoped>
.field-label { display: block; font-size: 14px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px; }
.section-divider { text-align: center; font-size: 13px; color: var(--text-tertiary); margin: 20px 0; letter-spacing: 1.5px; position: relative; }
.section-divider::before, .section-divider::after { content: ''; position: absolute; top: 50%; width: 60px; height: 1px; background: var(--border); }
.section-divider::before { right: calc(50% + 50px); }
.section-divider::after { left: calc(50% + 50px); }
.add-row { display: flex; gap: 12px; align-items: flex-end; margin-bottom: 16px; flex-wrap: wrap; }
.price-field { display: flex; flex-direction: column; gap: 4px; }
.price-label { font-size: 13px; color: var(--text-tertiary); }
.imei-row { display: flex; gap: 12px; }
.imei-input-wrap { flex: 1; }
.input-field { width: 100%; height: 48px; padding: 0 16px; font-size: 17px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.input-field:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.input-field::placeholder { color: var(--text-tertiary); font-size: 15px; }
.extra-row { display: flex; gap: 12px; margin-top: 12px; }
.extra-field { display: flex; align-items: center; gap: 8px; flex: 1; }
.extra-label { font-size: 13px; color: var(--text-tertiary); white-space: nowrap; font-weight: 500; }
.extra-input { flex: 1; height: 42px; padding: 0 14px; font-size: 15px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.extra-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.extra-input::placeholder { color: var(--text-tertiary); font-size: 14px; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; height: 48px; padding: 0 24px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); flex-shrink: 0; }
.action-btn:hover { background: var(--primary-dark); }
.items-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.item-row { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: var(--radius); }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 16px; font-weight: 500; color: var(--text); }
.item-imei { font-size: 14px; color: var(--text-tertiary); font-family: monospace; margin-top: 2px; }
.item-price { font-size: 17px; font-weight: 600; color: var(--text); font-family: monospace; white-space: nowrap; }
.item-del { width: 34px; height: 34px; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(239,68,68,0.1); color: var(--danger); cursor: pointer; transition: var(--transition); }
.item-del:hover { background: var(--danger); color: #fff; }
.summary-bar { padding: 14px 20px; border-radius: var(--radius-sm); font-size: 17px; font-weight: 600; color: var(--text); text-align: right; margin-bottom: 20px; }
.confirm-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 56px; border: none; border-radius: var(--radius); background: var(--success); color: #fff; font-size: 20px; font-weight: 700; cursor: pointer; font-family: inherit; transition: var(--transition); }
.confirm-btn:hover { filter: brightness(0.92); box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
:deep(.el-select) { --el-component-size: 44px; }
:deep(.el-input-number) { --el-component-size: 44px; }
</style>

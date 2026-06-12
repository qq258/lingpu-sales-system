<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <button class="pbm-btn-back" @click="$emit('back')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 class="pbm-title">采购入库</h1>
        <span class="pbm-subtitle">New Entry</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-section-card">
        <h3>基本信息</h3>
        <el-form :model="form" label-width="100px">
          <el-form-item label="供应商" required>
            <el-select v-model="form.supplierId" placeholder="请选择供应商" filterable style="width: 300px;">
              <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选备注" style="width: 300px;" />
          </el-form-item>
        </el-form>
      </div>

      <div class="pbm-section-card">
        <h3>选择商品</h3>
        <SkuSelector ref="skuSelectorRef" mode="purchase" @select="onSkuSelect" @scan-error="onScanError" />
      </div>

      <div class="pbm-section-card">
        <div class="pbm-mode-toggle">
          <label class="pbm-radio-card" :class="{ active: entryMode === 'single' }">
            <input type="radio" v-model="entryMode" value="single" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <span>逐台录入</span>
          </label>
          <label class="pbm-radio-card" :class="{ active: entryMode === 'batch' }">
            <input type="radio" v-model="entryMode" value="batch" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="15" x2="13" y2="15"/></svg>
            <span>批量粘贴</span>
          </label>
        </div>
      </div>

      <div v-if="entryMode === 'single'" class="pbm-section-card">
        <h3>逐台录入</h3>
        <div class="pbm-entry-row">
          <div class="pbm-field">
            <label>IMEI</label>
            <div class="pbm-scan-input-wrapper">
              <svg class="pbm-scan-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
              <input
                ref="singleImeiRef"
                v-model="singleImei"
                class="pbm-scan-input"
                placeholder="扫码枪扫描或手动输入IMEI"
                @keyup.enter="handleSingleAdd"
              />
            </div>
          </div>
          <div class="pbm-field">
            <label>单价（元）</label>
            <el-input-number v-model="singleUnitPrice" :min="0" :precision="2" :step="100" :controls="false" placeholder="0.00" class="pbm-price-input" />
          </div>
          <button class="pbm-btn-accent pbm-btn-accent--sm" :disabled="!canAddSingle" @click="handleSingleAdd">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>添加</span>
          </button>
        </div>
        <div v-if="selectedSku" class="pbm-selected-sku-hint">
          <el-tag size="small" type="primary">{{ selectedSku.brandName }}</el-tag>
          {{ selectedSku.modelName }} - {{ selectedSku.color }} / {{ selectedSku.storage }}
        </div>
      </div>

      <div v-if="entryMode === 'batch'" class="pbm-section-card">
        <h3>批量粘贴</h3>
        <div class="pbm-field">
          <label>单价（元）</label>
          <el-input-number v-model="batchUnitPrice" :min="0" :precision="2" :step="100" :controls="false" placeholder="0.00" class="pbm-price-input" style="max-width: 200px;" />
        </div>
        <div class="pbm-field" style="margin-top: 14px;">
          <label>IMEI 列表（每行一个）</label>
          <textarea
            ref="batchImeiRef"
            v-model="batchImeiText"
            class="pbm-textarea"
            rows="6"
            placeholder="粘贴 IMEI，每行一个&#10;&#10;例如:&#10;861234567890101&#10;861234567890102&#10;861234567890103"
          ></textarea>
        </div>
        <div class="pbm-batch-footer">
          <span class="pbm-batch-count" :class="{ 'pbm-batch-count--ok': batchImeiLines > 0 }">
            {{ batchImeiLines }} 个 IMEI
          </span>
          <button class="pbm-btn-accent pbm-btn-accent--sm" :disabled="!canAddBatch" @click="handleBatchAdd">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>解析并添加</span>
          </button>
        </div>
        <div v-if="selectedSku" class="pbm-selected-sku-hint">
          <el-tag size="small" type="primary">{{ selectedSku.brandName }}</el-tag>
          {{ selectedSku.modelName }} - {{ selectedSku.color }} / {{ selectedSku.storage }}
        </div>
      </div>

      <div class="pbm-section-card">
        <h3>本次入库清单</h3>
        <div class="pbm-table-wrapper">
          <el-table :data="items" border stripe max-height="400" element-loading-background="rgba(245,240,235,0.8)" v-loading="tableLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="商品信息" min-width="180">
              <template #default="{ row }">
                <div>
                  <el-tag size="small" type="primary">{{ row.sku.brandName || row.sku?.model?.brand?.name || '' }}</el-tag>
                  {{ row.sku.modelName || row.sku?.model?.name || '' }} - {{ row.sku.color || '' }} / {{ row.sku.storage || row.sku?.ram || '' }}{{ row.sku?.ram && row.sku?.rom ? '/' : '' }}{{ row.sku?.rom || '' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="IMEI" min-width="170" prop="imei" />
            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                ¥{{ (row.unitPrice || row.unit_price || 0).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                ¥{{ (row.unitPrice || row.unit_price || 0).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" :disabled="tableLoading" @click="handleDelete(row)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="items.length === 0" class="pbm-section-empty">
          <el-empty description="暂无入库商品，请选择商品后添加 IMEI" />
        </div>

        <div v-if="items.length > 0" class="pbm-summary">
          合计: <strong>{{ items.length }}</strong> 台
          <span class="pbm-summary-divider">|</span>
          总金额: <strong>¥{{ totalAmount.toFixed(2) }}</strong>
        </div>
      </div>

      <div class="pbm-form-actions">
        <button class="pbm-btn-plain" @click="resetForm">重置</button>
        <button class="pbm-btn-accent" :disabled="items.length === 0 || confirmLoading" @click="handleConfirm">
          <svg v-if="confirmLoading" class="pbm-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
          {{ confirmLoading ? '确认中...' : '确认入库' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getSuppliers,
  createPurchaseEntry,
  addPurchaseItem,
  batchAddPurchaseImei,
  deletePurchaseItem,
  confirmPurchaseEntry,
} from '@/api/purchase'
import type { SupplierData } from '@/api/purchase'
import type { SkuData } from '@/api/product'
import { createScanner } from '@/utils/scanner'
import SkuSelector from '@/components/SkuSelector.vue'

const userStore = useUserStore()
const emit = defineEmits<{ back: [] }>()

const suppliers = ref<SupplierData[]>([])
const form = ref({ supplierId: null as number | null, remark: '' })
const currentEntryId = ref<number | null>(null)
const confirmLoading = ref(false)
const tableLoading = ref(false)

const skuSelectorRef = ref<InstanceType<typeof SkuSelector>>()
const selectedSku = ref<SkuData | null>(null)

const entryMode = ref<'single' | 'batch'>('single')

const singleImeiRef = ref<HTMLInputElement>()
const singleImei = ref('')
const singleUnitPrice = ref(0)

const batchImeiRef = ref<HTMLTextAreaElement>()
const batchImeiText = ref('')
const batchUnitPrice = ref(0)

const items = ref<any[]>([])

const batchImeiLines = computed(() => {
  return batchImeiText.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .length
})

const canAddSingle = computed(() => {
  return !!(selectedSku.value && singleImei.value.trim() && singleUnitPrice.value > 0)
})

const canAddBatch = computed(() => {
  return !!(selectedSku.value && batchImeiLines.value > 0 && batchUnitPrice.value > 0)
})

const parsedImeiList = computed(() => {
  return batchImeiText.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
})

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => {
    return sum + (item.unitPrice || item.unit_price || 0)
  }, 0)
})

const scanner = createScanner({
  onScan: (code) => {
    if (entryMode.value === 'single') {
      singleImei.value = code
      nextTick(() => {
        if (canAddSingle.value) {
          handleSingleAdd()
        }
      })
    } else {
      if (batchImeiText.value) {
        batchImeiText.value += '\n' + code
      } else {
        batchImeiText.value = code
      }
    }
  },
  onError: (msg) => {
    ElMessage.warning(msg)
  },
})

onMounted(async () => {
  await loadSuppliers()
  scanner.attach()
})

onUnmounted(() => {
  scanner.detach()
})

async function loadSuppliers() {
  try {
    suppliers.value = await getSuppliers()
  } catch {
    suppliers.value = []
  }
}

function onSkuSelect(sku: SkuData) {
  selectedSku.value = sku
  ElMessage.success(`已选择: ${sku.brandName} ${sku.modelName} - ${sku.color} / ${sku.storage}`)
}

function onScanError(msg: string) {
  ElMessage.warning(msg)
}

async function handleSingleAdd() {
  if (!canAddSingle.value) return
  if (!selectedSku.value?.id) {
    ElMessage.warning('请先选择商品')
    return
  }

  if (!currentEntryId.value) {
    try {
      const entry = await createPurchaseEntry({
        supplierId: form.value.supplierId ?? undefined,
        remark: form.value.remark || undefined,
        storeId: userStore.effectiveStoreId || undefined,
      })
      currentEntryId.value = entry.id
    } catch {
      ElMessage.error('创建入库单失败')
      return
    }
  }

  const imei = singleImei.value.trim()
  try {
    const item = await addPurchaseItem(currentEntryId.value!, {
      skuId: selectedSku.value.id,
      imei,
      unitPrice: singleUnitPrice.value,
    })
    items.value.push(item)
    ElMessage.success(`已添加: ${imei}`)
    singleImei.value = ''
    singleUnitPrice.value = 0
    await nextTick()
    singleImeiRef.value?.focus()
  } catch (err: any) {
    const msg = err?.response?.data?.message || `添加 IMEI ${imei} 失败`
    ElMessage.error(msg)
  }
}

async function handleBatchAdd() {
  if (!canAddBatch.value) return
  if (!selectedSku.value?.id) {
    ElMessage.warning('请先选择商品')
    return
  }

  if (!currentEntryId.value) {
    try {
      const entry = await createPurchaseEntry({
        supplierId: form.value.supplierId ?? undefined,
        remark: form.value.remark || undefined,
        storeId: userStore.effectiveStoreId || undefined,
      })
      currentEntryId.value = entry.id
    } catch {
      ElMessage.error('创建入库单失败')
      return
    }
  }

  const imeiList = parsedImeiList.value
  if (imeiList.length === 0) return

  try {
    const result = await batchAddPurchaseImei(currentEntryId.value!, {
      skuId: selectedSku.value.id,
      imeiList,
      unitPrice: batchUnitPrice.value,
    })
    if (Array.isArray(result)) {
      items.value.push(...result)
    } else if (result?.items) {
      items.value.push(...result.items)
    }
    ElMessage.success(`成功添加 ${imeiList.length} 台`)
    batchImeiText.value = ''
    batchUnitPrice.value = 0
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '批量添加失败')
  }
}

async function handleDelete(row: any) {
  if (!currentEntryId.value || !row.id) return
  try {
    await ElMessageBox.confirm(`确定删除 IMEI: ${row.imei}？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    tableLoading.value = true
    await deletePurchaseItem(currentEntryId.value!, row.id)
    const idx = items.value.findIndex(item => item.id === row.id)
    if (idx !== -1) items.value.splice(idx, 1)
    ElMessage.success('已删除')
  } catch {
  } finally {
    tableLoading.value = false
  }
}

async function handleConfirm() {
  if (!form.value.supplierId) {
    ElMessage.warning('请先选择供应商')
    return
  }
  if (items.value.length === 0) {
    ElMessage.warning('入库商品清单为空')
    return
  }

  if (!currentEntryId.value) {
    try {
      const entry = await createPurchaseEntry({
        supplierId: form.value.supplierId ?? undefined,
        remark: form.value.remark || undefined,
        storeId: userStore.effectiveStoreId || undefined,
      })
      currentEntryId.value = entry.id
    } catch {
      ElMessage.error('创建入库单失败')
      return
    }
  }

  confirmLoading.value = true
  try {
    await confirmPurchaseEntry(currentEntryId.value!)
    ElMessage.success(`入库成功，共 ${items.value.length} 台`)
    emit('back')
  } catch {
  } finally {
    confirmLoading.value = false
  }
}

function resetForm() {
  form.value = { supplierId: null, remark: '' }
  items.value = []
  currentEntryId.value = null
  selectedSku.value = null
  singleImei.value = ''
  singleUnitPrice.value = 0
  batchImeiText.value = ''
  batchUnitPrice.value = 0
  skuSelectorRef.value?.focus()
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
  --pbm-green: #22c55e;
  --pbm-green-dim: rgba(34,197,94,0.12);
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
.pbm-header-left { display: flex; align-items: center; gap: 12px; }
.pbm-title { font-size: 20px; font-weight: 600; letter-spacing: -0.3px; color: var(--pbm-text); margin: 0; }
.pbm-subtitle { font-size: 12px; color: var(--pbm-text-dim); letter-spacing: 0.4px; text-transform: uppercase; font-family: var(--pbm-mono); }

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
  border-radius: var(--pbm-radius);
  padding: 20px;
}
.pbm-section-card h3 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--pbm-text);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--pbm-border);
}
.pbm-section-empty {
  padding: 20px 0;
}

.pbm-mode-toggle {
  display: flex;
  gap: 12px;
}
.pbm-radio-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 13px;
  font-weight: 500;
  color: var(--pbm-text-dim);
  background: var(--pbm-bg);
  user-select: none;
}
.pbm-radio-card input { display: none; }
.pbm-radio-card:hover { border-color: var(--pbm-text-dim); }
.pbm-radio-card.active {
  border-color: var(--pbm-accent);
  color: var(--pbm-text);
  background: var(--pbm-accent-glow);
}
.pbm-radio-card svg { flex-shrink: 0; }

.pbm-entry-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}
.pbm-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.pbm-field label {
  font-size: 11px;
  font-weight: 600;
  color: var(--pbm-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.pbm-scan-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--pbm-bg);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  min-width: 260px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pbm-scan-input-wrapper:focus-within {
  border-color: var(--pbm-accent);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow);
}
.pbm-scan-input-icon {
  color: var(--pbm-text-dim);
  flex-shrink: 0;
}
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

.pbm-number-input {
  padding: 8px 12px;
  background: var(--pbm-bg);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  font-size: 14px;
  color: var(--pbm-text);
  font-family: var(--pbm-mono);
  min-width: 140px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pbm-number-input:focus {
  border-color: var(--pbm-accent);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow);
}
.pbm-number-input::placeholder {
  color: rgba(138,127,114,0.4);
  font-family: var(--pbm-font);
}

.pbm-price-input {
  width: 150px;
}
.pbm-price-input :deep(.el-input__wrapper) {
  background: var(--pbm-bg);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  box-shadow: none;
  padding: 1px 12px;
}
.pbm-price-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--pbm-accent);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow);
}
.pbm-price-input :deep(.el-input__inner) {
  font-family: var(--pbm-mono);
  font-size: 14px;
  color: var(--pbm-text);
}

.pbm-textarea {
  width: 100%;
  max-width: 460px;
  padding: 10px 12px;
  background: var(--pbm-bg);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  font-size: 13px;
  color: var(--pbm-text);
  font-family: var(--pbm-mono);
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pbm-textarea:focus {
  border-color: var(--pbm-accent);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow);
}
.pbm-textarea::placeholder {
  color: rgba(138,127,114,0.4);
  font-family: var(--pbm-font);
}

.pbm-selected-sku-hint {
  margin-top: 12px;
  font-size: 13px;
  color: var(--pbm-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.pbm-batch-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  max-width: 460px;
}
.pbm-batch-count {
  font-size: 12px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
  font-weight: 600;
}
.pbm-batch-count--ok {
  color: var(--pbm-green);
}

.pbm-summary {
  padding: 12px 16px;
  background: var(--pbm-bg);
  border-radius: var(--pbm-radius);
  font-size: 14px;
  color: var(--pbm-text);
  display: flex;
  align-items: center;
  gap: 6px;
}
.pbm-summary strong { font-weight: 700; }
.pbm-summary-divider { color: var(--pbm-border); margin: 0 4px; }

.pbm-table-wrapper {
  margin-bottom: 12px;
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

.pbm-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 0 4px;
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
}
.pbm-btn-accent:hover { background: #dba84a; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(201,149,60,0.3); }
.pbm-btn-accent:active { transform: translateY(0); }
.pbm-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
.pbm-btn-accent--sm { padding: 6px 14px; font-size: 12px; }

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
.pbm-icon-btn:hover { background: var(--pbm-red-dim); color: var(--pbm-red); }
.pbm-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.pbm-btn-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  background: var(--pbm-surface);
  color: var(--pbm-text-dim);
  cursor: pointer;
  transition: all 0.12s;
  margin-right: 4px;
}
.pbm-btn-back:hover { color: var(--pbm-text); border-color: var(--pbm-text-dim); background: var(--pbm-surface-hover); }

@keyframes pbm-spin {
  to { transform: rotate(360deg); }
}
.pbm-spinner {
  animation: pbm-spin 0.8s linear infinite;
}

.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

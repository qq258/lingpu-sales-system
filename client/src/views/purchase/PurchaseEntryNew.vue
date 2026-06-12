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
        <h3>扫码添加商品</h3>
        <div class="pbm-scan-input-wrapper">
          <svg class="pbm-scan-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
          <input
            ref="scanInputRef"
            v-model="scanCode"
            class="pbm-scan-input"
            placeholder="扫码枪扫描商品条码，或手动输入后回车"
            @keyup.enter="handleScan"
          />
        </div>
      </div>

      <div class="pbm-section-card">
        <h3>手动选择商品</h3>
        <div class="pbm-manual-row">
          <el-select v-model="manualBrandId" placeholder="选择品牌" filterable clearable style="width: 160px;" @change="onBrandChange">
            <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
          <el-select v-model="manualModelId" placeholder="选择型号" filterable clearable style="width: 200px;" :disabled="!manualBrandId">
            <el-option v-for="m in filteredModels" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <el-input-number v-model="manualQuantity" :min="1" controls-position="right" style="width: 110px;" placeholder="数量" />
          <button class="pbm-btn-accent pbm-btn-accent--sm" :disabled="!manualModelId || manualQuantity <= 0" @click="addManualItem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>添加</span>
          </button>
        </div>
      </div>

      <div class="pbm-section-card">
        <h3>入库商品清单</h3>
        <div class="pbm-table-wrapper">
          <el-table :data="entryItems" border stripe max-height="400" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="商品信息" min-width="200">
              <template #default="{ row }">
                <div>
                  <el-tag size="small" type="primary">{{ row.brandName }}</el-tag>
                  {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="条码" width="140" prop="barcode" />
            <el-table-column label="数量" width="120">
              <template #default="{ row, $index }">
                <el-input-number v-model="row.quantity" :min="1" size="small" controls-position="right" style="width: 120px;" />
              </template>
            </el-table-column>
            <el-table-column label="进货单价" width="160">
              <template #default="{ row, $index }">
                <el-input-number v-model="row.costPrice" :min="0" :precision="2" size="small" controls-position="right" style="width: 150px;" />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                ¥{{ (row.quantity * row.costPrice).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row, $index }">
                <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="removeItem($index)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="entryItems.length === 0" class="pbm-section-empty">
          <el-empty description="暂无商品，请扫码或手动选择添加" />
        </div>
      </div>

      <div class="pbm-form-actions">
        <button class="pbm-btn-plain" @click="resetForm">重置</button>
        <button class="pbm-btn-accent" :disabled="entryItems.length === 0" @click="handleConfirm">
          确认入库
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getSuppliers, createPurchaseEntry, scanPurchaseEntry, confirmPurchaseEntry } from '@/api/purchase'
import type { SupplierData } from '@/api/purchase'
import { getBrands, getModels } from '@/api/product'
import type { BrandData, ModelData } from '@/api/product'
import { createScanner } from '@/utils/scanner'

const userStore = useUserStore()

const suppliers = ref<SupplierData[]>([])
const form = ref({ supplierId: null as number | null, remark: '' })
const scanInputRef = ref<HTMLInputElement>()
const scanCode = ref('')
const entryItems = ref<Array<{
  skuId?: number
  modelId?: number
  brandName: string
  modelName: string
  color: string
  storage: string
  barcode: string
  quantity: number
  costPrice: number
}>>([])
const currentEntryId = ref<number | null>(null)
const confirmLoading = ref(false)

const brands = ref<BrandData[]>([])
const allModels = ref<ModelData[]>([])

const manualBrandId = ref<number | undefined>()
const manualModelId = ref<number | undefined>()
const manualQuantity = ref(1)

const filteredModels = computed(() => {
  if (!manualBrandId.value) return []
  return allModels.value.filter(m => m.brandId === manualBrandId.value)
})

const emit = defineEmits<{ back: [] }>()

const scanner = createScanner({
  onScan: (code) => {
    scanCode.value = code
    handleScanCode(code)
  },
  onError: (msg) => {
    ElMessage.warning(msg)
  },
})

onMounted(async () => {
  await Promise.all([loadSuppliers(), loadBrands(), loadModels()])
  await nextTick()
  scanInputRef.value?.focus()
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

async function loadBrands() {
  try {
    brands.value = await getBrands()
  } catch {
    brands.value = []
  }
}

async function loadModels() {
  try {
    allModels.value = await getModels()
  } catch {
    allModels.value = []
  }
}

function onBrandChange() {
  manualModelId.value = undefined
}

async function handleScan() {
  const code = scanCode.value.trim()
  if (!code) return
  await handleScanCode(code)
  scanCode.value = ''
}

async function handleScanCode(code: string) {
  try {
    if (!currentEntryId.value) {
      const entry = await createPurchaseEntry({
        supplierId: form.value.supplierId!,
        remark: form.value.remark,
        storeId: userStore.effectiveStoreId || undefined,
      })
      currentEntryId.value = entry.id
    }

    const result = await scanPurchaseEntry(currentEntryId.value!, code)

    const existing = entryItems.value.find(item => item.skuId === result.skuId)
    if (existing) {
      existing.quantity += 1
    } else {
      entryItems.value.push({
        skuId: result.skuId,
        brandName: result.brandName || '',
        modelName: result.modelName || '',
        color: result.color || '',
        storage: result.storage || '',
        barcode: result.barcode || code,
        quantity: 1,
        costPrice: result.costPrice || 0,
      })
    }

    ElMessage.success(`已添加: ${result.modelName} ${result.color || ''}`)
  } catch (err: any) {
    const msg = err?.response?.data?.message || '扫码失败'
    ElMessage.error(msg)
  }
}

async function addManualItem() {
  const brandId = manualBrandId.value
  const modelId = manualModelId.value
  if (!brandId || !modelId) {
    ElMessage.warning('请选择品牌和型号')
    return
  }

  const brand = brands.value.find(b => b.id === brandId)
  const model = allModels.value.find(m => m.id === modelId)
  const label = `${brand?.name || ''} ${model?.name || ''}`

  const existing = entryItems.value.find(
    item => item.brandName === brand?.name && item.modelName === model?.name
  )
  if (existing) {
    existing.quantity += manualQuantity.value
  } else {
    entryItems.value.push({
      modelId: model!.id,
      brandName: brand?.name || '',
      modelName: model?.name || '',
      color: '',
      storage: '',
      barcode: '',
      quantity: manualQuantity.value,
      costPrice: 0,
    })
  }

  ElMessage.success(`已添加: ${label}`)
  manualQuantity.value = 1
  manualBrandId.value = undefined
  manualModelId.value = undefined
}

function removeItem(index: number) {
  entryItems.value.splice(index, 1)
}

async function handleConfirm() {
  if (!form.value.supplierId) {
    ElMessage.warning('请先选择供应商')
    return
  }

  if (entryItems.value.length === 0) {
    ElMessage.warning('入库商品清单为空')
    return
  }

  for (const item of entryItems.value) {
    if (!item.quantity || item.quantity <= 0) {
      ElMessage.warning('商品数量不能为空或为0')
      return
    }
    if (!item.costPrice || item.costPrice <= 0) {
      ElMessage.warning(`商品 "${item.brandName} ${item.modelName}" 的进货单价不能为空或为0`)
      return
    }
  }

  confirmLoading.value = true
  try {
    if (!currentEntryId.value) {
      const entry = await createPurchaseEntry({
        supplierId: form.value.supplierId!,
        remark: form.value.remark,
        storeId: userStore.effectiveStoreId || undefined,
      })
      currentEntryId.value = entry.id
    }

    const entryId = currentEntryId.value!

    await confirmPurchaseEntry(entryId, entryItems.value.map(item => ({
      modelId: item.modelId || 0,
      quantity: item.quantity,
      costPrice: item.costPrice,
    })))
    ElMessage.success('入库成功')
    emit('back')
  } catch {
    // handled by interceptor
  } finally {
    confirmLoading.value = false
  }
}

function resetForm() {
  form.value = { supplierId: null, remark: '' }
  entryItems.value = []
  currentEntryId.value = null
  scanCode.value = ''
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

/* ─── Header ─── */
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

/* ─── Body ─── */
.pbm-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
  gap: 16px;
}

/* ─── Section Card ─── */
.pbm-section-card {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: 6px;
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

/* ─── Manual add row ─── */
.pbm-manual-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pbm-manual-row :deep(.el-select) { width: auto; }
.pbm-manual-row :deep(.el-select .el-input__wrapper) {
  background: #f5f0eb;
  border: 1px solid var(--pbm-border);
  box-shadow: none;
  border-radius: var(--pbm-radius);
}
.pbm-manual-row :deep(.el-select .el-input__wrapper:hover) { border-color: var(--pbm-text-dim); }
.pbm-manual-row :deep(.el-select .el-input__wrapper.is-focus) { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }

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
.pbm-icon-btn:hover { background: var(--pbm-blue-dim); color: var(--pbm-blue); }
.pbm-icon-btn--danger:hover { background: var(--pbm-red-dim); color: var(--pbm-red); }
.pbm-icon-btn--sm { width: 24px; height: 24px; }

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

/* ─── Scan Input ─── */
.pbm-scan-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  max-width: 480px;
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
  font-family: var(--pbm-font);
}
.pbm-scan-input::placeholder {
  color: rgba(138,127,114,0.4);
}

/* ─── Table ─── */
.pbm-table-wrapper {
  margin-bottom: 8px;
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

/* ─── Form Actions ─── */
.pbm-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 0 4px;
}

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
:deep(.pbm-dialog .el-form-item__label) { color: var(--pbm-text-dim); font-size: 13px; }
:deep(.pbm-dialog .el-input__wrapper),
:deep(.pbm-dialog .el-select__wrapper),
:deep(.pbm-dialog .el-textarea__inner) {
  background: #f5f0eb;
  border: 1px solid var(--pbm-border);
  box-shadow: none;
  border-radius: var(--pbm-radius);
  color: var(--pbm-text);
}
:deep(.pbm-dialog .el-input__wrapper:hover),
:deep(.pbm-dialog .el-select__wrapper:hover),
:deep(.pbm-dialog .el-textarea__inner:hover) { border-color: var(--pbm-text-dim); }
:deep(.pbm-dialog .el-input__wrapper.is-focus),
:deep(.pbm-dialog .el-select__wrapper.is-focus),
:deep(.pbm-dialog .el-textarea__inner:focus) { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
:deep(.pbm-dialog .el-input__inner) { color: var(--pbm-text); }
:deep(.pbm-dialog .el-input__inner::placeholder) { color: rgba(138,127,114,0.4); }
:deep(.pbm-dialog .el-input-number__increase),
:deep(.pbm-dialog .el-input-number__decrease) { background: #f0ebe5; color: var(--pbm-text-dim); border-color: var(--pbm-border); }
:deep(.pbm-dialog .el-select-dropdown) { background: var(--pbm-surface); border: 1px solid var(--pbm-border); }
:deep(.pbm-dialog .el-select-dropdown__item) { color: var(--pbm-text); }
:deep(.pbm-dialog .el-select-dropdown__item.hover) { background: var(--pbm-surface-hover); }
:deep(.pbm-dialog .el-select-dropdown__item.selected) { color: var(--pbm-accent); background: var(--pbm-accent-glow); font-weight: 600; }

/* ─── Scrollbar ─── */
.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

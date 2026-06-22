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
        <div class="pbm-model-select">
          <el-select v-model="searchBrandId" placeholder="选择品牌" clearable filterable @change="onBrandChange" style="width: 150px;">
            <el-option v-for="brand in brands" :key="brand.id" :label="brand.name" :value="brand.id" />
          </el-select>
          <el-select v-model="searchModelId" placeholder="选择型号" clearable filterable style="width: 300px;" :disabled="!searchBrandId">
            <el-option v-for="model in models" :key="model.id" :label="`${model.name} - ${model.color || ''}/${model.memory || ''}  ¥${model.salePrice || 0}`" :value="model.id" />
          </el-select>
          <div class="pbm-field" style="flex:1;min-width:120px;">
            <label>单价</label>
            <input v-model.number="unitPrice" type="number" class="pbm-number-input" placeholder="¥0.00" min="0" step="0.01" />
          </div>
        </div>
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
          <div class="pbm-field pbm-field-optional">
            <label>IMEI2 <span class="pbm-optional-tag">可选</span></label>
            <input v-model="singleImei2" class="pbm-scan-input pbm-slim-input" placeholder="双卡IMEI2" @keyup.enter="handleSingleAdd" />
          </div>
          <div class="pbm-field pbm-field-optional">
            <label>S/N码 <span class="pbm-optional-tag">可选</span></label>
            <input v-model="singleSnCode" class="pbm-scan-input pbm-slim-input" placeholder="序列号SN" @keyup.enter="handleSingleAdd" />
          </div>
          <button class="pbm-btn-accent pbm-btn-accent--sm" @click="handleSingleAdd">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>添加</span>
          </button>
        </div>
      </div>

      <div v-if="entryMode === 'batch'" class="pbm-section-card">
        <h3>批量粘贴</h3>
        <div class="pbm-field" style="margin-top: 14px;">
          <label>录入数据（每行一条，可用 Tab/逗号分隔 IMEI1、IMEI2、SN）</label>
          <textarea
            ref="batchImeiRef"
            v-model="batchImeiText"
            class="pbm-textarea"
            rows="6"
            placeholder="粘贴数据，每行一条&#10;&#10;格式: IMEI1,IMEI2,SN（IMEI2和SN可选）&#10;&#10;例如:&#10;861234567890101,861234567890102,SN123456&#10;861234567890103,,SN123457&#10;861234567890104"
          ></textarea>
        </div>
        <div class="pbm-batch-footer">
          <span class="pbm-batch-count" :class="{ 'pbm-batch-count--ok': batchImeiLines > 0 }">
            {{ batchImeiLines }} 条记录
          </span>
          <button class="pbm-btn-accent pbm-btn-accent--sm" @click="handleBatchAdd">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>解析并添加</span>
          </button>
        </div>
      </div>

      <div class="pbm-section-card">
        <h3>本次入库清单</h3>
        <div class="pbm-table-wrapper">
          <el-table :data="items" border stripe max-height="400" show-summary :summary-method="tableSummary">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="品牌" width="120">
              <template #default="{ row }">
                <el-tag size="small" type="primary">{{ row.brandName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="型号" min-width="140">
              <template #default="{ row }">
                {{ row.modelName }}
              </template>
            </el-table-column>
            <el-table-column label="IMEI" min-width="170" prop="imei" />
            <el-table-column label="IMEI2" width="150" prop="imei2">
              <template #default="{ row }">
                <span class="pbm-dim-text">{{ row.imei2 || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="S/N" width="130" prop="snCode">
              <template #default="{ row }">
                <span class="pbm-dim-text">{{ row.snCode || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                ¥{{ (row.unitPrice || 0).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="handleDelete(row)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="items.length === 0" class="pbm-section-empty">
          <el-empty description="暂无入库商品，请先在上方选择商品" />
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
import { getSuppliers, quickConfirmPurchaseEntry } from '@/api/purchase'
import type { SupplierData } from '@/api/purchase'
import { getBrands, getModels } from '@/api/product'
import { createScanner } from '@/utils/scanner'

const userStore = useUserStore()
const emit = defineEmits<{ back: [] }>()

const suppliers = ref<SupplierData[]>([])
const form = ref({ supplierId: null as number | null, remark: '' })
const confirmLoading = ref(false)

let localIdCounter = 0

const brands = ref<any[]>([])
const models = ref<any[]>([])
const searchBrandId = ref<number | undefined>()
const searchModelId = ref<number | undefined>()

const selectedModelId = computed(() => searchModelId.value)
const selectedModel = computed(() => models.value.find(m => m.id === searchModelId.value))

const entryMode = ref<'single' | 'batch'>('single')
const singleImeiRef = ref<HTMLInputElement>()
const singleImei = ref('')
const singleImei2 = ref('')
const singleSnCode = ref('')
const unitPrice = ref(0)
const batchImeiRef = ref<HTMLTextAreaElement>()
const batchImeiText = ref('')
const items = ref<any[]>([])

const batchImeiLines = computed(() => {
  return batchImeiText.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .length
})

const canAddSingle = computed(() => {
  return !!(selectedModelId.value && singleImei.value.trim() && unitPrice.value > 0)
})

const parsedImeiList = computed(() => {
  return batchImeiText.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => {
      // 支持逗号、Tab、空格分隔: IMEI1,IMEI2,SN
      const parts = l.split(/[,\t\s]+/)
      return { imei: parts[0] || '', imei2: parts[1] || '', snCode: parts[2] || '' }
    })
})

function tableSummary(param: { columns: any[]; data: any[] }) {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = `合计 ${data.length} 台`
      return
    }
    if (column.property === 'imei') {
      sums[index] = ''
      return
    }
    if (column.label === '单价') {
      const total = data.reduce((sum, row) => sum + (row.unitPrice || 0), 0)
      sums[index] = `¥${total.toFixed(2)}`
      return
    }
    sums[index] = ''
  })
  return sums
}

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
  try {
    brands.value = await getBrands()
  } catch {}
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

async function onBrandChange() {
  searchModelId.value = undefined
  if (searchBrandId.value) {
    try {
      models.value = await getModels(searchBrandId.value)
    } catch {
      models.value = []
    }
  } else {
    models.value = []
  }
}

async function handleSingleAdd() {
  if (!selectedModelId.value) {
    ElMessage.warning('请先在上方选择品牌和型号')
    return
  }
  if (!singleImei.value.trim()) {
    ElMessage.warning('请输入 IMEI')
    return
  }
  if (!unitPrice.value || unitPrice.value <= 0) {
    ElMessage.warning('请输入单价')
    return
  }

  const model = selectedModel.value
  const item = {
    id: --localIdCounter,
    modelId: model.id,
    brandName: model.brandName || '',
    modelName: model.name,
    imei: singleImei.value.trim(),
    imei2: singleImei2.value.trim() || undefined,
    snCode: singleSnCode.value.trim() || undefined,
    unitPrice: unitPrice.value,
  }

  if (items.value.some(i => i.imei === item.imei)) {
    ElMessage.warning(`IMEI ${item.imei} 已添加到清单中`)
    return
  }

  items.value.push(item)
  singleImei.value = ''
  singleImei2.value = ''
  singleSnCode.value = ''
  await nextTick()
  singleImeiRef.value?.focus()
}

async function handleBatchAdd() {
  if (!selectedModelId.value) {
    ElMessage.warning('请先在上方选择品牌和型号')
    return
  }
  if (!unitPrice.value || unitPrice.value <= 0) {
    ElMessage.warning('请输入单价')
    return
  }
  if (!batchImeiText.value.trim()) {
    ElMessage.warning('请输入 IMEI 列表')
    return
  }

  const model = selectedModel.value
  const parsedList = parsedImeiList.value
  const existingImeis = new Set(items.value.map(i => i.imei))
  let addedCount = 0

  for (const entry of parsedList) {
    if (!entry.imei) continue
    if (existingImeis.has(entry.imei)) continue
    items.value.push({
      id: --localIdCounter,
      modelId: model.id,
      brandName: model.brandName || '',
      modelName: model.name,
      imei: entry.imei,
      imei2: entry.imei2 || undefined,
      snCode: entry.snCode || undefined,
      unitPrice: unitPrice.value,
    })
    existingImeis.add(entry.imei)
    addedCount++
  }

  if (addedCount > 0) {
    ElMessage.success(`成功添加 ${addedCount} 台`)
  }
  if (addedCount < parsedList.length) {
    ElMessage.warning(`${parsedList.length - addedCount} 个 IMEI 已存在，已跳过`)
  }
  batchImeiText.value = ''
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除 IMEI: ${row.imei}？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const idx = items.value.findIndex(item => item.id === row.id)
    if (idx !== -1) items.value.splice(idx, 1)
    ElMessage.success('已删除')
  } catch {
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

  confirmLoading.value = true
  try {
    await quickConfirmPurchaseEntry({
      supplierId: form.value.supplierId,
      remark: form.value.remark || undefined,
      storeId: userStore.effectiveStoreId || undefined,
      items: items.value.map(i => ({
        modelId: i.modelId,
        imei: i.imei,
        imei2: i.imei2,
        snCode: i.snCode,
        unitPrice: i.unitPrice || 0,
      })),
    })
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
  searchBrandId.value = undefined
  searchModelId.value = undefined
  unitPrice.value = 0
  singleImei.value = ''
  singleImei2.value = ''
  singleSnCode.value = ''
  batchImeiText.value = ''
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
.pbm-model-select {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-end;
}
.pbm-section-empty { padding: 20px 0; }
.pbm-mode-toggle { display: flex; gap: 12px; }
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
.pbm-radio-card.active { border-color: var(--pbm-accent); color: var(--pbm-text); background: var(--pbm-accent-glow); }
.pbm-radio-card svg { flex-shrink: 0; }
.pbm-entry-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}
.pbm-field { display: flex; flex-direction: column; gap: 5px; }
.pbm-field-optional { min-width: 140px; }
.pbm-optional-tag { font-size: 10px; color: var(--pbm-text-dim); font-weight: 400; text-transform: none; letter-spacing: 0; }
.pbm-field label { font-size: 11px; font-weight: 600; color: var(--pbm-text-dim); text-transform: uppercase; letter-spacing: 0.3px; }
.pbm-slim-input {
  padding: 8px 10px;
  background: var(--pbm-bg);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  font-size: 13px;
  color: var(--pbm-text);
  font-family: var(--pbm-mono);
  min-width: 120px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pbm-slim-input:focus { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
.pbm-dim-text { color: var(--pbm-text-dim); font-size: 12px; }
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
.pbm-scan-input-wrapper:focus-within { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
.pbm-scan-input-icon { color: var(--pbm-text-dim); flex-shrink: 0; }
.pbm-scan-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--pbm-text);
  font-family: var(--pbm-mono);
}
.pbm-scan-input::placeholder { color: rgba(138,127,114,0.4); font-family: var(--pbm-font); }
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
.pbm-number-input:focus { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
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
.pbm-textarea:focus { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
.pbm-batch-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; max-width: 460px; }
.pbm-batch-count { font-size: 12px; color: var(--pbm-text-dim); font-family: var(--pbm-mono); font-weight: 600; }
.pbm-batch-count--ok { color: var(--pbm-green); }
.pbm-table-wrapper { margin-bottom: 12px; }
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
.pbm-form-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 0 0 4px; }
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
.pbm-btn-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  background: var(--pbm-surface);
  color: var(--pbm-text-dim);
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-back:hover { color: var(--pbm-text); border-color: var(--pbm-text-dim); }
.pbm-spinner { animation: pbm-spin 0.8s linear infinite; }
@keyframes pbm-spin { to { transform: rotate(360deg); } }
</style>

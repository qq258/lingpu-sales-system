<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">库存盘点</h1>
        <span class="pbm-subtitle">Inventory Check</span>
      </div>
      <button class="pbm-btn-accent" @click="openNewDialog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>新建盘点</span>
      </button>
    </header>

    <div class="pbm-body">
      <div class="pbm-main">
        <div class="pbm-main-head">
          <span></span>
          <span class="pbm-section-count">{{ total }} 条记录</span>
        </div>

        <div class="pbm-table-wrapper">
          <el-table :data="checks" stripe v-loading="loading" size="small" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="#" width="48" align="center" />
            <el-table-column prop="id" label="盘点单号" width="100" />
            <el-table-column prop="storeName" label="门店" />
            <el-table-column prop="itemCount" label="盘点商品数" width="100" align="center" />
            <el-table-column label="盈亏" width="120" align="center">
              <template #default="{ row }">
                <span v-if="(row.profitLoss ?? 0) > 0" style="color:#2e7d32;font-weight:600;">+{{ row.profitLoss }}</span>
                <span v-else-if="(row.profitLoss ?? 0) < 0" style="color:#dc3545;font-weight:600;">{{ row.profitLoss }}</span>
                <span v-else style="color:var(--pbm-text-dim);">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <span class="pbm-status-badge" :class="row.status === 'audited' ? 'pbm-status-badge--ok' : 'pbm-status-badge--pending'">
                  {{ row.status === 'audited' ? '已审核' : '待审核' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160" />
            <el-table-column label="" width="80" fixed="right">
              <template #default="{ row }">
                <div class="pbm-cell-actions">
                  <button class="pbm-icon-btn pbm-icon-btn--sm" title="详情" @click="showDetail(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button v-if="row.status === 'pending'" class="pbm-icon-btn pbm-icon-btn--sm" title="审核" @click="handleAudit(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pbm-pagination-wrapper" v-if="total > 0">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @change="loadChecks"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="newDialogVisible" title="新建盘点" width="700px" :close-on-click-modal="false" class="pbm-dialog">
      <el-form ref="newFormRef" :model="newForm" :rules="newRules" label-width="100px" size="default">
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="newForm.storeId" placeholder="选择门店" filterable>
            <el-option v-for="s in userStore.availableStores" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="newForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <div style="margin-bottom:12px;">
        <div class="pbm-dialog-search" style="display:flex;gap:8px;flex-wrap:wrap;">
          <el-select v-model="searchBrandId" placeholder="选择品牌" clearable filterable size="small" @change="onBrandChange" style="width:150px;">
            <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
          <el-select v-model="searchModelId" placeholder="选择型号" clearable filterable size="small" style="width:250px;" :disabled="!searchBrandId">
            <el-option v-for="m in models" :key="m.id" :label="`${m.name} - ${m.color || ''}/${m.ram || ''}/${m.rom || ''}`" :value="m.id" />
          </el-select>
          <button class="pbm-btn-accent pbm-btn-accent--sm" :disabled="!searchModelId" @click="addCheckModel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>添加</span>
          </button>
        </div>
      </div>

      <div class="pbm-table-wrapper pbm-table-wrapper--compact">
        <el-table :data="newForm.items" stripe max-height="300" size="small">
          <el-table-column label="商品" min-width="180">
            <template #default="{ row }">
              <span class="pbm-tag-brand">{{ row.brandName }}</span>
              {{ row.modelName }} {{ row.color }} / {{ row.storage }}
            </template>
          </el-table-column>
          <el-table-column label="账面数量" width="90" align="center">
            <template #default="{ row }">{{ row.systemQuantity ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="实际数量" width="130">
            <template #default="{ row, $index }">
              <el-input-number v-model="row.actualQuantity" :min="0" size="small" controls-position="right" style="width:110px;" />
            </template>
          </el-table-column>
          <el-table-column label="" width="60" fixed="right">
            <template #default="{ row, $index }">
              <div class="pbm-cell-actions">
                <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="removeCheckItem($index)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <el-select v-model="searchBrandId" placeholder="选择品牌" clearable filterable size="small" @change="onBrandChange" style="width:150px;">
            <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
          <el-select v-model="searchModelId" placeholder="选择型号" clearable filterable size="small" style="width:250px;" :disabled="!searchBrandId">
            <el-option v-for="m in models" :key="m.id" :label="`${m.name} - ${m.color || ''}/${m.ram || ''}/${m.rom || ''}`" :value="m.id" />
          </el-select>
          <button class="pbm-btn-accent pbm-btn-accent--sm" :disabled="!searchModelId" @click="addCheckModel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>添加</span>
          </button>
        </div>

      <template #footer>
        <button class="pbm-btn-plain" @click="newDialogVisible = false">取消</button>
        <button class="pbm-btn-accent" :disabled="newForm.items.length === 0 || submitLoading" @click="handleCreateCheck">{{ submitLoading ? '提交中...' : '创建盘点' }}</button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="盘点详情" width="700px" :close-on-click-modal="false" class="pbm-dialog">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="盘点单号">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ detailData.storeName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span class="pbm-status-badge" :class="detailData.status === 'audited' ? 'pbm-status-badge--ok' : 'pbm-status-badge--pending'">
            {{ detailData.status === 'audited' ? '已审核' : '待审核' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
      <div class="pbm-table-wrapper pbm-table-wrapper--compact" style="margin-top:16px;">
        <el-table :data="detailData?.items || []" stripe size="small">
          <el-table-column label="商品" min-width="180">
            <template #default="{ row }">
              <span class="pbm-tag-brand">{{ row.brandName }}</span>
              {{ row.modelName }} {{ row.color }} / {{ row.storage }}
            </template>
          </el-table-column>
          <el-table-column prop="systemQuantity" label="账面数量" width="80" align="center" />
          <el-table-column prop="actualQuantity" label="实际数量" width="80" align="center" />
          <el-table-column label="盈亏" width="80" align="center">
            <template #default="{ row }">
              <span v-if="(row.difference ?? 0) > 0" style="color:#2e7d32;font-weight:600;">+{{ row.difference }}</span>
              <span v-else-if="(row.difference ?? 0) < 0" style="color:#dc3545;font-weight:600;">{{ row.difference }}</span>
              <span v-else style="color:var(--pbm-text-dim);">—</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <button class="pbm-btn-plain" @click="detailVisible = false">关闭</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getInventoryChecks, createInventoryCheck, auditInventoryCheck } from '@/api/inventory'
import { getBrands, getModels } from '@/api/product'
import { getInventoryByModel } from '@/api/inventory'

const userStore = useUserStore()

const loading = ref(false)
const checks = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const newDialogVisible = ref(false)
const newFormRef = ref<FormInstance>()
const submitLoading = ref(false)

const brands = ref<any[]>([])
const models = ref<any[]>([])
const searchBrandId = ref<number | undefined>()
const searchModelId = ref<number | undefined>()

const newForm = ref<{
  storeId: number | null
  remark: string
  items: Array<{
    modelId: number
    brandName: string
    modelName: string
    color: string
    storage: string
    systemQuantity: number
    actualQuantity: number
  }>
}>({
  storeId: null,
  remark: '',
  items: [],
})

const newRules: FormRules = {
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }],
}

const detailVisible = ref(false)
const detailData = ref<any>(null)

async function loadChecks() {
  loading.value = true
  try {
    const result = await getInventoryChecks({ page: page.value, pageSize: pageSize.value })
    checks.value = result.list
    total.value = result.total
  } catch {
    checks.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function openNewDialog() {
  newForm.value = { storeId: null, remark: '', items: [] }
  newDialogVisible.value = true
}

function addCheckModel() {
  if (!searchModelId.value) return
  const model = models.value.find(m => m.id === searchModelId.value)
  if (!model) return

  const existing = newForm.value.items.find(i => i.modelId === model.id)
  if (!existing) {
    let stock = 0
    try {
      getInventoryByModel(model.id, newForm.value.storeId || undefined).then(result => {
        stock = result[0]?.stock || 0
      })
    } catch {}
    newForm.value.items.push({
      modelId: model.id,
      brandName: model.brandName || '',
      modelName: model.name,
      color: model.color || '',
      storage: [model.ram, model.rom].filter(Boolean).join('/') || '',
      systemQuantity: stock,
      actualQuantity: stock,
    })
  }
}

function removeCheckItem(index: number) {
  newForm.value.items.splice(index, 1)
}

async function handleCreateCheck() {
  const valid = await newFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await createInventoryCheck({
      storeId: newForm.value.storeId!,
      items: newForm.value.items.map(i => ({ modelId: i.modelId, expectedQty: i.systemQuantity, actualQty: i.actualQuantity })),
      remark: newForm.value.remark,
    })
    ElMessage.success('盘点单创建成功')
    newDialogVisible.value = false
    await loadChecks()
  } catch {
    // handled
  } finally {
    submitLoading.value = false
  }
}

async function showDetail(row: any) {
  try {
    detailData.value = row
    detailVisible.value = true
  } catch {
    // handled
  }
}

async function handleAudit(row: any) {
  try {
    await ElMessageBox.confirm('确定审核通过该盘点单吗？审核后库存将更新。', '确认审核', { type: 'warning' })
    await auditInventoryCheck(row.id)
    ElMessage.success('审核成功')
    await loadChecks()
  } catch {
    // cancelled
  }
}

onMounted(async () => {
  await loadChecks()
  try {
    brands.value = await getBrands()
  } catch {}
})
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
  overflow: hidden;
}
.pbm-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--pbm-bg);
}

.pbm-main-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 12px;
  flex-shrink: 0;
}

.pbm-section-count {
  font-size: 12px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
}

.pbm-table-wrapper {
  flex: 1;
  padding: 0 24px 24px;
  min-height: 0;
}
.pbm-table-wrapper--compact {
  flex: none;
  padding: 0;
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

.pbm-status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--pbm-mono);
}
.pbm-status-badge--ok { background: #e8f5e9; color: #2e7d32; }
.pbm-status-badge--pending { background: #fef3e2; color: #c9953c; }

.pbm-pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  flex-shrink: 0;
}
.pbm-pagination-wrapper :deep(.el-pagination) { font-family: var(--pbm-font); }
.pbm-pagination-wrapper :deep(.el-pagination button),
.pbm-pagination-wrapper :deep(.el-pager li) {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  margin: 0 2px;
  color: var(--pbm-text);
  font-size: 12px;
  min-width: 30px;
  height: 30px;
}
.pbm-pagination-wrapper :deep(.el-pagination button:hover),
.pbm-pagination-wrapper :deep(.el-pager li:hover) {
  border-color: var(--pbm-accent);
  color: var(--pbm-accent);
}
.pbm-pagination-wrapper :deep(.el-pager li.is-active) {
  background: var(--pbm-accent);
  border-color: var(--pbm-accent);
  color: #fff;
}
.pbm-pagination-wrapper :deep(.el-pagination__total) {
  font-size: 12px;
  color: var(--pbm-text-dim);
}

.pbm-dialog-search {
  display: flex;
  align-items: center;
}
.pbm-dialog-search .pbm-search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: #f5f0eb;
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  transition: border-color 0.15s;
}
.pbm-dialog-search .pbm-search-input-wrapper:focus-within {
  border-color: var(--pbm-accent);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow);
}
.pbm-dialog-search .pbm-search-icon { color: var(--pbm-text-dim); flex-shrink: 0; }
.pbm-dialog-search .pbm-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--pbm-text);
  width: 170px;
  font-family: var(--pbm-font);
}
.pbm-dialog-search .pbm-search-input::placeholder { color: rgba(138,127,114,0.4); }

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
:deep(.pbm-dialog .el-select-dropdown) { background: var(--pbm-surface); border: 1px solid var(--pbm-border); }
:deep(.pbm-dialog .el-select-dropdown__item) { color: var(--pbm-text); }
:deep(.pbm-dialog .el-select-dropdown__item.hover) { background: var(--pbm-surface-hover); }
:deep(.pbm-dialog .el-select-dropdown__item.selected) { color: var(--pbm-accent); background: var(--pbm-accent-glow); font-weight: 600; }
:deep(.pbm-dialog .el-descriptions) { font-family: var(--pbm-font); }
:deep(.pbm-dialog .el-descriptions__title) { font-size: 13px; color: var(--pbm-text-dim); }
:deep(.pbm-dialog .el-descriptions__label) { color: var(--pbm-text-dim); font-size: 12px; }
:deep(.pbm-dialog .el-descriptions__content) { color: var(--pbm-text); font-size: 13px; }
:deep(.pbm-dialog .el-descriptions--border .el-descriptions__body) { background: var(--pbm-surface); border-color: var(--pbm-border); }

.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

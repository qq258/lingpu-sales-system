<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">品牌与型号管理</h1>
        <span class="pbm-subtitle">Brand &amp; Model Catalog</span>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="pbm-btn-plain" @click="handleExportBrands">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>导出品牌</span>
        </button>
        <button class="pbm-btn-plain" @click="handleExportModels">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>导出型号</span>
        </button>
        <button class="pbm-btn-accent" @click="openQuickAddDialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>快速新增</span>
        </button>
        <button class="pbm-btn-plain" @click="importDialogVisible = true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>导入</span>
        </button>
      </div>
    </header>

    <div class="pbm-body">
      <aside class="pbm-sidebar">
        <div class="pbm-sidebar-head">
          <span class="pbm-sidebar-label">品牌清单</span>
          <button class="pbm-btn-ghost" @click="openBrandDialog()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <div class="pbm-tree-container" v-loading="brandLoading" element-loading-background="rgba(245,240,235,0.8)">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            highlight-current
            @node-click="onTreeNodeClick"
            :current-node-key="currentNodeKey"
          >
            <template #default="{ node, data }">
              <div class="pbm-tree-node" :class="{ 'is-active': node.isCurrent }">
                <div class="pbm-tree-indicator" :class="{ 'is-active': node.isCurrent }" />
                <svg class="pbm-tree-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                <span class="pbm-tree-label-group">
                  <span class="pbm-tree-label">{{ data.label }}</span>
                  <span class="pbm-tree-count">{{ data.count }}</span>
                </span>
                <div v-show="node.isCurrent" class="pbm-tree-actions">
                  <button class="pbm-icon-btn" title="编辑品牌" @click.stop="openBrandDialog(data.source)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="pbm-icon-btn pbm-icon-btn--danger" title="删除品牌" @click.stop="handleDeleteBrand(data.source)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>
            </template>
          </el-tree>
          <div v-if="!brandLoading && brands.length === 0" class="pbm-tree-empty">暂无品牌</div>
        </div>
      </aside>

      <main class="pbm-main">
        <div class="pbm-main-head">
          <div class="pbm-main-head-left">
            <h2 class="pbm-section-title">
              型号目录
              <span v-if="selectedBrand" class="pbm-section-brand">{{ selectedBrand.name }}</span>
            </h2>
            <span v-if="selectedBrand" class="pbm-section-count">{{ models.length }} 个型号</span>
          </div>
          <button class="pbm-btn-ghost" :disabled="!selectedBrand" @click="openModelDialog()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>新增型号</span>
          </button>
        </div>

        <div class="pbm-table-wrapper">
          <el-table
            ref="modelTableRef"
            :data="models"
            stripe
            v-loading="modelLoading"
            size="small"
            highlight-current-row
            @current-change="onModelSelect"
            element-loading-background="rgba(245,240,235,0.8)"
          >
            <el-table-column type="index" label="#" width="48" />
            <el-table-column prop="name" label="型号名称" min-width="140">
              <template #default="{ row }">
                <span class="pbm-cell-name">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="memory" label="内存" width="120" />
            <el-table-column prop="salePrice" label="售价" width="100" align="right">
              <template #default="{ row }">
                <span class="pbm-cell-price">¥{{ (row.salePrice || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="国补" width="60" align="center">
              <template #default="{ row }">
                <span :class="['pbm-cell-subsidy', row.isSubsidy ? 'is-subsidy' : '']">{{ row.isSubsidy ? '是' : '否' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="" width="80" fixed="right">
              <template #default="{ row }">
                <div class="pbm-cell-actions">
                  <button class="pbm-icon-btn pbm-icon-btn--sm" title="编辑" @click="openModelDialog(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="handleDeleteModel(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pbm-detail-panel" v-if="selectedModel">
          <div class="pbm-detail-bar">
            <div class="pbm-detail-bar-dot" />
            <span class="pbm-detail-bar-label">规格详情</span>
            <span class="pbm-detail-bar-sep">|</span>
            <span class="pbm-detail-bar-name">{{ selectedModel.name }}</span>
          </div>
          <div class="pbm-detail-grid">
            <div class="pbm-spec-card" v-for="spec in specList" :key="spec.label">
              <span class="pbm-spec-label">{{ spec.label }}</span>
              <span class="pbm-spec-value" :class="{ 'pbm-spec-value--muted': !spec.value }">{{ spec.value || '—' }}</span>
            </div>
          </div>
        </div>
        <div class="pbm-detail-panel pbm-detail-panel--empty" v-else-if="models.length > 0">
          <div class="pbm-detail-prompt">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>选择上方表格中的型号查看完整规格</span>
          </div>
        </div>
        <div class="pbm-detail-panel pbm-detail-panel--empty" v-else-if="!modelLoading">
          <div class="pbm-detail-prompt">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            <span>从左侧选择品牌以查看型号</span>
          </div>
        </div>
      </main>
    </div>

    <BrandModelEditDialog
      v-model:visible="editDialogVisible"
      :mode="editDialogMode"
      :brand="editDialogBrand"
      :model="editDialogModel"
      :existing-brands="brands"
      :loading="editDialogLoading"
      @save="handleUnifiedSave"
      @save-and-new="handleUnifiedSaveAndNew"
    />

    <BatchImportDialog v-model:visible="importDialogVisible" @success="onImportSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type ElTree from 'element-plus/es/components/tree'
import { getBrands, getModels, createBrand, updateBrand, deleteBrand, createModel, updateModel, deleteModel } from '@/api/product'
import type { BrandData, ModelData } from '@/api/product'
import { exportWithQuery } from '@/api/tools'
import BrandModelEditDialog from './components/BrandModelEditDialog.vue'
import BatchImportDialog from './components/BatchImportDialog.vue'
import type { DialogMode } from './components/BrandModelEditDialog.vue'

const brandLoading = ref(false)
const modelLoading = ref(false)
const brands = ref<BrandData[]>([])
const models = ref<ModelData[]>([])
const selectedBrand = ref<BrandData | null>(null)
const selectedModel = ref<ModelData | null>(null)
const treeRef = ref<InstanceType<typeof ElTree>>()
const modelTableRef = ref()

const currentNodeKey = ref<string | null>(null)

// 一体化弹窗状态
const editDialogVisible = ref(false)
const editDialogMode = ref<DialogMode>('create')
const editDialogBrand = ref<BrandData | null>(null)
const editDialogModel = ref<ModelData | null>(null)
const editDialogLoading = ref(false)

// 导入弹窗状态
const importDialogVisible = ref(false)

function onImportSuccess() {
  importDialogVisible.value = false
  loadBrands()
}

function handleExportBrands() {
  exportWithQuery('/products/brands/export')
}

function handleExportModels() {
  exportWithQuery('/products/models/export')
}

interface TreeNode {
  id: string
  label: string
  source: BrandData
  count?: number
}

const treeProps = { label: 'label' }

const treeData = computed<TreeNode[]>(() =>
  brands.value.map(b => ({
    id: `brand-${b.id}`,
    label: b.name,
    source: b,
    count: b._count?.models || 0,
  }))
)

const specList = computed(() => {
  const m = selectedModel.value
  if (!m) return []
  const brandName = selectedBrand.value?.name
  return [
    { label: '品牌', value: brandName },
    { label: '型号名称', value: m.name },
    { label: '内存', value: m.memory },
    { label: '颜色', value: m.color },
    { label: '是否国补', value: m.isSubsidy ? '是' : '否' },
    { label: '描述', value: m.description },
  ]
})

function onTreeNodeClick(data: TreeNode) {
  selectedBrand.value = data.source
  currentNodeKey.value = data.id
  loadModels()
}

async function loadBrands() {
  brandLoading.value = true
  try {
    brands.value = await getBrands()
    if (brands.value.length > 0) {
      selectedBrand.value = brands.value[0]
      currentNodeKey.value = `brand-${brands.value[0].id}`
      await loadModels()
    }
  }
  catch { brands.value = [] }
  finally { brandLoading.value = false }
}

async function loadModels() {
  modelLoading.value = true
  selectedModel.value = null
  try { models.value = await getModels(selectedBrand.value?.id) }
  catch { models.value = [] }
  finally { modelLoading.value = false }
}

watch(models, (val) => {
  if (val.length > 0) {
    nextTick(() => {
      modelTableRef.value?.setCurrentRow(val[0])
      selectedModel.value = val[0]
    })
  }
})

function onModelSelect(row: ModelData | null) {
  selectedModel.value = row
}

function openBrandDialog(row?: BrandData) {
  editDialogMode.value = row ? 'edit-brand' : 'create'
  editDialogBrand.value = row || null
  editDialogModel.value = null
  editDialogVisible.value = true
}

function openModelDialog(row?: ModelData) {
  editDialogMode.value = row ? 'edit-model' : 'create'
  editDialogBrand.value = selectedBrand.value
  editDialogModel.value = row || null
  editDialogVisible.value = true
}

function openQuickAddDialog() {
  editDialogMode.value = 'create'
  editDialogBrand.value = null
  editDialogModel.value = null
  editDialogVisible.value = true
}

async function handleUnifiedSave(payload: { brand: { id?: number; name: string; description?: string }; models: Partial<ModelData>[] }) {
  await performSave(payload, false)
}

async function handleUnifiedSaveAndNew(payload: { brand: { id?: number; name: string; description?: string }; models: Partial<ModelData>[] }) {
  await performSave(payload, true)
}

async function performSave(payload: { brand: { id?: number; name: string; description?: string }; models: Partial<ModelData>[] }, keepDialogOpen: boolean) {
  editDialogLoading.value = true
  try {
    let brandId = payload.brand.id
    if (brandId) {
      await updateBrand(brandId, { name: payload.brand.name, description: payload.brand.description })
    } else {
      const created = await createBrand({ name: payload.brand.name, description: payload.brand.description })
      brandId = created.id!
    }

    for (const m of payload.models) {
      if (m.id) {
        const modelData: ModelData = {
          brandId: brandId,
          name: m.name || '',
          color: m.color,
          memory: m.memory,
          salePrice: m.salePrice,
          isSubsidy: m.isSubsidy,
          description: m.description,
        }
        await updateModel(m.id, modelData)
      } else {
        const modelData: ModelData = {
          brandId: brandId,
          name: m.name || '',
          color: m.color,
          memory: m.memory,
          salePrice: m.salePrice,
          isSubsidy: m.isSubsidy,
          description: m.description,
        }
        await createModel(modelData)
      }
    }

    ElMessage.success(`保存成功：${payload.models.length} 个型号`)
    await loadBrands()
    if (brandId) {
      const updated = brands.value.find(b => b.id === brandId)
      if (updated) {
        selectedBrand.value = updated
        currentNodeKey.value = `brand-${updated.id}`
        await loadModels()
      }
    }

    if (keepDialogOpen) {
      editDialogBrand.value = null
      editDialogModel.value = null
      editDialogMode.value = 'create'
    } else {
      editDialogVisible.value = false
    }
  } catch (err: any) {
    ElMessage.error('保存失败：' + (err?.message || '未知错误'))
  } finally {
    editDialogLoading.value = false
  }
}

async function handleDeleteBrand(row: BrandData) {
  try {
    await ElMessageBox.confirm(`确定删除品牌「${row.name}」吗？`, '确认删除', { type: 'warning' })
    await deleteBrand(row.id!)
    ElMessage.success('删除成功')
    if (selectedBrand.value?.id === row.id) {
      selectedBrand.value = null
      models.value = []
      selectedModel.value = null
      currentNodeKey.value = null
    }
    await loadBrands()
  } catch { /* cancelled */ }
}

async function handleDeleteModel(row: ModelData) {
  try {
    await ElMessageBox.confirm(`确定删除型号「${row.name}」吗？`, '确认删除', { type: 'warning' })
    await deleteModel(row.id!)
    ElMessage.success('删除成功')
    await loadBrands()
    await loadModels()
  } catch { /* cancelled */ }
}

onMounted(() => {
  loadBrands()
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

/* ─── Header ─── */
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

.pbm-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: transparent;
  color: var(--pbm-blue);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-ghost:hover { background: var(--pbm-blue-dim); border-color: var(--pbm-blue); }
.pbm-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }
.pbm-btn-ghost:disabled:hover { background: transparent; border-color: var(--pbm-border); }

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

/* ─── Body ─── */
.pbm-body {
  flex: 1;
  display: flex;
  gap: 0;
  min-height: 0;
  overflow: hidden;
}

/* ─── Sidebar ─── */
.pbm-sidebar {
  width: 270px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--pbm-border);
  background: var(--pbm-surface);
}
.pbm-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--pbm-border);
  flex-shrink: 0;
}
.pbm-sidebar-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
}

.pbm-tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  min-height: 0;
}
.pbm-tree-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--pbm-text-dim);
  font-size: 13px;
}

.pbm-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px 6px 8px;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  transition: background 0.12s;
}
.pbm-tree-node:hover { background: var(--pbm-surface-hover); }
.pbm-tree-node.is-active { background: rgba(212,168,83,0.08); }

.pbm-tree-indicator {
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: transparent;
  flex-shrink: 0;
  transition: all 0.2s;
}
.pbm-tree-indicator.is-active { background: var(--pbm-accent); box-shadow: 0 0 6px rgba(201,149,60,0.5); }

.pbm-tree-icon { color: var(--pbm-text-dim); flex-shrink: 0; }
.pbm-tree-label-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.pbm-tree-label { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pbm-tree-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--pbm-text-dim);
  background: #ede7e0;
  padding: 1px 7px;
  border-radius: 10px;
  font-family: var(--pbm-mono);
  flex-shrink: 0;
}
.pbm-tree-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  margin-left: auto;
  animation: fadeIn 0.15s ease;
}

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

/* ─── Main ─── */
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
  padding: 12px 20px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--pbm-border);
}
.pbm-main-head-left { display: flex; align-items: baseline; gap: 12px; }
.pbm-section-title { font-size: 15px; font-weight: 600; color: var(--pbm-text); margin: 0; display: flex; align-items: center; gap: 8px; }
.pbm-section-brand { color: var(--pbm-accent); font-weight: 500; }
.pbm-section-count { font-size: 12px; color: var(--pbm-text-dim); font-family: var(--pbm-mono); }

/* ─── Table ─── */
.pbm-table-wrapper {
  height: 230px;
  flex-shrink: 0;
}

/* Override Element Plus table */
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
.pbm-table-wrapper :deep(.el-table__body tr.current-row) { background: rgba(201,149,60,0.06); }
.pbm-table-wrapper :deep(.el-table__inner-wrapper::before), :deep(.el-table__inner-wrapper::after) { display: none; }
.pbm-table-wrapper :deep(.el-table__body-wrapper) { overflow-y: auto; }
.pbm-table-wrapper :deep(.el-table__body-wrapper::-webkit-scrollbar) { width: 5px; }
.pbm-table-wrapper :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) { background: var(--pbm-border); border-radius: 3px; }

.pbm-cell-name { font-weight: 500; }
.pbm-cell-actions { display: flex; gap: 2px; }

/* ─── Detail Panel ─── */
.pbm-detail-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid var(--pbm-border);
  background: var(--pbm-surface);
}
.pbm-detail-panel--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pbm-detail-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--pbm-border);
  font-size: 12px;
  font-family: var(--pbm-mono);
  flex-shrink: 0;
  background: var(--pbm-bg);
}
.pbm-detail-bar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--pbm-accent);
}
.pbm-detail-bar-label { color: var(--pbm-text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
.pbm-detail-bar-sep { color: var(--pbm-border); }
.pbm-detail-bar-name { color: var(--pbm-accent); font-weight: 500; }

.pbm-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1px;
  background: var(--pbm-border);
  padding: 0;
}

.pbm-spec-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 16px;
  background: var(--pbm-surface);
  transition: background 0.12s;
}
.pbm-spec-card:hover { background: var(--pbm-surface-hover); }

.pbm-spec-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
  font-weight: 600;
}
.pbm-spec-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--pbm-text);
}
.pbm-spec-value--muted { color: var(--pbm-text-dim); font-weight: 400; }

.pbm-detail-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--pbm-text-dim);
  font-size: 13px;
  opacity: 0.6;
}

/* ─── Dialog overrides ─── */
:deep(.pbm-dialog) {
  border-radius: 8px;
  overflow: hidden;
}
:deep(.pbm-dialog .el-dialog) {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: 8px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.15);
}
:deep(.pbm-dialog .el-dialog__header) {
  padding: 16px 24px;
  border-bottom: 1px solid var(--pbm-border);
  margin: 0;
}
:deep(.pbm-dialog .el-dialog__title) {
  font-size: 15px;
  font-weight: 600;
  color: var(--pbm-text);
}
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
:deep(.pbm-dialog .el-divider--horizontal) { border-color: var(--pbm-border); margin: 16px 0; }

.pbm-dialog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
.pbm-form-full { grid-column: 1 / -1; }

/* ─── Scan result ─── */
.pbm-scan-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--pbm-radius);
  margin-bottom: 12px;
  font-size: 13px;
}
.pbm-scan-result div { display: flex; flex-direction: column; gap: 1px; }
.pbm-scan-result div strong { font-weight: 600; }
.pbm-scan-result div span { font-size: 12px; color: var(--pbm-text-dim); }
.pbm-scan-result--ok { background: rgba(201,149,60,0.1); color: #8a6d2e; }
.pbm-scan-result--miss { background: rgba(220,53,69,0.08); color: #c82333; }

/* ─── Animations ─── */
@keyframes fadeIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }

/* ─── Scrollbar ─── */
.pbm-sidebar::-webkit-scrollbar,
.pbm-detail-panel::-webkit-scrollbar,
.pbm-tree-container::-webkit-scrollbar { width: 4px; }
.pbm-sidebar::-webkit-scrollbar-thumb,
.pbm-detail-panel::-webkit-scrollbar-thumb,
.pbm-tree-container::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

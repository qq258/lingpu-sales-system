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
            <el-table-column prop="osType" label="系统" width="100" />
            <el-table-column prop="screenSize" label="屏幕" width="90" />
            <el-table-column prop="cpu" label="处理器" min-width="140" />
            <el-table-column prop="ram" label="内存" width="80" />
            <el-table-column prop="rom" label="存储" width="80" />
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

    <el-dialog v-model="brandDialogVisible" :title="brandIsEdit ? '编辑品牌' : '新增品牌'" width="480px" :close-on-click-modal="false" class="pbm-dialog">
      <el-form ref="brandFormRef" :model="brandForm" :rules="brandRules" label-width="90px" size="default">
        <el-form-item label="品牌名称" prop="name">
          <el-input v-model="brandForm.name" placeholder="例：Apple, Samsung" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="brandForm.description" type="textarea" :rows="3" placeholder="可选描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="pbm-btn-plain" @click="brandDialogVisible = false">取消</button>
        <button class="pbm-btn-accent" :loading="brandSubmitLoading" @click="handleBrandSubmit">{{ brandSubmitLoading ? '提交中...' : '确定' }}</button>
      </template>
    </el-dialog>

    <el-dialog v-model="modelDialogVisible" :title="modelIsEdit ? '编辑型号' : '新增型号'" width="720px" top="4vh" :close-on-click-modal="false" class="pbm-dialog">
      <el-form ref="modelFormRef" :model="modelForm" :rules="modelRules" label-width="100px" size="default">
        <div class="pbm-dialog-grid">
          <el-form-item label="所属品牌" prop="brandId">
            <el-select v-model="modelForm.brandId" placeholder="选择品牌" filterable>
              <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="型号名称" prop="name">
            <el-input v-model="modelForm.name" placeholder="例：iPhone 15 Pro Max" />
          </el-form-item>
          <el-form-item label="操作系统">
            <el-input v-model="modelForm.osType" placeholder="iOS / Android" />
          </el-form-item>
          <el-form-item label="上市年份">
            <el-input-number v-model="modelForm.launchYear" :min="2000" :max="2099" controls-position="right" style="width:100%;" placeholder="2024" />
          </el-form-item>
          <el-form-item label="网络制式">
            <el-select v-model="modelForm.networkType" placeholder="选择" clearable>
              <el-option label="5G" value="5G" />
              <el-option label="4G" value="4G" />
              <el-option label="5G+4G" value="5G+4G" />
            </el-select>
          </el-form-item>
          <el-form-item label="屏幕尺寸">
            <el-input v-model="modelForm.screenSize" placeholder="6.7英寸" />
          </el-form-item>
          <el-form-item label="处理器">
            <el-input v-model="modelForm.cpu" placeholder="A17 Pro" />
          </el-form-item>
          <el-form-item label="电池容量">
            <el-input v-model="modelForm.battery" placeholder="4422mAh" />
          </el-form-item>
          <el-form-item label="运行内存">
            <el-input v-model="modelForm.ram" placeholder="8GB" />
          </el-form-item>
          <el-form-item label="存储容量">
            <el-input v-model="modelForm.rom" placeholder="256GB" />
          </el-form-item>
          <el-form-item label="颜色">
            <el-input v-model="modelForm.color" placeholder="深黑色 / 白色" />
          </el-form-item>
          <el-form-item label="描述" class="pbm-form-full">
            <el-input v-model="modelForm.description" type="textarea" :rows="2" placeholder="可选备注" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <button class="pbm-btn-plain" @click="modelDialogVisible = false">取消</button>
        <button class="pbm-btn-accent" :loading="modelSubmitLoading" @click="handleModelSubmit">{{ modelSubmitLoading ? '提交中...' : '确定' }}</button>
      </template>
    </el-dialog>

    <el-dialog v-model="quickDialogVisible" title="快速新增 — 扫码录入" width="520px" :close-on-click-modal="false" class="pbm-dialog">
      <el-form ref="quickFormRef" :model="quickForm" :rules="quickRules" label-width="90px" size="default">
        <el-form-item label="扫码枪" prop="barcode">
          <el-input ref="scanInputRef" v-model="quickForm.barcode" placeholder="对准条码扫一下，自动识别" clearable @keyup.enter="handleScanBarcode">
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 7V2h5"/><path d="M17 2h5v5"/><path d="M2 17v5h5"/><path d="M17 22h5v-5"/></svg>
            </template>
          </el-input>
        </el-form-item>
        <div v-if="scanResult" class="pbm-scan-result" :class="scanResult.found ? 'pbm-scan-result--ok' : 'pbm-scan-result--miss'">
          <svg v-if="scanResult.found" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <div>
            <strong>{{ scanResult.found ? '已识别' : '未匹配' }}</strong>
            <span v-if="scanResult.found">{{ scanResult.brandName }} · {{ scanResult.modelName }}</span>
            <span v-else>未找到商品信息，请手动填写</span>
          </div>
        </div>
        <el-divider />
        <el-form-item label="品牌" prop="brandName">
          <el-input v-model="quickForm.brandName" placeholder="输入或扫码自动填充">
            <template #append>
              <button class="pbm-btn-ghost" @click="quickSaveBrand" style="height:100%;border:none;background:none;padding:0 12px;cursor:pointer;color:#3b82f6;font-size:13px;">保存</button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="型号" prop="modelName">
          <el-input v-model="quickForm.modelName" placeholder="输入或扫码自动填充" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="pbm-btn-plain" @click="quickDialogVisible = false">取消</button>
        <button class="pbm-btn-accent" :loading="quickSubmitLoading" @click="handleQuickSubmit">{{ quickSubmitLoading ? '保存中...' : '保存品牌与型号' }}</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type ElTree from 'element-plus/es/components/tree'
import { getBrands, getModels, createBrand, updateBrand, deleteBrand, createModel, updateModel, deleteModel, scanBarcode } from '@/api/product'
import type { BrandData, ModelData } from '@/api/product'
import { exportWithQuery } from '@/api/tools'
import { createScanner } from '@/utils/scanner'

const brandLoading = ref(false)
const modelLoading = ref(false)
const brands = ref<BrandData[]>([])
const models = ref<ModelData[]>([])
const selectedBrand = ref<BrandData | null>(null)
const selectedModel = ref<ModelData | null>(null)
const treeRef = ref<InstanceType<typeof ElTree>>()
const modelTableRef = ref()

const currentNodeKey = ref<string | null>(null)

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
    { label: '上市年份', value: m.launchYear?.toString() },
    { label: '操作系统', value: m.osType },
    { label: '网络制式', value: m.networkType },
    { label: '屏幕尺寸', value: m.screenSize },
    { label: '处理器', value: m.cpu },
    { label: '运行内存', value: m.ram },
    { label: '存储容量', value: m.rom },
    { label: '电池容量', value: m.battery },
    { label: '颜色', value: m.color },
    { label: '描述', value: m.description },
  ]
})

function onTreeNodeClick(data: TreeNode) {
  selectedBrand.value = data.source
  currentNodeKey.value = data.id
  loadModels()
}

const brandDialogVisible = ref(false)
const brandIsEdit = ref(false)
const brandEditId = ref<number | null>(null)
const brandSubmitLoading = ref(false)
const brandFormRef = ref<FormInstance>()
const brandForm = ref<BrandData>({ name: '', description: '' })
const brandRules: FormRules = {
  name: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
}

const modelDialogVisible = ref(false)
const modelIsEdit = ref(false)
const modelEditId = ref<number | null>(null)
const modelSubmitLoading = ref(false)
const modelFormRef = ref<FormInstance>()
const modelForm = ref<ModelData>({ brandId: 0, name: '' })
const modelRules: FormRules = {
  brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }],
  name: [{ required: true, message: '请输入型号名称', trigger: 'blur' }],
}

const quickDialogVisible = ref(false)
const quickSubmitLoading = ref(false)
const quickFormRef = ref<FormInstance>()
const scanInputRef = ref()
const quickForm = ref({ barcode: '', brandName: '', modelName: '' })
const quickRules: FormRules = {
  brandName: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入型号名称', trigger: 'blur' }],
}
const scanResult = ref<{ found: boolean; brandName: string; modelName: string } | null>(null)

let scanner: ReturnType<typeof createScanner> | null = null

function resetModelForm() {
  return {
    brandId: selectedBrand.value?.id || 0,
    name: '', color: '', ram: '', rom: '',
    osType: '', launchYear: undefined as number | undefined,
    networkType: '', screenSize: '', cpu: '', battery: '', description: '',
  }
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
  if (row) {
    brandIsEdit.value = true
    brandEditId.value = row.id!
    brandForm.value = { name: row.name, description: row.description }
  } else {
    brandIsEdit.value = false
    brandEditId.value = null
    brandForm.value = { name: '', description: '' }
  }
  brandDialogVisible.value = true
}

async function handleBrandSubmit() {
  const valid = await brandFormRef.value?.validate().catch(() => false)
  if (!valid) return
  brandSubmitLoading.value = true
  try {
    if (brandIsEdit.value && brandEditId.value) {
      await updateBrand(brandEditId.value, brandForm.value)
      ElMessage.success('更新成功')
    } else {
      await createBrand(brandForm.value)
      ElMessage.success('创建成功')
    }
    brandDialogVisible.value = false
    await loadBrands()
  } finally { brandSubmitLoading.value = false }
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

function openModelDialog(row?: ModelData) {
  if (row) {
    modelIsEdit.value = true
    modelEditId.value = row.id!
    modelForm.value = { ...row }
  } else {
    modelIsEdit.value = false
    modelEditId.value = null
    modelForm.value = resetModelForm()
  }
  modelDialogVisible.value = true
}

async function handleModelSubmit() {
  const valid = await modelFormRef.value?.validate().catch(() => false)
  if (!valid) return
  modelSubmitLoading.value = true
  try {
    if (modelIsEdit.value && modelEditId.value) {
      await updateModel(modelEditId.value, { ...modelForm.value })
      ElMessage.success('更新成功')
    } else {
      await createModel({ ...modelForm.value })
      ElMessage.success('创建成功')
    }
    modelDialogVisible.value = false
    await loadBrands()
    await loadModels()
  } finally { modelSubmitLoading.value = false }
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

async function openQuickAddDialog() {
  scanResult.value = null
  quickForm.value = { barcode: '', brandName: '', modelName: '' }
  quickDialogVisible.value = true
  await nextTick()
  const input = scanInputRef.value?.$el?.querySelector('input')
  if (input) input.focus()
}

async function handleScanBarcode() {
  const barcode = quickForm.value.barcode.trim()
  if (!barcode) return
  try {
    const result = await scanBarcode(barcode)
    quickForm.value.brandName = result.brandName
    quickForm.value.modelName = result.modelName
    scanResult.value = { found: true, brandName: result.brandName, modelName: result.modelName }
    ElMessage.success(`已识别：${result.brandName} ${result.modelName}`)
  } catch {
    scanResult.value = { found: false, brandName: '', modelName: '' }
    ElMessage.warning('未找到该条码对应的商品信息，请手动填写品牌和型号')
  }
}

async function quickSaveBrand() {
  const name = quickForm.value.brandName.trim()
  if (!name) { ElMessage.warning('请先输入品牌名称'); return }
  if (brands.value.find(b => b.name === name)) { ElMessage.info(`品牌「${name}」已存在`); return }
  try {
    await createBrand({ name })
    ElMessage.success('品牌保存成功')
    await loadBrands()
  } catch { /* handled */ }
}

async function handleQuickSubmit() {
  const valid = await quickFormRef.value?.validate().catch(() => false)
  if (!valid) return
  quickSubmitLoading.value = true
  try {
    const brandName = quickForm.value.brandName.trim()
    const modelName = quickForm.value.modelName.trim()
    let brand = brands.value.find(b => b.name === brandName)
    if (!brand) { brand = await createBrand({ name: brandName }); await loadBrands() }
    const existingModels = await getModels(brand.id)
    if (existingModels.find(m => m.name === modelName && m.brandId === brand.id)) {
      ElMessage.warning(`型号「${modelName}」已存在`); return
    }
    await createModel({ brandId: brand.id!, name: modelName })
    ElMessage.success(`品牌「${brandName}」、型号「${modelName}」保存成功`)
    selectedBrand.value = brands.value.find(b => b.id === brand.id) || brand
    await loadBrands(); await loadModels()
    quickDialogVisible.value = false
  } catch { /* handled */ }
  finally { quickSubmitLoading.value = false }
}

onMounted(() => {
  loadBrands()
  nextTick(() => {
    scanner = createScanner({
      onScan: (code: string) => {
        if (quickDialogVisible.value) {
          quickForm.value.barcode = code
          handleScanBarcode()
        }
      },
    })
    scanner.attach()
  })
})

onUnmounted(() => { if (scanner) scanner.detach() })
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

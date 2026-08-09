<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">品牌型号维护</h1>
      <span class="title-line"></span>
      <div class="bm-header-actions">
        <button class="bm-btn-plain" @click="exportBrands()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出品牌
        </button>
        <button class="bm-btn-plain" @click="exportModels()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出型号
        </button>
        <button class="bm-btn-plain" @click="importDialogVisible = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          批量导入
        </button>
        <button class="bm-btn-accent" @click="openQuickAdd">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          快速新增
        </button>
      </div>
    </div>

    <div class="bm-layout">
      <!-- 左侧：品牌清单 -->
      <aside class="bm-side glass">
        <div class="bm-side-head">
          <span class="bm-side-title">品牌清单</span>
          <button class="bm-add-brand" @click="openBrandDialog()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新增品牌
          </button>
        </div>
        <div class="bm-tree-wrap" v-loading="brandLoading" element-loading-background="rgba(255,255,255,0.6)">
          <div
            v-for="b in brands"
            :key="b.id"
            class="bm-brand-node"
            :class="{ 'is-current': selectedBrand?.id === b.id }"
            @click="onSelectBrand(b)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <span class="bm-brand-name">{{ b.name }}</span>
            <span class="bm-brand-count">{{ b._count?.models || 0 }}</span>
            <span class="bm-brand-actions">
              <button class="bm-act" title="编辑品牌" @click.stop="openBrandDialog(b)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="bm-act bm-act--danger" title="删除品牌" @click.stop="handleDeleteBrand(b)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </span>
          </div>
          <div v-if="!brandLoading && !brands.length" class="empty-hint">暂无品牌</div>
        </div>
      </aside>

      <!-- 右侧：型号目录 -->
      <main class="bm-main">
        <div class="bm-main-head glass">
          <div class="bm-main-title">
            <span>型号目录</span>
            <span v-if="selectedBrand" class="bm-main-brand">{{ selectedBrand.name }}</span>
            <span v-if="selectedBrand" class="bm-main-count">{{ models.length }} 个型号</span>
          </div>
          <button class="bm-btn-accent bm-btn-accent--sm" :disabled="!selectedBrand" @click="openModelDialog()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新增型号
          </button>
        </div>

        <div class="bm-table-wrap glass">
          <el-table :data="models" v-loading="modelLoading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
            <el-table-column type="index" label="#" width="52" align="center" />
            <el-table-column prop="name" label="型号名称" min-width="160">
              <template #default="{ row }">
                <span class="bm-cell-name">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="color" label="颜色" width="110" />
            <el-table-column prop="memory" label="内存" width="130" />
            <el-table-column label="售价" width="110" align="right">
              <template #default="{ row }">
                <span class="bm-cell-price">¥{{ (row.sale_price || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="成本价" width="110" align="right">
              <template #default="{ row }">
                <span class="bm-cell-muted">¥{{ (row.cost_price || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="国补" width="70" align="center">
              <template #default="{ row }">
                <span :class="['bm-cell-subsidy', row.is_subsidy ? 'is-yes' : '']">{{ row.is_subsidy ? '是' : '否' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="bm-cell-muted">{{ row.description || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row }">
                <div class="bm-cell-actions">
                  <button class="bm-act" title="编辑" @click="openModelDialog(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="bm-act bm-act--danger" title="删除" @click="handleDeleteModel(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="!modelLoading && selectedBrand && !models.length" class="empty-hint">该品牌下暂无型号</div>
        </div>
      </main>
    </div>

    <!-- 品牌新增/编辑 -->
    <el-dialog v-model="brandDialogVisible" :title="brandForm.id ? '编辑品牌' : '新增品牌'" width="440px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="品牌名称" required>
          <el-input v-model="brandForm.name" placeholder="例：Apple" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="brandForm.description" placeholder="可选描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="brandDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="brandSaving" @click="saveBrand">保存</el-button>
      </template>
    </el-dialog>

    <!-- 型号新增/编辑 -->
    <el-dialog v-model="modelDialogVisible" :title="modelForm.id ? '编辑型号' : '新增型号'" width="520px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="所属品牌">
          <span class="bm-form-brand">{{ selectedBrand?.name }}</span>
        </el-form-item>
        <el-form-item label="型号名称" required>
          <el-input v-model="modelForm.name" placeholder="例：iPhone 15 Pro Max" />
        </el-form-item>
        <div class="bm-form-grid">
          <el-form-item label="颜色">
            <el-input v-model="modelForm.color" placeholder="深黑色" />
          </el-form-item>
          <el-form-item label="内存">
            <el-input v-model="modelForm.memory" placeholder="8GB/256GB" />
          </el-form-item>
        </div>
        <div class="bm-form-grid">
          <el-form-item label="售价">
            <el-input-number v-model="modelForm.salePrice" :min="0" :precision="2" :step="100" controls-position="right" style="width:100%;" />
          </el-form-item>
          <el-form-item label="成本价">
            <el-input-number v-model="modelForm.costPrice" :min="0" :precision="2" :step="100" controls-position="right" style="width:100%;" />
          </el-form-item>
        </div>
        <el-form-item label="国补">
          <el-switch v-model="modelForm.isSubsidy" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="modelForm.description" type="textarea" :rows="2" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modelDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="modelSaving" @click="saveModel">保存</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增（品牌+型号一步完成） -->
    <el-dialog v-model="quickDialogVisible" title="快速新增" width="480px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="品牌" required>
          <el-input v-model="quickForm.brandName" placeholder="已存在的品牌将自动复用" />
        </el-form-item>
        <el-form-item label="型号" required>
          <el-input v-model="quickForm.name" placeholder="例：iPhone 15 Pro Max" />
        </el-form-item>
        <div class="bm-form-grid">
          <el-form-item label="颜色">
            <el-input v-model="quickForm.color" placeholder="深黑色" />
          </el-form-item>
          <el-form-item label="内存">
            <el-input v-model="quickForm.memory" placeholder="8GB/256GB" />
          </el-form-item>
        </div>
        <el-form-item label="售价">
          <el-input-number v-model="quickForm.salePrice" :min="0" :precision="2" :step="100" controls-position="right" style="width:100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="quickSaving" @click="saveQuick">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入 -->
    <el-dialog v-model="importDialogVisible" title="批量导入品牌与型号" width="560px" destroy-on-close>
      <div class="bm-import-step">
        <span class="bm-import-num">1</span>
        <div class="bm-import-step-body">
          <div class="bm-import-step-title">下载模板</div>
          <button class="bm-link-btn" @click="downloadBrandModelTemplate()">↓ 下载 .xlsx 模板</button>
        </div>
      </div>
      <div class="bm-import-step">
        <span class="bm-import-num">2</span>
        <div class="bm-import-step-body">
          <div class="bm-import-step-title">选择文件</div>
          <div
            class="bm-dropzone"
            :class="{ 'has-file': !!importFile }"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @drop.prevent="onDropFile"
          >
            <input ref="importFileRef" type="file" accept=".xlsx,.xls" @change="onPickFile" hidden />
            <div v-if="!importFile" class="bm-dropzone-empty" @click="importFileRef?.click()">
              <span>点击选择或拖拽 .xlsx 文件</span>
            </div>
            <div v-else class="bm-dropzone-filled">
              <span class="bm-file-name">{{ importFile.name }}</span>
              <button class="bm-link-btn" @click="resetImportFile">重选</button>
            </div>
          </div>
        </div>
      </div>
      <div class="bm-import-step">
        <span class="bm-import-num">3</span>
        <div class="bm-import-step-body">
          <div class="bm-import-step-title">重复数据处理</div>
          <el-radio-group v-model="conflictMode">
            <el-radio value="skip">跳过已存在（推荐）</el-radio>
            <el-radio value="overwrite">用文件数据覆盖</el-radio>
          </el-radio-group>
        </div>
      </div>

      <div v-if="importResult" class="bm-import-result">
        <div class="bm-import-result-title">导入完成</div>
        <div class="bm-import-result-grid">
          <div class="bm-import-card bm-import-card--ok"><div class="bm-import-num">{{ importResult.success }}</div><div>新建成功</div></div>
          <div class="bm-import-card bm-import-card--skip"><div class="bm-import-num">{{ importResult.skipped }}</div><div>已跳过</div></div>
          <div class="bm-import-card bm-import-card--over"><div class="bm-import-num">{{ importResult.overwritten || 0 }}</div><div>已覆盖</div></div>
          <div class="bm-import-card bm-import-card--err"><div class="bm-import-num">{{ importResult.errors?.length || 0 }}</div><div>失败</div></div>
        </div>
        <div v-if="importResult.errors && importResult.errors.length" class="bm-import-errors">
          <div v-for="(e, i) in importResult.errors.slice(0, 8)" :key="i" class="bm-import-error">第{{ e.row }}行：{{ e.message }}</div>
          <div v-if="importResult.errors.length > 8" class="bm-import-error">… 共 {{ importResult.errors.length }} 条错误</div>
        </div>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">关闭</el-button>
        <el-button v-if="!importResult" type="primary" :loading="importing" :disabled="!importFile" @click="handleImport">
          {{ importing ? '导入中...' : '开始导入' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBrands,
  getModels,
  createBrand,
  updateBrand,
  deleteBrand,
  createModel,
  updateModel,
  deleteModel,
  exportBrands,
  exportModels,
  importBrandModels,
  downloadBrandModelTemplate,
} from '@/api/product'

// ---- 左侧品牌 ----
const brandLoading = ref(false)
const brands = ref<any[]>([])
const selectedBrand = ref<any>(null)

// ---- 右侧型号 ----
const modelLoading = ref(false)
const models = ref<any[]>([])

// ---- 弹窗 ----
const brandDialogVisible = ref(false)
const brandSaving = ref(false)
const brandForm = ref<{ id: number | null; name: string; description: string }>({ id: null, name: '', description: '' })

const modelDialogVisible = ref(false)
const modelSaving = ref(false)
const modelForm = ref({
  id: null as number | null,
  name: '',
  color: '',
  memory: '',
  salePrice: 0,
  costPrice: 0,
  isSubsidy: false,
  description: '',
})

const quickDialogVisible = ref(false)
const quickSaving = ref(false)
const quickForm = ref({ brandName: '', name: '', color: '', memory: '', salePrice: 0 })

const importDialogVisible = ref(false)
const importing = ref(false)
const importFile = ref<File | null>(null)
const importFileRef = ref<HTMLInputElement>()
const isDragover = ref(false)
const conflictMode = ref<'skip' | 'overwrite'>('skip')
const importResult = ref<{ success: number; skipped: number; overwritten?: number; errors?: Array<{ row: number; message: string }> } | null>(null)

// ---- 品牌 ----
async function loadBrands() {
  brandLoading.value = true
  try {
    brands.value = await getBrands()
    if (selectedBrand.value) {
      const keep = brands.value.find((b: any) => b.id === selectedBrand.value.id)
      if (keep) {
        selectedBrand.value = keep
        await loadModels()
      } else {
        selectedBrand.value = null
        models.value = []
      }
    }
  } catch {
    brands.value = []
  } finally {
    brandLoading.value = false
  }
}

function onSelectBrand(b: any) {
  selectedBrand.value = b
  loadModels()
}

function openBrandDialog(brand?: any) {
  brandForm.value = brand
    ? { id: brand.id, name: brand.name, description: brand.description || '' }
    : { id: null, name: '', description: '' }
  brandDialogVisible.value = true
}

async function saveBrand() {
  const name = brandForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入品牌名称')
    return
  }
  brandSaving.value = true
  try {
    if (brandForm.value.id) {
      await updateBrand(brandForm.value.id, name, brandForm.value.description)
    } else {
      await createBrand(name, brandForm.value.description)
    }
    ElMessage.success('保存成功')
    brandDialogVisible.value = false
    await loadBrands()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    brandSaving.value = false
  }
}

async function handleDeleteBrand(brand: any) {
  try {
    await ElMessageBox.confirm(`确定删除品牌「${brand.name}」？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteBrand(brand.id)
    ElMessage.success('删除成功')
    if (selectedBrand.value?.id === brand.id) {
      selectedBrand.value = null
      models.value = []
    }
    await loadBrands()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

// ---- 型号 ----
async function loadModels() {
  if (!selectedBrand.value) {
    models.value = []
    return
  }
  modelLoading.value = true
  try {
    models.value = await getModels(selectedBrand.value.id)
  } catch {
    models.value = []
  } finally {
    modelLoading.value = false
  }
}

function openModelDialog(model?: any) {
  modelForm.value = model
    ? {
        id: model.id,
        name: model.name,
        color: model.color || '',
        memory: model.memory || '',
        salePrice: model.sale_price || 0,
        costPrice: model.cost_price || 0,
        isSubsidy: !!model.is_subsidy,
        description: model.description || '',
      }
    : { id: null, name: '', color: '', memory: '', salePrice: 0, costPrice: 0, isSubsidy: false, description: '' }
  modelDialogVisible.value = true
}

async function saveModel() {
  const name = modelForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入型号名称')
    return
  }
  if (!selectedBrand.value) {
    ElMessage.warning('请先选择品牌')
    return
  }
  modelSaving.value = true
  try {
    const data = {
      color: modelForm.value.color,
      memory: modelForm.value.memory,
      sale_price: modelForm.value.salePrice || 0,
      cost_price: modelForm.value.costPrice || 0,
      is_subsidy: modelForm.value.isSubsidy,
      description: modelForm.value.description,
    }
    if (modelForm.value.id) {
      await updateModel(modelForm.value.id, selectedBrand.value.id, name, data)
    } else {
      await createModel(selectedBrand.value.id, name, data)
    }
    ElMessage.success('保存成功')
    modelDialogVisible.value = false
    await loadModels()
    await loadBrands()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    modelSaving.value = false
  }
}

async function handleDeleteModel(model: any) {
  try {
    await ElMessageBox.confirm(`确定删除型号「${model.name}」？删除后该型号将被停用。`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteModel(model.id)
    ElMessage.success('删除成功')
    await loadModels()
    await loadBrands()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

// ---- 快速新增 ----
function openQuickAdd() {
  quickForm.value = { brandName: '', name: '', color: '', memory: '', salePrice: 0 }
  quickDialogVisible.value = true
}

async function saveQuick() {
  const brandName = quickForm.value.brandName.trim()
  const name = quickForm.value.name.trim()
  if (!brandName) {
    ElMessage.warning('请输入品牌名称')
    return
  }
  if (!name) {
    ElMessage.warning('请输入型号名称')
    return
  }
  quickSaving.value = true
  try {
    let brand = brands.value.find((b: any) => b.name === brandName)
    if (!brand) {
      const created = await createBrand(brandName)
      brand = created
      await loadBrands()
    }
    await createModel(brand.id, name, {
      color: quickForm.value.color,
      memory: quickForm.value.memory,
      sale_price: quickForm.value.salePrice || 0,
    })
    ElMessage.success('快速新增成功')
    quickDialogVisible.value = false
    selectedBrand.value = brands.value.find((b: any) => b.id === brand.id) || brand
    await loadModels()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    quickSaving.value = false
  }
}

// ---- 批量导入 ----
function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    importFile.value = input.files[0]
    importResult.value = null
  }
}

function resetImportFile() {
  importFile.value = null
  if (importFileRef.value) importFileRef.value.value = ''
}

function onDropFile(e: DragEvent) {
  isDragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && /\.(xlsx|xls)$/i.test(file.name)) {
    importFile.value = file
    importResult.value = null
  } else {
    ElMessage.warning('请选择 .xlsx / .xls 文件')
  }
}

async function handleImport() {
  if (!importFile.value) return
  importing.value = true
  try {
    importResult.value = await importBrandModels(importFile.value, conflictMode.value)
    ElMessage.success('导入完成')
    await loadBrands()
    if (selectedBrand.value) await loadModels()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  loadBrands()
})
</script>

<style scoped>
.bm-header-actions { display: flex; gap: 8px; }
.bm-layout { display: flex; gap: 20px; align-items: flex-start; }

/* 按钮 */
.bm-btn-accent { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.bm-btn-accent:hover { background: var(--primary-dark); }
.bm-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; }
.bm-btn-accent--sm { height: 32px; padding: 0 14px; font-size: 13px; }
.bm-btn-plain { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: var(--transition); }
.bm-btn-plain:hover { border-color: var(--primary); color: var(--primary); }

/* 左侧品牌 */
.bm-side { width: 280px; border-radius: var(--radius); overflow: hidden; flex-shrink: 0; }
.bm-side-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.bm-side-title { font-size: 15px; font-weight: 600; color: var(--text); }
.bm-add-brand { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 12px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.bm-add-brand:hover { background: var(--primary-dark); }
.bm-tree-wrap { max-height: calc(100vh - 220px); overflow-y: auto; padding: 8px; }
.bm-brand-node { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; cursor: pointer; transition: var(--transition); }
.bm-brand-node:hover { background: rgba(37,99,235,0.06); }
.bm-brand-node.is-current { background: var(--primary-light); }
.bm-brand-name { flex: 1; font-size: 14px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bm-brand-count { font-size: 12px; color: var(--text-tertiary); background: rgba(226,232,240,0.6); padding: 1px 8px; border-radius: 10px; flex-shrink: 0; }
.bm-brand-actions { display: none; align-items: center; gap: 2px; flex-shrink: 0; }
.bm-brand-node:hover .bm-brand-actions, .bm-brand-node.is-current .bm-brand-actions { display: flex; }
.bm-act { width: 24px; height: 24px; border: none; border-radius: 6px; background: rgba(37,99,235,0.1); color: var(--primary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
.bm-act:hover { background: var(--primary); color: #fff; }
.bm-act--danger { background: rgba(239,68,68,0.1); color: var(--danger); }
.bm-act--danger:hover { background: var(--danger); color: #fff; }

/* 右侧型号 */
.bm-main { flex: 1; min-width: 0; }
.bm-main-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-radius: var(--radius); margin-bottom: 16px; }
.bm-main-title { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; color: var(--text); }
.bm-main-brand { color: var(--primary); font-weight: 600; }
.bm-main-count { font-size: 13px; color: var(--text-tertiary); font-weight: 400; }
.bm-table-wrap { border-radius: var(--radius); padding: 8px; }
.bm-cell-name { font-weight: 500; color: var(--text); }
.bm-cell-price { font-weight: 600; color: var(--text); font-family: monospace; }
.bm-cell-muted { color: var(--text-tertiary); }
.bm-cell-subsidy { font-size: 12px; padding: 2px 8px; border-radius: 6px; background: var(--border); color: var(--text-tertiary); }
.bm-cell-subsidy.is-yes { background: var(--success-light); color: #16a34a; }
.bm-cell-actions { display: flex; gap: 6px; justify-content: center; }
.bm-form-brand { font-size: 14px; color: var(--primary); font-weight: 600; }
.bm-form-grid { display: flex; gap: 12px; }
.bm-form-grid .el-form-item { flex: 1; }

/* 导入 */
.bm-import-step { display: flex; gap: 12px; margin-bottom: 16px; }
.bm-import-num { width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bm-import-step-body { flex: 1; }
.bm-import-step-title { font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 8px; }
.bm-link-btn { border: none; background: none; color: var(--primary); font-size: 13px; cursor: pointer; font-family: inherit; padding: 0; }
.bm-link-btn:hover { text-decoration: underline; }
.bm-dropzone { border: 1.5px dashed var(--border); border-radius: var(--radius-sm); padding: 18px; text-align: center; cursor: pointer; transition: var(--transition); }
.bm-dropzone:hover { border-color: var(--primary); }
.bm-dropzone.has-file { border-style: solid; border-color: var(--success); }
.bm-dropzone-empty { font-size: 13px; color: var(--text-tertiary); }
.bm-dropzone-filled { display: flex; align-items: center; justify-content: center; gap: 10px; }
.bm-file-name { font-size: 13px; color: var(--text); font-weight: 500; }
.bm-import-result { margin-top: 6px; padding: 14px; background: rgba(226,232,240,0.25); border-radius: var(--radius-sm); }
.bm-import-result-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 10px; }
.bm-import-result-grid { display: flex; gap: 10px; }
.bm-import-card { flex: 1; text-align: center; padding: 10px 0; border-radius: var(--radius-sm); font-size: 12px; color: var(--text-secondary); }
.bm-import-card--ok { background: var(--success-light); color: #16a34a; }
.bm-import-card--skip { background: #FEF3C7; color: #b45309; }
.bm-import-card--over { background: var(--primary-light); color: var(--primary); }
.bm-import-card--err { background: var(--danger-light); color: var(--danger); }
.bm-import-num { font-size: 20px; font-weight: 700; }
.bm-import-errors { margin-top: 10px; max-height: 140px; overflow-y: auto; }
.bm-import-error { font-size: 12px; color: var(--danger); font-family: monospace; padding: 2px 0; }
</style>

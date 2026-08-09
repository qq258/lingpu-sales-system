<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">库存管理</h1>
      <span class="title-line"></span>
    </div>

    <div class="im-layout">
      <!-- 左侧：品牌型号树 -->
      <aside class="im-side glass">
        <div class="im-side-head">
          <span class="im-side-title">品牌型号</span>
          <button class="im-add-brand-btn" @click="openBrandDialog()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新增品牌
          </button>
        </div>
        <div class="im-tree-wrap" v-loading="treeLoading" element-loading-background="rgba(255,255,255,0.6)">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            highlight-current
            :current-node-key="currentNodeKey"
            default-expand-all
            @node-click="onNodeClick"
          >
            <template #default="{ node, data }">
              <div class="im-node" :class="{ 'is-current': node.isCurrent }">
                <span class="im-node-label">{{ data.label }}</span>
                <span v-if="data.type === 'model'" class="im-node-stock">{{ data.stock }} 台</span>
                <span class="im-node-actions">
                  <button v-if="data.type === 'brand'" class="im-act" title="新增型号" @click.stop="openModelDialog(undefined, data)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  <button class="im-act" :title="data.type === 'brand' ? '编辑品牌' : '编辑型号'" @click.stop="data.type === 'brand' ? openBrandDialog(data.source) : openModelDialog(data.source)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="im-act im-act--danger" :title="data.type === 'brand' ? '删除品牌' : '删除型号'" @click.stop="data.type === 'brand' ? handleDeleteBrand(data.source) : handleDeleteModel(data.source)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </span>
              </div>
            </template>
          </el-tree>
          <div v-if="!treeLoading && !treeData.length" class="empty-hint">暂无品牌型号</div>
        </div>
      </aside>

      <!-- 右侧：筛选 + 库存 -->
      <main class="im-main">
        <div class="im-filter glass">
          <input v-model="keyword" class="im-filter-input" placeholder="搜索 IMEI / IMEI2 / SN码..." />
          <el-select v-model="colorFilter" placeholder="全部颜色" clearable size="large" style="width:150px;">
            <el-option v-for="c in colorOptions" :key="c" :label="c" :value="c" />
          </el-select>
          <el-select v-model="memoryFilter" placeholder="全部内存" clearable size="large" style="width:150px;">
            <el-option v-for="m in memoryOptions" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="im-filter-info">
            {{ selectedModel ? `型号：${selectedModel.name}` : '全部型号' }} · 显示 {{ filteredList.length }} 件在库
          </span>
          <button v-if="selectedModel && total > 0" class="im-clear-btn" @click="openClearModel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            清空该型号库存
          </button>
        </div>

        <div v-if="loading" class="im-squares">
          <div v-for="i in 8" :key="i" class="im-square im-square--skeleton" :style="{ animationDelay: (i * 0.05) + 's' }"></div>
        </div>
        <div v-else-if="filteredList.length" class="im-squares">
          <div v-for="item in filteredList" :key="item.id" class="im-square glass">
            <div class="im-square-top">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="15" y2="10"/></svg>
              <span class="im-square-brand">{{ item.brandName }}</span>
              <button class="im-square-del" title="删除库存" @click="openDeleteImei(item)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            </div>
            <div class="im-square-model">{{ item.modelName }}</div>
            <div class="im-square-spec">{{ item.color }}{{ item.color && item.storage ? ' · ' : '' }}{{ item.storage }}</div>
            <div class="im-square-imei">{{ item.imei }}</div>
            <div class="im-square-foot">
              <span class="im-square-store">{{ item.storeName }}</span>
              <span class="im-square-badge">在库</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-hint">{{ selectedModel ? '该型号暂无在库商品' : '点击左侧型号节点查看库存' }}</div>

        <div v-if="total > pageSize" class="pagination-row">
          <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next" size="large" @change="loadInventory" />
        </div>
      </main>
    </div>

    <!-- 品牌新增/编辑 -->
    <el-dialog v-model="brandDialogVisible" :title="brandForm.id ? '编辑品牌' : '新增品牌'" width="460px" destroy-on-close>
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
          <span class="im-model-brand">{{ modelForm.brandName }}</span>
        </el-form-item>
        <el-form-item label="型号名称" required>
          <el-input v-model="modelForm.name" placeholder="例：iPhone 15 Pro Max" />
        </el-form-item>
        <div class="im-model-grid">
          <el-form-item label="颜色">
            <el-input v-model="modelForm.color" placeholder="深黑色" />
          </el-form-item>
          <el-form-item label="内存">
            <el-input v-model="modelForm.memory" placeholder="8GB/256GB" />
          </el-form-item>
        </div>
        <div class="im-model-grid">
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
      </el-form>
      <template #footer>
        <el-button @click="modelDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="modelSaving" @click="saveModel">保存</el-button>
      </template>
    </el-dialog>

    <!-- 删除库存（原因必填） -->
    <el-dialog v-model="deleteDialogVisible" title="删除库存" width="480px" destroy-on-close>
      <div v-if="deleteTarget" class="im-del-tip">
        <span>将删除：</span>
        <template v-if="deleteTarget.type === 'imei'">
          <strong>{{ deleteTarget.item.brandName }} {{ deleteTarget.item.modelName }}</strong>
          <span class="im-del-imei">（IMEI: {{ deleteTarget.item.imei }}）</span>
        </template>
        <template v-else>
          型号 <strong>{{ deleteTarget.item.name }}</strong> 的全部在库库存（{{ deleteTarget.count }} 台）
        </template>
      </div>
      <div class="im-del-reason">
        <span class="im-del-reason-label">删除原因（必填）</span>
        <el-input v-model="deleteReason" type="textarea" :rows="3" placeholder="删除原因将记录到库存流水与操作日志" />
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="deleting" :disabled="!deleteReason.trim()" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getInventoryTree,
  getInventoryImeiList,
  deleteImeiInventory,
  deleteModelInventory,
} from '@/api/inventory'
import { createBrand, updateBrand, deleteBrand, createModel, updateModel, deleteModel } from '@/api/product'

const userStore = useUserStore()

// ---- 左侧树 ----
const treeLoading = ref(false)
const treeData = ref<any[]>([])
const treeProps = { label: 'label', children: 'children' }
const treeRef = ref()
const currentNodeKey = ref('')
const selectedModel = ref<any>(null)

// ---- 右侧库存 ----
const keyword = ref('')
const colorFilter = ref('')
const memoryFilter = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(200)
const loading = ref(false)

// ---- 弹窗 ----
const brandDialogVisible = ref(false)
const brandSaving = ref(false)
const brandForm = ref<{ id: number | null; name: string; description: string }>({ id: null, name: '', description: '' })

const modelDialogVisible = ref(false)
const modelSaving = ref(false)
const modelForm = ref({
  id: null as number | null,
  brandId: 0,
  brandName: '',
  name: '',
  color: '',
  memory: '',
  salePrice: 0,
  costPrice: 0,
  isSubsidy: false,
})

const deleteDialogVisible = ref(false)
const deleteReason = ref('')
const deleting = ref(false)
const deleteTarget = ref<any>(null)

const colorOptions = computed(() => [...new Set(list.value.map((i) => i.color).filter(Boolean))])
const memoryOptions = computed(() => [...new Set(list.value.map((i) => i.storage).filter(Boolean))])

const filteredList = computed(() => {
  let arr = list.value
  if (colorFilter.value) arr = arr.filter((i) => i.color === colorFilter.value)
  if (memoryFilter.value) arr = arr.filter((i) => i.storage === memoryFilter.value)
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    arr = arr.filter((i) => [i.imei, i.imei2, i.sn_code, i.modelName, i.brandName]
      .some((v) => v && String(v).toLowerCase().includes(kw)))
  }
  return arr
})

// ---- 加载树 ----
async function loadTree() {
  treeLoading.value = true
  try {
    const data = await getInventoryTree({ storeId: userStore.effectiveStoreId || undefined })
    treeData.value = data.map((b: any) => ({
      id: `brand-${b.id}`,
      label: b.name,
      type: 'brand',
      source: b,
      children: b.models.map((m: any) => ({
        id: `model-${m.id}`,
        label: m.name,
        type: 'model',
        source: m,
        stock: m.stock,
      })),
    }))
    // 初始自动选中第一个有型号的品牌下的第一个型号
    const first = data.find((b: any) => b.models.length > 0)
    if (first) {
      const m = first.models[0]
      currentNodeKey.value = `model-${m.id}`
      selectedModel.value = m
      await loadInventory()
    } else {
      currentNodeKey.value = ''
      selectedModel.value = null
      list.value = []
      total.value = 0
    }
  } catch {
    treeData.value = []
  } finally {
    treeLoading.value = false
  }
}

function onNodeClick(data: any) {
  currentNodeKey.value = data.id
  // 仅点击型号节点时更改右侧显示内容
  if (data.type === 'model') {
    selectedModel.value = data.source
    page.value = 1
    keyword.value = ''
    colorFilter.value = ''
    memoryFilter.value = ''
    loadInventory()
  }
}

async function loadInventory() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value, status: 'in_stock' }
    if (userStore.effectiveStoreId) params.storeId = userStore.effectiveStoreId
    if (selectedModel.value?.id) params.modelId = selectedModel.value.id
    const result = await getInventoryImeiList(params)
    list.value = result.list || []
    total.value = result.total || 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// ---- 品牌 CRUD ----
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
    await loadTree()
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
    await loadTree()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

// ---- 型号 CRUD ----
function findBrandOfModel(modelId: number) {
  for (const b of treeData.value) {
    if ((b.children || []).some((m: any) => m.source.id === modelId)) return b.source
  }
  return null
}

function openModelDialog(model?: any, brandNode?: any) {
  const brand = brandNode?.source || (model ? findBrandOfModel(model.id) : null)
  if (!brand) return
  modelForm.value = model
    ? {
        id: model.id,
        brandId: brand.id,
        brandName: brand.name,
        name: model.name,
        color: model.color || '',
        memory: model.memory || '',
        salePrice: model.salePrice || 0,
        costPrice: model.costPrice || 0,
        isSubsidy: !!model.isSubsidy,
      }
    : {
        id: null,
        brandId: brand.id,
        brandName: brand.name,
        name: '',
        color: '',
        memory: '',
        salePrice: 0,
        costPrice: 0,
        isSubsidy: false,
      }
  modelDialogVisible.value = true
}

async function saveModel() {
  const name = modelForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入型号名称')
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
    }
    if (modelForm.value.id) {
      await updateModel(modelForm.value.id, modelForm.value.brandId, name, data)
    } else {
      await createModel(modelForm.value.brandId, name, data)
    }
    ElMessage.success('保存成功')
    modelDialogVisible.value = false
    await loadTree()
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
    if (selectedModel.value?.id === model.id) {
      selectedModel.value = null
      list.value = []
      total.value = 0
    }
    await loadTree()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

// ---- 删除库存 ----
function openDeleteImei(item: any) {
  deleteTarget.value = { type: 'imei', item }
  deleteReason.value = ''
  deleteDialogVisible.value = true
}

function openClearModel() {
  deleteTarget.value = { type: 'model', item: selectedModel.value, count: total.value }
  deleteReason.value = ''
  deleteDialogVisible.value = true
}

async function confirmDelete() {
  const reason = deleteReason.value.trim()
  if (!reason) {
    ElMessage.warning('请填写删除原因')
    return
  }
  deleting.value = true
  try {
    if (deleteTarget.value.type === 'imei') {
      await deleteImeiInventory(deleteTarget.value.item.id, reason)
      ElMessage.success('删除成功')
    } else {
      await deleteModelInventory(deleteTarget.value.item.id, reason)
      ElMessage.success('已清空该型号库存')
    }
    deleteDialogVisible.value = false
    await loadInventory()
    await loadTree()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadTree()
})
</script>

<style scoped>
.im-layout { display: flex; gap: 20px; align-items: flex-start; }

/* 左侧树 */
.im-side { width: 320px; border-radius: var(--radius); overflow: hidden; flex-shrink: 0; }
.im-side-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.im-side-title { font-size: 15px; font-weight: 600; color: var(--text); }
.im-add-brand-btn { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 12px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.im-add-brand-btn:hover { background: var(--primary-dark); }
.im-tree-wrap { max-height: calc(100vh - 220px); overflow-y: auto; padding: 8px; }
.im-node { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; min-width: 0; }
.im-node.is-current { background: var(--primary-light); }
.im-node-label { flex: 1; font-size: 14px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.im-node-stock { font-size: 12px; color: var(--primary); font-weight: 600; background: var(--primary-light); padding: 1px 8px; border-radius: 10px; flex-shrink: 0; }
.im-node-actions { display: none; align-items: center; gap: 2px; flex-shrink: 0; }
.im-node:hover .im-node-actions, .im-node.is-current .im-node-actions { display: flex; }
.im-act { width: 22px; height: 22px; border: none; border-radius: 5px; background: rgba(37,99,235,0.1); color: var(--primary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
.im-act:hover { background: var(--primary); color: #fff; }
.im-act--danger { background: rgba(239,68,68,0.1); color: var(--danger); }
.im-act--danger:hover { background: var(--danger); color: #fff; }

/* 右侧 */
.im-main { flex: 1; min-width: 0; }
.im-filter { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: var(--radius); margin-bottom: 18px; flex-wrap: wrap; }
.im-filter-input { flex: 1; min-width: 220px; height: 40px; padding: 0 14px; font-size: 15px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.im-filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.im-filter-input::placeholder { color: var(--text-tertiary); font-size: 14px; }
.im-filter-info { font-size: 13px; color: var(--text-secondary); }
.im-clear-btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border: 1.5px solid var(--danger); border-radius: var(--radius-sm); background: #fff; color: var(--danger); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.im-clear-btn:hover { background: var(--danger); color: #fff; }

.im-squares { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.im-square { padding: 16px; display: flex; flex-direction: column; gap: 8px; border-radius: var(--radius); transition: var(--transition); }
.im-square:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.im-square--skeleton { height: 170px; background: linear-gradient(90deg, #E2E8F0 25%, #CBD5E1 50%, #E2E8F0 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.im-square-top { display: flex; align-items: center; gap: 8px; }
.im-square-brand { flex: 1; font-size: 13px; font-weight: 600; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; }
.im-square-del { width: 26px; height: 26px; border: none; border-radius: 6px; background: rgba(239,68,68,0.1); color: var(--danger); cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: var(--transition); }
.im-square:hover .im-square-del { opacity: 1; }
.im-square-del:hover { background: var(--danger); color: #fff; }
.im-square-model { font-size: 16px; font-weight: 600; color: var(--text); }
.im-square-spec { font-size: 13px; color: var(--text-secondary); }
.im-square-imei { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 13px; color: var(--text); background: rgba(226,232,240,0.4); padding: 6px 10px; border-radius: 6px; letter-spacing: 0.3px; }
.im-square-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
.im-square-store { font-size: 12px; color: var(--text-tertiary); }
.im-square-badge { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 6px; background: var(--success); color: #fff; }

.pagination-row { display: flex; justify-content: center; margin-top: 24px; }

/* 弹窗 */
.im-model-grid { display: flex; gap: 12px; }
.im-model-grid .el-form-item { flex: 1; }
.im-model-brand { font-size: 14px; color: var(--primary); font-weight: 600; }
.im-del-tip { font-size: 14px; color: var(--text); margin-bottom: 14px; }
.im-del-tip strong { font-weight: 600; }
.im-del-imei { color: var(--text-secondary); font-family: monospace; }
.im-del-reason { display: flex; flex-direction: column; gap: 8px; }
.im-del-reason-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
</style>

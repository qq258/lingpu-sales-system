<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">发起调货</h1>
        <span class="pbm-subtitle">New Transfer Request</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-section-card">
        <h3 class="pbm-section-card-title">调货信息</h3>
        <el-form :model="form" label-width="120px">
          <el-form-item label="来源门店">
            <span style="font-weight: 600;">{{ userStore.currentStoreName }}</span>
          </el-form-item>
          <el-form-item label="目标门店" required>
            <el-select v-model="form.toStoreId" placeholder="选择目标门店" filterable style="width: 300px;">
              <el-option
                v-for="s in availableTargetStores"
                :key="s.id"
                :label="s.name"
                :value="s.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" style="width: 300px;" placeholder="可选备注" />
          </el-form-item>
        </el-form>
      </div>

      <div class="pbm-section-card">
        <h3 class="pbm-section-card-title">选择调货商品</h3>
        <div class="manual-search">
          <el-select v-model="searchBrandId" placeholder="选择品牌" clearable filterable @change="onBrandChange" style="width: 150px;">
            <el-option v-for="brand in brands" :key="brand.id" :label="brand.name" :value="brand.id" />
          </el-select>
          <el-select v-model="searchModelId" placeholder="选择型号" clearable filterable style="width: 250px;" :disabled="!searchBrandId">
            <el-option v-for="model in models" :key="model.id" :label="`${model.name} - ${model.color || ''}/${model.ram || ''}/${model.rom || ''}`" :value="model.id" />
          </el-select>
          <button class="pbm-btn-accent pbm-btn-accent--sm" :disabled="!searchModelId" @click="addSelectedModel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>添加</span>
          </button>
        </div>

        <div class="pbm-table-wrapper">
          <el-table :data="items" border stripe max-height="400" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="商品" min-width="200">
              <template #default="{ row }">
                <el-tag size="small" type="primary">{{ row.brandName }}</el-tag>
                {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
              </template>
            </el-table-column>
            <el-table-column label="可用库存" width="100">
              <template #default="{ row }">
                <el-tag :type="(row.stock ?? 0) <= 0 ? 'danger' : 'success'" size="small">
                  {{ row.stock ?? 0 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="调货数量" width="140">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="row.stock || 999"
                  size="small"
                  controls-position="right"
                  style="width: 130px;"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row, $index }">
                <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="removeItem($index)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-if="items.length === 0" class="pbm-table-empty">请选择品牌和型号添加调货商品</div>
      </div>

      <div class="pbm-form-actions">
        <button class="pbm-btn-plain" @click="resetForm">重置</button>
        <button
          class="pbm-btn-accent"
          :disabled="!form.toStoreId || items.length === 0"
          @click="handleSubmit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{{ submitLoading ? '提交中...' : '提交调货申请' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { createTransfer } from '@/api/transfer'
import { getBrands, getModels } from '@/api/product'
import { getInventoryByModel } from '@/api/inventory'

const userStore = useUserStore()

const form = ref({ toStoreId: null as number | null, remark: '' })
const items = ref<Array<{
  modelId: number
  brandName: string
  modelName: string
  color: string
  storage: string
  stock: number
  quantity: number
}>>([])
const submitLoading = ref(false)

const brands = ref<any[]>([])
const models = ref<any[]>([])
const searchBrandId = ref<number | undefined>()
const searchModelId = ref<number | undefined>()

const availableTargetStores = computed(() => {
  return userStore.availableStores.filter(s => s.id !== userStore.effectiveStoreId)
})

onMounted(async () => {
  try {
    brands.value = await getBrands()
  } catch {}
})

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

async function addSelectedModel() {
  if (!searchModelId.value) return
  const model = models.value.find(m => m.id === searchModelId.value)
  if (!model) return

  let stock = 0
  try {
    const result = await getInventoryByModel(model.id, userStore.effectiveStoreId || undefined)
    stock = result[0]?.stock || 0
  } catch {}

  const existing = items.value.find(i => i.modelId === model.id)
  if (existing) {
    existing.quantity += 1
    ElMessage.info('已增加数量')
  } else {
    items.value.push({
      modelId: model.id,
      brandName: model.brandName || '',
      modelName: model.name,
      color: model.color || '',
      storage: [model.ram, model.rom].filter(Boolean).join('/') || '',
      stock,
      quantity: 1,
    })
    ElMessage.success('已添加商品')
  }
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

async function handleSubmit() {
  if (!form.value.toStoreId) {
    ElMessage.warning('请选择目标门店')
    return
  }
  if (items.value.length === 0) {
    ElMessage.warning('请添加调货商品')
    return
  }

  submitLoading.value = true
  try {
    await createTransfer({
      toStoreId: form.value.toStoreId,
      items: items.value.map(i => ({ modelId: i.modelId, quantity: i.quantity })),
      remark: form.value.remark,
    })
    ElMessage.success('调货申请已提交')
    resetForm()
  } catch {
    // handled by interceptor
  } finally {
    submitLoading.value = false
  }
}

function resetForm() {
  form.value = { toStoreId: null, remark: '' }
  items.value = []
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
</style>

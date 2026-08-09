<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">期初库存录入</h1>
      <span class="title-line"></span>
    </div>

    <div class="glass is-card">
      <div class="is-form">
        <el-select v-model="brandId" placeholder="品牌" filterable size="large" style="width:170px;" @change="onBrandChange">
          <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
        <el-select v-model="modelId" placeholder="型号" filterable size="large" style="width:260px;" :disabled="!brandId">
          <el-option v-for="m in models" :key="m.id" :label="`${m.name} ${m.color||''} ${m.memory||''}`.trim()" :value="m.id" />
        </el-select>
        <el-input-number v-model="quantity" :min="1" :max="9999" size="large" controls-position="right" style="width:140px;" />
        <button class="is-btn-accent" :disabled="!modelId" @click="handleAdd">添加到清单</button>
      </div>
    </div>

    <div class="is-section-title">本次期初清单 ({{ items.length }})</div>
    <div class="glass is-card">
      <el-table :data="items" stripe size="default">
        <el-table-column type="index" label="#" width="52" align="center" />
        <el-table-column label="商品" min-width="240">
          <template #default="{ row }">{{ row.brandName }} {{ row.modelName }} {{ row.color || '' }} {{ row.memory || '' }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="120" align="center" />
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ $index }">
            <button class="is-mini is-mini--danger" @click="items.splice($index, 1)">移除</button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!items.length" class="empty-hint">尚未添加</div>
    </div>

    <button v-if="items.length" class="is-submit" :disabled="submitting" @click="handleSubmit">
      确认录入 {{ items.length }} 项
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getBrands, getModels } from '@/api/product'
import { createInitialStock } from '@/api/inventory'

const userStore = useUserStore()
const brands = ref<any[]>([])
const models = ref<any[]>([])
const brandId = ref<number | null>(null)
const modelId = ref<number | null>(null)
const quantity = ref(1)
const items = ref<Array<{ modelId: number; brandName: string; modelName: string; color: string; memory: string; quantity: number }>>([])
const submitting = ref(false)

onMounted(async () => {
  try { brands.value = await getBrands() } catch { brands.value = [] }
})

async function onBrandChange() {
  modelId.value = null
  if (!brandId.value) { models.value = []; return }
  try { models.value = await getModels(brandId.value) } catch { models.value = [] }
}

function handleAdd() {
  if (!modelId.value) {
    ElMessage.warning('请选择品牌和型号')
    return
  }
  const m = models.value.find((x: any) => x.id === modelId.value)
  if (!m) return
  const brand = brands.value.find((b: any) => b.id === brandId.value)
  const existing = items.value.find((i) => i.modelId === modelId.value)
  if (existing) {
    existing.quantity += quantity.value
  } else {
    items.value.push({
      modelId: modelId.value,
      brandName: brand?.name || '',
      modelName: m.name,
      color: m.color || '',
      memory: m.memory || '',
      quantity: quantity.value,
    })
  }
  quantity.value = 1
}

async function handleSubmit() {
  submitting.value = true
  try {
    for (const item of items.value) {
      await createInitialStock(item.modelId, item.quantity, userStore.effectiveStoreId || undefined)
    }
    ElMessage.success(`期初录入成功，共 ${items.value.length} 项`)
    items.value = []
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '录入失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.is-card { border-radius: var(--radius); padding: 18px 20px; margin-bottom: 18px; }
.is-form { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.is-btn-accent { height: 40px; padding: 0 20px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.is-btn-accent:hover { background: var(--primary-dark); }
.is-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; }
.is-section-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
.is-mini { height: 24px; padding: 0 10px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text-secondary); font-size: 12px; cursor: pointer; font-family: inherit; }
.is-mini--danger:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-light); }
.is-submit { display: block; width: 100%; height: 54px; border: none; border-radius: var(--radius); background: var(--success); color: #fff; font-size: 17px; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 16px; transition: var(--transition); }
.is-submit:hover { filter: brightness(0.94); }
.is-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>

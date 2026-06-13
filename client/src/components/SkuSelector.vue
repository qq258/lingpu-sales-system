<template>
  <div class="sku-selector">
    <div class="manual-search">
      <el-select
        v-model="searchBrandId"
        placeholder="选择品牌"
        clearable
        filterable
        @change="onBrandChange"
        style="width: 150px;"
      >
        <el-option
          v-for="brand in brands"
          :key="brand.id"
          :label="brand.name"
          :value="brand.id"
        />
      </el-select>
      <el-select
        v-model="searchModelId"
        placeholder="选择型号"
        clearable
        filterable
        style="width: 150px;"
        :disabled="!searchBrandId"
      >
        <el-option
          v-for="model in models"
          :key="model.id"
          :label="model.name"
          :value="model.id"
        />
      </el-select>
      <div v-if="selectedSku" class="sku-info-row">
        <div class="auto-sku-hint">
          <el-tag size="small" type="primary">{{ selectedSku.brandName }}</el-tag>
          {{ selectedSku.modelName }} - {{ selectedSku.color }} / {{ selectedSku.storage }}
          <span class="auto-sku-price">¥{{ selectedSku.price }}</span>
        </div>
        <div class="price-field">
          <label>单价（元）</label>
          <el-input v-model.number="unitPrice" type="number" min="0" step="0.01" placeholder="0.00" class="price-input" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getBrands, getModels, getSkus } from '@/api/product'
import type { BrandData, ModelData, SkuData } from '@/api/product'

const props = withDefaults(defineProps<{
  mode?: 'purchase' | 'sale'
  modelValue?: number
}>(), {
  mode: 'sale',
  modelValue: 0,
})

const emit = defineEmits<{
  select: [sku: SkuData]
  'update:modelValue': [value: number]
}>()

const unitPrice = ref(props.modelValue)

watch(() => props.modelValue, (v) => {
  unitPrice.value = v
})

watch(unitPrice, (v) => {
  emit('update:modelValue', v)
})

const selectedSku = ref<SkuData | null>(null)

const brands = ref<BrandData[]>([])
const models = ref<ModelData[]>([])
const allSkus = ref<SkuData[]>([])

const searchBrandId = ref<number | undefined>()
const searchModelId = ref<number | undefined>()

onMounted(async () => {
  loadBrands()
})

async function loadBrands() {
  try {
    brands.value = await getBrands()
  } catch {
    // ignore
  }
}

async function onBrandChange() {
  searchModelId.value = undefined
  selectedSku.value = null
  allSkus.value = []
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

watch(searchModelId, async () => {
  selectedSku.value = null
  if (searchModelId.value) {
    try {
      const result = await getSkus({ modelId: searchModelId.value })
      allSkus.value = result.list
      if (allSkus.value.length > 0) {
        selectedSku.value = allSkus.value[0]
        emit('select', allSkus.value[0])
      }
    } catch {
      allSkus.value = []
    }
  } else {
    allSkus.value = []
  }
})
</script>

<style scoped>
.sku-selector {
  margin-bottom: 12px;
}
.manual-search {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.sku-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.auto-sku-hint {
  font-size: 13px;
  color: var(--pbm-text, #2c2418);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
}
.auto-sku-price {
  color: #f56c6c;
  font-weight: 600;
}
.price-field {
  display: flex;
  align-items: center;
  gap: 6px;
}
.price-field label {
  font-size: 11px;
  font-weight: 600;
  color: var(--pbm-text-dim, #8a7f72);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.price-input {
  width: 130px;
}
.price-input :deep(.el-input__wrapper) {
  background: var(--pbm-bg, #f5f0eb);
  border: 1px solid var(--pbm-border, #e5ddd3);
  border-radius: var(--pbm-radius, 6px);
  box-shadow: none;
  padding: 1px 12px;
}
.price-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--pbm-accent, #c9953c);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow, rgba(201,149,60,0.12));
}
.price-input :deep(.el-input__inner) {
  font-family: var(--pbm-mono, "SF Mono", monospace);
  font-size: 14px;
  color: var(--pbm-text, #2c2418);
}
</style>

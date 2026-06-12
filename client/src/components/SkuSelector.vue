<template>
  <div class="sku-selector">
    <div class="scan-input-wrapper">
      <el-input
        ref="inputRef"
        v-model="scanInput"
        :placeholder="mode === 'sale' ? '扫码添加商品' : '扫码枪扫描商品条码'"
        clearable
        :disabled="loading"
        @keyup.enter="handleScanInput"
      >
        <template #prefix>
          <el-icon><Barcode /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" :disabled="loading" @click="handleScanInput">
        <el-icon><Search /></el-icon>
        查询
      </el-button>
    </div>
    <div class="search-result" v-if="selectedSku">
      <el-card shadow="hover" class="sku-card">
        <div class="sku-info">
          <div class="sku-name">
            <el-tag size="small" type="primary">{{ selectedSku.brandName }}</el-tag>
            {{ selectedSku.modelName }} - {{ selectedSku.color }} / {{ selectedSku.storage }}
          </div>
          <div class="sku-details">
            <span class="sku-price">¥{{ selectedSku.price }}</span>
            <span v-if="mode === 'purchase'" class="sku-cost">成本价：¥{{ selectedSku.costPrice || '-' }}</span>
            <span class="sku-stock" v-if="mode === 'sale'">
              库存：<span :class="stockClass">{{ selectedSku.stock ?? '未知' }}</span>
            </span>
          </div>
        </div>
        <el-button type="success" size="small" @click="confirmSelect">
          <el-icon><Check /></el-icon>
          选择
        </el-button>
      </el-card>
    </div>
    <div class="manual-search" v-if="showManualSearch">
      <el-divider>或手动搜索</el-divider>
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
      >
        <el-option
          v-for="model in models"
          :key="model.id"
          :label="model.name"
          :value="model.id"
        />
      </el-select>
      <el-select
        v-model="searchSkuId"
        placeholder="选择具体配置"
        clearable
        filterable
        style="width: 200px;"
        @change="onSkuSelect"
      >
        <el-option
          v-for="sku in filteredSkus"
          :key="sku.id"
          :label="`${sku.color} / ${sku.storage} - ¥${sku.price}`"
          :value="sku.id"
        />
      </el-select>
    </div>
    <el-button type="text" size="small" @click="showManualSearch = !showManualSearch">
      {{ showManualSearch ? '收起搜索' : '手动搜索' }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { scanSku, searchSkus, getBrands, getModels, getSkus } from '@/api/product'
import type { BrandData, ModelData, SkuData } from '@/api/product'

const props = withDefaults(defineProps<{
  mode?: 'purchase' | 'sale'
  autoFocus?: boolean
}>(), {
  mode: 'sale',
  autoFocus: true,
})

const emit = defineEmits<{
  select: [sku: SkuData]
  scanError: [msg: string]
}>()

const inputRef = ref()
const scanInput = ref('')
const loading = ref(false)
const selectedSku = ref<SkuData | null>(null)
const showManualSearch = ref(false)

const brands = ref<BrandData[]>([])
const models = ref<ModelData[]>([])
const allSkus = ref<SkuData[]>([])

const searchBrandId = ref<number | undefined>()
const searchModelId = ref<number | undefined>()
const searchSkuId = ref<number | undefined>()

const filteredSkus = computed(() => {
  let result = allSkus.value
  if (searchBrandId.value) {
    result = result.filter(s => s.brandId === searchBrandId.value)
  }
  if (searchModelId.value) {
    result = result.filter(s => s.modelId === searchModelId.value)
  }
  return result
})

const stockClass = computed(() => {
  const stock = selectedSku.value?.stock
  if (stock === undefined || stock === null) return ''
  if (stock <= 0) return 'stock-none'
  if (stock <= 5) return 'stock-low'
  return 'stock-ok'
})

onMounted(async () => {
  if (props.autoFocus) {
    await nextTick()
    inputRef.value?.focus()
  }
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
  searchSkuId.value = undefined
  selectedSku.value = null
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
  searchSkuId.value = undefined
  selectedSku.value = null
  if (searchModelId.value) {
    try {
      const result = await getSkus({ modelId: searchModelId.value })
      allSkus.value = result.list
    } catch {
      allSkus.value = []
    }
  } else {
    allSkus.value = []
  }
})

function onSkuSelect(skuId: number) {
  const sku = allSkus.value.find(s => s.id === skuId)
  if (sku) {
    selectedSku.value = sku
  }
}

async function handleScanInput() {
  const input = scanInput.value.trim()
  if (!input) return

  loading.value = true
  try {
    const sku = await scanSku(input)
    selectedSku.value = sku
    scanInput.value = ''
    emit('select', sku)
  } catch {
    try {
      const results = await searchSkus(input)
      if (results.length > 0) {
        selectedSku.value = results[0]
        scanInput.value = ''
        emit('select', results[0])
      } else {
        emit('scanError', '未找到匹配的商品')
      }
    } catch {
      emit('scanError', '查询失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

function confirmSelect() {
  if (selectedSku.value) {
    emit('select', selectedSku.value)
    scanInput.value = ''
    inputRef.value?.focus()
  }
}

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped>
.sku-selector {
  margin-bottom: 12px;
}
.scan-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}
.scan-input-wrapper .el-input {
  flex: 1;
}
.search-result {
  margin-top: 12px;
}
.sku-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sku-card :deep(.el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}
.sku-info {
  flex: 1;
}
.sku-name {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.sku-details {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #606266;
}
.sku-price {
  color: #f56c6c;
  font-weight: 700;
  font-size: 16px;
}
.stock-ok {
  color: #67c23a;
}
.stock-low {
  color: #e6a23c;
}
.stock-none {
  color: #f56c6c;
}
.manual-search {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
}
</style>

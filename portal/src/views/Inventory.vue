<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">库存查询</h1>
      <span class="title-line"></span>
    </div>

    <div class="search-section">
      <div class="search-row">
        <div class="search-input-wrap">
          <input ref="searchRef" v-model="keyword" class="search-input" placeholder="搜索 IMEI / IMEI2 / SN码 / 商品名称..." @keyup.enter="doSearch" />
        </div>
        <button class="search-btn" @click="doSearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          搜索
        </button>
      </div>

      <div class="filter-row">
        <el-select v-model="brandFilter" placeholder="全部品牌" clearable filterable size="large" style="width:160px;" @change="onBrandFilter">
          <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
        <el-select v-model="modelFilter" placeholder="全部型号" clearable filterable size="large" style="width:200px;" :disabled="!brandFilter" @change="doSearch">
          <el-option v-for="m in models" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="全部状态" clearable size="large" style="width:130px;" @change="doSearch">
          <el-option label="在库" value="in_stock" />
          <el-option label="已售" value="sold" />
        </el-select>
        <span class="result-count">共 {{ total }} 件商品</span>
      </div>
    </div>

    <div v-if="loading" class="card-grid">
      <div v-for="i in 8" :key="i" class="skeleton-card" :style="{ animationDelay: (i * 0.05) + 's' }"></div>
    </div>
    <div v-else-if="list.length" class="card-grid">
      <ProductCard v-for="item in list" :key="item.imei || item.id" :product="item" />
    </div>
    <div v-else class="empty-hint">暂无库存数据</div>

    <div v-if="total > pageSize" class="pagination-row">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="prev, pager, next" size="large" @change="loadData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { getInventoryImeiList } from '@/api/inventory'
import { getBrands, getModels } from '@/api/product'
import ProductCard from '@/components/ProductCard.vue'

const userStore = useUserStore()
const searchRef = ref<HTMLInputElement>()
const keyword = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const brands = ref<any[]>([])
const models = ref<any[]>([])
const brandFilter = ref<number | undefined>()
const modelFilter = ref<number | undefined>()
const statusFilter = ref<string | undefined>()

onMounted(async () => {
  try { brands.value = await getBrands() } catch {}
  nextTick(() => searchRef.value?.focus())
  loadData()
})

async function onBrandFilter() {
  modelFilter.value = undefined
  if (!brandFilter.value) { models.value = []; page.value = 1; loadData(); return }
  try { models.value = await getModels(brandFilter.value) } catch { models.value = [] }
  page.value = 1; loadData()
}

function doSearch() { page.value = 1; loadData() }

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (brandFilter.value) params.brandId = brandFilter.value
    if (modelFilter.value) params.modelId = modelFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    if (userStore.effectiveStoreId) params.storeId = userStore.effectiveStoreId
    const result = await getInventoryImeiList(params)
    list.value = result.list || []; total.value = result.total || 0
  } catch { list.value = []; total.value = 0 }
  finally { loading.value = false }
}
</script>

<style scoped>
.search-section { margin-bottom: 24px; }
.search-row { display: flex; gap: 12px; margin-bottom: 16px; }
.search-input-wrap { flex: 1; }
.search-input { width: 100%; height: 52px; padding: 0 20px; font-size: 18px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.search-input::placeholder { color: var(--text-tertiary); font-size: 17px; }
.search-btn { display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 28px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 17px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.search-btn:hover { background: var(--primary-dark); }
.filter-row { display: flex; align-items: center; gap: 12px; }
.result-count { font-size: 14px; color: var(--text-tertiary); margin-left: auto; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.skeleton-card { height: 190px; border-radius: var(--radius); background: linear-gradient(90deg, #E2E8F0 25%, #CBD5E1 50%, #E2E8F0 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.pagination-row { display: flex; justify-content: center; margin-top: 28px; }
</style>

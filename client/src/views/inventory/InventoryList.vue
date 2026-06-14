<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">库存查询</h1>
        <span class="pbm-subtitle">IMEI Inventory</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-main">
        <div class="pbm-main-head">
          <div class="pbm-search-group">
            <div class="pbm-search-input-wrapper">
              <svg class="pbm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="searchKeyword" class="pbm-search-input" placeholder="搜索 IMEI / 商品名称" @keyup.enter="loadImeiList" />
            </div>
            <el-select v-model="searchBrandId" placeholder="品牌" clearable filterable size="small" style="width:130px;" @change="onBrandChange">
              <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
            </el-select>
            <el-select v-model="searchModelId" placeholder="型号" clearable filterable size="small" style="width:130px;" :disabled="!searchBrandId">
              <el-option v-for="m in models" :key="m.id" :label="m.name" :value="m.id" />
            </el-select>
            <button class="pbm-btn-accent" @click="loadImeiList">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>查询</span>
            </button>
          </div>
          <span class="pbm-section-count">{{ total }} 条记录</span>
        </div>

        <div class="pbm-table-wrapper">
          <el-table :data="imeiList" stripe v-loading="loading" size="small" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="#" width="48" align="center" />
            <el-table-column label="商品信息" min-width="200">
              <template #default="{ row }">
                <span class="pbm-tag-brand">{{ row.brandName }}</span>
                {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
              </template>
            </el-table-column>
            <el-table-column label="IMEI" width="170" prop="imei" />
            <el-table-column label="IMEI2" width="150">
              <template #default="{ row }">{{ row.imei2 || '-' }}</template>
            </el-table-column>
            <el-table-column label="S/N" width="130">
              <template #default="{ row }">{{ row.sn_code || '-' }}</template>
            </el-table-column>
            <el-table-column prop="storeName" label="门店" width="120" />
            <el-table-column label="是否售出" width="100" align="center">
              <template #default="{ row }">
                <span :class="['pbm-status-tag', row.isSold ? 'pbm-status-tag--sold' : 'pbm-status-tag--ok']">
                  {{ row.isSold ? '是' : '否' }}
                </span>
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
            @change="loadImeiList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getInventoryImeiList } from '@/api/inventory'
import { getBrands, getModels } from '@/api/product'

const userStore = useUserStore()
const loading = ref(false)
const imeiList = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const searchBrandId = ref<number | undefined>()
const searchModelId = ref<number | undefined>()
const brands = ref<any[]>([])
const models = ref<any[]>([])

async function loadImeiList() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (searchBrandId.value) params.brand_id = searchBrandId.value
    if (searchModelId.value) params.model_id = searchModelId.value
    if (userStore.effectiveStoreId) params.storeId = userStore.effectiveStoreId
    const result = await getInventoryImeiList(params)
    imeiList.value = result.list
    total.value = result.total
  } catch {
    imeiList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadBrands() {
  try {
    brands.value = await getBrands()
  } catch {
    brands.value = []
  }
}

async function onBrandChange() {
  searchModelId.value = undefined
  models.value = []
  if (searchBrandId.value) {
    try {
      models.value = await getModels(searchBrandId.value)
    } catch {
      models.value = []
    }
  }
}

onMounted(() => {
  loadBrands()
  loadImeiList()
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
.pbm-search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pbm-search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  transition: border-color 0.15s;
}
.pbm-search-input-wrapper:focus-within {
  border-color: var(--pbm-accent);
  box-shadow: 0 0 0 2px var(--pbm-accent-glow);
}
.pbm-search-icon { color: var(--pbm-text-dim); flex-shrink: 0; }
.pbm-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--pbm-text);
  width: 220px;
  font-family: var(--pbm-font);
}
.pbm-search-input::placeholder { color: rgba(138,127,114,0.4); }
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

.pbm-status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--pbm-mono);
}
.pbm-status-tag--ok { background: rgba(34,197,94,0.12); color: #16a34a; }
.pbm-status-tag--sold { background: rgba(220,53,69,0.12); color: #dc3545; }

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

.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

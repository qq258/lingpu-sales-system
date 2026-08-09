<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">库存流水</h1>
      <span class="title-line"></span>
      <el-select v-model="changeType" placeholder="变动类型" clearable size="large" style="width:160px;" @change="doSearch">
        <el-option label="采购入库" value="purchase_in" />
        <el-option label="销售出库" value="sale_out" />
        <el-option label="调货出库" value="transfer_out" />
        <el-option label="调货入库" value="transfer_in" />
        <el-option label="盘点调整" value="check" />
        <el-option label="期初录入" value="initial" />
        <el-option label="库存删除" value="inventory_delete" />
      </el-select>
      <button class="lg-btn-plain" @click="doSearch">查询</button>
      <button class="lg-btn-accent" @click="exportInventoryLogs()">导出 Excel</button>
      <span class="lg-count">共 {{ total }} 条</span>
    </div>

    <div class="glass lg-card">
      <el-table :data="list" v-loading="loading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }"><span class="lg-name">{{ row.modelName }}</span> <span class="lg-muted">{{ row.color }} / {{ row.storage }}</span></template>
        </el-table-column>
        <el-table-column prop="storeName" label="门店" width="110" />
        <el-table-column label="变动类型" width="110">
          <template #default="{ row }">{{ changeTypeLabel(row.changeType) }}</template>
        </el-table-column>
        <el-table-column label="变动数量" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.changeQuantity > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }">
              {{ row.changeQuantity > 0 ? '+' : '' }}{{ row.changeQuantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeQuantity" label="变动前" width="80" align="center" />
        <el-table-column prop="afterQuantity" label="变动后" width="80" align="center" />
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">{{ row.operatorName || '-' }}</template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
      </el-table>
      <div v-if="!loading && !list.length" class="empty-hint">暂无流水记录</div>
    </div>

    <div v-if="total > pageSize" class="pagination-row">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next" size="large" @change="load" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getInventoryLogs, exportInventoryLogs } from '@/api/inventory'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const changeType = ref('')

const typeMap: Record<string, string> = {
  purchase_in: '采购入库', sale_out: '销售出库', transfer_out: '调货出库',
  transfer_in: '调货入库', check: '盘点调整', initial: '期初录入', inventory_delete: '库存删除',
}

function changeTypeLabel(t: string) {
  return typeMap[t] || t
}

async function load() {
  loading.value = true
  try {
    const result = await getInventoryLogs({
      page: page.value,
      pageSize: pageSize.value,
      change_type: changeType.value || undefined,
    })
    list.value = result.list || []
    total.value = result.total || 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function doSearch() {
  page.value = 1
  load()
}

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}

onMounted(load)
</script>

<style scoped>
.lg-btn-accent { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.lg-btn-accent:hover { background: var(--primary-dark); }
.lg-btn-plain { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: var(--transition); }
.lg-btn-plain:hover { border-color: var(--primary); color: var(--primary); }
.lg-count { font-size: 13px; color: var(--text-tertiary); }
.lg-card { border-radius: var(--radius); padding: 8px; }
.lg-name { font-weight: 500; color: var(--text); }
.lg-muted { font-size: 12px; color: var(--text-tertiary); }
.pagination-row { display: flex; justify-content: center; margin-top: 24px; }
</style>

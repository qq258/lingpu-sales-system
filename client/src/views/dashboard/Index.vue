<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">数据看板</h1>
        <span class="pbm-subtitle">Dashboard</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-stat-cards">
        <div class="pbm-stat-card">
          <span class="pbm-stat-card-label">TODAY SALES</span>
          <span class="pbm-stat-card-value">¥{{ (dashboardData?.todaySales || 0).toFixed(2) }}</span>
        </div>
        <div class="pbm-stat-card">
          <span class="pbm-stat-card-label">TODAY ORDERS</span>
          <span class="pbm-stat-card-value">{{ dashboardData?.todayOrders || 0 }}</span>
        </div>
        <div class="pbm-stat-card">
          <span class="pbm-stat-card-label">LOW STOCK</span>
          <span class="pbm-stat-card-value pbm-stat-card-value--danger">{{ dashboardData?.lowStockCount || 0 }}</span>
        </div>
      </div>

      <div class="pbm-section-card">
        <h3 class="pbm-section-card-title">近7日销售趋势</h3>
        <div class="pbm-trend-chart">
          <div class="pbm-chart-bars">
            <div class="pbm-bar-item" v-for="item in weeklySales" :key="item.date">
              <div class="pbm-bar-value">¥{{ item.amount.toFixed(0) }}</div>
              <div class="pbm-bar" :style="{ height: getBarHeight(item.amount) + 'px' }"></div>
              <div class="pbm-bar-label">{{ formatDate(item.date) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="pbm-grid-2col">
        <div class="pbm-section-card">
          <h3 class="pbm-section-card-title">最近订单</h3>
          <div class="pbm-table-wrapper">
            <el-table :data="dashboardData?.recentOrders || []" size="small" max-height="300" element-loading-background="rgba(245,240,235,0.8)">
              <el-table-column prop="orderNo" label="单号" width="140" />
              <el-table-column prop="totalAmount" label="金额" width="80">
                <template #default="{ row }">
                  ¥{{ row.totalAmount?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="时间" width="160">
                <template #default="{ row }">
                  {{ row.createdAt ? row.createdAt.slice(0, 16) : '-' }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="pbm-section-card">
          <h3 class="pbm-section-card-title">热销产品排行</h3>
          <div class="pbm-table-wrapper">
            <el-table :data="dashboardData?.topProducts || []" size="small" max-height="300" element-loading-background="rgba(245,240,235,0.8)">
              <el-table-column type="index" label="排名" width="60" />
              <el-table-column prop="modelName" label="商品" />
              <el-table-column prop="quantity" label="销量" width="80" />
              <el-table-column prop="amount" label="金额" width="100">
                <template #default="{ row }">
                  ¥{{ row.amount?.toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <div class="pbm-section-card" v-if="userStore.isSuperAdmin && dashboardData?.storeCompare">
        <h3 class="pbm-section-card-title">门店销售对比</h3>
        <div class="pbm-table-wrapper">
          <el-table :data="dashboardData.storeCompare" size="small" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column prop="storeName" label="门店" />
            <el-table-column prop="sales" label="销售额">
              <template #default="{ row }">
                ¥{{ row.sales?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="orders" label="订单数" />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { getDashboard } from '@/api/stats'

const userStore = useUserStore()

const dashboardData = ref<any>(null)

const weeklySales = computed(() => {
  return dashboardData.value?.weeklySales || []
})

const maxAmount = computed(() => {
  if (weeklySales.value.length === 0) return 1
  return Math.max(...weeklySales.value.map((s: any) => s.amount), 1)
})

function getBarHeight(amount: number) {
  return Math.max((amount / maxAmount.value) * 200, 4)
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : dateStr
}

async function loadDashboard() {
  try {
    dashboardData.value = await getDashboard(userStore.effectiveStoreId || undefined)
  } catch {
    dashboardData.value = null
  }
}

watch(() => userStore.effectiveStoreId, () => {
  loadDashboard()
})

onMounted(() => {
  loadDashboard()
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

.pbm-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 24px 24px;
  gap: 16px;
}

.pbm-stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  flex-shrink: 0;
}
.pbm-stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  padding: 20px 24px;
}
.pbm-stat-card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--pbm-text-dim);
  font-family: var(--pbm-mono);
}
.pbm-stat-card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--pbm-text);
  font-family: var(--pbm-mono);
  line-height: 1.2;
}
.pbm-stat-card-value--danger { color: var(--pbm-red); }

.pbm-section-card {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  padding: 20px;
}
.pbm-section-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--pbm-text);
  margin: 0 0 16px;
}

.pbm-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.pbm-grid-2col .pbm-section-card { margin-bottom: 0; }

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

.pbm-trend-chart {
  padding: 16px 0;
}
.pbm-chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 240px;
  gap: 8px;
}
.pbm-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
}
.pbm-bar-value {
  font-size: 11px;
  color: var(--pbm-text-dim);
  margin-bottom: 4px;
  white-space: nowrap;
  font-family: var(--pbm-mono);
}
.pbm-bar {
  width: 100%;
  max-width: 48px;
  background: linear-gradient(180deg, var(--pbm-accent), #dba84a);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
  min-height: 4px;
}
.pbm-bar-label {
  font-size: 12px;
  color: var(--pbm-text-dim);
  margin-top: 6px;
}

.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

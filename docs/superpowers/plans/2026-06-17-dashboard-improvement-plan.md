# Dashboard 看板改进实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升 portal 首页看板的数据展示完整性和可读性，补充关键指标卡片，调整布局比例。

**Architecture:** 基于现有 Dashboard.vue 和数据 API（/stats/dashboard、/stats/sales、/stats/top-products）进行增量改进，不改动后端，仅优化前端呈现。

**Tech Stack:** Vue 3 + TypeScript + Element Plus + 毛玻璃 CSS 主题

---

### Task 1: 新增核心指标卡片行（P0）

**说明：** 后端 /stats/dashboard API 已返回 todaySales（今日销售额）、todayOrders（今日订单数）、lowStockCount（低库存预警数），但前端从未展示。StatCard.vue 组件已存在且支持 sales/orders/lowstock 三种图标类型。

**Files:**
- Modify: `portal/src/views/Dashboard.vue`

- [ ] **Step 1: 在 Dashboard.vue 的 loadAll 中提取指标数据**

在 Dashboard.vue 的 script 中，新增响应式变量：
```typescript
const todaySales = ref(0)
const todayOrders = ref(0)
const lowStockCount = ref(0)
```

修改 `loadAll` 函数，从 dashboard API 返回值中提取指标：
```typescript
async function loadAll() {
  const storeId = userStore.effectiveStoreId || undefined
  try {
    const d = await getDashboard(storeId)
    recentOrders.value = d?.recentOrders || []
    todaySales.value = d?.todaySales || 0
    todayOrders.value = d?.todayOrders || 0
    lowStockCount.value = d?.lowStockCount || 0
  } catch {}
  await loadAllDataOnly()
}
```

- [ ] **Step 2: 在看板顶部添加 StatCard 行**

在 template 中，在 `quick-bar-row` 之后、`sale-section` 之前，新增一个 stat-card 行：
```html
    <!-- 核心指标 -->
    <div class="stat-cards-row">
      <StatCard label="sales" :value="todaySales" prefix="¥" />
      <StatCard label="orders" :value="todayOrders" />
      <StatCard label="lowstock" :value="lowStockCount" />
    </div>
```

并在 script 中导入 StatCard：
```typescript
import StatCard from '@/components/StatCard.vue'
```

添加样式：
```css
.stat-cards-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
```

- [ ] **Step 3: 验证编译无报错**

Run: `cd d:\qxy\手机销售门户网站\portal && npx vue-tsc --noEmit`
Expected: 无类型错误

---

### Task 2: 简化快速开单区域（P1）

**说明：** 当前 Dashboard 内嵌了完整的销售开单表单（品牌搜索、IMEI 录入、购物车、结算收款），导致页面臃肿。改为仅保留扫码输入框 + 快捷跳转链接，完整的开单流程引导到 /sale 页面。

**Files:**
- Modify: `portal/src/views/Dashboard.vue`

- [ ] **Step 1: 替换快速开单区模板**

将原有的完整 `sale-section`（从 `<div class="sale-section glass">` 开始到对应的闭合 `</div>`）替换为精简版本：

```html
    <!-- 快速扫码入口 -->
    <div class="sale-section glass">
      <div class="sale-section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        快速扫码开单
      </div>
      <div class="quick-scan-body">
        <div class="scan-row">
          <div class="scan-input-wrap">
            <input ref="scanRef" v-model="scanInput" class="scan-input" placeholder="扫码枪扫描或输入 IMEI 后按回车" @keyup.enter="goToSale" />
          </div>
          <button class="scan-btn" @click="goToSale">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            去开单
          </button>
        </div>
        <div class="quick-scan-hint">
          <span>扫码后跳转至开单页完成销售</span>
          <router-link to="/sale" class="quick-scan-link">前往完整开单页 →</router-link>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: 替换对应的 script 逻辑**

移除以下不再需要的逻辑代码（保留 `scanRef`、`scanInput`、`goToSale`，移除所有购物车、无库存销售、品牌搜索、IMEI 编辑、收款相关代码）：

替换 script setup 中所有从销售相关的功能代码，仅保留精简版本：

```typescript
// -- 快速扫码 --
const scanRef = ref<HTMLInputElement>()
const scanInput = ref('')
const router = useRouter()

function goToSale() {
  const imei = scanInput.value.trim()
  if (imei) {
    router.push(`/sale?imei=${encodeURIComponent(imei)}`)
  } else {
    router.push('/sale')
  }
}
```

- [ ] **Step 3: 移除不需要的 import**

移除以下不再需要的 import：
```typescript
// 移除这些（如果不再使用）
// import { scanImeiForSale, getBrandInventory } from '@/api/inventory'
// import { getPurchaseEntries } from '@/api/purchase'
// import { createSale, getSalePrintData, createNoStockSale } from '@/api/sales'
// import { getModels } from '@/api/product'
// import ConfirmDialog from '@/components/ConfirmDialog.vue'
// import ImeiQueryDialog from '@/components/ImeiQueryDialog.vue'
// import PrintReceipt from '@/components/PrintReceipt.vue'
// import SaveBrandDialog from '@/components/SaveBrandDialog.vue'
// import type { BrandModelItem } from '@/components/SaveBrandDialog.vue'
```

保留仍需使用的 import：
```typescript
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'  // 新增
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getBrandInventory } from '@/api/inventory'      // 仍用于品牌库存
import { getPurchaseEntries } from '@/api/purchase'      // 仍用于最近入库
import { getDashboard, getSalesStats, getTopProducts } from '@/api/stats'
import LineChart from '@/components/LineChart.vue'
import HorizontalBarChart from '@/components/HorizontalBarChart.vue'
import StatCard from '@/components/StatCard.vue'
```

- [ ] **Step 4: 移除不再需要的 template 片段**

移除以下 template 片段（因为这些组件被移除了）：
- `ConfirmDialog` (确认收款弹窗)
- `ImeiQueryDialog` (IMEI查询弹窗)
- `PrintReceipt` (小票打印)
- `SaveBrandDialog` (保存品牌型号)

- [ ] **Step 5: 移除不再需要的样式**

保留快速开单区域的精简样式，移除购物车、IMEI录入、结算等不再使用的样式块。

在 style 中移除以下样式块：
- `.sale-type-row` / `.sale-type-radio` / `.radio-dot`
- `.brand-search-wrap` / `.brand-dropdown` / `.brand-selected-tag` 等品牌搜索相关样式
- `.imei-entry-row` / `.imei-entry-input` 等 IMEI 录入样式
- `.cart-area` / `.cart-header` / `.cart-list` / `.cart-item` 等购物车样式
- `.cart-imei-edit-overlay` / `.cart-imei-edit-box` 等行内编辑样式
- `.checkout-area` / `.pay-btn` 等结算样式

添加快速扫码区样式：
```css
.quick-scan-body { display: flex; flex-direction: column; gap: 10px; }
.quick-scan-hint { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-tertiary); }
.quick-scan-link { color: var(--primary); font-weight: 500; text-decoration: none; }
.quick-scan-link:hover { text-decoration: underline; }
```

---

### Task 3: 调整数据网格布局（P1）

**说明：** 当前 data-grid 为 3fr 1fr 双列布局，右侧"售出排行"区域过窄。改为"趋势图全宽" + "品牌库存和售出排行双列"的布局。

**Files:**
- Modify: `portal/src/views/Dashboard.vue`

- [ ] **Step 1: 重构数据网格模板**

将原有的 data-grid 结构调整为：
```html
    <!-- 销售额趋势（全宽） -->
    <div class="data-card glass" style="margin-bottom: 20px;">
      <div class="data-card-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        销售额趋势
        <span class="trend-range-label" v-if="timeRangeLabel">{{ timeRangeLabel }}</span>
      </div>
      <div class="data-card-body" style="height:200px;">
        <LineChart :data="trendData" color="#2563EB" height="200px" />
      </div>
    </div>

    <!-- 双列：品牌库存 + 售出排行 -->
    <div class="data-grid-2col">
      <div class="data-card glass">
        <div class="data-card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          品牌库存
        </div>
        <div class="brand-cards">
          <div v-for="b in brandStockList" :key="b.name" class="brand-card">
            <span class="brand-name">{{ b.name }}</span>
            <span class="brand-qty">{{ b.qty }} 台</span>
          </div>
          <div v-if="!brandStockList.length" class="empty-data">暂无库存数据</div>
        </div>
      </div>
      <div class="data-card glass">
        <div class="data-card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          售出排行
        </div>
        <div class="data-card-body" style="min-height:200px;">
          <HorizontalBarChart :data="topProductsData" color="#F97316" />
        </div>
      </div>
    </div>
```

- [ ] **Step 2: 添加新布局样式并移除旧布局样式**

移除旧的 data-grid 样式：
```css
/* 移除 */
.data-grid { display: grid; grid-template-columns: 3fr 1fr; gap: 20px; }
.data-grid-left { ... }
.data-grid-right { ... }
```

添加新样式：
```css
.data-grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.trend-range-label { font-size: 12px; font-weight: 400; color: var(--text-tertiary); margin-left: 8px; }
```

---

### Task 4: 添加统计时段指示器（P2）

**说明：** TimeRangePicker 切换时段后，用户无法直观看到当前选中的时间范围。新增 computed 属性显示可读的时间范围文本。

**Files:**
- Modify: `portal/src/views/Dashboard.vue`

- [ ] **Step 1: 新增时间范围文本计算属性**

在 script 中新增：
```typescript
const timeRangeLabel = computed(() => {
  const range = getDateRange()
  if (!range.start_date) return '全部时间'
  return `${range.start_date} ~ ${range.end_date}`
})
```

- [ ] **Step 2: 在 TimeRangePicker 旁显示时间范围**

在 template 中，找到 TimeRangePicker 所在位置（它位于 data-grid 之前），添加时间范围标签：

在 `<!-- 数据网格 -->` 之前添加：
```html
    <!-- 统计时段选择 -->
    <div class="time-range-bar">
      <TimeRangePicker v-model="timeRange" />
      <span class="time-range-text" v-if="timeRangeLabel">📅 {{ timeRangeLabel }}</span>
    </div>
```

注册组件：
```typescript
import TimeRangePicker from '@/components/TimeRangePicker.vue'
```

添加样式：
```css
.time-range-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.time-range-text { font-size: 13px; color: var(--text-tertiary); }
```

**注意：** 由于不主动使用 emoji，将 📅 替换为纯文字样式。改用文字：
```html
<span class="time-range-text">{{ timeRangeLabel }}</span>
```

---

### Task 5: 丰富记录区展示字段（P2）

**说明：** "今日售出"和"最近入库"的记录列表信息密度低，增加时间、品牌/型号等关键信息。

**Files:**
- Modify: `portal/src/views/Dashboard.vue`

- [ ] **Step 1: 丰富"今日售出"记录**

后端 `/stats/dashboard` 返回的 `recentOrders` 包含 `orderNo`、`totalAmount`、`createdAt`。在模板中增加时间和金额信息：

```html
      <div class="record-list">
        <div v-for="ord in recentOrders" :key="ord.orderNo" class="record-item">
          <div class="record-left">
            <svg width="5" height="5" viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2.5" fill="#F97316"/></svg>
            <div class="record-info-col">
              <span class="record-info">{{ ord.orderNo }}</span>
              <span class="record-time">{{ formatTime(ord.createdAt) }}</span>
            </div>
          </div>
          <span class="record-amount">¥{{ (ord.totalAmount || 0).toFixed(2) }}</span>
        </div>
        <div v-if="!recentOrders.length" class="empty-data">暂无售出记录</div>
      </div>
```

- [ ] **Step 2: 丰富"最近入库"记录**

后端 `/purchase-entries` 返回的条目包含 `entry_no`、`created_at`、`supplier.name`、`operator.real_name`、`_count.items`。

在模板中增强显示：
```html
      <div class="record-list">
        <div v-for="e in recentEntries" :key="e.id" class="record-item">
          <div class="record-left">
            <svg width="5" height="5" viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2.5" fill="#3B82F6"/></svg>
            <div class="record-info-col">
              <span class="record-info">{{ e.entry_no || '' }}</span>
              <span class="record-time">{{ formatTime(e.created_at) }}</span>
            </div>
          </div>
          <span class="record-qty">x{{ e._count?.items || e.itemCount || 0 }}</span>
        </div>
        <div v-if="!recentEntries.length" class="empty-data">暂无入库记录</div>
      </div>
```

- [ ] **Step 3: 添加 formatTime 工具函数**

在 script 中新增：
```typescript
function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
```

- [ ] **Step 4: 添加新样式**

```css
.record-info-col { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.record-time { font-size: 11px; color: var(--text-tertiary); font-family: monospace; }
```

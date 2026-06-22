<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">数据看板</h1>
      <span class="title-line"></span>
    </div>

    <!-- 快捷按钮 -->
    <div class="quick-bar-row">
      <button class="quick-btn" @click="$router.push('/entry')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>入库</span>
      </button>
      <button class="quick-btn" @click="$router.push('/inventory')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>查库存</span>
      </button>
      <button class="quick-btn" @click="$router.push('/manual')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span>使用手册</span>
      </button>
      <button class="quick-btn" @click="showImeiQuery = true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        <span>IMEI查询</span>
      </button>
    </div>

    <!-- 快速开单区 -->
    <div class="sale-section glass">
      <div class="sale-section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        快速开单
      </div>

      <!-- 销售类型切换 -->
      <div class="sale-type-row" style="margin-bottom:16px;">
        <span class="sale-type-label">销售类型</span>
        <label :class="['sale-type-radio', { active: saleType === 'normal' }]" @click="switchType('normal')">
          <span class="radio-dot"></span> 普通销售
        </label>
        <label :class="['sale-type-radio', { active: saleType === 'no-stock' }]" @click="switchType('no-stock')">
          <span class="radio-dot"></span> 无库存销售
        </label>
      </div>

      <!-- 普通销售：扫码 IMEI -->
      <div v-if="saleType === 'normal'">
        <div class="scan-row">
          <div class="scan-input-wrap">
            <input ref="scanRef" v-model="scanInput" class="scan-input" placeholder="扫码枪扫描或输入 IMEI 后按回车" @keyup.enter="handleScan" />
          </div>
          <button class="scan-btn" @click="handleScan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
            扫描
          </button>
        </div>
        <div v-if="scanning" class="scan-status"><span class="spinner"></span> 正在查询...</div>
        <div v-if="scanError" class="scan-error">{{ scanError }}</div>
      </div>

      <!-- 无库存销售：品牌型号搜索 + IMEI 录入 -->
      <div v-if="saleType === 'no-stock'">
        <div class="brand-search-wrap">
          <input
            ref="brandInputRef"
            v-model="brandInput"
            class="scan-input"
            placeholder="搜索或输入品牌型号"
            @input="onBrandInput"
            @keydown="onBrandKeydown"
            @keyup.enter="onBrandEnter"
          />
          <!-- 下拉匹配列表 -->
          <div v-if="brandSuggestions.length > 0 && brandDropdownOpen" class="brand-dropdown">
            <div
              v-for="(m, idx) in brandSuggestions"
              :key="idx"
              :class="['brand-dropdown-item', { active: brandHighlightIdx === idx }]"
              @click="selectBrandSuggestion(m)"
              @mouseenter="brandHighlightIdx = idx"
            >
              <span class="brand-dd-name">{{ m.brand?.name }} {{ m.name }}</span>
              <span class="brand-dd-spec">{{ [m.color, m.memory].filter(Boolean).join(' · ') }}</span>
              <span class="brand-dd-price">¥{{ (m.sale_price || 0).toFixed(2) }}</span>
            </div>
            <div v-if="brandInput.trim() && !brandExactMatch" class="brand-dropdown-empty">
              <span>未找到匹配项，将保存为新品牌型号</span>
              <button class="brand-save-btn" @click.stop="openSaveBrandFromSearch">保存</button>
            </div>
          </div>
          <!-- 已选品牌型号标签 -->
          <div v-if="selectedModel" class="brand-selected-tag">
            <span>{{ selectedModel.brand?.name }} {{ selectedModel.name }} - {{ selectedModel.color || '' }} {{ selectedModel.memory || '' }}</span>
            <button class="brand-selected-clear" @click="clearSelectedModel">&times;</button>
          </div>
        </div>

        <!-- IMEI 录入区 -->
        <div v-if="selectedModel || (brandInput.trim() && !brandSuggestions.length && !brandSearching)" style="margin-top:16px;">
          <div class="imei-entry-row">
            <span class="settle-label">售出价格</span>
            <el-input-number v-model="noStockPrice" :min="0" :precision="2" size="large" controls-position="right" style="width:200px;" />
          </div>
          <div class="imei-entry-row" style="margin-top:12px;">
            <span class="settle-label">IMEI1</span>
            <div class="imei1-input-wrap">
              <input ref="imei1Ref" v-model="noStockImei1" class="imei-entry-input" :class="{ 'input-error': noStockImeiError }" placeholder="扫码或输入 IMEI1" @keyup.enter="focusImei2" />
              <div v-if="noStockImeiError" class="no-stock-imei-error-tip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {{ noStockImeiError }}
              </div>
              <div v-if="noStockImeiChecking" class="no-stock-imei-checking">
                <span class="checking-spinner"></span> 校验中...
              </div>
            </div>
          </div>
          <div class="imei-entry-row">
            <span class="settle-label">IMEI2</span>
            <input ref="imei2Ref" v-model="noStockImei2" class="imei-entry-input" placeholder="扫码或输入 IMEI2（可选）" @keyup.enter="focusSn" />
          </div>
          <div class="imei-entry-row">
            <span class="settle-label">S/N</span>
            <input ref="snRef" v-model="noStockSn" class="imei-entry-input" placeholder="扫码或输入 S/N 码（可选）" @keyup.enter="addNoStockItem" />
          </div>
          <button class="imei-add-btn" @click="addNoStockItem">添加至购物车</button>
        </div>
      </div>

      <div v-if="saleType === 'normal' && scanError" class="scan-error">{{ scanError }}</div>

      <div v-if="cart.length">
        <div class="section-header">
          <span class="section-title">已选商品</span>
          <span class="section-badge">{{ cart.length }} 件</span>
        </div>
        <div class="cart-list">
          <CartItemCard v-for="(item, i) in cart" :key="i" :item="item" @remove="cart.splice(i, 1)" />
        </div>

        <div class="checkout-area">
          <div class="checkout-row">
            <span class="checkout-label">合计</span>
            <span class="checkout-total">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
          <div class="checkout-row">
            <span class="checkout-label">收款金额</span>
            <el-input-number v-model="paidAmount" :min="0" :precision="2" size="large" controls-position="right" style="width:180px;" />
          </div>
          <div class="checkout-row">
            <span class="checkout-label">找零</span>
            <span :class="['checkout-change', changeAmount < 0 ? 'change-err' : '']">¥{{ Math.abs(changeAmount).toFixed(2) }}{{ changeAmount < 0 ? ' (不足)' : '' }}</span>
          </div>
          <div class="checkout-row">
            <div class="customer-field">
              <span class="checkout-label">客户</span>
              <el-input v-model="customerName" placeholder="选填" size="large" style="width:160px;" />
            </div>
            <div class="customer-field">
              <span class="checkout-label">电话</span>
              <el-input v-model="customerPhone" placeholder="选填" size="large" style="width:160px;" />
            </div>
            <div class="customer-field">
              <span class="checkout-label">地址</span>
              <el-input v-model="customerAddress" placeholder="选填" size="large" style="width:200px;" />
            </div>
            <div class="customer-field">
              <span class="checkout-label">备注</span>
              <el-input v-model="remark" placeholder="选填" size="large" style="width:160px;" />
            </div>
          </div>
        </div>

        <button class="pay-btn" @click="showPayConfirm = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ saleType === 'no-stock' ? '确认收款（无库存）' : '确认收款' }}  ¥{{ totalAmount.toFixed(2) }}
        </button>
      </div>
      <div v-else class="cart-empty">{{ saleType === 'normal' ? '扫码添加商品开始开单' : '添加商品开始开单' }}</div>
    </div>

    <!-- 统计时段选择 -->
    <!-- <div class="time-range-bar">
      <el-select v-model="timeRange" size="large" style="width:150px;">
        <el-option label="最近3个月" value="3m" />
        <el-option label="本月" value="thisMonth" />
        <el-option label="本年" value="thisYear" />
      </el-select>
      <span class="time-range-text">{{ timeRangeLabel }}</span>
    </div> -->

    <!-- 销售额趋势（全宽） -->
    <!-- <div class="data-card glass" style="margin-bottom:20px;">
      <div class="data-card-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        销售额趋势
      </div>
      <div class="data-card-body" style="height:200px;">
        <LineChart :data="trendData" color="#2563EB" height="200px" />
      </div>
    </div>

    <!-- 商品广场 -->
    <div class="data-card glass" style="margin-bottom:20px;">
      <div class="data-card-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        商品广场
        <span class="showcase-count">{{ flatModels.length }} 个型号</span>
        <div class="showcase-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="showcaseKeyword" class="showcase-input" placeholder="搜索品牌 / 型号..." />
        </div>
      </div>
      <div v-if="showcaseLoading" class="showcase-loading">加载中...</div>
      <div v-else-if="filteredBrands.length === 0" class="empty-data">暂无型号数据</div>
      <div v-else class="showcase-body">
        <div v-for="brand in filteredBrands" :key="brand.id" class="showcase-brand-group">
          <div class="showcase-brand-header">
            <span class="showcase-brand-name">{{ brand.name }}</span>
            <span class="showcase-brand-count">{{ brand.models.length }} 款</span>
          </div>
          <div class="showcase-model-grid">
            <div v-for="m in brand.models" :key="m.id" class="showcase-model-card">
              <div class="showcase-model-name">{{ m.name }}</div>
              <div class="showcase-model-spec">{{ [m.color, m.memory].filter(Boolean).join(' · ') }}</div>
              <div class="showcase-model-price">¥{{ (m.sale_price || 0).toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 双列：品牌库存 + 售出排行 -->
    <!-- <div class="data-grid-2col">
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
    </div> -->

    <!-- 双列记录 -->
    <!-- <div class="dual-records">
      <div class="data-card glass">
        <div class="data-card-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          最近售出
        </div>
        <div class="record-list">
          <div v-for="sale in recentSales" :key="sale.id || sale.order_no" class="record-item">
            <div class="record-left">
              <svg width="5" height="5" viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2.5" fill="#F97316"/></svg>
              <span class="record-sale-link" @click="openSaleDetail(sale.id)">售出 {{ saleItemName(sale) }} x {{ sale.quantity || 1 }}</span>
            </div>
            <span class="record-date">{{ formatDate(sale.created_at) }}</span>
          </div>
          <div v-if="!recentSales.length" class="empty-data">暂无售出记录</div>
        </div>
      </div>
      <div class="data-card glass">
        <div class="data-card-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          最近入库
        </div>
        <div class="record-list">
          <div v-for="e in recentEntries" :key="e.id" class="record-item">
            <div class="record-left">
              <svg width="5" height="5" viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2.5" fill="#3B82F6"/></svg>
              <span class="record-supplier-link" @click="openEntryDetail(e.id)">{{ e.supplier?.name || '未知供应商' }}</span>
            </div>
            <span class="record-date">{{ formatDate(e.created_at) }}</span>
          </div>
          <div v-if="!recentEntries.length" class="empty-data">暂无入库记录</div>
        </div>
      </div>
    </div> -->

    <!-- 入库详情弹窗 -->
    <el-dialog v-model="entryDetailVisible" title="入库详情" width="700px" :close-on-click-modal="false" class="entry-detail-dialog">
      <template v-if="entryDetailData">
        <div class="entry-detail-info">
          <div class="entry-detail-row">
            <span class="entry-detail-label">供应商</span>
            <span class="entry-detail-value">{{ entryDetailData.supplier?.name || '-' }}</span>
          </div>
          <div class="entry-detail-row">
            <span class="entry-detail-label">入库时间</span>
            <span class="entry-detail-value">{{ formatDateTime(entryDetailData.created_at) }}</span>
          </div>
          <div class="entry-detail-row" v-if="entryDetailData.remark">
            <span class="entry-detail-label">备注</span>
            <span class="entry-detail-value">{{ entryDetailData.remark }}</span>
          </div>
        </div>
        <div class="entry-detail-items-head">入库商品明细</div>
        <el-table :data="entryDetailData?.items || []" stripe size="small" max-height="300">
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">
              <span class="entry-model-cell">
                <span class="entry-model-brand">{{ row.model?.brand?.name }}</span>
                {{ row.model?.name }} {{ row.model?.color || '' }} {{ row.model?.memory || '' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="IMEI" width="150" prop="imei" />
          <el-table-column label="IMEI2" width="130">
            <template #default="{ row }">{{ row.imei2 || '-' }}</template>
          </el-table-column>
          <el-table-column label="S/N" width="120">
            <template #default="{ row }">{{ row.sn_code || '-' }}</template>
          </el-table-column>
          <el-table-column label="单价" width="90" align="right">
            <template #default="{ row }">¥{{ (row.unit_price || 0).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <button class="dialog-close-btn" @click="entryDetailVisible = false">关闭</button>
      </template>
    </el-dialog>

    <!-- 销售详情弹窗 -->
    <el-dialog v-model="saleDetailVisible" title="销售详情" width="700px" :close-on-click-modal="false" class="entry-detail-dialog">
      <template v-if="saleDetailData">
        <div class="entry-detail-info">
          <div class="entry-detail-row">
            <span class="entry-detail-label">订单号</span>
            <span class="entry-detail-value">{{ saleDetailData.order_no }}</span>
          </div>
          <div class="entry-detail-row">
            <span class="entry-detail-label">售出时间</span>
            <span class="entry-detail-value">{{ formatDateTime(saleDetailData.created_at) }}</span>
          </div>
          <div class="entry-detail-row">
            <span class="entry-detail-label">合计金额</span>
            <span class="entry-detail-value">¥{{ (saleDetailData.total_amount || 0).toFixed(2) }}</span>
          </div>
          <div class="entry-detail-row" v-if="saleDetailData.customer_name">
            <span class="entry-detail-label">客户</span>
            <span class="entry-detail-value">{{ saleDetailData.customer_name }}{{ saleDetailData.customer_phone ? ' / ' + saleDetailData.customer_phone : '' }}</span>
          </div>
        </div>
        <div class="entry-detail-items-head">售出商品明细</div>
        <el-table :data="saleDetailData?.items || []" stripe size="small" max-height="300">
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">
              <span class="entry-model-cell">{{ saleItemName(saleDetailData) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="IMEI" width="180" prop="imei" />
          <el-table-column label="售价" width="100" align="right">
            <template #default="{ row }">¥{{ (row.unit_price || 0).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <button class="dialog-close-btn" @click="saleDetailVisible = false">关闭</button>
      </template>
    </el-dialog>

    <!-- 确认收款弹窗 -->
    <ConfirmDialog
      :visible="showPayConfirm" title="确认收款"
      :message="`共 ${cart.length} 件商品，应收 ¥${totalAmount.toFixed(2)}，实收 ¥${paidAmount.toFixed(2)}${saleType === 'no-stock' ? '（无库存销售）' : ''}`"
      type="success" confirm-text="确认收款" cancel-text="再想想"
      @confirm="handlePay" @cancel="showPayConfirm = false"
    />

    <!-- IMEI查询弹窗 -->
    <ImeiQueryDialog v-model:visible="showImeiQuery" />

    <!-- 小票打印 -->
    <PrintReceipt ref="printReceiptRef" :data="printData" :store-name="storeName" />

    <!-- 保存品牌型号 -->
    <SaveBrandDialog
      :visible="showSaveBrand"
      :items="pendingBrandItems"
      @confirm="onBrandSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { scanImeiForSale, getBrandInventory } from '@/api/inventory'
import { getPurchaseEntries, getPurchaseEntry, checkImeiExists } from '@/api/purchase'
import { getDashboard, getSalesStats, getTopProducts } from '@/api/stats'
import { createSale, createNoStockSale, getSalePrintData, getSalesList, getSaleDetail } from '@/api/sales'
import { getBrands, getModels } from '@/api/product'
import LineChart from '@/components/LineChart.vue'
import HorizontalBarChart from '@/components/HorizontalBarChart.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ImeiQueryDialog from '@/components/ImeiQueryDialog.vue'
import PrintReceipt from '@/components/PrintReceipt.vue'
import CartItemCard from '@/components/CartItemCard.vue'
import SaveBrandDialog from '@/components/SaveBrandDialog.vue'
import type { BrandModelItem } from '@/components/SaveBrandDialog.vue'

const userStore = useUserStore()
const scanRef = ref<HTMLInputElement>()
const brandInputRef = ref<HTMLInputElement>()
const imei1Ref = ref<HTMLInputElement>()
const imei2Ref = ref<HTMLInputElement>()
const snRef = ref<HTMLInputElement>()

// 销售类型
const saleType = ref<'normal' | 'no-stock'>('normal')

// 无库存销售状态
const brandInput = ref('')
const brandSearching = ref(false)
const brandSuggestions = ref<any[]>([])
const brandDropdownOpen = ref(false)
const brandHighlightIdx = ref(-1)
const brandExactMatch = ref(false)
const selectedModel = ref<any>(null)
const noStockPrice = ref(0)
const noStockImei1 = ref('')
const noStockImei2 = ref('')
const noStockSn = ref('')
const noStockImeiError = ref('')
const noStockImeiChecking = ref(false)
let noStockImeiCheckTimer: ReturnType<typeof setTimeout> | null = null
const brandSaveMarked = ref<Set<string>>(new Set())

// 保存品牌型号弹窗
const showSaveBrand = ref(false)
const pendingBrandItems = ref<BrandModelItem[]>([])

// 备注
const remark = ref('')

// 时间范围
const timeRangeLabel = computed(() => {
  const range = getDateRange()
  if (!range.start_date) return '全部时间'
  return `${range.start_date} ~ ${range.end_date}`
})

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateTime(iso: string) {
  if (!iso) return ''
  return `${formatDate(iso)} ${formatTime(iso)}`
}

function saleItemName(sale: any) {
  const brand = sale.model?.brand?.name || ''
  const model = sale.model?.name || ''
  return [brand, model].filter(Boolean).join(' ') || '手机'
}

// 开单
const scanInput = ref('')
const scanning = ref(false)
const scanError = ref('')
const cart = ref<Array<{ brandName: string; modelName: string; color?: string; storage?: string; imei: string; imei2?: string | null; snCode?: string | null; price: number; modelId?: number | null; rawText?: string; brandText?: string; modelText?: string }>>([])
const paidAmount = ref(0)
const customerName = ref('')
const customerPhone = ref('')
const customerAddress = ref('')
const showPayConfirm = ref(false)
const showImeiQuery = ref(false)
const printData = ref<any>(null)
const printReceiptRef = ref()

const totalAmount = computed(() => cart.value.reduce((s, i) => s + (i.price || 0), 0))
const changeAmount = computed(() => paidAmount.value - totalAmount.value)
const storeName = computed(() => {
  const sid = userStore.effectiveStoreId
  const s = userStore.stores.find((x: any) => x.id === sid)
  return s?.name || ''
})

// 数据
const timeRange = ref('3m')
const trendRaw = ref<any[]>([])
const topRaw = ref<any[]>([])
const recentOrders = ref<any[]>([])
const recentSales = ref<any[]>([])
const brandStockRaw = ref<any[]>([])
const recentEntries = ref<any[]>([])

// 商品广场
const showcaseKeyword = ref('')
const showcaseLoading = ref(false)
const showcaseBrands = ref<any[]>([])

const flatModels = computed(() => {
  const list: any[] = []
  for (const b of showcaseBrands.value) {
    for (const m of b.models || []) {
      list.push({ ...m, brandName: b.name })
    }
  }
  return list
})

const filteredBrands = computed(() => {
  const kw = showcaseKeyword.value.trim().toLowerCase()
  if (!kw) return showcaseBrands.value
  return showcaseBrands.value
    .map(b => ({
      ...b,
      models: (b.models || []).filter((m: any) =>
        b.name.toLowerCase().includes(kw) ||
        (m.name || '').toLowerCase().includes(kw) ||
        (m.color || '').toLowerCase().includes(kw)
      ),
    }))
    .filter(b => b.models.length > 0)
})

// 入库详情弹窗
const entryDetailVisible = ref(false)
const entryDetailData = ref<any>(null)

async function openEntryDetail(id: number) {
  try {
    const data = await getPurchaseEntry(id)
    entryDetailData.value = data
    entryDetailVisible.value = true
  } catch { /* handled by interceptor */ }
}

// 销售详情弹窗
const saleDetailVisible = ref(false)
const saleDetailData = ref<any>(null)

async function openSaleDetail(id: number) {
  try {
    const data = await getSaleDetail(id)
    saleDetailData.value = data
    saleDetailVisible.value = true
  } catch { /* handled by interceptor */ }
}

const trendData = computed(() => trendRaw.value.map((i: any) => ({ label: (i.date || '').slice(5), value: i.totalAmount || i.amount || 0 })))
const topProductsData = computed(() => topRaw.value.map((i: any) => ({ label: i.modelName || '', value: i.quantity || 0 })))

// 品牌库存聚合
const brandStockList = computed(() => {
  const map: Record<string, number> = {}
  for (const item of brandStockRaw.value) {
    const name = item.brandName || item.brand_name || '未知'
    map[name] = (map[name] || 0) + (item.quantity || item.stock || 0)
  }
  return Object.entries(map)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)
})

onMounted(() => {
  nextTick(() => {
    if (saleType.value === 'normal') scanRef.value?.focus()
    else brandInputRef.value?.focus()
  })
  loadAll()
})

watch(timeRange, loadAllDataOnly)

async function loadAll() {
  const storeId = userStore.effectiveStoreId || undefined
  try {
    const d = await getDashboard(storeId)
    recentOrders.value = d?.recentOrders || []
  } catch {}
  await Promise.all([
    loadAllDataOnly(),
    loadRecentSales(),
    loadShowcase(),
  ])
}

async function loadShowcase() {
  showcaseLoading.value = true
  try {
    const brands = await getBrands()
    showcaseBrands.value = (brands || []).filter((b: any) => b.models && b.models.length > 0)
  } catch {
    showcaseBrands.value = []
  } finally {
    showcaseLoading.value = false
  }
}

async function loadRecentSales() {
  try {
    const res = await getSalesList({ page: 1, pageSize: 5, storeId: userStore.effectiveStoreId || undefined })
    recentSales.value = res?.list || []
  } catch { recentSales.value = [] }
}

async function loadAllDataOnly() {
  const storeId = userStore.effectiveStoreId || undefined
  const range = getDateRange()
  try { trendRaw.value = await getSalesStats({ ...range, storeId }) } catch { trendRaw.value = [] }
  try { topRaw.value = await getTopProducts({ startDate: range.start_date, endDate: range.end_date, storeId, limit: 10 }) } catch { topRaw.value = [] }
  try {
    const inv = await getBrandInventory({ storeId })
    brandStockRaw.value = inv?.list || []
  } catch { brandStockRaw.value = [] }
  try {
    const entries = await getPurchaseEntries({ page: 1, pageSize: 5 })
    recentEntries.value = entries?.list?.slice(0, 5) || []
  } catch { recentEntries.value = [] }
}

function getDateRange() {
  const now = new Date(); const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0'); const d = String(now.getDate()).padStart(2, '0')
  const today = `${y}-${m}-${d}`
  let start = ''; let groupBy = 'day'
  switch (timeRange.value) {
    case '3m': { const d3 = new Date(now); d3.setDate(d3.getDate() - 90); start = d3.toISOString().slice(0, 10); break }
    case 'thisMonth': { start = `${y}-${m}-01`; break }
    case 'thisYear': { start = `${y}-01-01`; groupBy = 'month'; break }
  }
  return { start_date: start, end_date: today, groupBy }
}

// 销售类型切换
function switchType(type: 'normal' | 'no-stock') {
  if (type === saleType.value) return
  if (cart.value.length > 0) {
    ElMessageBox.confirm('切换销售类型将清空购物车，是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      doSwitchType(type)
    }).catch(() => {})
  } else {
    doSwitchType(type)
  }
}

function doSwitchType(type: 'normal' | 'no-stock') {
  saleType.value = type
  resetCart()
  nextTick(() => {
    if (type === 'normal') scanRef.value?.focus()
    else brandInputRef.value?.focus()
  })
}

// 无库存销售：品牌型号搜索
let brandSearchTimer: ReturnType<typeof setTimeout> | null = null

async function onBrandInput() {
  if (brandSearchTimer) clearTimeout(brandSearchTimer)
  const val = brandInput.value.trim()
  if (!val) {
    brandSuggestions.value = []
    brandDropdownOpen.value = false
    selectedModel.value = null
    return
  }
  brandSearchTimer = setTimeout(async () => {
    brandSearching.value = true
    try {
      const models = await getModels(undefined, val)
      const filtered = models.filter((m: any) => {
        const fullName = `${m.brand?.name || ''} ${m.name}`.toLowerCase()
        return fullName.includes(val.toLowerCase())
      })
      brandSuggestions.value = filtered
      brandExactMatch.value = filtered.some((m: any) =>
        `${m.brand?.name} ${m.name}` === val
      )
      brandDropdownOpen.value = filtered.length > 0 || val.length > 0
      brandHighlightIdx.value = -1
    } catch {
      brandSuggestions.value = []
    } finally {
      brandSearching.value = false
    }
  }, 300)
}

function onBrandKeydown(e: KeyboardEvent) {
  if (!brandDropdownOpen.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    brandHighlightIdx.value = Math.min(brandHighlightIdx.value + 1, brandSuggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    brandHighlightIdx.value = Math.max(brandHighlightIdx.value - 1, -1)
  } else if (e.key === 'Enter' && brandHighlightIdx.value >= 0) {
    e.preventDefault()
    selectBrandSuggestion(brandSuggestions.value[brandHighlightIdx.value])
  }
}

function onBrandEnter() {
  if (brandHighlightIdx.value >= 0 && brandSuggestions.value[brandHighlightIdx.value]) {
    selectBrandSuggestion(brandSuggestions.value[brandHighlightIdx.value])
  } else if (brandInput.value.trim()) {
    brandDropdownOpen.value = false
    selectedModel.value = null
    noStockPrice.value = 0
    nextTick(() => imei1Ref.value?.focus())
  }
}

function selectBrandSuggestion(model: any) {
  selectedModel.value = model
  brandInput.value = `${model.brand?.name} ${model.name}`
  brandDropdownOpen.value = false
  noStockPrice.value = model.sale_price || 0
  nextTick(() => imei1Ref.value?.focus())
}

function clearSelectedModel() {
  selectedModel.value = null
  brandInput.value = ''
  brandSuggestions.value = []
  brandDropdownOpen.value = false
  nextTick(() => brandInputRef.value?.focus())
}

function focusImei2() { nextTick(() => imei2Ref.value?.focus()) }
function focusSn() { nextTick(() => snRef.value?.focus()) }

// 无库存销售 IMEI 自动校验
watch(noStockImei1, (val) => {
  const trimmed = val.trim()
  if (!trimmed) {
    noStockImeiError.value = ''
    if (noStockImeiCheckTimer) { clearTimeout(noStockImeiCheckTimer); noStockImeiCheckTimer = null }
    return
  }
  if (trimmed.length >= 15) {
    if (noStockImeiCheckTimer) clearTimeout(noStockImeiCheckTimer)
    noStockImeiCheckTimer = setTimeout(async () => {
      noStockImeiChecking.value = true
      try {
        const data = await checkImeiExists(trimmed)
        if (data?.exists) {
          const status = data.record?.status === 'sold' ? '已售出' : '已在库'
          noStockImeiError.value = `IMEI ${trimmed} ${status}，不能作为无库存销售`
        } else {
          noStockImeiError.value = ''
        }
      } catch {
        // 静默跳过
      } finally {
        noStockImeiChecking.value = false
      }
    }, 300)
  } else {
    noStockImeiError.value = ''
  }
})

function addNoStockItem() {
  if (!brandInput.value.trim()) {
    ElMessage.warning('请输入品牌型号')
    return
  }
  if (!noStockImei1.value.trim()) {
    ElMessage.warning('请输入 IMEI1')
    return
  }
  // IMEI 重复性校验 — 库存中存在则不能作为无库存销售
  if (noStockImeiError.value) {
    ElMessage.warning(noStockImeiError.value)
    return
  }
  const rawText = brandInput.value.trim()
  const brand = selectedModel.value?.brand?.name || ''
  const modelName = selectedModel.value?.name || ''
  cart.value.push({
    brandName: brand || rawText,
    modelName: modelName || '',
    color: selectedModel.value?.color || '',
    storage: selectedModel.value?.memory || '',
    imei: noStockImei1.value.trim(),
    imei2: noStockImei2.value.trim() || null,
    snCode: noStockSn.value.trim() || null,
    price: noStockPrice.value,
    modelId: selectedModel.value?.id || null,
    rawText,
    brandText: brand,
    modelText: modelName,
  })
  paidAmount.value = totalAmount.value
  noStockImei1.value = ''
  noStockImei2.value = ''
  noStockSn.value = ''
  noStockImeiError.value = ''
  noStockPrice.value = selectedModel.value?.sale_price || 0
  if (!selectedModel.value) brandInput.value = ''
  nextTick(() => imei1Ref.value?.focus())
}

async function openSaveBrandFromSearch() {
  if (!brandInput.value.trim()) return
  const rawText = brandInput.value.trim()
  const spaceIdx = rawText.indexOf(' ')
  const brand = spaceIdx > 0 ? rawText.slice(0, spaceIdx) : rawText
  const model = spaceIdx > 0 ? rawText.slice(spaceIdx + 1) : ''
  pendingBrandItems.value = [{ rawText, brand, model, salePrice: noStockPrice.value }]
  showSaveBrand.value = true
}

// 扫码
async function handleScan() {
  const imei = scanInput.value.trim()
  if (!imei) return
  scanning.value = true; scanError.value = ''
  try {
    const item = await scanImeiForSale(imei, userStore.effectiveStoreId || undefined)
    if (!item) {
      promptSwitchToNoStock(imei)
      return
    }
    if (item.isSold || item.status === 'sold') { scanError.value = '该手机已售出'; return }
    if (cart.value.some(c => c.imei === imei)) { scanError.value = '已在购物车中'; return }
    cart.value.push({
      brandName: item.brandName || '',
      modelName: item.modelName || '',
      color: item.color || '',
      storage: item.storage || '',
      imei: item.imei,
      imei2: item.imei2 || null,
      snCode: item.sn_code || null,
      price: item.salePrice || 0,
    })
    paidAmount.value = totalAmount.value
    scanInput.value = ''; scanError.value = ''
    nextTick(() => scanRef.value?.focus())
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 404) {
      promptSwitchToNoStock(imei)
    } else {
      scanError.value = e?.response?.data?.message || e?.message || '查询失败'
    }
  } finally { scanning.value = false }
}

function promptSwitchToNoStock(imei: string) {
  ElMessageBox.confirm(
    `未找到 IMEI "${imei}" 的库存记录，是否切换到无库存销售模式？`,
    '未匹配到库存',
    {
      confirmButtonText: '切换到无库存销售',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    saleType.value = 'no-stock'
    cart.value = []
    paidAmount.value = 0
    noStockImei1.value = imei
    nextTick(() => { brandInputRef.value?.focus() })
  }).catch(() => {
    scanInput.value = ''
    nextTick(() => scanRef.value?.focus())
  })
}

// 收款
async function handlePay() {
  showPayConfirm.value = false
  if (saleType.value === 'normal') {
    await doNormalPay()
  } else {
    await doNoStockPay()
  }
}

async function doNormalPay() {
  let saleId: number | null = null
  try {
    const result = await createSale({
      items: cart.value.map(i => ({ imei: i.imei, unit_price: i.price, imei2: i.imei2 || null, sn_code: i.snCode || null })),
      actual_amount: paidAmount.value,
      total_amount: totalAmount.value,
      change_amount: paidAmount.value - totalAmount.value,
      customer_name: customerName.value || undefined,
      customer_phone: customerPhone.value || undefined,
      customer_address: customerAddress.value || undefined,
      remark: remark.value || undefined,
    })
    saleId = result?.id
    const msg = `开单成功！共 ${cart.value.length} 件 ¥${totalAmount.value.toFixed(2)}`
    ElMessage.success({ message: msg, duration: 3000 })
    resetCart()
    nextTick(() => scanRef.value?.focus())
    loadAll()
    if (saleId) {
      ElMessageBox.confirm('是否打印小票？', '开单成功', {
        confirmButtonText: '打印',
        cancelButtonText: '关闭',
        type: 'success',
      }).then(async () => {
        try {
          const d = await getSalePrintData(saleId)
          printData.value = d
          nextTick(() => { printReceiptRef.value?.open() })
        } catch { ElMessage.error('获取打印数据失败') }
      }).catch(() => {})
    }
  } catch (e: any) { ElMessage.error(e?.message || '开单失败') }
}

// 无库存销售：付款
async function doNoStockPay() {
  const toSave: BrandModelItem[] = []
  for (const item of cart.value) {
    if (item.modelId) continue
    const rawText = item.rawText || `${item.brandName} ${item.modelName}`.trim()
    if (brandSaveMarked.value.has(rawText)) continue
    const spaceIdx = rawText.indexOf(' ')
    const brand = spaceIdx > 0 ? rawText.slice(0, spaceIdx) : rawText
    const model = spaceIdx > 0 ? rawText.slice(spaceIdx + 1) : ''
    toSave.push({ rawText, brand, model, salePrice: item.price })
  }
  if (toSave.length > 0) {
    pendingBrandItems.value = toSave
    showSaveBrand.value = true
    return
  }
  await submitNoStockSale()
}

async function onBrandSaved(savedItems: BrandModelItem[]) {
  showSaveBrand.value = false
  for (const item of savedItems) {
    if (!item.brand.trim() || !item.model.trim()) continue
    brandSaveMarked.value.add(item.rawText)
  }
  await submitNoStockSale()
}

async function submitNoStockSale() {
  try {
    const result = await createNoStockSale({
      items: cart.value.map(i => ({
        brand_name: i.brandName,
        model_name: i.modelName || i.brandName,
        model_id: i.modelId || null,
        color: i.color || '',
        storage: i.storage || '',
        imei: i.imei,
        imei2: i.imei2 || null,
        sn_code: i.snCode || null,
        unit_price: i.price,
      })),
      actual_amount: paidAmount.value,
      total_amount: totalAmount.value,
      change_amount: paidAmount.value - totalAmount.value,
      customer_name: customerName.value || undefined,
      customer_phone: customerPhone.value || undefined,
      customer_address: customerAddress.value || undefined,
      remark: remark.value || undefined,
    })
    const msg = `无库存开单成功！共 ${cart.value.length} 件 ¥${totalAmount.value.toFixed(2)}`
    ElMessage.success({ message: msg, duration: 3000 })
    resetCart()
    nextTick(() => brandInputRef.value?.focus())
    loadAll()
    if (result?.id) {
      try {
        const d = await getSalePrintData(result.id)
        printData.value = d
        nextTick(() => { printReceiptRef.value?.open() })
      } catch { /* print failed, non-critical */ }
    }
  } catch (e: any) { ElMessage.error(e?.message || '开单失败') }
}

function resetCart() {
  cart.value = []
  paidAmount.value = 0
  customerName.value = ''
  customerPhone.value = ''
  customerAddress.value = ''
  remark.value = ''
  scanInput.value = ''
  scanError.value = ''
  brandInput.value = ''
  brandSuggestions.value = []
  brandDropdownOpen.value = false
  selectedModel.value = null
  noStockPrice.value = 0
  noStockImei1.value = ''
  noStockImei2.value = ''
  noStockSn.value = ''
  brandSaveMarked.value = new Set()
}
</script>

<style scoped>
.page-container { width: 100%; }
/* 页面标题 */
.page-title-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: var(--text); margin: 0; white-space: nowrap; }
.title-line { flex: 1; height: 0; border-top: 1px dashed var(--border); }

/* 快捷按钮 */
.quick-bar-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.quick-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 88px; border: none; border-radius: 16px; cursor: pointer; font-family: inherit; color: var(--text); background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)); border: 1px solid var(--glass-border); transition: var(--transition); font-size: 16px; font-weight: 600; }
.quick-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.quick-btn:active { transform: translateY(0); }
.quick-btn svg { color: var(--primary); }

/* 开单区 */
.sale-section { padding: 22px 24px; border-radius: var(--radius); margin-bottom: 24px; }
.sale-section-header { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; color: var(--text); margin-bottom: 18px; }
.sale-section-header svg { color: var(--primary); }
.scan-row { display: flex; gap: 12px; }
.scan-input-wrap { flex: 1; }
.scan-input { width: 100%; height: 50px; padding: 0 18px; font-size: 18px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.scan-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.scan-input::placeholder { color: var(--text-tertiary); font-size: 16px; }
.scan-btn { display: inline-flex; align-items: center; gap: 6px; height: 50px; padding: 0 24px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.scan-btn:hover { background: var(--primary-dark); }
.scan-status { margin-top: 10px; font-size: 14px; color: var(--text-tertiary); display: flex; align-items: center; gap: 8px; }
.scan-error { margin-top: 10px; font-size: 14px; color: var(--danger); padding: 8px 12px; background: var(--danger-light); border-radius: var(--radius-sm); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.cart-area { margin-top: 18px; }
.cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 15px; font-weight: 600; color: var(--text); }
.cart-clear { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border: 1px solid var(--border); border-radius: 8px; background: transparent; font-size: 13px; cursor: pointer; font-family: inherit; color: var(--text-tertiary); transition: var(--transition); }
.cart-clear:hover { border-color: var(--danger); color: var(--danger); }
.cart-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; max-height: 240px; overflow-y: auto; }
.cart-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,0.5); border-radius: var(--radius-sm); }
.cart-item-info { flex: 1; min-width: 0; }
.cart-item-name { font-size: 15px; font-weight: 500; color: var(--text); }
.cart-item-imei { font-size: 13px; color: var(--text-tertiary); font-family: monospace; margin-top: 1px; }
.cart-item-del { width: 30px; height: 30px; border: none; border-radius: 50%; background: rgba(239,68,68,0.1); display: flex; align-items: center; justify-content: center; color: var(--danger); cursor: pointer; transition: var(--transition); flex-shrink: 0; }
.cart-item-del:hover { background: var(--danger); color: #fff; }
.cart-empty { text-align: center; padding: 24px 0; font-size: 15px; color: var(--text-tertiary); }
.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; margin-top: 16px; }
.section-title { font-size: 17px; font-weight: 600; color: var(--text); }
.section-badge { background: var(--primary-light); color: var(--primary); font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 10px; }
.checkout-area { border-top: 1px solid var(--border); padding-top: 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 12px; }
.checkout-row { display: flex; align-items: center; gap: 16px; }
.checkout-label { font-size: 14px; color: var(--text-secondary); min-width: 70px; }
.checkout-total { font-size: 24px; font-weight: 700; color: var(--text); font-family: 'SF Mono', monospace; }
.checkout-change { font-size: 18px; font-weight: 700; font-family: monospace; color: var(--success); }
.change-err { color: var(--danger); font-size: 15px; }
.customer-field { display: flex; align-items: center; gap: 8px; }
.pay-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 56px; border: none; border-radius: var(--radius); background: var(--success); color: #fff; font-size: 20px; font-weight: 700; cursor: pointer; font-family: inherit; transition: var(--transition); }
.pay-btn:hover { filter: brightness(0.92); box-shadow: 0 4px 16px rgba(34,197,94,0.3); }

/* 销售类型切换 */
.sale-type-row { display: flex; align-items: center; gap: 12px; }
.sale-type-label { font-size: 14px; color: var(--text-secondary); font-weight: 500; min-width: 60px; }
.sale-type-radio { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; color: var(--text-secondary); padding: 6px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); transition: var(--transition); user-select: none; }
.sale-type-radio:hover { border-color: var(--primary); color: var(--text); }
.sale-type-radio.active { border-color: var(--primary); color: var(--primary); background: var(--primary-light); font-weight: 600; }
.radio-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); display: inline-block; transition: var(--transition); }
.sale-type-radio.active .radio-dot { border-color: var(--primary); border-width: 5px; }
.settle-label { font-size: 14px; color: var(--text-secondary); min-width: 70px; }

/* 品牌型号搜索 */
.brand-search-wrap { position: relative; }
.brand-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-sm); max-height: 240px; overflow-y: auto; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.brand-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background 0.1s; }
.brand-dropdown-item:hover,
.brand-dropdown-item.active { background: var(--primary-light); }
.brand-dd-name { flex: 1; font-size: 14px; font-weight: 500; color: var(--text); }
.brand-dd-spec { font-size: 12px; color: var(--text-tertiary); }
.brand-dd-price { font-size: 14px; font-weight: 600; color: var(--text); font-family: monospace; }
.brand-dropdown-empty { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; font-size: 13px; color: var(--text-tertiary); border-top: 1px solid var(--border); }
.brand-save-btn { padding: 4px 12px; font-size: 12px; border: 1px solid #2563EB; border-radius: var(--radius-sm); background: #fff; color: #2563EB; cursor: pointer; font-family: inherit; white-space: nowrap; }
.brand-save-btn:hover { background: var(--primary-light); }
.brand-selected-tag { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 14px; background: var(--primary-light); border-radius: var(--radius-sm); font-size: 14px; color: var(--primary); font-weight: 500; }
.brand-selected-clear { width: 20px; height: 20px; border: none; border-radius: 50%; background: rgba(37,99,235,0.15); color: #2563EB; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; line-height: 1; }

/* IMEI 录入 */
.imei-entry-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.imei-entry-input { flex: 1; max-width: 280px; height: 42px; padding: 0 14px; font-size: 15px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: monospace; background: #fff; box-sizing: border-box; }
.imei-entry-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
.imei-add-btn { padding: 10px 28px; border: none; border-radius: var(--radius-sm); background: #2563EB; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
.imei-add-btn:hover { filter: brightness(0.92); }
.imei1-input-wrap { flex: 1; max-width: 280px; }
.imei-entry-input.input-error { border-color: var(--danger); box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.no-stock-imei-error-tip { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: 13px; color: var(--danger); }
.no-stock-imei-checking { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 13px; color: var(--text-tertiary); }
.checking-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 统计时段 */
.time-range-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.time-range-text { font-size: 13px; color: var(--text-tertiary); font-family: monospace; }

/* 双列网格 */
.data-grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.data-card { padding: 20px 22px; border-radius: var(--radius); display: flex; flex-direction: column; }
.data-card-header { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 14px; }
.data-card-body { flex: 1; }

/* 品牌库存卡片 */
.brand-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.brand-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; background: rgba(255,255,255,0.5); border-radius: var(--radius-sm); }
.brand-name { font-size: 14px; font-weight: 600; color: var(--text); }
.brand-qty { font-size: 20px; font-weight: 700; color: var(--primary); font-family: 'SF Mono', monospace; }

/* 双列记录 */
.dual-records { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
.record-list { display: flex; flex-direction: column; gap: 4px; }
.record-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
.record-item:last-child { border-bottom: none; }
.record-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.record-time { font-size: 13px; color: var(--text); font-family: monospace; font-weight: 500; white-space: nowrap; }
.record-supplier-link { font-size: 14px; color: var(--primary); font-weight: 500; cursor: pointer; text-decoration: none; transition: var(--transition); }
.record-supplier-link:hover { text-decoration: underline; color: var(--primary-dark); }
.record-sale-link { font-size: 14px; color: var(--primary); font-weight: 500; cursor: pointer; text-decoration: none; transition: var(--transition); }
.record-sale-link:hover { text-decoration: underline; color: var(--primary-dark); }
.record-sale-text { font-size: 14px; color: var(--text); font-weight: 500; }
.record-date { font-size: 12px; color: var(--text-tertiary); font-family: monospace; flex-shrink: 0; }
.record-amount { font-size: 14px; font-weight: 600; color: var(--text); font-family: monospace; flex-shrink: 0; }
.record-qty { font-size: 14px; font-weight: 600; color: var(--primary); font-family: monospace; flex-shrink: 0; }
.empty-data { font-size: 13px; color: var(--text-tertiary); padding: 12px 0; text-align: center; }

/* 商品广场 */
.showcase-count { font-size: 12px; font-weight: 500; color: var(--text-tertiary); margin-left: -2px; }
.showcase-search { display: flex; align-items: center; gap: 6px; margin-left: auto; padding: 4px 10px; background: rgba(255,255,255,0.6); border: 1px solid var(--border); border-radius: var(--radius-sm); }
.showcase-search svg { color: var(--text-tertiary); flex-shrink: 0; }
.showcase-input { border: none; outline: none; background: transparent; font-size: 13px; font-family: inherit; color: var(--text); width: 160px; }
.showcase-input::placeholder { color: var(--text-tertiary); }
.showcase-loading { padding: 20px 0; text-align: center; font-size: 14px; color: var(--text-tertiary); }
.showcase-body { display: flex; flex-direction: column; gap: 20px; }
.showcase-brand-group { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.showcase-brand-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: rgba(139,92,246,0.06); border-bottom: 1px solid var(--border); }
.showcase-brand-name { font-size: 15px; font-weight: 600; color: var(--text); }
.showcase-brand-count { font-size: 12px; color: var(--text-tertiary); font-weight: 500; }
.showcase-model-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; background: #fff; padding: 16px; }
.showcase-model-card { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-sm); transition: all 0.15s; }
.showcase-model-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); border-color: var(--primary); }
.showcase-model-name { font-size: 14px; font-weight: 600; color: var(--text); }
.showcase-model-spec { font-size: 11px; color: var(--text-tertiary); }
.showcase-model-price { font-size: 16px; font-weight: 700; color: var(--primary); font-family: 'SF Mono', monospace; margin-top: 4px; }

/* 统一样式覆盖 */
:deep(.el-input-number) { --el-component-size: 38px; }
:deep(.el-input) { --el-component-size: 38px; }
:deep(.el-input__inner) { font-size: 15px; }
:deep(.el-input-number .el-input__inner) { font-size: 15px; font-weight: 600; }

/* 入库详情弹窗 */
:deep(.entry-detail-dialog .el-dialog) { border-radius: 10px; }
:deep(.entry-detail-dialog .el-dialog__header) { padding: 16px 24px; border-bottom: 1px solid var(--border); margin: 0; }
:deep(.entry-detail-dialog .el-dialog__title) { font-size: 16px; font-weight: 600; }
:deep(.entry-detail-dialog .el-dialog__body) { padding: 20px 24px; }
:deep(.entry-detail-dialog .el-dialog__footer) { padding: 12px 24px 16px; border-top: 1px solid var(--border); }
.entry-detail-info { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 16px; }
.entry-detail-row { display: flex; background: #fff; padding: 10px 14px; align-items: center; }
.entry-detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-tertiary); font-weight: 600; width: 80px; flex-shrink: 0; }
.entry-detail-value { font-size: 13px; color: var(--text); }
.entry-detail-items-head { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.entry-model-cell { display: flex; align-items: center; gap: 4px; }
.entry-model-brand { display: inline-block; padding: 1px 6px; background: var(--primary-light); color: var(--primary); border-radius: 3px; font-size: 11px; font-weight: 600; }
.dialog-close-btn { padding: 8px 24px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--text-secondary); font-size: 13px; cursor: pointer; font-family: inherit; }
.dialog-close-btn:hover { border-color: var(--text-tertiary); color: var(--text); }

@media (max-width: 1100px) {
  .data-grid-2col { grid-template-columns: 1fr; }
  .quick-bar-row { grid-template-columns: repeat(2, 1fr); }
  .brand-cards { grid-template-columns: repeat(3, 1fr); }
  .dual-records { grid-template-columns: 1fr; }
}
</style>

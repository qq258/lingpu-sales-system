<template>
  <el-dialog v-model="visible" title="小票预览" width="420px" top="5vh" destroy-on-close>
    <div class="receipt" ref="receiptRef">
      <!-- 店铺信息 -->
      <div class="receipt-header">
        <h3>{{ data?.storeName || storeName }}</h3>
        <p class="receipt-addr" v-if="data?.storeAddress">{{ data.storeAddress }}</p>
        <p class="receipt-tel" v-if="data?.storePhone">{{ data.storePhone }}</p>
      </div>
      <div class="receipt-divider"></div>

      <!-- 单号 & 时间 -->
      <div class="receipt-info">
        <div class="info-row"><span>单号</span><span>{{ data?.orderNo }}</span></div>
        <div class="info-row"><span>日期</span><span>{{ data?.createdAt }}</span></div>
        <div class="info-row"><span>收银员</span><span>{{ data?.cashier }}</span></div>
      </div>

      <!-- 客户信息 -->
      <div v-if="data?.customerName || data?.customerAddress || data?.customerPhone" class="receipt-divider"></div>
      <div class="receipt-customer" v-if="data?.customerName || data?.customerAddress || data?.customerPhone">
        <div class="info-row" v-if="data?.customerName"><span>客户</span><span>{{ data.customerName }}</span></div>
        <div class="info-row" v-if="data?.customerAddress"><span>地址</span><span>{{ data.customerAddress }}</span></div>
        <div class="info-row" v-if="data?.customerPhone"><span>电话</span><span>{{ data.customerPhone }}</span></div>
      </div>

      <!-- 商品明细 -->
      <div class="receipt-divider"></div>
      <div class="receipt-section-title">商品明细</div>
      <div class="receipt-items">
        <div v-for="(item, idx) in data?.items" :key="idx" class="receipt-item">
          <div class="item-header">
            <span class="item-name">{{ item.modelName }}</span>
            <span class="item-price">¥{{ item.price.toFixed(2) }}</span>
          </div>
          <div class="item-codes">
            <div class="item-code-row"><span class="code-label">IMEI1</span><span class="code-value">{{ item.imei || '' }}</span></div>
            <div v-if="item.imei2" class="item-code-row"><span class="code-label">IMEI2</span><span class="code-value">{{ item.imei2 }}</span></div>
            <div v-if="item.snCode" class="item-code-row"><span class="code-label">S/N</span><span class="code-value">{{ item.snCode }}</span></div>
          </div>
        </div>
      </div>

      <!-- 金额汇总 -->
      <div class="receipt-divider"></div>
      <div class="receipt-total">
        <div class="total-row"><span>合计</span><span>¥{{ data?.totalAmount?.toFixed(2) }}</span></div>
        <div class="total-row"><span>实收</span><span>¥{{ data?.paidAmount?.toFixed(2) }}</span></div>
        <div class="total-row" v-if="data?.changeAmount"><span>找零</span><span>¥{{ data?.changeAmount?.toFixed(2) }}</span></div>
        <div v-if="data?.paidAmount != null && data?.totalAmount != null && data.paidAmount < data.totalAmount" class="total-row discount-row">
          <span></span><span class="discount-text">优惠 ¥{{ (data.totalAmount - data.paidAmount).toFixed(2) }}</span>
        </div>
      </div>

      <!-- 备注 -->
      <div class="receipt-divider" v-if="data?.remark"></div>
      <div class="receipt-remark" v-if="data?.remark">备注：{{ data.remark }}</div>

      <!-- 保修须知 -->
      <div class="receipt-divider" v-if="warrantyContent"></div>
      <div class="receipt-warranty" v-if="warrantyContent" v-html="warrantyContent"></div>

      <div class="receipt-divider"></div>
      <div class="receipt-footer">
        <p>感谢您的光临！</p>
        <p>售后电话：{{ data?.storePhone || storePhone || '—' }}</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handlePrint">打印</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const props = defineProps<{
  data: {
    storeName?: string
    storeAddress?: string
    storePhone?: string
    orderNo: string
    createdAt: string
    cashier: string
    customerName?: string
    customerAddress?: string
    customerPhone?: string
    totalAmount: number
    paidAmount: number
    changeAmount?: number
    remark?: string
    items: Array<{ modelId: number; modelName: string; imei: string; imei2?: string; snCode?: string; quantity: number; price: number }>
  } | null
  storeName?: string
  storePhone?: string
}>()

const visible = ref(false)
const receiptRef = ref<HTMLDivElement>()
const warrantyContent = ref('')

async function loadWarrantyNotice() {
  try {
    const res: any = await request.get('/settings/warranty_notice')
    warrantyContent.value = res?.data?.value || ''
  } catch {
    warrantyContent.value = ''
  }
}

function open() {
  visible.value = true
  nextTick(() => loadWarrantyNotice())
}

function handlePrint() {
  const itemsHtml = (props.data?.items || []).map((item) => {
    let codesHtml = `<div class="item-code-row"><span class="code-label">IMEI1</span><span class="code-value">${item.imei || ''}</span></div>`
    if (item.imei2) codesHtml += `<div class="item-code-row"><span class="code-label">IMEI2</span><span class="code-value">${item.imei2}</span></div>`
    if (item.snCode) codesHtml += `<div class="item-code-row"><span class="code-label">S/N</span><span class="code-value">${item.snCode}</span></div>`
    return `
      <div class="receipt-item">
        <div class="item-header">
          <span class="item-name">${item.modelName}</span>
          <span class="item-price">¥${item.price.toFixed(2)}</span>
        </div>
        <div class="item-codes">${codesHtml}</div>
      </div>
    `
  }).join('')

  const customerHtml = (props.data?.customerName || props.data?.customerAddress || props.data?.customerPhone)
    ? `
    <div class="receipt-divider"></div>
    <div class="receipt-customer">
      ${props.data?.customerName ? `<div class="info-row"><span>客户</span><span>${props.data.customerName}</span></div>` : ''}
      ${props.data?.customerAddress ? `<div class="info-row"><span>地址</span><span>${props.data.customerAddress}</span></div>` : ''}
      ${props.data?.customerPhone ? `<div class="info-row"><span>电话</span><span>${props.data.customerPhone}</span></div>` : ''}
    </div>`
    : ''

  const remarkHtml = props.data?.remark ? `<div class="receipt-divider"></div><div class="receipt-remark">备注：${props.data.remark}</div>` : ''
  const changeHtml = props.data?.changeAmount ? `<div class="total-row"><span>找零</span><span>¥${props.data.changeAmount.toFixed(2)}</span></div>` : ''
  const discountHtml = (props.data?.paidAmount != null && props.data?.totalAmount != null && props.data.paidAmount < props.data.totalAmount)
    ? `<div class="total-row discount-row"><span></span><span class="discount-text">优惠 ¥${(props.data.totalAmount - props.data.paidAmount).toFixed(2)}</span></div>`
    : ''

  const warrantyHtml = warrantyContent.value
    ? `<div class="receipt-divider"></div><div class="receipt-warranty">${warrantyContent.value}</div>`
    : ''

  const printWindow = window.open('', '_blank', 'width=380,height=600')
  if (!printWindow) {
    ElMessage.error('请允许弹出窗口以打印小票')
    return
  }

  printWindow.document.write(`
    <html>
    <head>
      <title>小票打印</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; width: 300px; margin: 0 auto; background: #fff; }
        .receipt-header { text-align: center; margin-bottom: 6px; }
        .receipt-header h3 { margin: 0; font-size: 15px; }
        .receipt-addr, .receipt-tel { margin: 2px 0 0; font-size: 11px; color: #555; }
        .receipt-divider { border-top: 1px dashed #999; margin: 6px 0; }
        .receipt-section-title { font-size: 11px; font-weight: bold; margin-bottom: 4px; }
        .receipt-info .info-row, .receipt-customer .info-row { display: flex; justify-content: space-between; margin: 1px 0; font-size: 11px; }
        .receipt-item { margin: 6px 0; padding: 4px 0; border-top: 1px dotted #ccc; }
        .receipt-item:first-child { border-top: none; }
        .item-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .item-name { font-size: 11px; font-weight: bold; }
        .item-price { font-size: 11px; font-weight: bold; }
        .item-codes { margin: 2px 0; }
        .item-code-row { display: flex; justify-content: space-between; margin: 1px 0; font-size: 10px; }
        .code-label { color: #666; font-weight: bold; }
        .code-value { color: #333; font-family: monospace; letter-spacing: 0.5px; }
        .receipt-total .total-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: bold; font-size: 12px; }
        .receipt-remark { font-size: 11px; color: #555; }
        .discount-row { color: #e67e22; }
        .discount-text { font-size: 11px; font-weight: 600; }
        .receipt-warranty { font-size: 10px; line-height: 1.5; color: #555; }
        .receipt-warranty p { margin: 2px 0; }
        .receipt-warranty ul, .receipt-warranty ol { margin: 2px 0; padding-left: 16px; }
        .receipt-warranty li { margin: 1px 0; }
        .receipt-warranty strong { font-weight: bold; }
        .receipt-footer { text-align: center; font-size: 11px; color: #888; margin-top: 4px; }
        .receipt-footer p { margin: 2px 0; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="receipt-header">
          <h3>${props.data?.storeName || props.storeName || ''}</h3>
          ${props.data?.storeAddress ? `<p class="receipt-addr">${props.data.storeAddress}</p>` : ''}
          ${props.data?.storePhone ? `<p class="receipt-tel">${props.data.storePhone}</p>` : ''}
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-info">
          <div class="info-row"><span>单号</span><span>${props.data?.orderNo || ''}</span></div>
          <div class="info-row"><span>日期</span><span>${props.data?.createdAt || ''}</span></div>
          <div class="info-row"><span>收银员</span><span>${props.data?.cashier || ''}</span></div>
        </div>
        ${customerHtml}
        <div class="receipt-divider"></div>
        <div class="receipt-section-title">商品明细</div>
        ${itemsHtml}
        <div class="receipt-divider"></div>
        <div class="receipt-total">
          <div class="total-row"><span>合计</span><span>¥${(props.data?.totalAmount || 0).toFixed(2)}</span></div>
          <div class="total-row"><span>实收</span><span>¥${(props.data?.paidAmount || 0).toFixed(2)}</span></div>
          ${changeHtml}
          ${discountHtml}
        </div>
        ${remarkHtml}
        ${warrantyHtml}
        <div class="receipt-divider"></div>
        <div class="receipt-footer">
          <p>感谢您的光临！</p>
          <p>售后电话：${props.data?.storePhone || props.storePhone || '—'}</p>
        </div>
      </div>
      <script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 300) }<\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

defineExpose({ open })
</script>

<style scoped>
.receipt {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #333;
}
.receipt-header {
  text-align: center;
  margin-bottom: 6px;
}
.receipt-header h3 {
  margin: 0;
  font-size: 15px;
}
.receipt-addr, .receipt-tel {
  margin: 2px 0 0;
  font-size: 11px;
  color: #666;
}
.receipt-divider {
  border-top: 1px dashed #dcdfe6;
  margin: 6px 0;
}
.receipt-section-title {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 4px;
}
.receipt-info .info-row,
.receipt-customer .info-row {
  display: flex;
  justify-content: space-between;
  margin: 1px 0;
  font-size: 11px;
}
.receipt-item {
  margin: 6px 0;
  padding: 4px 0;
  border-top: 1px dotted #dcdfe6;
}
.receipt-item:first-child {
  border-top: none;
}
.item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}
.item-name {
  font-size: 11px;
  font-weight: bold;
}
.item-price {
  font-size: 11px;
  font-weight: bold;
  color: #f56c6c;
}
.item-codes {
  margin: 2px 0;
}
.item-code-row {
  display: flex;
  justify-content: space-between;
  margin: 1px 0;
  font-size: 10px;
}
.code-label {
  color: #666;
  font-weight: bold;
}
.code-value {
  color: #333;
  font-family: monospace;
  letter-spacing: 0.5px;
}
.receipt-total .total-row {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
  font-weight: bold;
  font-size: 12px;
}
.receipt-remark { font-size: 11px; color: #666; }
.discount-row { color: #e67e22; }
.discount-text { font-size: 11px; font-weight: 600; }
.receipt-warranty { font-size: 10px; line-height: 1.6; color: #555; }
.receipt-warranty :deep(p) { margin: 4px 0; }
.receipt-warranty :deep(ul), .receipt-warranty :deep(ol) { margin: 4px 0; padding-left: 16px; }
.receipt-warranty :deep(li) { margin: 2px 0; }
.receipt-warranty :deep(strong) { font-weight: bold; }
.receipt-footer {
  text-align: center;
  font-size: 11px;
  color: #909399;
}
.receipt-footer p {
  margin: 2px 0;
}
</style>

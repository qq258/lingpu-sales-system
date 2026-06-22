<template>
  <el-dialog v-model="visible" title="小票预览" width="420px" top="5vh" destroy-on-close>
    <div class="receipt" ref="receiptRef">
      <div class="receipt-header">
        <h3>{{ storeName || data?.store?.name || '' }}</h3>
        <p v-if="data?.store?.address" class="receipt-addr">{{ data.store.address }}</p>
        <p v-if="data?.store?.phone" class="receipt-tel">{{ data.store.phone }}</p>
      </div>
      <div class="receipt-divider"></div>

      <div class="receipt-info">
        <div class="info-row"><span>单号</span><span>{{ data?.order_no || '' }}</span></div>
        <div class="info-row"><span>日期</span><span>{{ formatTime(data?.created_at) }}</span></div>
        <div class="info-row"><span>收银员</span><span>{{ data?.operator?.real_name || '' }}</span></div>
      </div>

      <div v-if="data?.customer_name || data?.customer_address || data?.customer_phone" class="receipt-divider"></div>
      <div v-if="data?.customer_name || data?.customer_address || data?.customer_phone" class="receipt-customer">
        <div v-if="data?.customer_name" class="info-row"><span>客户</span><span>{{ data.customer_name }}</span></div>
        <div v-if="data?.customer_address" class="info-row"><span>地址</span><span>{{ data.customer_address }}</span></div>
        <div v-if="data?.customer_phone" class="info-row"><span>电话</span><span>{{ data.customer_phone }}</span></div>
      </div>

      <div class="receipt-divider"></div>
      <div class="receipt-section-title">商品明细</div>
      <div class="receipt-items">
        <div v-for="(item, idx) in data?.items || []" :key="idx" class="receipt-item">
          <div class="item-header">
            <span class="item-name">{{ item.model_name }}</span>
            <span class="item-price">¥{{ (item.unit_price || 0).toFixed(2) }}</span>
          </div>
          <div class="item-codes">
            <div class="item-code-row"><span class="code-label">IMEI1</span><span class="code-value">{{ item.imei || '' }}</span></div>
            <div v-if="item.imei2" class="item-code-row"><span class="code-label">IMEI2</span><span class="code-value">{{ item.imei2 }}</span></div>
            <div v-if="item.sn_code" class="item-code-row"><span class="code-label">S/N</span><span class="code-value">{{ item.sn_code }}</span></div>
          </div>
        </div>
      </div>

      <div class="receipt-divider"></div>
      <div class="receipt-total">
        <div class="total-row"><span>合计</span><span>¥{{ (data?.total_amount || 0).toFixed(2) }}</span></div>
        <div class="total-row"><span>实收</span><span>¥{{ (data?.actual_amount || 0).toFixed(2) }}</span></div>
        <div v-if="data?.change_amount" class="total-row"><span>找零</span><span>¥{{ (data.change_amount).toFixed(2) }}</span></div>
        <div v-if="data?.actual_amount != null && data?.total_amount != null && data.actual_amount < data.total_amount" class="total-row discount-row">
          <span></span><span class="discount-text">优惠 ¥{{ (data.total_amount - data.actual_amount).toFixed(2) }}</span>
        </div>
      </div>

      <div v-if="data?.remark" class="receipt-divider"></div>
      <div v-if="data?.remark" class="receipt-remark">备注：{{ data.remark }}</div>

      <div v-if="warrantyContent" class="receipt-divider"></div>
      <div v-if="warrantyContent" class="receipt-warranty" v-html="warrantyContent"></div>

      <div class="receipt-divider"></div>
      <div class="receipt-footer">
        <p>感谢您的光临！</p>
        <p>售后电话：{{ data?.store?.phone || '—' }}</p>
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
  data: any
  storeName?: string
}>()

const visible = ref(false)
const receiptRef = ref<HTMLDivElement>()
const warrantyContent = ref('')

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}

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
  if (!props.data) return

  const itemsHtml = (props.data.items || []).map((item: any) => {
    let codesHtml = `<div class="item-code-row"><span class="code-label">IMEI1</span><span class="code-value">${item.imei || ''}</span></div>`
    if (item.imei2) codesHtml += `<div class="item-code-row"><span class="code-label">IMEI2</span><span class="code-value">${item.imei2}</span></div>`
    if (item.sn_code) codesHtml += `<div class="item-code-row"><span class="code-label">S/N</span><span class="code-value">${item.sn_code}</span></div>`
    return `
      <div class="receipt-item">
        <div class="item-header">
          <span class="item-name">${item.model_name || ''}</span>
          <span class="item-price">¥${(item.unit_price || 0).toFixed(2)}</span>
        </div>
        <div class="item-codes">${codesHtml}</div>
      </div>
    `
  }).join('')

  const customerHtml = (props.data.customer_name || props.data.customer_address || props.data.customer_phone)
    ? `
    <div class="receipt-divider"></div>
    <div class="receipt-customer">
      ${props.data.customer_name ? `<div class="info-row"><span>客户</span><span>${props.data.customer_name}</span></div>` : ''}
      ${props.data.customer_address ? `<div class="info-row"><span>地址</span><span>${props.data.customer_address}</span></div>` : ''}
      ${props.data.customer_phone ? `<div class="info-row"><span>电话</span><span>${props.data.customer_phone}</span></div>` : ''}
    </div>`
    : ''

  const changeHtml = props.data.change_amount
    ? `<div class="total-row"><span>找零</span><span>¥${(props.data.change_amount).toFixed(2)}</span></div>`
    : ''

  const discountHtml = (props.data.actual_amount != null && props.data.total_amount != null && props.data.actual_amount < props.data.total_amount)
    ? `<div class="total-row discount-row"><span></span><span class="discount-text">优惠 ¥${(props.data.total_amount - props.data.actual_amount).toFixed(2)}</span></div>`
    : ''

  const remarkHtml = props.data.remark
    ? `<div class="receipt-divider"></div><div class="receipt-remark">备注：${props.data.remark}</div>`
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
    <html><head><title>小票打印</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; width: 300px; margin: 0 auto; background: #fff; }
      .receipt-header { text-align: center; margin-bottom: 6px; }
      .receipt-header h3 { margin: 0; font-size: 15px; }
      .receipt-addr, .receipt-tel { margin: 2px 0 0; font-size: 11px; color: #555; }
      .receipt-divider { border-top: 1px dashed #999; margin: 6px 0; }
      .receipt-section-title { font-size: 11px; font-weight: bold; margin-bottom: 4px; }
      .info-row { display: flex; justify-content: space-between; margin: 1px 0; font-size: 11px; }
      .receipt-item { margin: 6px 0; padding: 4px 0; border-top: 1px dotted #ccc; }
      .receipt-item:first-child { border-top: none; }
      .item-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .item-name { font-size: 11px; font-weight: bold; }
      .item-price { font-size: 11px; font-weight: bold; }
      .item-codes { margin: 2px 0; }
      .item-code-row { display: flex; justify-content: space-between; margin: 1px 0; font-size: 10px; }
      .code-label { color: #666; font-weight: bold; }
      .code-value { color: #333; font-family: monospace; letter-spacing: 0.5px; }
      .total-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: bold; font-size: 12px; }
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
    </style></head><body>
      <div class="receipt">
        <div class="receipt-header">
          <h3>${props.storeName || props.data?.store?.name || ''}</h3>
          ${props.data?.store?.address ? `<p class="receipt-addr">${props.data.store.address}</p>` : ''}
          ${props.data?.store?.phone ? `<p class="receipt-tel">${props.data.store.phone}</p>` : ''}
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-info">
          <div class="info-row"><span>单号</span><span>${props.data.order_no || ''}</span></div>
          <div class="info-row"><span>日期</span><span>${formatTime(props.data.created_at)}</span></div>
          <div class="info-row"><span>收银员</span><span>${props.data?.operator?.real_name || ''}</span></div>
        </div>
        ${customerHtml}
        <div class="receipt-divider"></div>
        <div class="receipt-section-title">商品明细</div>
        ${itemsHtml}
        <div class="receipt-divider"></div>
        <div class="receipt-total">
          <div class="total-row"><span>合计</span><span>¥${(props.data.total_amount || 0).toFixed(2)}</span></div>
          <div class="total-row"><span>实收</span><span>¥${(props.data.actual_amount || 0).toFixed(2)}</span></div>
          ${changeHtml}
          ${discountHtml}
        </div>
        ${remarkHtml}
        ${warrantyHtml}
        <div class="receipt-divider"></div>
        <div class="receipt-footer">
          <p>感谢您的光临！</p>
          <p>售后电话：${props.data?.store?.phone || '—'}</p>
        </div>
      </div>
      <script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 300) }<\/script>
    </body></html>
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
.receipt-header { text-align: center; margin-bottom: 6px; }
.receipt-header h3 { margin: 0; font-size: 15px; }
.receipt-addr, .receipt-tel { margin: 2px 0 0; font-size: 11px; color: #666; }
.receipt-divider { border-top: 1px dashed #dcdfe6; margin: 6px 0; }
.receipt-section-title { font-size: 11px; font-weight: bold; margin-bottom: 4px; }
.receipt-info .info-row, .receipt-customer .info-row { display: flex; justify-content: space-between; margin: 1px 0; font-size: 11px; }
.receipt-item { margin: 6px 0; padding: 4px 0; border-top: 1px dotted #dcdfe6; }
.receipt-item:first-child { border-top: none; }
.item-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.item-name { font-size: 11px; font-weight: bold; }
.item-price { font-size: 11px; font-weight: bold; color: #f56c6c; }
.item-codes { margin: 2px 0; }
.item-code-row { display: flex; justify-content: space-between; margin: 1px 0; font-size: 10px; }
.code-label { color: #666; font-weight: bold; }
.code-value { color: #333; font-family: monospace; letter-spacing: 0.5px; }
.receipt-total .total-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: bold; font-size: 12px; }
.receipt-remark { font-size: 11px; color: #666; }
.discount-row { color: #e67e22; }
.discount-text { font-size: 11px; font-weight: 600; }
.receipt-warranty { font-size: 10px; line-height: 1.6; color: #555; }
.receipt-warranty :deep(p) { margin: 4px 0; }
.receipt-warranty :deep(ul), .receipt-warranty :deep(ol) { margin: 4px 0; padding-left: 16px; }
.receipt-warranty :deep(li) { margin: 2px 0; }
.receipt-warranty :deep(strong) { font-weight: bold; }
.receipt-footer { text-align: center; font-size: 11px; color: #888; margin-top: 4px; }
.receipt-footer p { margin: 2px 0; }
</style>

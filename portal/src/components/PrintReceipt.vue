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
          <div class="item-barcode-block">
            <div class="item-code-label">IMEI1</div>
            <div class="item-code-value">{{ item.imei || '' }}</div>
            <svg v-if="item.imei" :ref="el => { if (el) renderBarcode(el as SVGSVGElement, item.imei) }" class="barcode-svg"></svg>
          </div>
          <div v-if="item.imei2" class="item-barcode-block">
            <div class="item-code-label">IMEI2</div>
            <div class="item-code-value">{{ item.imei2 }}</div>
            <svg :ref="el => { if (el) renderBarcode(el as SVGSVGElement, item.imei2) }" class="barcode-svg"></svg>
          </div>
          <div v-if="item.sn_code" class="item-barcode-block">
            <div class="item-code-label">S/N</div>
            <div class="item-code-value">{{ item.sn_code }}</div>
            <svg :ref="el => { if (el) renderBarcode(el as SVGSVGElement, item.sn_code) }" class="barcode-svg"></svg>
          </div>
        </div>
      </div>

      <div class="receipt-divider"></div>
      <div class="receipt-total">
        <div class="total-row"><span>合计</span><span>¥{{ (data?.total_amount || 0).toFixed(2) }}</span></div>
        <div class="total-row"><span>实收</span><span>¥{{ (data?.actual_amount || 0).toFixed(2) }}</span></div>
        <div v-if="data?.change_amount" class="total-row"><span>找零</span><span>¥{{ (data.change_amount).toFixed(2) }}</span></div>
      </div>

      <div v-if="data?.remark" class="receipt-divider"></div>
      <div v-if="data?.remark" class="receipt-remark">备注：{{ data.remark }}</div>

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
import JsBarcode from 'jsbarcode'

const props = defineProps<{
  data: any
  storeName?: string
}>()

const visible = ref(false)
const receiptRef = ref<HTMLDivElement>()

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}

function open() {
  visible.value = true
}

function renderBarcode(svg: SVGSVGElement, value: string) {
  if (!value) return
  nextTick(() => {
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    try {
      JsBarcode(svg, value, {
        format: 'CODE128',
        width: 2,
        height: 30,
        displayValue: false,
        margin: 0,
      })
    } catch {
      // barcode render failed, skip
    }
  })
}

function generateBarcodeSvg(imei: string): string {
  if (!imei) return ''
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  try {
    JsBarcode(svg, imei, {
      format: 'CODE128',
      width: 2,
      height: 30,
      displayValue: false,
      margin: 0,
    })
    return svg.outerHTML
  } catch { return '' }
}

function barcodeBlock(label: string, value: string) {
  const svg = generateBarcodeSvg(value)
  return `
    <div class="item-barcode-block">
      <div class="item-code-label">${label}</div>
      <div class="item-code-value">${value}</div>
      ${svg || ''}
    </div>
  `
}

function handlePrint() {
  if (!props.data) return

  const itemsHtml = (props.data.items || []).map((item: any) => {
    let blocks = barcodeBlock('IMEI1', item.imei || '')
    if (item.imei2) blocks += barcodeBlock('IMEI2', item.imei2)
    if (item.sn_code) blocks += barcodeBlock('S/N', item.sn_code)
    return `
      <div class="receipt-item">
        <div class="item-header">
          <span class="item-name">${item.model_name || ''}</span>
          <span class="item-price">¥${(item.unit_price || 0).toFixed(2)}</span>
        </div>
        ${blocks}
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

  const remarkHtml = props.data.remark
    ? `<div class="receipt-divider"></div><div class="receipt-remark">备注：${props.data.remark}</div>`
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
      .item-barcode-block { text-align: center; margin: 8px 0; padding: 6px 0; border-top: 1px dotted #ddd; }
      .item-barcode-block:first-of-type { border-top: none; }
      .item-code-label { text-align: center; font-size: 10px; font-weight: bold; color: #666; margin-bottom: 2px; letter-spacing: 0.5px; }
      .item-code-value { text-align: center; font-size: 11px; font-weight: bold; color: #333; margin-bottom: 4px; letter-spacing: 1px; }
      .item-barcode-block svg { width: 100%; max-width: 100%; height: auto; }
      .total-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: bold; font-size: 12px; }
      .receipt-remark { font-size: 11px; color: #555; }
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
        </div>
        ${remarkHtml}
        <div class="receipt-divider"></div>
        <div class="receipt-footer">
          <p>感谢您的光临！</p>
          <p>售后电话：${props.data?.store?.phone || '—'}</p>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); window.close(); }, 300)
        }
      <\/script>
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
.item-barcode-block { text-align: center; margin: 8px 0; padding: 6px 0; border-top: 1px dotted #dcdfe6; }
.item-barcode-block:first-of-type { border-top: none; }
.item-code-label { text-align: center; font-size: 10px; font-weight: bold; color: #666; margin-bottom: 2px; letter-spacing: 0.5px; }
.item-code-value { text-align: center; font-size: 11px; font-weight: bold; color: #333; margin-bottom: 4px; letter-spacing: 1px; }
:deep(.item-barcode-block svg), .item-barcode-block svg { width: 100%; max-width: 100%; height: auto; }
.receipt-total .total-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: bold; font-size: 12px; }
.receipt-remark { font-size: 11px; color: #666; }
.receipt-footer { text-align: center; font-size: 11px; color: #888; margin-top: 4px; }
.receipt-footer p { margin: 2px 0; }
.barcode-svg { width: 100%; display: block; }
</style>

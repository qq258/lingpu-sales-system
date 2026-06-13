<template>
  <el-dialog v-model="visible" title="小票预览" width="380px" top="5vh" destroy-on-close>
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
            <span class="item-name">{{ item.skuName }}</span>
            <span class="item-price">¥{{ item.price.toFixed(2) }}</span>
          </div>
          <div class="item-barcode-wrap">
            <div>IMEI: {{ item.imei || "123123" }}</div>
            <BarcodeCell v-if="item.imei" :value="item.imei" />
          </div>
          <div class="item-imei">{{ item.imei }}</div>
        </div>
      </div>

      <!-- 金额汇总 -->
      <div class="receipt-divider"></div>
      <div class="receipt-total">
        <div class="total-row"><span>合计</span><span>¥{{ data?.totalAmount?.toFixed(2) }}</span></div>
        <div class="total-row"><span>实收</span><span>¥{{ data?.paidAmount?.toFixed(2) }}</span></div>
        <div class="total-row" v-if="data?.changeAmount"><span>找零</span><span>¥{{ data?.changeAmount?.toFixed(2) }}</span></div>
      </div>

      <!-- 备注 -->
      <div class="receipt-divider" v-if="data?.remark"></div>
      <div class="receipt-remark" v-if="data?.remark">备注：{{ data.remark }}</div>

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
import { ref, nextTick, watch, h, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import JsBarcode from 'jsbarcode'

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
    items: Array<{ skuId: number; skuName: string; imei: string; quantity: number; price: number }>
  } | null
  storeName?: string
  storePhone?: string
}>()

// ========== BarcodeCell 子组件 ==========
const BarcodeCell = {
  name: 'BarcodeCell',
  props: {
    value: { type: String, default: '' },
  },
  setup(props: { value: string }) {
    const svgRef = ref<SVGSVGElement | null>(null)

    function render() {
      const el = svgRef.value
      if (!el || !props.value) {
        console.log('[BarcodeCell] 跳过渲染: svgRef=', !!el, 'value=', props.value)
        return
      }
      while (el.firstChild) el.removeChild(el.firstChild)
      try {
        JsBarcode(el, props.value, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 4,
        })
        const barCount = el.querySelectorAll('rect').length
        console.log(`[BarcodeCell] 渲染成功 IMEI=${props.value}`, { barCount })
      } catch (e) {
        console.error(`[BarcodeCell] 渲染失败 IMEI=${props.value}`, e)
      }
    }

    onMounted(() => {
      console.log('[BarcodeCell] onMounted 被调用', { value: props.value })
      nextTick(render)
    })

    watch(() => props.value, () => {
      nextTick(render)
    })

    return () => h('svg', { ref: svgRef, class: 'barcode-svg', xmlns: 'http://www.w3.org/2000/svg' })
  },
}
// ======================================

const visible = ref(false)
const receiptRef = ref<HTMLDivElement>()

function open() {
  console.log('[PrintReceipt] open() 被调用', {
    hasData: !!props.data,
    itemsCount: props.data?.items?.length ?? 0,
    imeis: props.data?.items?.map(i => i.imei) ?? [],
  })
  visible.value = true
}

// 预览弹窗打开后，等 DOM 渲染完成检查条形码
watch(visible, async (val) => {
  if (!val || !props.data?.items?.length) return
  // 需要多层 nextTick 等 BarcodeCell 内 onMounted + nextTick 完成
  await nextTick()
  await nextTick()
  await nextTick()
  const svgs = receiptRef.value?.querySelectorAll('.item-barcode-wrap svg.barcode-svg') ?? []
  console.log(`[PrintReceipt] 预览条形码检查: 找到 ${svgs.length} 个 SVG`)
  svgs.forEach((svg, idx) => {
    const imei = props.data?.items?.[idx]?.imei
    const bars = svg.querySelectorAll('rect').length
    console.log(`[PrintReceipt] 预览条形码 [${idx}] IMEI=${imei}`, {
      barCount: bars,
      svgWidth: svg.getAttribute('width'),
      svgHeight: svg.getAttribute('height'),
    })
  })
  if (svgs.length === 0) {
    console.warn('[PrintReceipt] 预览中未找到任何 .barcode-svg 元素')
  }
})

function generateBarcodeSvg(imei: string): string {
  if (!imei) {
    console.warn('[PrintReceipt] generateBarcodeSvg 收到空 IMEI')
    return ''
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  try {
    JsBarcode(svg, imei, {
      format: 'CODE128',
      width: 1.5,
      height: 40,
      displayValue: false,
      margin: 4,
    })
    const barCount = svg.querySelectorAll('rect').length
    console.log(`[PrintReceipt] generateBarcodeSvg IMEI=${imei}`, {
      success: true,
      barCount,
      outerHtmlLength: svg.outerHTML.length,
    })
    return svg.outerHTML
  } catch (e) {
    console.error(`[PrintReceipt] generateBarcodeSvg IMEI=${imei} 失败`, e)
    return ''
  }
}

function handlePrint() {
  console.log('[PrintReceipt] handlePrint() 被调用', {
    itemsCount: props.data?.items?.length ?? 0,
  })

  const printWindow = window.open('', '_blank', 'width=380,height=600')
  if (!printWindow) {
    console.error('[PrintReceipt] 打印窗口被浏览器拦截')
    ElMessage.error('请允许弹出窗口以打印小票')
    return
  }

  // 预生成所有条形码 SVG
  const barcodeSvgs = (props.data?.items || []).map((item) => generateBarcodeSvg(item.imei))
  const validSvgCount = barcodeSvgs.filter(s => s.length > 0).length
  console.log('[PrintReceipt] 条形码 SVG 预生成完毕', {
    total: barcodeSvgs.length,
    valid: validSvgCount,
    empty: barcodeSvgs.length - validSvgCount,
  })

  const itemsHtml = (props.data?.items || []).map((item, idx) => `
    <div class="receipt-item">
      <div class="item-header">
        <span class="item-name">${item.skuName}</span>
        <span class="item-price">¥${item.price.toFixed(2)}</span>
      </div>
      <div class="item-barcode-wrap">
        ${barcodeSvgs[idx] || '<!-- 条形码生成失败 -->'}
      </div>
      <div class="item-imei">${item.imei}</div>
    </div>
  `).join('')

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
        .item-barcode-wrap { text-align: center; margin: 2px 0; }
        .item-barcode { max-width: 100%; }
        .item-imei { text-align: center; font-size: 10px; color: #555; letter-spacing: 1px; }
        .receipt-total .total-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: bold; font-size: 12px; }
        .receipt-remark { font-size: 11px; color: #555; }
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
        </div>
        ${remarkHtml}
        <div class="receipt-divider"></div>
        <div class="receipt-footer">
          <p>感谢您的光临！</p>
          <p>售后电话：${props.data?.storePhone || props.storePhone || '—'}</p>
        </div>
      </div>
      <script>
        console.log('[PrintReceipt] 打印窗口已加载，准备打印')
        var svgs = document.querySelectorAll('.item-barcode-wrap svg')
        console.log('[PrintReceipt] 打印窗口中条形码 SVG 数量:', svgs.length)
        svgs.forEach(function(svg, idx) {
          var bars = svg.querySelectorAll('rect').length
          console.log('[PrintReceipt] 打印条形码检查 [' + idx + ']', {
            tag: svg.tagName,
            barCount: bars,
            width: svg.getAttribute('width'),
            height: svg.getAttribute('height'),
          })
        })
        window.onload = function() {
          console.log('[PrintReceipt] 打印窗口 window.onload 触发')
          setTimeout(function() {
            console.log('[PrintReceipt] 调用 window.print()')
            window.print()
            window.close()
          }, 300)
        }
      <\/script>
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
.item-barcode-wrap {
  text-align: center;
  margin: 2px 0;
}
.item-barcode {
  max-width: 100%;
}
.item-imei {
  text-align: center;
  font-size: 10px;
  color: #888;
  letter-spacing: 1px;
}
.receipt-total .total-row {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
  font-weight: bold;
  font-size: 12px;
}
.receipt-remark {
  font-size: 11px;
  color: #666;
}
.receipt-footer {
  text-align: center;
  font-size: 11px;
  color: #909399;
}
.receipt-footer p {
  margin: 2px 0;
}
</style>

<template>
  <el-dialog v-model="visible" title="小票预览" width="360px" top="5vh">
    <div class="receipt" ref="receiptRef">
      <div class="receipt-header">
        <h3>{{ storeName }}</h3>
        <p>手机销售管理系统</p>
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-info">
        <div class="info-row">
          <span>单号：</span>
          <span>{{ data?.orderNo }}</span>
        </div>
        <div class="info-row">
          <span>售出时间：</span>
          <span>{{ data?.createdAt }}</span>
        </div>
        <div class="info-row">
          <span>收银员：</span>
          <span>{{ data?.cashier }}</span>
        </div>
        <div class="info-row" v-if="data?.customerName">
          <span>客户：</span>
          <span>{{ data?.customerName }}</span>
        </div>
        <div class="info-row" v-if="data?.remark">
          <span>备注：</span>
          <span>{{ data?.remark }}</span>
        </div>
      </div>
      <div class="receipt-divider"></div>
      <table class="receipt-items">
        <thead>
          <tr>
            <th>商品</th>
            <th>数量</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data?.items" :key="item.skuId">
            <td>{{ item.skuName }}</td>
            <td>{{ item.quantity }}</td>
            <td>¥{{ (item.price * item.quantity).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="receipt-divider"></div>
      <div class="receipt-total">
        <div class="total-row">
          <span>合计：</span>
          <span>¥{{ data?.totalAmount?.toFixed(2) }}</span>
        </div>
        <div class="total-row">
          <span>实收：</span>
          <span>¥{{ data?.paidAmount?.toFixed(2) }}</span>
        </div>
        <div class="total-row" v-if="data?.changeAmount">
          <span>找零：</span>
          <span>¥{{ data?.changeAmount?.toFixed(2) }}</span>
        </div>
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-footer">
        <p>感谢您的光临！</p>
        <p>如有问题请联系：{{ storePhone }}</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handlePrint">打印</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  data: {
    orderNo: string
    createdAt: string
    cashier: string
    customerName?: string
    totalAmount: number
    paidAmount: number
    changeAmount?: number
    remark?: string
    items: Array<{ skuId: number; skuName: string; quantity: number; price: number }>
  } | null
  storeName?: string
  storePhone?: string
}>()

const visible = ref(false)
const receiptRef = ref<HTMLDivElement>()

function open() {
  visible.value = true
}

function handlePrint() {
  const printWindow = window.open('', '_blank', 'width=380,height=600')
  if (!printWindow) {
    ElMessage.error('请允许弹出窗口以打印小票')
    return
  }
  const receiptHtml = receiptRef.value?.innerHTML || ''
  printWindow.document.write(`
    <html>
    <head>
      <title>小票打印</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; width: 300px; margin: 0 auto; }
        .receipt-header { text-align: center; margin-bottom: 8px; }
        .receipt-header h3 { margin: 0; font-size: 16px; }
        .receipt-header p { margin: 4px 0 0; font-size: 12px; color: #666; }
        .receipt-divider { border-top: 1px dashed #333; margin: 8px 0; }
        .receipt-info .info-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .receipt-items { width: 100%; border-collapse: collapse; }
        .receipt-items th, .receipt-items td { text-align: left; padding: 4px 2px; }
        .receipt-items th { border-bottom: 1px dashed #333; }
        .receipt-items td:last-child { text-align: right; }
        .receipt-items th:last-child { text-align: right; }
        .receipt-items th:nth-child(2), .receipt-items td:nth-child(2) { text-align: center; }
        .receipt-total .total-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: bold; }
        .receipt-footer { text-align: center; font-size: 11px; color: #666; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      ${receiptHtml}
      <script>
        window.onload = function() { window.print(); window.close(); }
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
}
.receipt-header {
  text-align: center;
  margin-bottom: 8px;
}
.receipt-header h3 {
  margin: 0;
  font-size: 16px;
}
.receipt-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #666;
}
.receipt-divider {
  border-top: 1px dashed #dcdfe6;
  margin: 8px 0;
}
.receipt-info .info-row {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
}
.receipt-items {
  width: 100%;
  border-collapse: collapse;
}
.receipt-items th,
.receipt-items td {
  text-align: left;
  padding: 4px 2px;
}
.receipt-items th {
  border-bottom: 1px dashed #dcdfe6;
}
.receipt-items td:last-child {
  text-align: right;
}
.receipt-items th:last-child {
  text-align: right;
}
.receipt-items th:nth-child(2),
.receipt-items td:nth-child(2) {
  text-align: center;
}
.receipt-total .total-row {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
  font-weight: bold;
}
.receipt-footer {
  text-align: center;
  font-size: 11px;
  color: #909399;
}
</style>

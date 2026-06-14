<template>
  <div class="record-card glass">
    <div class="record-top">
      <div>
        <span class="record-no">{{ record.order_no || record.orderNo }}</span>
        <span class="record-time">{{ formatTime(record.created_at || record.createdAt) }}</span>
      </div>
      <button class="record-print" @click="$emit('print', record)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>补打
      </button>
    </div>
    <div class="record-items">{{ record.model_name || record.modelName || '商品' }}<template v-if="record.quantity"> x{{ record.quantity }}</template></div>
    <div class="record-bottom">
      <span class="record-amount">¥{{ (record.actual_amount || record.actualAmount || 0).toFixed(2) }}</span>
      <span class="record-customer" v-if="record.customer_name || record.customerName">{{ record.customer_name || record.customerName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ record: any }>()
defineEmits<{ print: [record: any] }>()

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}
</script>

<style scoped>
.record-card { padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: var(--transition); }
.record-card:hover { box-shadow: var(--shadow-md); }
.record-top { display: flex; justify-content: space-between; align-items: flex-start; }
.record-no { font-size: 15px; font-weight: 600; color: var(--text); font-family: monospace; display: block; }
.record-time { font-size: 13px; color: var(--text-tertiary); margin-top: 2px; display: block; }
.record-print { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid var(--border); border-radius: 8px; background: rgba(255,255,255,0.6); font-size: 13px; cursor: pointer; font-family: inherit; color: var(--text-secondary); transition: var(--transition); }
.record-print:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.record-items { font-size: 17px; color: var(--text); font-weight: 500; }
.record-bottom { display: flex; align-items: center; gap: 16px; }
.record-amount { font-size: 22px; font-weight: 700; color: var(--text); font-family: monospace; }
.record-customer { font-size: 14px; color: var(--text-secondary); }
</style>

<template>
  <div class="product-card glass">
    <div class="card-header">
      <svg class="card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/></svg>
      <span class="card-brand">{{ product.brandName }}</span>
    </div>
    <div class="card-model">{{ product.modelName }}</div>
    <div class="card-spec" v-if="product.color || product.storage">{{ product.color || '' }}{{ product.color && product.storage ? ' · ' : '' }}{{ product.storage || '' }}</div>
    <div class="card-imei">{{ product.imei }}</div>
    <div class="card-footer">
      <span class="card-store">{{ product.storeName }}</span>
      <span :class="['card-badge', product.isSold ? 'card-badge--sold' : 'card-badge--ok']">{{ product.isSold ? '已售' : '在库' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ product: any }>()
</script>

<style scoped>
.product-card { padding: 18px; display: flex; flex-direction: column; gap: 8px; cursor: default; transition: var(--transition); }
.product-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.card-header { display: flex; align-items: center; gap: 8px; }
.card-icon { flex-shrink: 0; }
.card-brand { font-size: 13px; font-weight: 600; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; }
.card-model { font-size: 17px; font-weight: 600; color: var(--text); }
.card-spec { font-size: 14px; color: var(--text-secondary); }
.card-imei { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 14px; color: var(--text); background: rgba(226,232,240,0.4); padding: 6px 10px; border-radius: 6px; letter-spacing: 0.3px; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.card-store { font-size: 13px; color: var(--text-tertiary); }
.card-badge { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 6px; }
.card-badge--ok { background: var(--success); color: #fff; }
.card-badge--sold { background: var(--border); color: var(--text-tertiary); }
</style>

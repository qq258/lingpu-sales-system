<template>
  <div class="cart-card glass">
    <div class="cart-left">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="15" y2="10"/></svg>
      <div class="cart-details">
        <div class="cart-name">{{ item.brandName }} {{ item.modelName }}</div>
        <div class="cart-spec">{{ item.color }}{{ item.color && item.storage ? ' · ' : '' }}{{ item.storage }}</div>
        <div class="cart-imei">{{ item.imei }}</div>
      </div>
    </div>
    <div class="cart-right">
      <el-input-number v-model="item.price" :min="0" :precision="2" :step="100" size="large" controls-position="right" style="width:150px;" />
      <button class="cart-remove" @click="$emit('remove')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ item: any }>()
defineEmits<{ remove: [] }>()
</script>

<style scoped>
.cart-card { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; gap: 16px; }
.cart-left { display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1; }
.cart-details { min-width: 0; }
.cart-name { font-size: 16px; font-weight: 600; color: var(--text); }
.cart-spec { font-size: 14px; color: var(--text-secondary); margin-top: 2px; }
.cart-imei { font-size: 13px; color: var(--text-tertiary); font-family: monospace; margin-top: 2px; }
.cart-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.cart-remove { width: 36px; height: 36px; border: none; border-radius: 50%; background: rgba(239,68,68,0.1); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--danger); transition: var(--transition); }
.cart-remove:hover { background: var(--danger); color: #fff; }
:deep(.el-input-number) { --el-component-size: 40px; }
:deep(.el-input-number .el-input__inner) { font-size: 15px; font-weight: 600; }
</style>

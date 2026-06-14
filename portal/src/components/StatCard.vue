<template>
  <div class="stat-card glass">
    <div class="stat-top">
      <span class="stat-label">{{ label }}</span>
      <span class="stat-icon" v-html="iconSvg"></span>
    </div>
    <span class="stat-value">{{ prefix }}{{ formattedValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ label: string; value: string | number; prefix?: string }>()

const iconMap: Record<string, string> = {
  sales: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  orders: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  lowstock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
}

const formattedValue = computed(() => {
  if (typeof props.value === 'number') return props.value.toLocaleString()
  return props.value
})

const iconSvg = computed(() => iconMap[props.label] || iconMap['orders'])
</script>

<style scoped>
.stat-card { padding: 22px 24px; position: relative; }
.stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.stat-label { font-size: 14px; font-weight: 500; color: var(--text-secondary); letter-spacing: 0.3px; text-transform: uppercase; }
.stat-icon { flex-shrink: 0; }
.stat-value { font-size: 36px; font-weight: 700; color: var(--text); line-height: 1.1; letter-spacing: -1px; }
</style>

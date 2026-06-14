<template>
  <div class="bar-chart" :style="{ height }">
    <div class="chart-bars">
      <div v-for="(item, i) in data" :key="i" class="chart-bar-item">
        <div class="chart-bar-value" v-if="showValue">{{ formatValue(item.value) }}</div>
        <div class="chart-bar" :style="{ height: barHeight(item.value) + '%', background: barColor(i) }"></div>
        <div class="chart-bar-label" :title="item.label">{{ item.label }}</div>
      </div>
    </div>
    <div v-if="!data.length" class="chart-empty">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      <span>暂无数据</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ data: Array<{ label: string; value: number }>; maxValue?: number; height?: string; color?: string; showValue?: boolean }>()

const max = computed(() => props.maxValue || Math.max(...props.data.map(d => d.value), 1))

function barHeight(val: number) { return Math.max((val / max.value) * 100, 2) }

function formatValue(v: number) {
  return v >= 10000 ? (v / 10000).toFixed(1) + 'w' : v.toLocaleString()
}

function barColor(i: number) {
  if (props.color) return props.color
  const colors = ['#2563EB','#3B82F6','#60A5FA','#93C5FD','#BFDBFE','#F97316','#FB923C','#FCD34D','#34D399','#22C55E']
  return colors[i % colors.length]
}
</script>

<style scoped>
.bar-chart { position: relative; width: 100%; }
.chart-bars { display: flex; align-items: flex-end; justify-content: space-around; height: 100%; gap: 6px; padding: 8px 0 0; }
.chart-bar-item { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; min-width: 0; }
.chart-bar-value { font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px; white-space: nowrap; font-family: 'SF Mono', monospace; }
.chart-bar { width: 100%; max-width: 36px; border-radius: 6px 6px 2px 2px; transition: height 0.4s ease; min-height: 3px; }
.chart-bar-label { font-size: 11px; color: var(--text-tertiary); margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-align: center; }
.chart-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: var(--text-tertiary); }
</style>

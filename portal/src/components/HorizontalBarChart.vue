<template>
  <div class="hbar-chart" :style="{ height }">
    <div v-if="data.length" class="hbar-list">
      <div v-for="(item, i) in data" :key="i" class="hbar-item">
        <span class="hbar-rank">{{ i + 1 }}</span>
        <span class="hbar-label" :title="item.label">{{ item.label }}</span>
        <div class="hbar-track">
          <div class="hbar-bar" :style="{ width: barWidth(item.value) + '%', background: barColor(i) }"></div>
        </div>
        <span class="hbar-value">{{ formatValue(item.value) }}</span>
      </div>
    </div>
    <div v-else class="chart-empty">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      <span>暂无数据</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: Array<{ label: string; value: number }>
  maxValue?: number
  height?: string
  color?: string
}>()

const max = computed(() => props.maxValue || Math.max(...props.data.map(d => d.value), 1))

function barWidth(val: number) { return Math.max((val / max.value) * 100, 2) }

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
.hbar-chart { position: relative; width: 100%; overflow-y: auto; }
.hbar-list { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
.hbar-item { display: flex; align-items: center; gap: 8px; }
.hbar-rank { width: 20px; font-size: 13px; font-weight: 700; color: var(--text-tertiary); text-align: center; flex-shrink: 0; }
.hbar-label { font-size: 13px; color: var(--text); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; width: 120px; }
.hbar-track { flex: 1; height: 20px; background: #E2E8F0; border-radius: 10px; overflow: hidden; }
.hbar-bar { height: 100%; border-radius: 10px; transition: width 0.4s ease; min-width: 4px; }
.hbar-value { font-size: 13px; font-weight: 600; color: var(--text); font-family: 'SF Mono', monospace; width: 50px; text-align: right; flex-shrink: 0; }
.chart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 100%; font-size: 14px; color: var(--text-tertiary); }
</style>

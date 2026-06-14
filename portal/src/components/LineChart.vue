<template>
  <div class="line-chart" :style="{ height }">
    <svg v-if="data.length" class="chart-svg" :viewBox="`0 0 ${svgW} ${svgH}`" preserveAspectRatio="none">
      <!-- 网格线 -->
      <line v-for="(y, yi) in gridY" :key="yi" :x1="padL" :y1="y" :x2="svgW - padR" :y2="y" stroke="#E2E8F0" stroke-width="1" />
      <!-- 折线 -->
      <polyline :points="linePoints" :stroke="color" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <!-- 面积 -->
      <path :d="areaPath" :fill="color" fill-opacity="0.08" />
      <!-- 数据点 -->
      <circle v-for="(p, i) in points" :key="i" :cx="p.x" :cy="p.y" r="4" :fill="color" stroke="#fff" stroke-width="2" />
    </svg>
    <div v-if="!data.length" class="chart-empty">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      <span>暂无数据</span>
    </div>
    <div class="chart-labels">
      <span v-for="(item, i) in dataLabels" :key="i" class="chart-label">{{ item }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: Array<{ label: string; value: number }>
  height?: string
  color?: string
}>()

const svgW = 400
const svgH = 180
const padL = 10
const padR = 10
const padT = 10
const padB = 10

const color = computed(() => props.color || '#2563EB')

const plotW = computed(() => svgW - padL - padR)
const plotH = computed(() => svgH - padT - padB)

const maxVal = computed(() => Math.max(...props.data.map(d => d.value), 1))

const points = computed(() => {
  const len = props.data.length
  return props.data.map((d, i) => ({
    x: padL + (len > 1 ? (i / (len - 1)) * plotW.value : plotW.value / 2),
    y: padT + plotH.value * (1 - d.value / maxVal.value),
  }))
})

const linePoints = computed(() => points.value.map(p => `${p.x},${p.y}`).join(' '))

const areaPath = computed(() => {
  if (!points.value.length) return ''
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  const top = points.value.map(p => `${p.x},${p.y}`).join(' ')
  return `M ${first.x},${padT + plotH.value} L ${top} L ${last.x},${padT + plotH.value} Z`
})

const gridY = computed(() => {
  const lines = 4
  const result = []
  for (let i = 0; i <= lines; i++) {
    result.push(padT + (plotH.value / lines) * i)
  }
  return result
})

const dataLabels = computed(() => props.data.map(d => d.label))
</script>

<style scoped>
.line-chart { position: relative; width: 100%; display: flex; flex-direction: column; }
.chart-svg { width: 100%; height: calc(100% - 22px); }
.chart-labels { display: flex; justify-content: space-between; padding: 0 4px; height: 22px; }
.chart-label { font-size: 10px; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chart-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: var(--text-tertiary); }
</style>

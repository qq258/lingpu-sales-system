<template>
  <div ref="containerRef" class="line-chart" :style="{ height }" @mouseleave="tooltipVisible = false">
    <svg v-if="data.length" class="chart-svg" :viewBox="`0 0 ${vbW} ${vbH}`" preserveAspectRatio="none">
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.3" />
          <stop offset="100%" :stop-color="color" stop-opacity="0.03" />
        </linearGradient>
      </defs>
      <!-- Y轴分割线 -->
      <line v-for="(g, gi) in gridLines" :key="gi" :x1="padL" :y1="g.y" :x2="vbW - padR" :y2="g.y" stroke="rgba(0,0,0,0.12)" stroke-width="1" />
      <!-- Y轴标签 -->
      <text v-for="(g, gi) in gridLines" :key="'l'+gi" :x="padL - 6" :y="g.y + 4" fill="#808080" font-size="12" text-anchor="end" font-family="sans-serif">{{ g.label }}</text>
      <!-- 面积渐变 -->
      <path :d="areaPath" :fill="`url(#${gradId})`" />
      <!-- 折线 -->
      <polyline :points="linePoints" :stroke="color" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <!-- 数据点 -->
      <circle v-for="(p, i) in points" :key="i" :cx="p.x" :cy="p.y" r="4" :fill="color" stroke="#fff" stroke-width="2" class="chart-dot" :data-idx="i" @mouseenter="showTooltip($event, i)" />
      <!-- 数据标签（显示在点上方） -->
      <text v-for="(p, i) in points" :key="'v'+i" :x="p.x" :y="p.y - 10" fill="#808080" font-size="12" text-anchor="middle" font-family="sans-serif" class="chart-value-label">{{ formatVal(data[i].value) }}</text>
      <!-- Tooltip -->
      <g v-if="tooltipVisible && tooltipIdx >= 0">
        <rect :x="tooltipRect.x" :y="tooltipRect.y" :width="tooltipRect.w" :height="tooltipRect.h" rx="4" fill="rgba(50,50,50,0.92)" />
        <text :x="tooltipRect.x + tooltipRect.w / 2" :y="tooltipRect.y + 16" fill="#fff" font-size="12" text-anchor="middle" font-family="sans-serif">{{ tooltipText }}</text>
      </g>
    </svg>
    <div v-if="!data.length" class="chart-empty">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      <span>暂无数据</span>
    </div>
    <!-- X轴标签 -->
    <div class="chart-labels">
      <span v-for="(item, i) in displayLabels" :key="i" class="chart-label" :class="{ 'chart-label--hide': !item }">{{ item || '' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  data: Array<{ label: string; value: number }>
  height?: string
  color?: string
  maxLabels?: number
}>()

const containerRef = ref<HTMLDivElement>()
const vbW = ref(400)
const vbH = ref(220)

const padL = 50
const padR = 14
const padT = 28
const padB = 10

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    const parent = containerRef.value.parentElement
    if (parent) {
      const rect = parent.getBoundingClientRect()
      if (rect.width > 0) vbW.value = Math.round(rect.width)
    }
    resizeObserver = new ResizeObserver(entries => {
      const rect = entries[0].contentRect
      if (rect.width > 0) {
        vbW.value = Math.round(rect.width)
        vbH.value = Math.round(rect.height)
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

const uid = Math.random().toString(36).slice(2, 8)
const gradId = `line-grad-${uid}`
const color = computed(() => props.color || '#3B57F7')
const maxLabels = computed(() => props.maxLabels || 7)

const plotW = computed(() => Math.max(vbW.value - padL - padR, 1))
const plotH = computed(() => Math.max(vbH.value - padT - padB, 1))

const maxVal = computed(() => Math.max(...props.data.map(d => d.value), 1))

function formatVal(v: number) {
  return v >= 10000 ? (v / 10000).toFixed(1) + 'w' : v.toLocaleString()
}

// Y轴网格线
const gridLines = computed(() => {
  const lines = 4
  const result = []
  for (let i = 0; i <= lines; i++) {
    const val = (maxVal.value / lines) * (lines - i)
    result.push({
      y: padT + (plotH.value / lines) * i,
      label: formatVal(val),
    })
  }
  return result
})

// 数据点坐标
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

// X轴智能标签
const displayLabels = computed(() => {
  const labels = props.data.map(d => d.label)
  const total = labels.length
  if (total <= maxLabels.value) return labels

  const step = Math.ceil(total / maxLabels.value)
  const result: (string | null)[] = []
  let count = 0
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || count % step === 0) {
      result.push(labels[i])
    } else {
      result.push(null)
    }
    count++
  }
  return result
})

// Tooltip
const tooltipVisible = ref(false)
const tooltipIdx = ref(-1)
const tooltipText = ref('')
const tooltipRect = ref({ x: 0, y: 0, w: 0, h: 0 })

function showTooltip(e: MouseEvent, idx: number) {
  const d = props.data[idx]
  tooltipIdx.value = idx
  tooltipText.value = `${d.label}  ${formatVal(d.value)}`
  const textLen = tooltipText.value.length * 7 + 16
  const rectW = Math.max(textLen, 60)
  const rectH = 24
  let rectX = points.value[idx].x - rectW / 2
  const rectY = points.value[idx].y - 38
  if (rectX < 0) rectX = 4
  if (rectX + rectW > vbW.value) rectX = vbW.value - rectW - 4
  tooltipRect.value = { x: rectX, y: rectY, w: rectW, h: rectH }
  tooltipVisible.value = true
}
</script>

<style scoped>
.line-chart { position: relative; width: 100%; display: flex; flex-direction: column; user-select: none; }
.chart-svg { width: 100%; height: 100%; display: block; }
.chart-dot { cursor: pointer; transition: r 0.15s ease; }
.chart-dot:hover { r: 6; }
.chart-value-label { pointer-events: none; }
.chart-labels { display: flex; justify-content: space-between; padding: 0 4px; height: 24px; align-items: flex-start; flex-shrink: 0; }
.chart-label { font-size: 12px; color: #808080; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; text-align: center; }
.chart-label:first-child { text-align: left; }
.chart-label:last-child { text-align: right; }
.chart-label--hide { visibility: hidden; }
.chart-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: var(--text-tertiary); }
</style>

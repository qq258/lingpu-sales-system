<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible" class="sbd-overlay" @click.self="() => {}">
        <div class="sbd-box glass-strong">
          <div class="sbd-header">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            <span>确认新增品牌型号</span>
          </div>
          <div class="sbd-desc">以下品牌型号尚未录入系统，请确认后保存</div>

          <div class="sbd-accordion">
            <div v-for="(item, idx) in items" :key="idx" class="sbd-panel">
              <div class="sbd-panel-header" @click="togglePanel(idx)">
                <svg :class="['sbd-arrow', { open: openPanel === idx }]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                <span class="sbd-panel-title">{{ item.rawText }}</span>
              </div>
              <div v-show="openPanel === idx" class="sbd-panel-body">
                <div class="sbd-field-row">
                  <label class="sbd-label">品牌</label>
                  <input v-model="item.brand" class="sbd-field-input" placeholder="品牌名称" />
                </div>
                <div class="sbd-field-row">
                  <label class="sbd-label">型号</label>
                  <input v-model="item.model" class="sbd-field-input" placeholder="型号名称" />
                </div>
              </div>
            </div>
          </div>

          <div class="sbd-actions">
            <button class="sbd-btn sbd-btn-primary" :disabled="saving" @click="handleConfirm">
              {{ saving ? '保存中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getBrands, createBrand, createModel } from '@/api/product'

export interface BrandModelItem {
  rawText: string
  brand: string
  model: string
}

const props = defineProps<{
  visible: boolean
  items: BrandModelItem[]
}>()
const emit = defineEmits<{
  confirm: [savedItems: BrandModelItem[]]
}>()

const openPanel = ref(0)
const saving = ref(false)

function togglePanel(idx: number) {
  openPanel.value = openPanel.value === idx ? -1 : idx
}

async function handleConfirm() {
  saving.value = true
  try {
    const saved: BrandModelItem[] = []
    const brands = await getBrands()
    for (const item of props.items) {
      if (!item.brand.trim() || !item.model.trim()) continue
      let brandId: number | null = null
      const existing = brands.find((b: any) => b.name === item.brand.trim())
      if (existing) {
        brandId = existing.id
      } else {
        const brandRes: any = await createBrand(item.brand.trim())
        brandId = brandRes?.data?.id || brandRes?.id
      }
      if (brandId) {
        await createModel(brandId, item.model.trim())
        saved.push({ ...item })
      }
    }
    emit('confirm', saved)
  } catch {
    // error handled by interceptor
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.sbd-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 2100; backdrop-filter: blur(6px); }
.sbd-box { border-radius: var(--radius-lg); padding: 28px; max-width: 440px; width: 92%; }
.sbd-header { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.sbd-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; }
.sbd-accordion { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; max-height: 320px; overflow-y: auto; }
.sbd-panel { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.sbd-panel-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; cursor: pointer; background: var(--bg); user-select: none; }
.sbd-panel-header:hover { background: var(--bg-hover); }
.sbd-arrow { flex-shrink: 0; transition: transform 0.2s; }
.sbd-arrow.open { transform: rotate(0deg); }
.sbd-arrow:not(.open) { transform: rotate(-90deg); }
.sbd-panel-title { font-size: 14px; font-weight: 600; color: var(--text); }
.sbd-panel-body { padding: 12px 14px 16px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; }
.sbd-field-row { display: flex; align-items: center; gap: 12px; }
.sbd-label { font-size: 13px; color: var(--text-secondary); min-width: 40px; font-weight: 500; }
.sbd-field-input { flex: 1; height: 38px; padding: 0 12px; font-size: 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; background: #fff; font-family: inherit; box-sizing: border-box; }
.sbd-field-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
.sbd-actions { display: flex; }
.sbd-btn { flex: 1; height: 46px; border: none; border-radius: var(--radius-sm); font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.sbd-btn-primary { background: #2563EB; color: #fff; }
.sbd-btn-primary:hover { filter: brightness(0.95); }
.sbd-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.dialog-enter-active { transition: all 0.2s ease; }
.dialog-leave-active { transition: all 0.15s ease; }
.dialog-enter-from { opacity: 0; transform: scale(0.92); }
.dialog-leave-to { opacity: 0; transform: scale(0.92); }
</style>

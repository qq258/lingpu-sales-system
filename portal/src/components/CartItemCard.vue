<template>
  <div class="cart-card glass">
    <div class="cart-left">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="15" y2="10"/></svg>
      <div class="cart-details">
        <div class="cart-name">{{ item.brandName }} {{ item.modelName }}</div>
        <div class="cart-spec">{{ item.color }}{{ item.color && item.storage ? ' · ' : '' }}{{ item.storage }}</div>
        <div class="cart-imei-row">
          <span class="cart-imei-tag" v-if="item.imei">IMEI1: {{ item.imei }}</span>
          <span v-else class="cart-imei-missing" @click="editImei('1')">IMEI1: [待录入]</span>
          <span class="cart-imei-sep">|</span>
          <span class="cart-imei-tag" v-if="item.imei2">IMEI2: {{ item.imei2 }}</span>
          <span v-else class="cart-imei-missing" @click="editImei('2')">IMEI2: [待录入]</span>
          <span class="cart-imei-sep">|</span>
          <span class="cart-imei-tag" v-if="item.snCode">SN: {{ item.snCode }}</span>
          <span v-else class="cart-imei-missing" @click="editImei('sn')">SN: [待录入]</span>
        </div>
      </div>
    </div>
    <div class="cart-right">
      <el-input-number v-model="item.price" :min="0" :precision="2" :step="100" size="large" controls-position="right" style="width:150px;" />
      <button class="cart-remove" @click="$emit('remove')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- IMEI 行内编辑弹出框 -->
    <div v-if="showImeiEditor" class="imei-overlay" @click.self="closeImeiEditor">
      <div class="imei-editor-box glass-strong">
        <div class="imei-editor-title">录入 {{ imeiEditTarget === 'sn' ? 'S/N 码' : `IMEI${imeiEditTarget}` }}</div>
        <input
          ref="imeiEditInputRef"
          v-model="imeiEditValue"
          class="imei-edit-input"
          :placeholder="imeiEditTarget === 'sn' ? '扫码或输入 S/N 码' : `扫码或输入 IMEI${imeiEditTarget}`"
          @keyup.enter="confirmImeiEdit"
        />
        <div class="imei-editor-actions">
          <button class="imei-btn imei-btn-cancel" @click="closeImeiEditor">取消</button>
          <button class="imei-btn imei-btn-confirm" @click="confirmImeiEdit">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{ item: any }>()
const emit = defineEmits<{ remove: []; update: [field: string, value: string] }>()

const showImeiEditor = ref(false)
const imeiEditTarget = ref<'1' | '2' | 'sn'>('1')
const imeiEditValue = ref('')
const imeiEditInputRef = ref<HTMLInputElement>()

function editImei(target: '1' | '2' | 'sn') {
  imeiEditTarget.value = target
  imeiEditValue.value = ''
  showImeiEditor.value = true
  nextTick(() => imeiEditInputRef.value?.focus())
}

function closeImeiEditor() {
  showImeiEditor.value = false
  imeiEditValue.value = ''
}

function confirmImeiEdit() {
  const val = imeiEditValue.value.trim()
  if (!val) {
    closeImeiEditor()
    return
  }
  const key = imeiEditTarget.value === '1' ? 'imei' : imeiEditTarget.value === '2' ? 'imei2' : 'snCode'
  props.item[key] = val
  emit('update', key, val)
  closeImeiEditor()
}
</script>

<style scoped>
.cart-card { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; gap: 16px; position: relative; }
.cart-left { display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1; }
.cart-details { min-width: 0; }
.cart-name { font-size: 16px; font-weight: 600; color: var(--text); }
.cart-spec { font-size: 14px; color: var(--text-secondary); margin-top: 2px; }
.cart-imei-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
.cart-imei-tag { font-size: 12px; color: var(--text-tertiary); font-family: monospace; }
.cart-imei-missing { font-size: 12px; color: #F59E0B; cursor: pointer; font-family: monospace; text-decoration: underline dotted; }
.cart-imei-missing:hover { color: #EF4444; }
.cart-imei-sep { color: var(--border); font-size: 12px; }
.cart-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.cart-remove { width: 36px; height: 36px; border: none; border-radius: 50%; background: rgba(239,68,68,0.1); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #EF4444; transition: var(--transition); }
.cart-remove:hover { background: #EF4444; color: #fff; }
:deep(.el-input-number) { --el-component-size: 40px; }
:deep(.el-input-number .el-input__inner) { font-size: 15px; font-weight: 600; }

.imei-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.3); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.imei-editor-box { padding: 24px; border-radius: var(--radius); max-width: 380px; width: 90%; }
.imei-editor-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text); }
.imei-edit-input { width: 100%; height: 44px; padding: 0 14px; font-size: 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: monospace; background: #fff; box-sizing: border-box; }
.imei-edit-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
.imei-editor-actions { display: flex; gap: 10px; margin-top: 16px; }
.imei-btn { flex: 1; height: 40px; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
.imei-btn-cancel { background: var(--border); color: var(--text-secondary); }
.imei-btn-confirm { background: #2563EB; color: #fff; }
.imei-btn:hover { filter: brightness(0.95); }
</style>

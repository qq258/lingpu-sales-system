<template>
  <div class="product-card glass">
    <div class="card-header">
      <svg class="card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/></svg>
      <span class="card-brand">{{ product.brandName }}</span>
    </div>
    <div class="card-model">{{ product.modelName }}</div>
    <div class="card-spec" v-if="product.color || product.storage">{{ product.color || '' }}{{ product.color && product.storage ? ' · ' : '' }}{{ product.storage || '' }}</div>
    <div class="card-imei-row">
      <div class="card-imei">{{ product.imei }}</div>
      <button v-if="hasExpandable" class="card-expand-btn" @click="expanded = !expanded" :title="expanded ? '收起' : '展开'">
        <svg :class="['expand-icon', { 'expand-icon--open': expanded }]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>
    <div v-if="expanded" class="card-extra">
      <div class="card-extra-item">
        <span class="card-extra-label">IMEI2</span>
        <template v-if="product.imei2">
          <span class="card-extra-value mono">{{ product.imei2 }}</span>
        </template>
        <template v-else>
          <div class="card-extra-edit">
            <input v-model="editImei2" class="extra-input" placeholder="输入 IMEI2" @keyup.enter="handleSave('imei2')" />
            <button class="extra-save-btn" :disabled="saving || !editImei2.trim()" @click="handleSave('imei2')">保存</button>
          </div>
        </template>
      </div>
      <div class="card-extra-item">
        <span class="card-extra-label">SN码</span>
        <template v-if="product.sn_code">
          <span class="card-extra-value mono">{{ product.sn_code }}</span>
        </template>
        <template v-else>
          <div class="card-extra-edit">
            <input v-model="editSnCode" class="extra-input" placeholder="输入 SN 码" @keyup.enter="handleSave('sn_code')" />
            <button class="extra-save-btn" :disabled="saving || !editSnCode.trim()" @click="handleSave('sn_code')">保存</button>
          </div>
        </template>
      </div>
    </div>
    <div class="card-footer">
      <span class="card-store">{{ product.storeName }}</span>
      <span :class="['card-badge', product.isSold ? 'card-badge--sold' : 'card-badge--ok']">{{ product.isSold ? '已售' : '在库' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { updateImeiInfo } from '@/api/inventory'

const props = defineProps<{ product: any }>()
const emit = defineEmits<{ updated: [] }>()

const expanded = ref(false)
const editImei2 = ref('')
const editSnCode = ref('')
const saving = ref(false)

const hasExpandable = computed(() => !props.product.imei2 || !props.product.sn_code)

async function handleSave(field: 'imei2' | 'sn_code') {
  const data: any = {}
  if (field === 'imei2') {
    if (!editImei2.value.trim()) return
    data.imei2 = editImei2.value.trim()
  } else {
    if (!editSnCode.value.trim()) return
    data.sn_code = editSnCode.value.trim()
  }
  saving.value = true
  try {
    await updateImeiInfo(props.product.id, data)
    if (data.imei2) props.product.imei2 = data.imei2
    if (data.sn_code) props.product.sn_code = data.sn_code
    editImei2.value = ''
    editSnCode.value = ''
    emit('updated')
  } catch {
    // 静默失败
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.product-card { padding: 18px; display: flex; flex-direction: column; gap: 8px; cursor: default; transition: var(--transition); }
.product-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.card-header { display: flex; align-items: center; gap: 8px; }
.card-icon { flex-shrink: 0; }
.card-brand { font-size: 13px; font-weight: 600; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; }
.card-model { font-size: 17px; font-weight: 600; color: var(--text); }
.card-spec { font-size: 14px; color: var(--text-secondary); }
.card-imei-row { display: flex; align-items: center; gap: 6px; }
.card-imei { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 14px; color: var(--text); background: rgba(226,232,240,0.4); padding: 6px 10px; border-radius: 6px; letter-spacing: 0.3px; flex: 1; }
.card-expand-btn { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 6px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: var(--transition); flex-shrink: 0; }
.card-expand-btn:hover { border-color: var(--primary); color: var(--primary); }
.expand-icon { transition: transform 0.2s; }
.expand-icon--open { transform: rotate(180deg); }
.card-extra { margin-top: 4px; padding: 10px 12px; background: rgba(226,232,240,0.25); border-radius: 8px; display: flex; flex-direction: column; gap: 8px; animation: slideDown 0.15s ease; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.card-extra-item { display: flex; align-items: center; gap: 8px; }
.card-extra-label { font-size: 12px; font-weight: 600; color: var(--text-tertiary); min-width: 48px; }
.card-extra-value { font-size: 13px; color: var(--text); }
.card-extra-value.mono { font-family: 'SF Mono', 'Cascadia Code', monospace; }
.card-extra-edit { display: flex; gap: 6px; flex: 1; }
.extra-input { flex: 1; height: 28px; padding: 0 8px; font-size: 13px; font-family: 'SF Mono', 'Cascadia Code', monospace; border: 1.5px solid var(--border); border-radius: 4px; outline: none; background: #fff; transition: var(--transition); }
.extra-input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-glow); }
.extra-save-btn { height: 28px; padding: 0 10px; border: none; border-radius: 4px; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); white-space: nowrap; }
.extra-save-btn:hover { background: var(--primary-dark); }
.extra-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.card-store { font-size: 13px; color: var(--text-tertiary); }
.card-badge { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 6px; }
.card-badge--ok { background: var(--success); color: #fff; }
.card-badge--sold { background: var(--border); color: var(--text-tertiary); }
</style>

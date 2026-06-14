<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
        <div class="dialog-box glass-strong">
          <div class="dialog-header">
            <h3 class="dialog-title">IMEI 查询</h3>
            <button class="dialog-close" @click="handleClose">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="dialog-body">
            <div class="query-row">
              <div class="query-input-wrap">
                <input ref="queryRef" v-model="imeiInput" class="query-input" placeholder="输入 IMEI 码" @keyup.enter="handleQuery" />
              </div>
              <button class="query-btn" :disabled="queryLoading" @click="handleQuery">
                <span v-if="queryLoading" class="spinner"></span>
                <span v-else>查询</span>
              </button>
            </div>

            <div v-if="queryError" class="query-error">{{ queryError }}</div>

            <div v-if="result" class="result-area">
              <div class="result-section">
                <h4 class="result-section-title">手机信息</h4>
                <div class="info-grid">
                  <div class="info-item"><span class="info-label">品牌</span><span class="info-value">{{ result.brandName || '-' }}</span></div>
                  <div class="info-item"><span class="info-label">型号</span><span class="info-value">{{ result.modelName || '-' }}</span></div>
                  <div class="info-item"><span class="info-label">颜色</span><span class="info-value">{{ result.color || '-' }}</span></div>
                  <div class="info-item"><span class="info-label">存储</span><span class="info-value">{{ result.storage || '-' }}</span></div>
                  <div class="info-item"><span class="info-label">IMEI</span><span class="info-value mono">{{ result.imei || '-' }}</span></div>
                  <div class="info-item"><span class="info-label">IMEI2</span><span class="info-value mono">{{ result.imei2 || '-' }}</span></div>
                  <div class="info-item"><span class="info-label">SN码</span><span class="info-value mono">{{ result.sn_code || '-' }}</span></div>
                  <div class="info-item"><span class="info-label">状态</span><span :class="['status-badge', result.status === 'in_stock' ? 'status-ok' : 'status-sold']">{{ result.status === 'in_stock' ? '在库' : '已售' }}</span></div>
                  <div class="info-item"><span class="info-label">所在门店</span><span class="info-value">{{ result.storeName || '-' }}</span></div>
                  <div class="info-item"><span class="info-label">售价</span><span class="info-value">¥{{ (result.salePrice || 0).toFixed(2) }}</span></div>
                </div>
              </div>

              <div v-if="saleRecords.length" class="result-section">
                <h4 class="result-section-title">销售记录</h4>
                <div v-for="r in saleRecords" :key="r.id" class="record-line">
                  <span class="record-no">{{ r.order_no }}</span>
                  <span class="record-date">{{ formatTime(r.created_at) }}</span>
                  <span class="record-amount">¥{{ (r.actual_amount || 0).toFixed(2) }}</span>
                </div>
              </div>

              <div v-if="entryRecords.length" class="result-section">
                <h4 class="result-section-title">入库记录</h4>
                <div v-for="r in entryRecords" :key="r.id" class="record-line">
                  <span class="record-no">{{ r.entry_no }}</span>
                  <span class="record-date">{{ formatTime(r.created_at) }}</span>
                  <span class="record-supplier">{{ r.supplier?.name || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { scanImeiForSale } from '@/api/inventory'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [boolean] }>()

const queryRef = ref<HTMLInputElement>()
const imeiInput = ref('')
const queryLoading = ref(false)
const queryError = ref('')
const result = ref<any>(null)
const saleRecords = ref<any[]>([])
const entryRecords = ref<any[]>([])

watch(() => props.visible, (v) => {
  if (v) {
    imeiInput.value = ''
    result.value = null
    saleRecords.value = []
    entryRecords.value = []
    queryError.value = ''
    nextTick(() => queryRef.value?.focus())
  }
})

function handleClose() {
  emit('update:visible', false)
}

async function handleQuery() {
  const imei = imeiInput.value.trim()
  if (!imei) { queryError.value = '请输入 IMEI'; return }
  queryLoading.value = true; queryError.value = ''
  try {
    const data = await scanImeiForSale(imei)
    if (!data) { queryError.value = '未找到该 IMEI 对应的记录'; result.value = null; return }
    result.value = data
    // TODO: 后续可扩展查询该 IMEI 的销售记录和入库记录
    saleRecords.value = []
    entryRecords.value = []
  } catch (e: any) {
    queryError.value = e?.response?.data?.message || e?.message || '查询失败'
    result.value = null
  } finally {
    queryLoading.value = false
  }
}

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}
</script>

<style scoped>
.dialog-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(6px); }
.dialog-box { border-radius: var(--radius-lg); width: 520px; max-width: 92vw; max-height: 80vh; display: flex; flex-direction: column; }
.dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 28px 0; }
.dialog-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; }
.dialog-close { width: 32px; height: 32px; border: none; border-radius: 50%; background: var(--border); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: var(--transition); }
.dialog-close:hover { background: var(--danger); color: #fff; }
.dialog-body { padding: 20px 28px 28px; overflow-y: auto; flex: 1; }
.query-row { display: flex; gap: 10px; }
.query-input-wrap { flex: 1; }
.query-input { width: 100%; height: 46px; padding: 0 14px; font-size: 17px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.query-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.query-btn { height: 46px; padding: 0 24px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.query-btn:hover { background: var(--primary-dark); }
.query-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.query-error { margin-top: 12px; font-size: 14px; color: var(--danger); padding: 10px; background: var(--danger-light); border-radius: var(--radius-sm); }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.result-area { margin-top: 20px; display: flex; flex-direction: column; gap: 18px; }
.result-section-title { font-size: 15px; font-weight: 600; color: var(--text); margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 12px; color: var(--text-tertiary); }
.info-value { font-size: 14px; color: var(--text); font-weight: 500; }
.info-value.mono { font-family: 'SF Mono', monospace; font-size: 13px; }
.status-badge { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 6px; display: inline-block; width: fit-content; }
.status-ok { background: var(--success); color: #fff; }
.status-sold { background: var(--border); color: var(--text-tertiary); }
.record-line { display: flex; gap: 12px; align-items: center; padding: 6px 0; font-size: 14px; color: var(--text); border-bottom: 1px solid var(--border); }
.record-line:last-child { border-bottom: none; }
.record-no { font-family: 'SF Mono', monospace; font-size: 13px; color: var(--primary); min-width: 160px; }
.record-date { font-size: 13px; color: var(--text-tertiary); }
.record-amount { margin-left: auto; font-weight: 600; font-family: monospace; }
.record-supplier { margin-left: auto; font-size: 13px; color: var(--text-secondary); }

.dialog-enter-active { transition: all 0.2s ease; }
.dialog-leave-active { transition: all 0.15s ease; }
.dialog-enter-from { opacity: 0; transform: scale(0.94); }
.dialog-leave-to { opacity: 0; transform: scale(0.94); }
</style>

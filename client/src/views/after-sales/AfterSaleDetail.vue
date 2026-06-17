<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">工单详情</h1>
        <span class="pbm-subtitle">{{ order?.order_no }}</span>
      </div>
      <button class="pbm-btn-ghost" style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;" @click="$router.push('/after-sales/list')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回列表
      </button>
      <button class="pbm-btn-ghost" style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;color:var(--pbm-red);border-color:rgba(220,53,69,0.3);" @click="handleDelete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        删除
      </button>
    </header>

    <div class="pbm-body" v-loading="loading" element-loading-background="rgba(245,240,235,0.8)">
      <template v-if="order">
        <div class="pbm-content">
          <!-- 顶部信息卡片 -->
          <div class="pbm-detail-cards">
            <div class="pbm-detail-card">
              <div class="pbm-detail-card__label">手机信息</div>
              <div class="pbm-detail-card__body">
                <div>IMEI：<strong>{{ order.imei?.imei || '-' }}</strong></div>
                <div>品牌型号：<span class="pbm-tag-brand">{{ order.imei?.model?.brand?.name || '' }}</span> {{ order.imei?.model?.name || '-' }}</div>
                <div>颜色/存储：{{ order.imei?.model?.color || '-' }} / {{ [order.imei?.model?.ram, order.imei?.model?.rom].filter(Boolean).join('/') || '-' }}</div>
              </div>
            </div>
            <div class="pbm-detail-card">
              <div class="pbm-detail-card__label">工单信息</div>
              <div class="pbm-detail-card__body">
                <div>工单号：<strong>{{ order.order_no }}</strong></div>
                <div>处理人：{{ order.handler?.real_name || '-' }}</div>
              </div>
            </div>
            <div class="pbm-detail-card">
              <div class="pbm-detail-card__label">客户信息</div>
              <div class="pbm-detail-card__body">
                <div>姓名：{{ order.customer_name || '-' }}</div>
                <div>电话：{{ order.customer_phone || '-' }}</div>
                <div>地址：{{ order.customer_address || '-' }}</div>
              </div>
            </div>
            <div class="pbm-detail-card">
              <div class="pbm-detail-card__label">当前状态</div>
              <div class="pbm-detail-card__body">
                <div><span :class="['pbm-status-tag', `pbm-status-tag--${order.status}`]">{{ statusLabel(order.status) }}</span></div>
                <div v-if="order.supplier_status !== 'none'" style="margin-top:4px;">
                  供应商：<span :class="['pbm-status-tag', order.supplier_status === 'completed' ? 'pbm-status-tag--ok' : 'pbm-status-tag--warn']">{{ supplierLabel(order.supplier_status) }}</span>
                </div>
                <div class="pbm-detail-card__meta">创建时间：{{ formatDate(order.created_at) }}</div>
              </div>
            </div>
          </div>

          <!-- 故障描述 -->
          <div class="pbm-section">
            <div class="pbm-section__label">故障描述</div>
            <div class="pbm-section__text">{{ order.fault_description }}</div>
          </div>

          <div v-if="order.detection_result" class="pbm-section">
            <div class="pbm-section__label">检测结果</div>
            <div class="pbm-section__text">{{ order.detection_result }}</div>
          </div>

          <div v-if="order.result" class="pbm-section">
            <div class="pbm-section__label">最终处理结果</div>
            <div class="pbm-section__text">{{ order.result }}</div>
          </div>

          <div v-if="order.process_type === 'exchange' && order.exchange_imei_id" class="pbm-section">
            <div class="pbm-section__label">换货信息</div>
            <div class="pbm-section__text">换货型号 ID：{{ order.exchange_model_id || '-' }} · 换货 IMEI ID：{{ order.exchange_imei_id }}</div>
          </div>

          <div v-if="order.cost" class="pbm-section">
            <div class="pbm-section__label">费用</div>
            <div class="pbm-section__text">{{ order.cost }} 元{{ order.cost_remark ? '（' + order.cost_remark + '）' : '' }}</div>
          </div>

          <!-- 处理操作区 -->
          <div class="pbm-section pbm-section--ops">
            <div class="pbm-section__label">处理操作</div>
            <el-form label-position="top" size="small" class="pbm-ops-form">
              <div class="pbm-ops-row">
                <el-form-item label="检测结果">
                  <el-select v-model="editForm.detection_result" placeholder="检测结果" clearable>
                    <el-option label="确认故障" value="确认故障" />
                    <el-option label="无故障" value="无故障" />
                    <el-option label="需联系供应商" value="需联系供应商" />
                  </el-select>
                </el-form-item>
                <el-form-item label="处理方式">
                  <el-select v-model="editForm.process_type" placeholder="处理方式" clearable>
                    <el-option label="维修" value="repair" />
                    <el-option label="换货" value="exchange" />
                    <el-option label="退款" value="refund" />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="editForm.process_type === 'repair'" label="维修级别">
                  <el-select v-model="editForm.repair_level" placeholder="维修级别" clearable>
                    <el-option label="当场维修" value="minor" />
                    <el-option label="店里维修" value="medium" />
                    <el-option label="返厂维修" value="major" />
                  </el-select>
                </el-form-item>
                <el-form-item label="费用">
                  <el-input v-model.number="editForm.cost" placeholder="费用" type="number" style="width:100px;" />
                </el-form-item>
                <el-form-item label="费用说明">
                  <el-input v-model="editForm.cost_remark" placeholder="费用说明" style="width:140px;" />
                </el-form-item>
              </div>
              <div class="pbm-ops-row">
                <el-form-item label="供应商联系人" v-if="editForm.supplier_status && editForm.supplier_status !== 'none'">
                  <el-input v-model="editForm.supplier_contact" placeholder="供应商联系人/电话" />
                </el-form-item>
                <el-form-item label="供应商状态">
                  <el-select v-model="editForm.supplier_status" placeholder="供应商状态" clearable>
                    <el-option label="无需供应商" value="none" />
                    <el-option label="待联系" value="pending" />
                    <el-option label="处理中" value="in_progress" />
                    <el-option label="已处理" value="completed" />
                  </el-select>
                </el-form-item>
                <el-form-item label="供应商处理结果" class="pbm-ops-item--wide">
                  <el-input v-model="editForm.supplier_result" placeholder="供应商处理结果" />
                </el-form-item>
              </div>
              <div v-if="editForm.process_type === 'exchange'" class="pbm-ops-row">
                <el-form-item label="换货型号 ID">
                  <el-input v-model.number="editForm.exchange_model_id" placeholder="新手机型号 ID" type="number" />
                </el-form-item>
                <el-form-item label="换货 IMEI ID">
                  <el-input v-model.number="editForm.exchange_imei_id" placeholder="新手机 IMEI ID" type="number" />
                </el-form-item>
              </div>
              <div class="pbm-ops-row">
                <el-form-item label="变更状态">
                  <el-select v-model="editForm.status" placeholder="变更状态" style="width:160px;">
                    <el-option label="待处理" value="pending" />
                    <el-option label="检测中" value="detecting" />
                    <el-option label="维修中" value="repairing" />
                    <el-option label="已维修" value="repaired" />
                    <el-option label="换货中" value="exchanging" />
                    <el-option label="已换货" value="exchanged" />
                    <el-option label="退款中" value="refunding" />
                    <el-option label="已退款" value="refunded" />
                    <el-option label="已完成" value="completed" />
                    <el-option label="已取消" value="cancelled" />
                  </el-select>
                </el-form-item>
                <el-form-item label="最终处理结果" class="pbm-ops-item--wide">
                  <el-input v-model="editForm.result" placeholder="最终处理结果" />
                </el-form-item>
              </div>
              <div class="pbm-ops-actions">
                <button class="pbm-btn-accent" @click="handleUpdate" :disabled="saving">{{ saving ? '保存中...' : '保存更新' }}</button>
                <button v-if="order.status !== 'completed' && order.status !== 'cancelled'" class="pbm-btn-success" @click="handleComplete" :disabled="completing">{{ completing ? '完成中...' : '完成工单' }}</button>
              </div>
            </el-form>
          </div>

          <!-- 操作日志 -->
          <div class="pbm-section">
            <div class="pbm-section__label">操作日志 / 供应商沟通记录</div>
            <div class="pbm-log-list">
              <div v-for="log in logs" :key="log.id" class="pbm-log-item">
                <div class="pbm-log-item__head">
                  <strong>{{ log.operator?.real_name || '系统' }}</strong>
                  <span class="pbm-log-badge">{{ actionLabel(log.action) }}</span>
                  <span class="pbm-log-time">{{ formatDate(log.created_at) }}</span>
                </div>
                <div class="pbm-log-item__body">{{ log.content }}</div>
              </div>
              <div v-if="!logs.length" class="pbm-log-empty">暂无操作记录</div>
            </div>
            <div class="pbm-log-add">
              <el-input v-model="logContent" placeholder="添加日志 / 供应商沟通记录..." style="flex:1;" />
              <button class="pbm-btn-accent pbm-btn-accent--sm" @click="handleAddLog" :disabled="logSubmitting">添加记录</button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAfterSaleDetail, updateAfterSale, addAfterSaleLog, completeAfterSale, deleteAfterSale } from '@/api/after-sales'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const completing = ref(false)
const order = ref<any>(null)
const logs = ref<any[]>([])
const logContent = ref('')
const logSubmitting = ref(false)

const editForm = reactive({
  detection_result: '',
  process_type: '',
  repair_level: '',
  status: '',
  cost: 0,
  cost_remark: '',
  supplier_contact: '',
  supplier_status: '',
  supplier_result: '',
  exchange_model_id: undefined as number | undefined,
  exchange_imei_id: undefined as number | undefined,
  result: '',
})

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待处理', detecting: '检测中', repairing: '维修中', repaired: '已维修',
    exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
    completed: '已完成', cancelled: '已取消',
  }
  return map[status] || status
}

function supplierLabel(status: string) {
  const map: Record<string, string> = {
    none: '无需', pending: '待联系', in_progress: '处理中', completed: '已处理',
  }
  return map[status] || status
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    created: '创建工单', detected: '检测', repairing: '维修中', repaired: '已维修',
    exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
    completed: '已完成', cancelled: '已取消',
    pending: '待处理', detecting: '检测中',
    supplier_contact: '供应商沟通', supplier_done: '供应商处理完成', remark: '备注',
  }
  return map[action] || action
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const data = await getAfterSaleDetail(id)
    order.value = data
    editForm.detection_result = data.detection_result || ''
    editForm.process_type = data.process_type || ''
    editForm.repair_level = data.repair_level || ''
    editForm.status = data.status || ''
    editForm.cost = data.cost || 0
    editForm.cost_remark = data.cost_remark || ''
    editForm.supplier_contact = data.supplier_contact || ''
    editForm.supplier_status = data.supplier_status || ''
    editForm.supplier_result = data.supplier_result || ''
    editForm.exchange_model_id = data.exchange_model_id || undefined
    editForm.exchange_imei_id = data.exchange_imei_id || undefined
    editForm.result = data.result || ''
    if (data.logs) logs.value = data.logs
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

async function handleUpdate() {
  const id = Number(route.params.id)
  if (!id) return
  saving.value = true
  try {
    const payload: any = {}
    if (editForm.detection_result) payload.detection_result = editForm.detection_result
    if (editForm.process_type) payload.process_type = editForm.process_type
    if (editForm.repair_level) payload.repair_level = editForm.repair_level
    if (editForm.status) payload.status = editForm.status
    if (editForm.cost) payload.cost = editForm.cost
    if (editForm.cost_remark) payload.cost_remark = editForm.cost_remark
    if (editForm.supplier_contact) payload.supplier_contact = editForm.supplier_contact
    if (editForm.supplier_status) payload.supplier_status = editForm.supplier_status
    if (editForm.supplier_result) payload.supplier_result = editForm.supplier_result
    if (editForm.exchange_model_id) payload.exchange_model_id = editForm.exchange_model_id
    if (editForm.exchange_imei_id) payload.exchange_imei_id = editForm.exchange_imei_id
    if (editForm.result) payload.result = editForm.result
    await updateAfterSale(id, payload)
    ElMessage.success('保存成功')
    await loadDetail()
  } catch {
    // handled
  } finally {
    saving.value = false
  }
}

async function handleAddLog() {
  if (!logContent.value.trim()) { ElMessage.warning('请输入日志内容'); return }
  const id = Number(route.params.id)
  logSubmitting.value = true
  try {
    await addAfterSaleLog(id, { content: logContent.value.trim() })
    logContent.value = ''
    ElMessage.success('添加成功')
    await loadDetail()
  } catch {
    // handled
  } finally {
    logSubmitting.value = false
  }
}

async function handleComplete() {
  const id = Number(route.params.id)
  if (!id) return
  completing.value = true
  try {
    await completeAfterSale(id)
    ElMessage.success('工单已完成')
    await loadDetail()
  } catch { /* handled */ }
  finally { completing.value = false }
}

async function handleDelete() {
  const id = Number(route.params.id)
  if (!id) return
  try {
    await ElMessageBox.confirm('确定删除该售后工单？删除后不可恢复。', '确认删除', { type: 'warning' })
    await deleteAfterSale(id)
    ElMessage.success('删除成功')
    router.push('/after-sales/list')
  } catch {
    // cancelled
  }
}

onMounted(() => { loadDetail() })
</script>

<style>
.pbm-root {
  --pbm-bg: #f5f0eb;
  --pbm-surface: #ffffff;
  --pbm-surface-hover: #f0ebe5;
  --pbm-border: #e5ddd3;
  --pbm-text: #2c2418;
  --pbm-text-dim: #8a7f72;
  --pbm-accent: #c9953c;
  --pbm-accent-glow: rgba(201,149,60,0.12);
  --pbm-blue: #3b82f6;
  --pbm-blue-dim: rgba(59,130,246,0.12);
  --pbm-red: #dc3545;
  --pbm-red-dim: rgba(220,53,69,0.12);
  --pbm-radius: 6px;
  --pbm-font: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --pbm-mono: "SF Mono", "JetBrains Mono", "Cascadia Code", monospace;
}
</style>

<style scoped>
.pbm-root {
  height: 100%; display: flex; flex-direction: column;
  color: var(--pbm-text); font-family: var(--pbm-font); background: var(--pbm-bg);
}
.pbm-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; flex-shrink: 0; border-bottom: 1px solid var(--pbm-border);
}
.pbm-header-left { display: flex; align-items: center; gap: 16px; }
.pbm-title { font-size: 20px; font-weight: 600; color: var(--pbm-text); margin: 0; }
.pbm-subtitle { font-size: 12px; color: var(--pbm-text-dim); font-family: var(--pbm-mono); }
.pbm-back-link { font-size: 14px; color: var(--pbm-blue); text-decoration: none; }
.pbm-back-link:hover { text-decoration: underline; }

.pbm-body { flex: 1; overflow-y: auto; padding: 24px; }
.pbm-content { max-width: 1000px; }

.pbm-detail-cards { display: flex; gap: 16px; margin-bottom: 20px; }
.pbm-detail-card {
  flex: 1; padding: 16px; background: var(--pbm-surface);
  border: 1px solid var(--pbm-border); border-radius: var(--pbm-radius);
}
.pbm-detail-card__label { font-size: 11px; color: var(--pbm-text-dim); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 8px; }
.pbm-detail-card__body { font-size: 13px; line-height: 1.8; }
.pbm-detail-card__meta { font-size: 12px; color: var(--pbm-text-dim); margin-top: 4px; }

.pbm-section {
  margin-bottom: 16px; padding: 16px; background: var(--pbm-surface);
  border: 1px solid var(--pbm-border); border-radius: var(--pbm-radius);
}
.pbm-section__label { font-size: 11px; color: var(--pbm-text-dim); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 8px; }
.pbm-section__text { font-size: 14px; white-space: pre-wrap; }
.pbm-section--ops { background: #faf8f5; }

.pbm-status-tag {
  display: inline-block; padding: 3px 10px; border-radius: 4px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.3px;
}
.pbm-status-tag--pending, .pbm-status-tag--detecting, .pbm-status-tag--repairing, .pbm-status-tag--exchanging, .pbm-status-tag--refunding { background: rgba(250,173,20,0.12); color: #b8860b; }
.pbm-status-tag--repaired, .pbm-status-tag--exchanged, .pbm-status-tag--refunded, .pbm-status-tag--completed { background: rgba(46,125,50,0.08); color: #2e7d32; }
.pbm-status-tag--cancelled { background: rgba(0,0,0,0.05); color: var(--pbm-text-dim); }
.pbm-status-tag--ok { background: rgba(46,125,50,0.08); color: #2e7d32; }
.pbm-status-tag--warn { background: rgba(250,173,20,0.12); color: #b8860b; }

.pbm-ops-form { width: 100%; }
.pbm-ops-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 4px; }
.pbm-ops-row .el-form-item { flex: 1; min-width: 130px; margin-bottom: 8px; }
.pbm-ops-item--wide { flex: 2 !important; min-width: 200px !important; }
.pbm-ops-form :deep(.el-form-item__label) { font-size: 11px; color: var(--pbm-text-dim); font-weight: 600; letter-spacing: 0.3px; padding-bottom: 2px; }

.pbm-ops-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }

.pbm-btn-accent {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; background: var(--pbm-accent); color: #fff;
  border: none; border-radius: var(--pbm-radius);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.pbm-btn-accent:hover { background: #dba84a; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(201,149,60,0.3); }
.pbm-btn-accent--sm { padding: 6px 14px; font-size: 12px; }
.pbm-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.pbm-btn-success {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; background: #2e7d32; color: #fff;
  border: none; border-radius: var(--pbm-radius);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.pbm-btn-success:hover { background: #388e3c; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(46,125,50,0.3); }
.pbm-btn-success:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.pbm-log-list { margin-top: 8px; }
.pbm-log-item { padding: 10px 0; border-bottom: 1px solid var(--pbm-border); }
.pbm-log-item:last-child { border-bottom: none; }
.pbm-log-item__head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 13px; }
.pbm-log-badge { font-size: 10px; padding: 1px 6px; border-radius: 3px; background: var(--pbm-blue-dim); color: var(--pbm-blue); font-weight: 600; }
.pbm-log-time { font-size: 12px; color: var(--pbm-text-dim); margin-left: auto; }
.pbm-log-item__body { font-size: 13px; color: #555; }
.pbm-log-empty { color: var(--pbm-text-dim); font-size: 13px; padding: 8px 0; }
.pbm-log-add { display: flex; gap: 8px; margin-top: 12px; }
</style>

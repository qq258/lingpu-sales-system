<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">售后详情</h1>
      <span class="title-line"></span>
      <button class="back-btn ops-btn ops-btn--primary" @click="$router.push('/after-sales')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回
      </button>
      <button class="ops-btn" style="background:none;color:var(--text-tertiary);border:1px solid var(--border);" @click="handleDelete">删除</button>
    </div>

    <div v-if="loading" class="loading-list">
      <div v-for="i in 5" :key="i" class="skeleton-row" :style="{ animationDelay: (i * 0.06) + 's' }"></div>
    </div>
    <template v-else-if="order">
      <!-- 基本信息 -->
      <div class="detail-section glass">
        <div class="detail-header">
          <span class="detail-order-no">{{ order.order_no }}</span>
          <span :class="['detail-status-badge', `detail-status-badge--${order.status}`]">{{ statusLabel(order.status) }}</span>
        </div>
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">IMEI</span><span class="detail-value">{{ order.imei?.imei || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">品牌型号</span><span class="detail-value">{{ order.imei?.model?.brand?.name || '' }} {{ order.imei?.model?.name || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">客户姓名</span><span class="detail-value">{{ order.customer_name || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">客户电话</span><span class="detail-value">{{ order.customer_phone || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">处理方式</span><span class="detail-value">{{ processTypeLabel(order.process_type) }}</span></div>
          <div class="detail-item"><span class="detail-label">处理人</span><span class="detail-value">{{ order.handler?.real_name || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">创建时间</span><span class="detail-value">{{ formatDate(order.created_at) }}</span></div>
          <div class="detail-item" v-if="order.cost"><span class="detail-label">费用</span><span class="detail-value">¥{{ order.cost }}</span></div>
          <div class="detail-item" v-if="order.supplier_status !== 'none'">
            <span class="detail-label">供应商</span>
            <span :class="['detail-supplier-tag', order.supplier_status === 'completed' ? 'detail-supplier-tag--ok' : 'detail-supplier-tag--pending']">{{ supplierLabel(order.supplier_status) }}</span>
          </div>
        </div>
        <div class="detail-desc-block">
          <div class="detail-label">故障描述</div>
          <div class="detail-desc-text">{{ order.fault_description }}</div>
        </div>
        <div v-if="order.detection_result" class="detail-desc-block">
          <div class="detail-label">检测结果</div>
          <div class="detail-desc-text">{{ order.detection_result }}</div>
        </div>
        <div v-if="order.result" class="detail-desc-block">
          <div class="detail-label">最终处理结果</div>
          <div class="detail-desc-text">{{ order.result }}</div>
        </div>
      </div>

      <!-- 处理操作 -->
      <div class="detail-section glass" style="margin-top:16px;">
        <div class="detail-label" style="margin-bottom:16px;font-size:14px;text-transform:none;color:var(--text);">处理操作</div>

        <div class="ops-grid">
          <div class="ops-grid__item">
            <div class="ops-grid__label">检测结果</div>
            <el-select v-model="ops.detection_result" placeholder="选择检测结果" clearable size="large" style="width:100%;">
              <el-option label="确认故障" value="确认故障" />
              <el-option label="无故障" value="无故障" />
              <el-option label="需联系供应商" value="需联系供应商" />
            </el-select>
          </div>

          <div class="ops-grid__item">
            <div class="ops-grid__label">处理方式</div>
            <el-select v-model="ops.process_type" placeholder="选择处理方式" clearable size="large" style="width:100%;">
              <el-option label="维修" value="repair" />
              <el-option label="换货" value="exchange" />
              <el-option label="退款" value="refund" />
            </el-select>
          </div>

          <div class="ops-grid__item" v-if="ops.process_type === 'repair'">
            <div class="ops-grid__label">维修级别</div>
            <el-select v-model="ops.repair_level" placeholder="维修级别" clearable size="large" style="width:100%;">
              <el-option label="当场维修" value="minor" />
              <el-option label="店里维修" value="medium" />
              <el-option label="返厂维修" value="major" />
            </el-select>
          </div>

          <div class="ops-grid__item">
            <div class="ops-grid__label">费用（元）</div>
            <el-input v-model.number="ops.cost" placeholder="0" type="number" size="large" />
          </div>

          <div class="ops-grid__item">
            <div class="ops-grid__label">供应商状态</div>
            <el-select v-model="ops.supplier_status" placeholder="供应商状态" clearable size="large" style="width:100%;">
              <el-option label="无需供应商" value="none" />
              <el-option label="待联系" value="pending" />
              <el-option label="处理中" value="in_progress" />
              <el-option label="已处理" value="completed" />
            </el-select>
          </div>

          <div class="ops-grid__item" v-if="ops.supplier_status && ops.supplier_status !== 'none'">
            <div class="ops-grid__label">供应商联系人</div>
            <el-input v-model="ops.supplier_contact" placeholder="联系人姓名 / 电话" size="large" />
          </div>

          <div class="ops-grid__item">
            <div class="ops-grid__label">变更状态</div>
            <el-select v-model="ops.status" placeholder="变更状态" clearable size="large" style="width:100%;">
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
          </div>
        </div>

        <div class="ops-actions">
          <button class="ops-btn ops-btn--primary" @click="handleUpdate" :disabled="saving">{{ saving ? '保存中...' : '保存更新' }}</button>
          <button v-if="order.status !== 'completed' && order.status !== 'cancelled'" class="ops-btn ops-btn--success" @click="handleComplete" :disabled="completing">{{ completing ? '完成中...' : '完成工单' }}</button>
        </div>
      </div>

      <!-- 操作日志 -->
      <div class="detail-section glass" style="margin-top:16px;">
        <div class="detail-label">操作日志</div>
        <div v-if="logs.length" class="log-list">
          <div v-for="log in logs" :key="log.id" class="log-item">
            <div class="log-header">
              <strong>{{ log.operator?.real_name || '系统' }}</strong>
              <span class="log-badge">{{ actionLabel(log.action) }}</span>
              <span class="log-time">{{ formatDate(log.created_at) }}</span>
            </div>
            <div class="log-body">{{ log.content }}</div>
          </div>
        </div>
        <div v-else class="log-empty">暂无操作记录</div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <el-input v-model="logContent" placeholder="添加日志 / 供应商沟通记录..." style="flex:1;" />
          <el-button type="primary" @click="handleAddLog" :loading="logSubmitting">添加记录</el-button>
        </div>
      </div>
    </template>
    <div v-else class="empty-hint">工单不存在</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
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

const ops = reactive({
  detection_result: '',
  process_type: '',
  repair_level: '',
  status: '',
  cost: 0,
  supplier_contact: '',
  supplier_status: '',
})

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

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待处理', detecting: '检测中', repairing: '维修中', repaired: '已维修',
    exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
    completed: '已完成', cancelled: '已取消',
  }
  return map[status] || status
}

function processTypeLabel(type: string) {
  const map: Record<string, string> = { repair: '维修', exchange: '换货', refund: '退款' }
  return map[type] || '-'
}

function supplierLabel(status: string) {
  const map: Record<string, string> = { none: '无需', pending: '待联系', in_progress: '处理中', completed: '已处理' }
  return map[status] || status
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const data = await getAfterSaleDetail(id)
    order.value = data
    if (data.logs) logs.value = data.logs
    // 回填操作表单
    ops.detection_result = data.detection_result || ''
    ops.process_type = data.process_type || ''
    ops.repair_level = data.repair_level || ''
    ops.status = data.status || ''
    ops.cost = data.cost || 0
    ops.supplier_contact = data.supplier_contact || ''
    ops.supplier_status = data.supplier_status || ''
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
    if (ops.detection_result) payload.detection_result = ops.detection_result
    if (ops.process_type) payload.process_type = ops.process_type
    if (ops.repair_level) payload.repair_level = ops.repair_level
    if (ops.status) payload.status = ops.status
    if (ops.cost) payload.cost = ops.cost
    if (ops.supplier_contact) payload.supplier_contact = ops.supplier_contact
    if (ops.supplier_status) payload.supplier_status = ops.supplier_status
    await updateAfterSale(id, payload)
    ElMessage.success('保存成功')
    await loadDetail()
  } catch { /* handled */ }
  finally { saving.value = false }
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
  } catch { /* handled */ }
  finally { logSubmitting.value = false }
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
    await ElMessageBox.confirm('确定删除该售后工单？', '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    await deleteAfterSale(id)
    ElMessage.success('删除成功')
    router.push('/after-sales')
  } catch {
    // cancelled
  }
}

onMounted(() => { loadDetail() })
</script>

<style scoped>
.back-btn { background: none; border: none; color: var(--primary); font-size: 15px; cursor: pointer; padding: 0; margin-right: 8px; font-family: inherit; }
.back-btn:hover { opacity: 0.7; }

.detail-section { padding: 28px; border-radius: var(--radius); }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.detail-order-no { font-size: 22px; font-weight: 700; color: var(--primary); letter-spacing: -0.3px; }

.detail-status-badge {
  display: inline-block; padding: 4px 14px; border-radius: 20px;
  font-size: 13px; font-weight: 600; letter-spacing: 0.3px;
}
.detail-status-badge--pending, .detail-status-badge--detecting, .detail-status-badge--repairing, .detail-status-badge--exchanging, .detail-status-badge--refunding { background: rgba(250,173,20,0.15); color: #c4941a; }
.detail-status-badge--repaired, .detail-status-badge--exchanged, .detail-status-badge--refunded, .detail-status-badge--completed { background: rgba(46,125,50,0.1); color: #2e7d32; }
.detail-status-badge--cancelled { background: rgba(0,0,0,0.04); color: var(--text-tertiary); }

.detail-grid { display: grid; grid-template-columns: auto auto; gap: 6px 24px; max-width: 500px; }
.detail-item { font-size: 14px; padding: 4px 0; display: flex; align-items: center; gap: 12px; }
.detail-label { font-size: 12px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500; flex-shrink: 0; min-width: 60px; }
.detail-value { color: var(--text); font-weight: 500; margin-left: auto; }

.detail-supplier-tag {
  display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
}
.detail-supplier-tag--ok { background: rgba(46,125,50,0.1); color: #2e7d32; }
.detail-supplier-tag--pending { background: rgba(250,173,20,0.15); color: #c4941a; }

.detail-desc-block { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border); }
.detail-desc-text { font-size: 14px; color: var(--text); line-height: 1.7; white-space: pre-wrap; margin-top: 6px; }

.log-list { margin-top: 12px; }
.log-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
.log-item:last-child { border-bottom: none; }
.log-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; font-size: 14px; }
.log-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(37,99,235,0.08); color: var(--primary); font-weight: 600; }
.log-time { font-size: 12px; color: var(--text-tertiary); margin-left: auto; }
.log-body { font-size: 14px; color: var(--text-secondary); line-height: 1.5; }
.log-empty { color: var(--text-tertiary); font-size: 14px; padding: 16px 0; text-align: center; }

.ops-btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 42px; padding: 0 22px; border: none; border-radius: var(--radius-sm);
  font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: var(--transition); white-space: nowrap;
}
.ops-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ops-btn--primary { background: var(--primary); color: #fff; }
.ops-btn--primary:hover:not(:disabled) { filter: brightness(0.92); box-shadow: 0 4px 12px var(--primary-glow); }
.ops-btn--success { background: var(--success); color: #fff; }
.ops-btn--success:hover:not(:disabled) { filter: brightness(0.92); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }

.ops-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 16px; }
.ops-grid__label { font-size: 12px; color: var(--text-tertiary); margin-bottom: 4px; font-weight: 500; }
.ops-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
</style>

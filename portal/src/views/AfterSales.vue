<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">售后工单</h1>
      <span class="title-line"></span>
    </div>

    <div class="search-section">
      <div class="search-row">
        <div class="search-input-wrap">
          <input v-model="keyword" class="search-input" placeholder="搜索工单号 / 客户姓名..." @keyup.enter="doSearch" />
        </div>
        <button class="search-btn" @click="doSearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          搜索
        </button>
        <button class="glass filter-btn" style="color:var(--primary);font-weight:600;white-space:nowrap;height:52px;display:inline-flex;align-items:center;padding:0 24px;border-radius:var(--radius-sm);font-size:16px;" @click="showCreateDialog = true">+ 新建工单</button>
      </div>
      <div class="filter-row">
        <el-select v-model="searchStatus" placeholder="筛选状态" clearable size="large" style="width:140px;">
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
        <button class="glass filter-btn" @click="doSearch">查询</button>
        <span class="result-count">共 {{ total }} 条记录</span>
      </div>
    </div>

    <!-- 新建工单弹窗 -->
    <el-dialog v-model="showCreateDialog" title="新建售后工单" width="500px" :close-on-click-modal="false" class="as-dialog">
      <el-form label-position="top">
        <el-form-item label="手机 IMEI" required>
          <el-input v-model="createForm.imei" placeholder="输入 IMEI" @keyup.enter="searchImei">
            <template #append>
              <el-button @click="searchImei">搜索</el-button>
            </template>
          </el-input>
          <div v-if="createForm.imeiMatch" style="margin-top:8px;padding:8px 12px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;font-size:13px;line-height:1.7;">
            <div>✅ <strong>{{ createForm.imeiMatch.brandName }} {{ createForm.imeiMatch.modelName }}</strong></div>
            <div style="color:#666;">{{ createForm.imeiMatch.color }} / {{ createForm.imeiMatch.storage }}</div>
            <div v-if="createForm.imeiMatch.saleRecord" style="color:#666;">
              售出时间：{{ formatDate(createForm.imeiMatch.saleRecord.created_at) }}
            </div>
            <div v-else style="color:#666;">状态：{{ createForm.imeiMatch.status === 'in_stock' ? '在库' : createForm.imeiMatch.status }}</div>
          </div>
          <div v-if="createForm.imeiError" style="margin-top:6px;padding:6px 10px;background:#fff2f0;border:1px solid #ffccc7;border-radius:6px;font-size:13px;color:#ff4d4f;">
            {{ createForm.imeiError }}
          </div>
        </el-form-item>
        <el-form-item label="客户姓名" required>
          <el-input v-model="createForm.customer_name" placeholder="客户姓名" />
        </el-form-item>
        <el-form-item label="客户电话">
          <el-input v-model="createForm.customer_phone" placeholder="客户电话" />
        </el-form-item>
        <el-form-item label="故障描述" required>
          <el-input v-model="createForm.fault_description" type="textarea" :rows="3" placeholder="请描述故障现象或售后原因" />
        </el-form-item>
        <el-form-item label="检测结果">
          <el-select v-model="createForm.detection_result" placeholder="检测结果" clearable style="width:100%;">
            <el-option label="确认故障" value="确认故障" />
            <el-option label="无故障" value="无故障" />
            <el-option label="需联系供应商" value="需联系供应商" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理方式">
          <el-select v-model="createForm.process_type" placeholder="处理方式" clearable style="width:100%;">
            <el-option label="维修" value="repair" />
            <el-option label="换货" value="exchange" />
            <el-option label="退款" value="refund" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="createForm.process_type === 'repair'" label="维修级别">
          <el-select v-model="createForm.repair_level" placeholder="维修级别" clearable style="width:100%;">
            <el-option label="当场维修" value="minor" />
            <el-option label="店里维修" value="medium" />
            <el-option label="返厂维修" value="major" />
          </el-select>
        </el-form-item>
        <el-form-item label="费用">
          <el-input v-model.number="createForm.cost" placeholder="费用" type="number" />
        </el-form-item>
        <el-form-item label="供应商联系人">
          <el-input v-model="createForm.supplier_contact" placeholder="供应商联系人" />
        </el-form-item>
        <el-form-item label="供应商状态">
          <el-select v-model="createForm.supplier_status" placeholder="供应商状态" clearable style="width:100%;">
            <el-option label="无需供应商" value="none" />
            <el-option label="待联系" value="pending" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已处理" value="completed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="createLoading">创建工单</el-button>
      </template>
    </el-dialog>

    <div v-if="loading" class="loading-list">
      <div v-for="i in 5" :key="i" class="skeleton-row" :style="{ animationDelay: (i * 0.06) + 's' }"></div>
    </div>
    <div v-else-if="list.length" class="record-list">
      <div v-for="item in list" :key="item.id" class="after-sale-card glass" @click="$router.push(`/after-sales/${item.id}`)">
        <div class="card-header">
          <span class="card-order-no">{{ item.order_no }}</span>
          <span :class="['card-status', `card-status--${item.status}`]">{{ statusLabel(item.status) }}</span>
        </div>
        <div class="card-body">
          <div class="card-row"><span class="card-label">客户</span><span class="card-value">{{ item.customer_name || '-' }}</span></div>
          <div class="card-row"><span class="card-label">处理方式</span><span class="card-value">{{ processTypeLabel(item.process_type) }}</span></div>
          <div class="card-row"><span class="card-label">故障</span><span class="card-value text-ellipsis">{{ item.fault_description }}</span></div>
        </div>
        <div class="card-footer">
          <span>{{ formatDate(item.created_at) }}</span>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="card-del" @click.stop="handleDelete(item)">删除</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-hint">暂无售后工单</div>

    <div v-if="total > pageSize" class="pagination-row">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="prev, pager, next" size="large" @change="loadData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAfterSalesList, createAfterSale, deleteAfterSale } from '@/api/after-sales'
import request from '@/api/request'

const keyword = ref('')
const searchStatus = ref<string | undefined>()
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

// 新建弹窗
const showCreateDialog = ref(false)
const createLoading = ref(false)
const createForm = reactive({
  imei: '',
  customer_name: '',
  customer_phone: '',
  fault_description: '',
  detection_result: '',
  process_type: '',
  repair_level: '',
  cost: 0,
  supplier_contact: '',
  supplier_status: 'none',
  imeiMatch: null as any,
  imeiError: '',
})

function resetCreateForm() {
  createForm.imei = ''
  createForm.customer_name = ''
  createForm.customer_phone = ''
  createForm.fault_description = ''
  createForm.detection_result = ''
  createForm.process_type = ''
  createForm.repair_level = ''
  createForm.cost = 0
  createForm.supplier_contact = ''
  createForm.supplier_status = 'none'
  createForm.imeiMatch = null
  createForm.imeiError = ''
}

async function searchImei() {
  createForm.imeiError = ''
  createForm.imeiMatch = null
  if (!createForm.imei.trim()) { ElMessage.warning('请输入 IMEI'); return }
  try {
    const res: any = await request.get('/inventory/imei-query', { params: { imei: createForm.imei.trim() } })
    createForm.imeiMatch = res.data
    // 查到后自动填充客户信息
    if (res.data?.saleRecord) {
      const sr = res.data.saleRecord
      if (sr.customer_name && sr.customer_name !== '-') createForm.customer_name = sr.customer_name
      if (sr.customer_phone) createForm.customer_phone = sr.customer_phone
    }
  } catch {
    createForm.imeiError = '未找到该手机，请检查 IMEI 是否正确'
  }
}

async function handleCreate() {
  if (!createForm.imeiMatch) { ElMessage.warning('请先搜索并确认手机'); return }
  if (!createForm.customer_name.trim()) { ElMessage.warning('请输入客户姓名'); return }
  if (!createForm.fault_description.trim()) { ElMessage.warning('请输入故障描述'); return }
  createLoading.value = true
  try {
    await createAfterSale({
      imei_id: createForm.imeiMatch.id,
      customer_name: createForm.customer_name,
      customer_phone: createForm.customer_phone,
      fault_description: createForm.fault_description,
      detection_result: createForm.detection_result || undefined,
      process_type: createForm.process_type || undefined,
      repair_level: createForm.repair_level || undefined,
      cost: createForm.cost || undefined,
      supplier_contact: createForm.supplier_contact || undefined,
      supplier_status: createForm.supplier_status !== 'none' ? createForm.supplier_status : undefined,
    })
    ElMessage.success('工单创建成功')
    showCreateDialog.value = false
    resetCreateForm()
    loadData()
  } catch { /* handled */ }
  finally { createLoading.value = false }
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

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function doSearch() { page.value = 1; loadData() }

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (searchStatus.value) params.status = searchStatus.value
    const result = await getAfterSalesList(params)
    list.value = result.list
    total.value = result.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })

async function handleDelete(item: any) {
  try {
    await ElMessageBox.confirm(`确定删除工单 ${item.order_no}？`, '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    await deleteAfterSale(item.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // cancelled
  }
}
</script>

<style scoped>
.search-section { margin-bottom: 24px; }
.search-row { display: flex; gap: 12px; margin-bottom: 16px; }
.search-input-wrap { flex: 1; }
.search-input { width: 100%; height: 52px; padding: 0 20px; font-size: 18px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.search-input::placeholder { color: var(--text-tertiary); font-size: 17px; }
.search-btn { display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 28px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 17px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.search-btn:hover { background: var(--primary-dark); }
.filter-row { display: flex; align-items: center; gap: 10px; }
.filter-btn { display: inline-flex; align-items: center; height: 42px; padding: 0 20px; border-radius: var(--radius-sm); font-size: 15px; cursor: pointer; font-family: inherit; color: var(--text-secondary); transition: var(--transition); }
.filter-btn:hover { border-color: var(--primary); color: var(--primary); }
.result-count { font-size: 14px; color: var(--text-tertiary); margin-left: auto; }
.record-list { display: flex; flex-direction: column; gap: 14px; }
.loading-list { display: flex; flex-direction: column; gap: 14px; }
.skeleton-row { height: 110px; border-radius: var(--radius); background: linear-gradient(90deg, #E2E8F0 25%, #CBD5E1 50%, #E2E8F0 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.pagination-row { display: flex; justify-content: center; margin-top: 28px; }

.after-sale-card { padding: 18px; border-radius: var(--radius); cursor: pointer; transition: var(--transition); margin-bottom: 12px; }
.after-sale-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.card-order-no { font-weight: 700; font-size: 15px; color: var(--primary); letter-spacing: -0.2px; }

.card-status {
  display: inline-block; padding: 2px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.2px;
}
.card-status--pending, .card-status--detecting, .card-status--repairing, .card-status--exchanging, .card-status--refunding { background: rgba(250,173,20,0.15); color: #c4941a; }
.card-status--repaired, .card-status--exchanged, .card-status--refunded, .card-status--completed { background: rgba(46,125,50,0.1); color: #2e7d32; }
.card-status--cancelled { background: rgba(0,0,0,0.04); color: var(--text-tertiary); }

.card-body { font-size: 14px; line-height: 2.1; }
.card-row { display: flex; }
.card-label { width: 60px; color: var(--text-tertiary); flex-shrink: 0; font-size: 13px; }
.card-value { color: var(--text); }
.text-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 13px; color: var(--text-tertiary); }
.card-del { background:none;border:1px solid var(--border);color:var(--text-tertiary);font-size:13px;cursor:pointer;padding:6px 14px;border-radius:var(--radius-sm);font-family:inherit;transition:var(--transition); }
.card-del:hover { color:#ef4444;border-color:#ef4444;background:rgba(239,68,68,0.06); }

:deep(.el-date-editor) { --el-component-size: 42px; }
:deep(.el-date-editor .el-input__inner) { font-size: 14px; }
</style>

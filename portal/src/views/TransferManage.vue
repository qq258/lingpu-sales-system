<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">调货管理</h1>
      <span class="title-line"></span>
      <button class="tf-btn-accent" @click="openCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        发起调货
      </button>
    </div>

    <div class="glass tf-card">
      <el-table :data="list" v-loading="loading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
        <el-table-column prop="transfer_no" label="调货单号" min-width="150">
          <template #default="{ row }"><span class="tf-no">{{ row.transfer_no }}</span></template>
        </el-table-column>
        <el-table-column label="调出门店" width="120">
          <template #default="{ row }">{{ row.from_store?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="调入门店" width="120">
          <template #default="{ row }">{{ row.to_store?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <span class="tf-name">{{ row.model?.name }}</span>
            <span class="tf-muted">{{ row.model?.color }} / {{ row.model?.memory }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="70" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="['tf-badge', `tf-badge--${row.status}`]">{{ statusLabel(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申请人" width="100">
          <template #default="{ row }">{{ row.applicant?.real_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <div class="tf-actions">
              <button v-if="row.status === 'pending'" class="tf-mini" @click="handleOutbound(row)">出库</button>
              <button v-if="row.status === 'outbound'" class="tf-mini" @click="handleInbound(row)">入库</button>
              <button v-if="row.status === 'pending'" class="tf-mini tf-mini--danger" @click="handleCancel(row)">取消</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && !list.length" class="empty-hint">暂无调货记录</div>
    </div>

    <div v-if="total > pageSize" class="pagination-row">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next" size="large" @change="load" />
    </div>

    <!-- 发起调货 -->
    <el-dialog v-model="createVisible" title="发起调货" width="560px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="调入门店" required>
          <el-select v-model="toStoreId" placeholder="选择目标门店" filterable size="large" style="width:100%;">
            <el-option v-for="s in targetStores" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="添加商品">
          <div class="tf-add-row">
            <el-select v-model="brandId" placeholder="品牌" filterable size="default" style="width:130px;" @change="onBrandChange">
              <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
            </el-select>
            <el-select v-model="modelId" placeholder="型号" filterable size="default" style="width:200px;" :disabled="!brandId">
              <el-option v-for="m in models" :key="m.id" :label="`${m.name} ${m.color||''} ${m.memory||''}`.trim()" :value="m.id" />
            </el-select>
            <el-input-number v-model="qty" :min="1" :max="999" size="default" controls-position="right" style="width:110px;" />
            <button class="tf-mini" :disabled="!modelId" @click="addItem">添加</button>
          </div>
          <div v-if="items.length" class="tf-item-tags">
            <span v-for="(it, i) in items" :key="i" class="tf-tag">
              {{ it.brandName }} {{ it.modelName }} × {{ it.quantity }}
              <b class="tf-tag-del" @click="items.splice(i, 1)">×</b>
            </span>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="remark" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" :disabled="!toStoreId || !items.length" @click="handleCreate">提交调货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getStores } from '@/api/store'
import { getBrands, getModels } from '@/api/product'
import { getTransfers, createTransfer, outboundTransfer, inboundTransfer, cancelTransfer } from '@/api/transfer'

const userStore = useUserStore()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const stores = ref<any[]>([])
const targetStores = computed(() => stores.value.filter((s) => s.id !== userStore.effectiveStoreId))

const createVisible = ref(false)
const creating = ref(false)
const toStoreId = ref<number | null>(null)
const brandId = ref<number | null>(null)
const modelId = ref<number | null>(null)
const qty = ref(1)
const remark = ref('')
const items = ref<Array<{ modelId: number; brandName: string; modelName: string; quantity: number }>>([])
const brands = ref<any[]>([])
const models = ref<any[]>([])

const statusMap: Record<string, string> = { pending: '待出库', outbound: '待入库', completed: '已完成', cancelled: '已取消' }

function statusLabel(s: string) {
  return statusMap[s] || s
}

async function load() {
  loading.value = true
  try {
    const result = await getTransfers({ page: page.value, pageSize: pageSize.value })
    list.value = result.list || []
    total.value = result.total || 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  createVisible.value = true
  toStoreId.value = null
  brandId.value = null
  modelId.value = null
  qty.value = 1
  remark.value = ''
  items.value = []
  try { stores.value = await getStores() } catch { stores.value = [] }
  try { brands.value = await getBrands() } catch { brands.value = [] }
}

async function onBrandChange() {
  modelId.value = null
  if (!brandId.value) { models.value = []; return }
  try { models.value = await getModels(brandId.value) } catch { models.value = [] }
}

function addItem() {
  if (!modelId.value) return
  const m = models.value.find((x: any) => x.id === modelId.value)
  if (!m) return
  const brand = brands.value.find((b: any) => b.id === brandId.value)
  const existing = items.value.find((i) => i.modelId === modelId.value)
  if (existing) existing.quantity += qty.value
  else items.value.push({ modelId: modelId.value, brandName: brand?.name || '', modelName: `${m.name} ${m.color || ''} ${m.memory || ''}`.trim(), quantity: qty.value })
  qty.value = 1
}

async function handleCreate() {
  if (!toStoreId.value) {
    ElMessage.warning('请选择调入门店')
    return
  }
  creating.value = true
  try {
    await createTransfer({ toStoreId: toStoreId.value, items: items.value.map((i) => ({ modelId: i.modelId, quantity: i.quantity })), remark: remark.value || undefined })
    ElMessage.success('调货申请已提交')
    createVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '提交失败')
  } finally {
    creating.value = false
  }
}

async function handleOutbound(row: any) {
  try {
    await ElMessageBox.confirm(`确认「${row.transfer_no}」出库？`, '出库确认', { confirmButtonText: '确认出库', cancelButtonText: '取消', type: 'warning' })
    await outboundTransfer(row.id)
    ElMessage.success('出库成功')
    await load()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}

async function handleInbound(row: any) {
  try {
    await ElMessageBox.confirm(`确认「${row.transfer_no}」入库？`, '入库确认', { confirmButtonText: '确认入库', cancelButtonText: '取消', type: 'warning' })
    await inboundTransfer(row.id)
    ElMessage.success('入库成功')
    await load()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}

async function handleCancel(row: any) {
  try {
    await ElMessageBox.confirm(`确定取消调货单「${row.transfer_no}」？`, '取消确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await cancelTransfer(row.id)
    ElMessage.success('已取消')
    await load()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  }
}

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}

onMounted(load)
</script>

<style scoped>
.tf-btn-accent { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.tf-btn-accent:hover { background: var(--primary-dark); }
.tf-card { border-radius: var(--radius); padding: 8px; }
.tf-no { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 13px; color: var(--primary); }
.tf-name { font-weight: 500; color: var(--text); }
.tf-muted { font-size: 12px; color: var(--text-tertiary); }
.tf-badge { font-size: 12px; padding: 2px 10px; border-radius: 6px; background: var(--border); color: var(--text-tertiary); }
.tf-badge--completed { background: var(--success-light); color: #16a34a; }
.tf-badge--outbound { background: var(--warning-light); color: #b45309; }
.tf-badge--cancelled { background: var(--danger-light); color: var(--danger); }
.tf-actions { display: flex; gap: 6px; justify-content: center; }
.tf-mini { height: 26px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text-secondary); font-size: 12px; cursor: pointer; font-family: inherit; transition: var(--transition); }
.tf-mini:hover { border-color: var(--primary); color: var(--primary); }
.tf-mini--danger:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-light); }
.pagination-row { display: flex; justify-content: center; margin-top: 24px; }
.tf-add-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tf-item-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.tf-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--primary-light); color: var(--primary); border-radius: 6px; font-size: 13px; }
.tf-tag-del { cursor: pointer; font-weight: 700; color: var(--primary); }
</style>

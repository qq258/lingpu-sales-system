<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">库存盘点</h1>
      <span class="title-line"></span>
    </div>

    <div class="glass ck-tabs">
      <el-tabs v-model="activeTab" class="ck-tabs-inner">
        <!-- 发起盘点 -->
        <el-tab-pane label="发起盘点" name="create">
          <div class="ck-toolbar">
            <button class="ck-btn-plain" @click="loadInventory">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              加载当前库存
            </button>
            <el-input v-model="remark" placeholder="盘点备注（可选）" style="width:240px;" />
            <span class="ck-count">共 {{ checkRows.length }} 项</span>
          </div>

          <div class="glass ck-card">
            <el-table :data="checkRows" v-loading="invLoading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
              <el-table-column type="index" label="#" width="52" align="center" />
              <el-table-column label="商品" min-width="220">
                <template #default="{ row }"><span class="ck-name">{{ row.brandName }} {{ row.modelName }}</span> <span class="ck-muted">{{ row.color }} / {{ row.storage }}</span></template>
              </el-table-column>
              <el-table-column label="账面数量" width="100" align="center">
                <template #default="{ row }">{{ row.expected_qty }}</template>
              </el-table-column>
              <el-table-column label="实盘数量" width="160">
                <template #default="{ row }">
                  <el-input-number v-model="row.actual_qty" :min="0" :max="9999" size="small" controls-position="right" style="width:130px;" />
                </template>
              </el-table-column>
              <el-table-column label="差异" width="90" align="center">
                <template #default="{ row }">
                  <span :style="{ color: (row.actual_qty - row.expected_qty) !== 0 ? '#f59e0b' : 'inherit', fontWeight: 600 }">
                    {{ row.actual_qty - row.expected_qty > 0 ? '+' : '' }}{{ row.actual_qty - row.expected_qty }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="!invLoading && !checkRows.length" class="empty-hint">点击「加载当前库存」开始盘点</div>
          </div>

          <button v-if="checkRows.length" class="ck-submit" :disabled="submitting" @click="handleCreateCheck">
            提交盘点单
          </button>
        </el-tab-pane>

        <!-- 盘点记录 -->
        <el-tab-pane label="盘点记录" name="records">
          <div class="glass ck-card">
            <el-table :data="checks" v-loading="checksLoading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
              <el-table-column prop="check_no" label="盘点单号" min-width="160">
                <template #default="{ row }"><span class="ck-no">{{ row.check_no }}</span></template>
              </el-table-column>
              <el-table-column label="门店" width="120">
                <template #default="{ row }">{{ row.store?.name || '-' }}</template>
              </el-table-column>
              <el-table-column label="盘点人" width="110">
                <template #default="{ row }">{{ row.checker?.real_name || '-' }}</template>
              </el-table-column>
              <el-table-column label="盘点项" width="90" align="center">
                <template #default="{ row }">{{ row._count?.items || 0 }}</template>
              </el-table-column>
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <span :class="['ck-badge', row.status === 'completed' ? 'is-on' : '']">{{ row.status === 'completed' ? '已审核' : '待审核' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="150" align="center">
                <template #default="{ row }">
                  <div class="ck-actions">
                    <button v-if="row.status === 'pending'" class="ck-mini" @click="handleAudit(row)">审核</button>
                    <button v-if="row.status === 'pending'" class="ck-mini ck-mini--danger" @click="handleDelete(row)">删除</button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="!checksLoading && !checks.length" class="empty-hint">暂无盘点记录</div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBrandInventory } from '@/api/inventory'
import {
  getInventoryChecks,
  createInventoryCheck,
  auditInventoryCheck,
  deleteInventoryCheck,
} from '@/api/inventory'

const activeTab = ref('create')
const remark = ref('')
const checkRows = ref<Array<{ model_id: number; brandName: string; modelName: string; color: string; storage: string; expected_qty: number; actual_qty: number }>>([])
const invLoading = ref(false)
const submitting = ref(false)
const checks = ref<any[]>([])
const checksLoading = ref(false)

async function loadInventory() {
  invLoading.value = true
  try {
    const result = await getBrandInventory()
    checkRows.value = (result.list || []).map((i: any) => ({
      model_id: i.modelId,
      brandName: i.brandName,
      modelName: i.modelName,
      color: i.color || '',
      storage: i.storage || '',
      expected_qty: i.quantity || 0,
      actual_qty: i.quantity || 0,
    }))
  } catch {
    checkRows.value = []
  } finally {
    invLoading.value = false
  }
}

async function handleCreateCheck() {
  if (!checkRows.value.length) return
  submitting.value = true
  try {
    await createInventoryCheck(
      checkRows.value.map((r) => ({ model_id: r.model_id, expected_qty: r.expected_qty, actual_qty: r.actual_qty })),
      remark.value || undefined,
    )
    ElMessage.success('盘点单已提交')
    checkRows.value = []
    remark.value = ''
    await loadChecks()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

async function loadChecks() {
  checksLoading.value = true
  try {
    const result = await getInventoryChecks({ pageSize: 50 })
    checks.value = result.list || []
  } catch {
    checks.value = []
  } finally {
    checksLoading.value = false
  }
}

async function handleAudit(row: any) {
  try {
    await ElMessageBox.confirm(`确定审核通过盘点单「${row.check_no}」？审核后将按差异调整库存。`, '审核确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    })
    await auditInventoryCheck(row.id)
    ElMessage.success('审核完成')
    await loadChecks()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '审核失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除盘点单「${row.check_no}」？`, '删除确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    })
    await deleteInventoryCheck(row.id)
    ElMessage.success('删除成功')
    await loadChecks()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}

onMounted(() => {
  loadChecks()
})
</script>

<style scoped>
.ck-tabs { border-radius: var(--radius); padding: 8px 20px 20px; }
.ck-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.ck-btn-plain { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: var(--transition); }
.ck-btn-plain:hover { border-color: var(--primary); color: var(--primary); }
.ck-count { font-size: 13px; color: var(--text-tertiary); }
.ck-card { border-radius: var(--radius-sm); padding: 8px; }
.ck-name { font-weight: 500; color: var(--text); }
.ck-muted { font-size: 12px; color: var(--text-tertiary); }
.ck-no { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 13px; color: var(--primary); }
.ck-badge { font-size: 12px; padding: 2px 10px; border-radius: 6px; background: var(--border); color: var(--text-tertiary); }
.ck-badge.is-on { background: var(--success-light); color: #16a34a; }
.ck-actions { display: flex; gap: 6px; justify-content: center; }
.ck-mini { height: 26px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text-secondary); font-size: 12px; cursor: pointer; font-family: inherit; transition: var(--transition); }
.ck-mini:hover { border-color: var(--primary); color: var(--primary); }
.ck-mini--danger:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-light); }
.ck-submit { display: block; width: 100%; height: 50px; border: none; border-radius: var(--radius); background: var(--success); color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 14px; transition: var(--transition); }
.ck-submit:hover { filter: brightness(0.94); }
</style>

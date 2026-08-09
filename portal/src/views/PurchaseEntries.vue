<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">入库记录</h1>
      <span class="title-line"></span>
      <button class="pe-btn-plain" @click="load">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        刷新
      </button>
    </div>

    <div class="glass pe-card">
      <el-table :data="list" v-loading="loading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
        <el-table-column prop="entry_no" label="入库单号" min-width="160">
          <template #default="{ row }"><span class="pe-no">{{ row.entry_no }}</span></template>
        </el-table-column>
        <el-table-column label="门店" width="120">
          <template #default="{ row }">{{ row.store?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="供应商" width="140">
          <template #default="{ row }">{{ row.supplier?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="数量" width="80" align="center">
          <template #default="{ row }">{{ row._count?.items || 0 }}</template>
        </el-table-column>
        <el-table-column label="总金额" width="110" align="right">
          <template #default="{ row }"><span class="pe-price">¥{{ (row.total_amount || 0).toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span :class="['pe-badge', row.status === 'confirmed' ? 'is-on' : '']">{{ row.status === 'confirmed' ? '已完成' : '待确认' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="110">
          <template #default="{ row }">{{ row.operator?.real_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center">
          <template #default="{ row }">
            <div class="pe-actions">
              <button class="pe-mini" @click="openDetail(row.id)">详情</button>
              <button class="pe-mini pe-mini--danger" @click="handleDelete(row)">删除</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && !list.length" class="empty-hint">暂无入库记录</div>
    </div>

    <div v-if="total > pageSize" class="pagination-row">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next" size="large" @change="load" />
    </div>

    <el-dialog v-model="detailVisible" title="入库单详情" width="640px">
      <div v-if="detail" class="pe-detail">
        <div class="pe-detail-meta">
          <span>单号：{{ detail.entry_no }}</span>
          <span>状态：{{ detail.status === 'confirmed' ? '已完成' : '待确认' }}</span>
          <span>供应商：{{ detail.supplier?.name || '-' }}</span>
          <span>操作人：{{ detail.operator?.real_name || '-' }}</span>
        </div>
        <el-table :data="detail.items || []" size="small" stripe>
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">{{ row.model?.brand?.name || '' }} {{ row.model?.name || '' }} {{ row.model?.color || '' }} {{ row.model?.memory || '' }}</template>
          </el-table-column>
          <el-table-column prop="imei" label="IMEI1" min-width="150" />
          <el-table-column prop="imei2" label="IMEI2" width="140" />
          <el-table-column prop="sn_code" label="S/N" width="140" />
        </el-table>
      </div>
      <template #footer><el-button @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPurchaseEntries, getPurchaseEntry, deletePurchaseEntry } from '@/api/purchase'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const detailVisible = ref(false)
const detail = ref<any>(null)

async function load() {
  loading.value = true
  try {
    const result = await getPurchaseEntries({ page: page.value, pageSize: pageSize.value })
    list.value = result.list || []
    total.value = result.total || 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function openDetail(id: number) {
  try {
    detail.value = await getPurchaseEntry(id)
    detailVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '加载失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除入库单「${row.entry_no}」？`, '删除确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    })
    await deletePurchaseEntry(row.id)
    ElMessage.success('删除成功')
    await load()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}

onMounted(load)
</script>

<style scoped>
.pe-btn-plain { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: var(--transition); }
.pe-btn-plain:hover { border-color: var(--primary); color: var(--primary); }
.pe-card { border-radius: var(--radius); padding: 8px; }
.pe-no { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 13px; color: var(--primary); }
.pe-price { font-family: monospace; font-weight: 600; }
.pe-badge { font-size: 12px; padding: 2px 10px; border-radius: 6px; background: var(--border); color: var(--text-tertiary); }
.pe-badge.is-on { background: var(--success-light); color: #16a34a; }
.pe-actions { display: flex; gap: 6px; justify-content: center; }
.pe-mini { height: 26px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text-secondary); font-size: 12px; cursor: pointer; font-family: inherit; transition: var(--transition); }
.pe-mini:hover { border-color: var(--primary); color: var(--primary); }
.pe-mini--danger:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-light); }
.pagination-row { display: flex; justify-content: center; margin-top: 24px; }
.pe-detail-meta { display: flex; gap: 20px; flex-wrap: wrap; font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
</style>

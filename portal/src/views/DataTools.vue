<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">数据工具</h1>
      <span class="title-line"></span>
    </div>

    <div class="dt-tabs glass">
      <el-tabs v-model="activeTab" class="dt-tabs-inner">
        <!-- 数据备份 -->
        <el-tab-pane label="数据备份" name="backup">
          <div class="dt-tab-content">
            <div class="dt-actions">
              <button class="dt-btn-accent" :loading="creating" @click="handleCreateBackup">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                创建备份节点
              </button>
              <button class="dt-btn-plain" @click="downloadBackup()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                下载整库备份
              </button>
              <span class="dt-tip">备份节点即数据库的完整快照，可随时下载或快速还原。</span>
            </div>

            <div class="dt-table-wrap">
              <el-table :data="backupNodes" v-loading="backupLoading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
                <el-table-column prop="name" label="备份文件" min-width="280">
                  <template #default="{ row }">
                    <span class="dt-file-name">{{ row.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="大小" width="110" align="right">
                  <template #default="{ row }">
                    {{ formatSize(row.size) }}
                  </template>
                </el-table-column>
                <el-table-column label="创建时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center">
                  <template #default="{ row }">
                    <div class="dt-row-actions">
                      <button class="dt-btn-mini" @click="downloadBackupNode(row.name)">下载</button>
                      <button class="dt-btn-mini dt-btn-mini--warn" @click="handleRestore(row)">还原</button>
                      <button class="dt-btn-mini dt-btn-mini--danger" @click="handleDeleteNode(row)">删除</button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!backupLoading && !backupNodes.length" class="empty-hint">暂无备份节点</div>
            </div>

            <div class="dt-upload-card">
              <div class="dt-upload-title">上传备份文件还原</div>
              <div
                class="dt-dropzone"
                :class="{ 'has-file': !!restoreFile }"
                @dragover.prevent="dropOver = true"
                @dragleave.prevent="dropOver = false"
                @drop.prevent="onDropRestore"
              >
                <input ref="restoreFileRef" type="file" accept=".sqlite,.db" @change="onPickRestore" hidden />
                <div v-if="!restoreFile" class="dt-dropzone-empty" @click="restoreFileRef?.click()">
                  <span>点击选择或拖拽 .sqlite 备份文件</span>
                </div>
                <div v-else class="dt-dropzone-filled">
                  <span class="dt-file-name">{{ restoreFile.name }}</span>
                  <button class="dt-link-btn" @click="resetRestoreFile">重选</button>
                </div>
              </div>
              <button class="dt-btn-accent dt-btn-accent--sm" :disabled="!restoreFile" @click="handleRestoreFile">开始还原</button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 按表导出 -->
        <el-tab-pane label="按表导出" name="export">
          <div class="dt-tab-content">
            <div class="dt-table-wrap">
              <el-table :data="tables" v-loading="tableLoading" stripe size="default" element-loading-background="rgba(255,255,255,0.6)">
                <el-table-column type="index" label="#" width="52" align="center" />
                <el-table-column prop="label" label="数据表" min-width="200" />
                <el-table-column prop="count" label="记录数" width="120" align="center" />
                <el-table-column label="操作" width="140" align="center">
                  <template #default="{ row }">
                    <button class="dt-btn-mini" @click="exportTable(row.key, `${row.label}_${dateStr()}.xlsx`)">导出 Excel</button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- 按表导入 -->
        <el-tab-pane label="按表导入" name="import">
          <div class="dt-tab-content">
            <div class="dt-import-row">
              <el-select v-model="importTableKey" placeholder="请选择目标数据表" size="large" style="width:220px;">
                <el-option v-for="t in importableTables" :key="t.key" :label="t.label" :value="t.key" />
              </el-select>
            </div>
            <div
              class="dt-dropzone"
              :class="{ 'has-file': !!importFile }"
              @dragover.prevent="dropOver = true"
              @dragleave.prevent="dropOver = false"
              @drop.prevent="onDropImport"
            >
              <input ref="importFileRef" type="file" accept=".xlsx,.xls" @change="onPickImport" hidden />
              <div v-if="!importFile" class="dt-dropzone-empty" @click="importFileRef?.click()">
                <span>点击选择或拖拽 .xlsx / .xls 文件</span>
              </div>
              <div v-else class="dt-dropzone-filled">
                <span class="dt-file-name">{{ importFile.name }}</span>
                <button class="dt-link-btn" @click="resetImportFile">重选</button>
              </div>
            </div>
            <div class="dt-import-row">
              <button class="dt-btn-accent" :disabled="!importFile || !importTableKey" :loading="importing" @click="handleImport">
                确认导入
              </button>
            </div>

            <div v-if="importResult" class="dt-import-result">
              <div :class="['dt-import-summary', importResult.errors.length === 0 ? 'is-ok' : 'is-warn']">
                {{ importResult.msg }}
              </div>
              <div v-if="importResult.errors.length" class="dt-import-errors">
                <div v-for="(e, i) in importResult.errors" :key="i" class="dt-import-error">{{ e }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 清理业务数据（仅超级管理员） -->
        <el-tab-pane v-if="userStore.isSuperAdmin" label="清空业务数据" name="clear">
          <div class="dt-tab-content">
            <section class="dt-clear-card">
              <div class="dt-clear-heading">
                <span class="dt-clear-badge">超级管理员操作</span>
                <h2>清空业务数据</h2>
                <p>用于重新开始演示或清理旧业务记录。清理前会自动创建整库备份。</p>
              </div>

              <div class="dt-clear-columns">
                <div class="dt-clear-list dt-clear-list--keep">
                  <strong>会保留</strong>
                  <span>账号及密码、门店信息、角色菜单权限、系统设置</span>
                </div>
                <div class="dt-clear-list dt-clear-list--delete">
                  <strong>会清空</strong>
                  <span>供应商、品牌型号、库存与 IMEI、采购入库、销售、调拨、盘点、售后及业务操作日志</span>
                </div>
              </div>

              <div class="dt-clear-footer">
                <span>此操作会清除所有门店的业务数据；如需恢复，可在“数据备份”中还原自动生成的备份节点。</span>
                <button class="dt-btn-danger" :disabled="clearing" @click="handleClearBusinessData">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  {{ clearing ? '正在清理…' : '备份并清空业务数据' }}
                </button>
              </div>
            </section>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getTables,
  downloadBackup,
  getBackupNodes,
  createBackup,
  downloadBackupNode,
  deleteBackupNode,
  restoreFromNode,
  restoreFromFile,
  exportTable,
  importTable,
  clearBusinessData,
  type BackupNode,
} from '@/api/tools'

const activeTab = ref('backup')
const userStore = useUserStore()

// ---- 备份节点 ----
const backupNodes = ref<BackupNode[]>([])
const backupLoading = ref(false)
const creating = ref(false)

// ---- 导出 ----
const tables = ref<Array<{ key: string; label: string; count: number }>>([])
const tableLoading = ref(false)

// ---- 导入 ----
const importTableKey = ref('')
const importFile = ref<File | null>(null)
const importFileRef = ref<HTMLInputElement>()
const importing = ref(false)
const importResult = ref<{ msg: string; errors: string[] } | null>(null)
const clearing = ref(false)

// ---- 上传还原 ----
const restoreFile = ref<File | null>(null)
const restoreFileRef = ref<HTMLInputElement>()
const dropOver = ref(false)

const importableTables = computed(() => tables.value.filter((t) => ['suppliers', 'brands'].includes(t.key)))

async function loadBackupNodes() {
  backupLoading.value = true
  try {
    backupNodes.value = await getBackupNodes()
  } catch {
    backupNodes.value = []
  } finally {
    backupLoading.value = false
  }
}

async function loadTables() {
  tableLoading.value = true
  try {
    tables.value = await getTables()
  } catch {
    tables.value = []
  } finally {
    tableLoading.value = false
  }
}

async function handleCreateBackup() {
  creating.value = true
  try {
    const node = await createBackup()
    ElMessage.success(`备份节点已创建`)
    await loadBackupNodes()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '创建备份失败')
  } finally {
    creating.value = false
  }
}

async function handleDeleteNode(row: BackupNode) {
  try {
    await ElMessageBox.confirm(`确定删除备份「${row.name}」？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteBackupNode(row.name)
    ElMessage.success('删除成功')
    await loadBackupNodes()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

async function handleRestore(row: BackupNode) {
  try {
    await ElMessageBox.confirm(
      `将使用备份「${row.name}」覆盖当前数据。还原前系统会自动备份当前数据库，是否继续？`,
      '还原确认',
      { confirmButtonText: '确认还原', cancelButtonText: '取消', type: 'warning' },
    )
    await showRestoreResult(await restoreFromNode(row.name))
    await loadBackupNodes()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '还原失败')
  }
}

// 展示还原结果，并列出表结构差异等提示信息
async function showRestoreResult(res: any) {
  ElMessage.success(res?.message || '还原成功')
  const warnings: string[] = res?.data?.warnings || []
  if (warnings.length) {
    await ElMessageBox.alert(
      warnings.map((w) => `<div style="margin:2px 0;font-size:13px;">· ${w}</div>`).join(''),
      '还原完成，有以下提示',
      { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' },
    ).catch(() => {})
  }
}

function onPickRestore(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) restoreFile.value = input.files[0]
}

function resetRestoreFile() {
  restoreFile.value = null
  if (restoreFileRef.value) restoreFileRef.value.value = ''
}

function onDropRestore(e: DragEvent) {
  dropOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && /\.(sqlite|db)$/i.test(file.name)) restoreFile.value = file
  else ElMessage.warning('请选择 .sqlite 备份文件')
}

async function handleRestoreFile() {
  if (!restoreFile.value) return
  try {
    await ElMessageBox.confirm(
      '将使用上传的备份文件覆盖当前数据。还原前系统会自动备份当前数据库，是否继续？',
      '还原确认',
      { confirmButtonText: '确认还原', cancelButtonText: '取消', type: 'warning' },
    )
    await showRestoreResult(await restoreFromFile(restoreFile.value))
    resetRestoreFile()
    await loadBackupNodes()
  } catch (e: any) {
    if (e === 'cancel' || e?.action === 'cancel') return
    ElMessage.error(e?.response?.data?.message || e?.message || '还原失败')
  }
}

// ---- 导入 ----
function onPickImport(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    importFile.value = input.files[0]
    importResult.value = null
  }
}

function resetImportFile() {
  importFile.value = null
  if (importFileRef.value) importFileRef.value.value = ''
}

function onDropImport(e: DragEvent) {
  dropOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && /\.(xlsx|xls)$/i.test(file.name)) {
    importFile.value = file
    importResult.value = null
  } else {
    ElMessage.warning('请选择 .xlsx / .xls 文件')
  }
}

async function handleImport() {
  if (!importTableKey.value || !importFile.value) return
  importing.value = true
  importResult.value = null
  try {
    const result = await importTable(importTableKey.value, importFile.value)
    importResult.value = {
      msg: result.errors.length === 0
        ? `成功导入 ${result.success} 条数据`
        : `成功 ${result.success} 条，失败 ${result.errors.length} 条`,
      errors: result.errors || [],
    }
    ElMessage.success('导入完成')
    await loadTables()
  } catch (e: any) {
    importResult.value = { msg: `导入失败：${e?.message || '未知错误'}`, errors: [] }
  } finally {
    importing.value = false
  }
}

async function handleClearBusinessData() {
  if (clearing.value) return
  clearing.value = true
  try {
    await ElMessageBox.confirm(
      '将清空所有门店的供应商、品牌型号、库存与 IMEI、采购入库、销售、调拨、盘点、售后和业务操作日志。账号密码、门店、角色菜单权限及系统设置会保留。清理前系统会自动创建整库备份，是否继续？',
      '确认清空业务数据',
      {
        confirmButtonText: '备份并清空',
        cancelButtonText: '取消',
        type: 'error',
        distinguishCancelAndClose: true,
      },
    )

    const result = await clearBusinessData()
    const labels: Record<string, string> = {
      after_sale_logs: '售后处理记录',
      after_sales: '售后工单',
      sale_items: '销售商品明细',
      sales: '销售单',
      purchase_items: '入库商品明细',
      purchase_entries: '入库单',
      inventory_check_items: '盘点明细',
      inventory_checks: '盘点单',
      transfers: '调拨单',
      inventory_imeis: 'IMEI 记录',
      inventory_logs: '库存流水',
      inventory: '库存汇总',
      operation_logs: '业务操作日志',
      suppliers: '供应商',
      models: '型号',
      brands: '品牌',
    }
    const deletedDetails = Object.entries(result.deleted)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${labels[key] || key}：${count} 条`)
    await loadTables()
    await loadBackupNodes()
    await ElMessageBox.alert(
      `清理前备份：${result.backup_name}\n${deletedDetails.length ? deletedDetails.join('、') : '没有业务记录需要删除'}\n\n账号密码、门店、角色菜单权限和系统设置已保留。`,
      '清理完成',
      { confirmButtonText: '知道了' },
    )
  } catch (e: any) {
    if (e === 'cancel' || e === 'close' || e?.action === 'cancel' || e?.action === 'close') return
    ElMessage.error(e?.response?.data?.message || e?.message || '清空业务数据失败')
  } finally {
    clearing.value = false
  }
}

// ---- 工具函数 ----
function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatTime(t: string): string {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}

function dateStr(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

onMounted(() => {
  loadBackupNodes()
  loadTables()
})
</script>

<style scoped>
.dt-tabs { border-radius: var(--radius); padding: 8px 20px 20px; }
.dt-tabs-inner :deep(.el-tabs__item) { font-size: 14px; font-weight: 500; }
.dt-tab-content { display: flex; flex-direction: column; gap: 16px; }

.dt-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dt-btn-accent { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 16px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.dt-btn-accent:hover { background: var(--primary-dark); }
.dt-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; }
.dt-btn-accent--sm { height: 30px; padding: 0 14px; font-size: 12px; }
.dt-btn-plain { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: var(--transition); }
.dt-btn-plain:hover { border-color: var(--primary); color: var(--primary); }
.dt-btn-mini { height: 26px; padding: 0 10px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text-secondary); font-size: 12px; cursor: pointer; font-family: inherit; transition: var(--transition); }
.dt-btn-mini:hover { border-color: var(--primary); color: var(--primary); }
.dt-btn-mini--warn { color: #b45309; }
.dt-btn-mini--warn:hover { border-color: #f59e0b; color: #b45309; background: var(--warning-light); }
.dt-btn-mini--danger { color: var(--danger); }
.dt-btn-mini--danger:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-light); }
.dt-tip { font-size: 12px; color: var(--text-tertiary); }
.dt-table-wrap { border-radius: var(--radius-sm); overflow: hidden; }
.dt-file-name { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 13px; color: var(--text); }
.dt-row-actions { display: flex; gap: 6px; justify-content: center; }

.dt-upload-card, .dt-import-row { display: flex; flex-direction: column; gap: 10px; }
.dt-upload-title { font-size: 14px; font-weight: 600; color: var(--text); }
.dt-dropzone { border: 1.5px dashed var(--border); border-radius: var(--radius-sm); padding: 20px; text-align: center; cursor: pointer; transition: var(--transition); }
.dt-dropzone:hover { border-color: var(--primary); }
.dt-dropzone.has-file { border-style: solid; border-color: var(--success); }
.dt-dropzone-empty { font-size: 13px; color: var(--text-tertiary); }
.dt-dropzone-filled { display: flex; align-items: center; justify-content: center; gap: 10px; }
.dt-link-btn { border: none; background: none; color: var(--primary); font-size: 13px; cursor: pointer; font-family: inherit; padding: 0; }
.dt-link-btn:hover { text-decoration: underline; }

.dt-import-result { padding: 12px 14px; background: rgba(226,232,240,0.25); border-radius: var(--radius-sm); }
.dt-import-summary { font-size: 13px; font-weight: 600; }
.dt-import-summary.is-ok { color: #16a34a; }
.dt-import-summary.is-warn { color: #b45309; }
.dt-import-errors { margin-top: 8px; max-height: 180px; overflow-y: auto; }
.dt-import-error { font-size: 12px; color: var(--danger); font-family: monospace; padding: 2px 0; }

.dt-clear-card { padding: 24px; border: 1px solid rgba(220, 38, 38, 0.2); border-radius: var(--radius); background: linear-gradient(135deg, rgba(254, 242, 242, 0.72), rgba(255, 255, 255, 0.9)); }
.dt-clear-heading h2 { margin: 10px 0 6px; color: var(--text); font-size: 18px; }
.dt-clear-heading p { margin: 0; color: var(--text-secondary); font-size: 13px; }
.dt-clear-badge { display: inline-flex; align-items: center; min-height: 24px; padding: 0 9px; border-radius: 999px; background: rgba(220, 38, 38, 0.09); color: #b91c1c; font-size: 11px; font-weight: 700; }
.dt-clear-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
.dt-clear-list { display: flex; flex-direction: column; gap: 7px; padding: 14px 16px; border-radius: var(--radius-sm); background: rgba(255, 255, 255, 0.8); }
.dt-clear-list strong { font-size: 13px; }
.dt-clear-list span { color: var(--text-secondary); font-size: 12px; line-height: 1.7; }
.dt-clear-list--keep strong { color: #15803d; }
.dt-clear-list--delete strong { color: #b91c1c; }
.dt-clear-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 20px; }
.dt-clear-footer > span { max-width: 640px; color: var(--text-tertiary); font-size: 12px; line-height: 1.6; }
.dt-btn-danger { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; gap: 7px; min-height: 36px; padding: 0 14px; border: 0; border-radius: var(--radius-sm); background: #dc2626; color: #fff; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: var(--transition); }
.dt-btn-danger:hover { background: #b91c1c; }
.dt-btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }

@media (max-width: 720px) {
  .dt-clear-card { padding: 18px; }
  .dt-clear-columns { grid-template-columns: 1fr; }
  .dt-clear-footer { align-items: stretch; flex-direction: column; }
  .dt-btn-danger { width: 100%; }
}
</style>

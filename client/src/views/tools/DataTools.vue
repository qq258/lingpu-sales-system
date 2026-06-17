<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">数据工具</h1>
        <span class="pbm-subtitle">Data Tools</span>
      </div>
    </header>

    <div class="pbm-body">
      <el-tabs v-model="activeTab" class="pbm-tabs">
        <el-tab-pane label="数据备份" name="backup">
          <div class="pbm-tab-content">
            <div class="pbm-card">
              <h3 class="pbm-card-title">整库备份</h3>
              <p class="pbm-card-desc">下载当前数据库的完整备份文件（.sqlite 格式），可用于数据恢复。</p>
              <div class="pbm-card-info">
                <span>数据库类型: SQLite</span>
                <span>文件路径: data/database.sqlite</span>
              </div>
              <button class="pbm-btn-accent" @click="handleBackup">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>下载整库备份</span>
              </button>
            </div>

            <div class="pbm-card">
              <h3 class="pbm-card-title">按表导出</h3>
              <p class="pbm-card-desc">选择需要导出的数据表，导出为 Excel 文件。</p>
              <div class="pbm-card-row">
                <el-select v-model="exportTableKey" placeholder="请选择数据表" style="width: 240px;">
                  <el-option v-for="t in tables" :key="t.key" :label="t.label" :value="t.key" />
                </el-select>
                <button class="pbm-btn-accent" :disabled="!exportTableKey" @click="handleExportTable">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>导出 Excel</span>
                </button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据导入" name="import">
          <div class="pbm-tab-content">
            <div class="pbm-card">
              <h3 class="pbm-card-title">从 Excel 导入数据</h3>
              <p class="pbm-card-desc">选择目标数据表并上传 Excel 文件，导入数据到系统中。当前支持导入：供应商、品牌。</p>
              <div class="pbm-card-row">
                <el-select v-model="importTableKey" placeholder="请选择目标数据表" style="width: 240px;">
                  <el-option v-for="t in importableTables" :key="t.key" :label="t.label" :value="t.key" />
                </el-select>
              </div>
              <div class="pbm-card-row">
                <el-upload
                  ref="uploadRef"
                  :auto-upload="false"
                  :show-file-list="true"
                  accept=".xlsx,.xls"
                  :limit="1"
                  :on-change="onFileChange"
                >
                  <template #trigger>
                    <el-button type="primary" plain>选择文件</el-button>
                  </template>
                  <button class="pbm-btn-accent" style="margin-left: 10px;" :disabled="!selectedFile || !importTableKey" :loading="importLoading" @click="handleImport">
                    确认导入
                  </button>
                  <template #tip>
                    <div class="pbm-tip">仅支持 .xlsx / .xls 文件</div>
                  </template>
                </el-upload>
              </div>
              <div v-if="importResult" class="pbm-import-result">
                <div :class="['pbm-import-summary', importResult.errors.length === 0 ? 'pbm-import-success' : 'pbm-import-warn']">
                  {{ importResult.msg }}
                </div>
                <div v-if="importResult.errors.length > 0" class="pbm-import-errors">
                  <div v-for="(err, i) in importResult.errors" :key="i" class="pbm-import-error">{{ err }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据导出" name="export">
          <div class="pbm-tab-content">
            <div class="pbm-card">
              <h3 class="pbm-card-title">数据表列表</h3>
              <p class="pbm-card-desc">所有可导出的数据表，点击「导出 Excel」下载数据。</p>
              <el-table :data="tables" stripe size="small">
                <el-table-column prop="label" label="数据表" min-width="200" />
                <el-table-column prop="count" label="记录数" width="120" align="center" />
                <el-table-column label="操作" width="140" align="center">
                  <template #default="{ row }">
                    <button class="pbm-btn-accent pbm-btn-accent--sm" @click="exportTable(row.key)">
                      导出 Excel
                    </button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadInstance, UploadFile } from 'element-plus'
import { getTables, downloadBackup, exportTable, importTable } from '@/api/tools'
import type { TableInfo } from '@/api/tools'

const activeTab = ref('backup')
const tables = ref<TableInfo[]>([])
const exportTableKey = ref('')
const importTableKey = ref('')
const importLoading = ref(false)
const selectedFile = ref<File | null>(null)
const uploadRef = ref<UploadInstance>()
const importResult = ref<{ msg: string; errors: string[] } | null>(null)

const importableTables = computed(() =>
  tables.value.filter(t => ['suppliers', 'brands'].includes(t.key))
)

async function loadTables() {
  try {
    tables.value = await getTables()
  } catch {
    tables.value = []
  }
}

function handleBackup() {
  try {
    downloadBackup()
    ElMessage.success('备份文件下载中...')
  } catch {
    ElMessage.error('备份失败')
  }
}

function handleExportTable() {
  if (!exportTableKey.value) return
  const table = tables.value.find(t => t.key === exportTableKey.value)
  exportTable(exportTableKey.value, `${table?.label || exportTableKey.value}.xlsx`)
  ElMessage.success('导出中...')
}

function onFileChange(uploadFile: UploadFile) {
  if (uploadFile.raw) {
    selectedFile.value = uploadFile.raw
  }
}

async function handleImport() {
  if (!importTableKey.value || !selectedFile.value) return
  importLoading.value = true
  importResult.value = null
  try {
    const result = await importTable(importTableKey.value, selectedFile.value)
    importResult.value = {
      msg: result.errors.length === 0
        ? `✅ 成功导入 ${result.success} 条数据`
        : `⚠️ 成功 ${result.success} 条，失败 ${result.errors.length} 条`,
      errors: result.errors || [],
    }
    ElMessage.success('导入完成')
    loadTables()
  } catch (e: any) {
    importResult.value = { msg: `❌ 导入失败: ${e.message || '未知错误'}`, errors: [] }
  } finally {
    importLoading.value = false
  }
}

onMounted(() => {
  loadTables()
})
</script>

<style scoped>
.pbm-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #2c2418;
  font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f5f0eb;
}
.pbm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  flex-shrink: 0;
  border-bottom: 1px solid #e5ddd3;
}
.pbm-header-left { display: flex; align-items: baseline; gap: 12px; }
.pbm-title { font-size: 20px; font-weight: 600; margin: 0; }
.pbm-subtitle { font-size: 12px; color: #8a7f72; text-transform: uppercase; letter-spacing: 0.4px; font-family: "SF Mono", monospace; }
.pbm-body { flex: 1; padding: 24px; overflow-y: auto; }
.pbm-tabs :deep(.el-tabs__header) { margin: 0 0 20px; }
.pbm-tabs :deep(.el-tabs__item) { font-size: 14px; font-weight: 500; color: #8a7f72; }
.pbm-tabs :deep(.el-tabs__item.is-active) { color: #c9953c; }
.pbm-tabs :deep(.el-tabs__active-bar) { background: #c9953c; }
.pbm-tab-content { display: flex; flex-direction: column; gap: 20px; }
.pbm-card {
  background: #fff;
  border: 1px solid #e5ddd3;
  border-radius: 6px;
  padding: 24px;
}
.pbm-card-title { font-size: 16px; font-weight: 600; margin: 0 0 8px; }
.pbm-card-desc { font-size: 13px; color: #8a7f72; margin: 0 0 16px; }
.pbm-card-info { display: flex; gap: 24px; font-size: 12px; color: #8a7f72; margin-bottom: 16px; font-family: "SF Mono", monospace; }
.pbm-card-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.pbm-btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: #c9953c;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-accent:hover { background: #dba84a; }
.pbm-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; }
.pbm-btn-accent--sm { padding: 4px 12px; font-size: 12px; }
.pbm-tip { font-size: 12px; color: #8a7f72; margin-top: 4px; }
.pbm-import-result { margin-top: 12px; }
.pbm-import-summary { padding: 8px 12px; border-radius: 4px; font-size: 13px; font-weight: 500; }
.pbm-import-success { background: rgba(34,197,94,0.12); color: #16a34a; }
.pbm-import-warn { background: rgba(234,179,8,0.12); color: #ca8a04; }
.pbm-import-errors { margin-top: 8px; max-height: 200px; overflow-y: auto; }
.pbm-import-error { padding: 4px 8px; font-size: 12px; color: #dc3545; font-family: "SF Mono", monospace; }
</style>

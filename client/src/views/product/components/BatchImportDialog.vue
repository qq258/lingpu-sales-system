<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(v: boolean) => emit('update:visible', v)"
    title="批量导入品牌与型号"
    width="640px"
    :close-on-click-modal="false"
    class="bmi-dialog"
  >
    <div class="bmi-step">
      <div class="bmi-step-num">1</div>
      <div class="bmi-step-content">
        <div class="bmi-step-title">下载模板</div>
        <button class="bmi-btn-link" @click="downloadBrandModelTemplate">↓ 下载 .xlsx 模板</button>
      </div>
    </div>

    <div class="bmi-step">
      <div class="bmi-step-num">2</div>
      <div class="bmi-step-content">
        <div class="bmi-step-title">上传文件</div>
        <div
          class="bmi-dropzone"
          :class="{ 'is-dragover': isDragover, 'has-file': !!file }"
          @dragover.prevent="isDragover = true"
          @dragleave.prevent="isDragover = false"
          @drop.prevent="onDrop"
        >
          <input ref="fileInputRef" type="file" accept=".xlsx,.xls" @change="onFileChange" hidden />
          <div v-if="!file" class="bmi-dropzone-empty" @click="fileInputRef?.click()">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>拖拽 .xlsx 文件到此处，或<span class="bmi-link">点击选择</span></span>
          </div>
          <div v-else class="bmi-dropzone-filled">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span class="bmi-filename">{{ file.name }}</span>
            <span class="bmi-filesize">({{ formatSize(file.size) }})</span>
            <button class="bmi-btn-mini" @click.stop="resetFile">重选</button>
          </div>
        </div>
      </div>
    </div>

    <div class="bmi-step">
      <div class="bmi-step-num">3</div>
      <div class="bmi-step-content">
        <div class="bmi-step-title">重复数据处理</div>
        <el-radio-group v-model="conflictMode">
          <el-radio value="skip">跳过已存在（推荐）</el-radio>
          <el-radio value="overwrite">用文件数据覆盖</el-radio>
        </el-radio-group>
      </div>
    </div>

    <div v-if="previewRows.length > 0" class="bmi-preview">
      <div class="bmi-preview-title">
        预览（前 {{ Math.min(previewRows.length, 10) }} 行 / 共 {{ totalRows }} 行）
      </div>
      <el-table :data="previewRows.slice(0, 10)" size="small" max-height="200">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="brandName" label="品牌" min-width="100" />
        <el-table-column prop="name" label="型号" min-width="140" />
        <el-table-column prop="ram" label="内存" width="70" />
        <el-table-column prop="rom" label="存储" width="70" />
        <el-table-column prop="color" label="颜色" width="80" />
        <el-table-column prop="osType" label="系统" width="70" />
      </el-table>
    </div>

    <div v-if="result" class="bmi-result">
      <div class="bmi-result-title">导入完成</div>
      <div class="bmi-result-grid">
        <div class="bmi-result-card bmi-result-card--ok">
          <div class="bmi-result-num">{{ result.success }}</div>
          <div class="bmi-result-label">新建成功</div>
        </div>
        <div class="bmi-result-card bmi-result-card--skip">
          <div class="bmi-result-num">{{ result.skipped }}</div>
          <div class="bmi-result-label">已跳过</div>
        </div>
        <div class="bmi-result-card bmi-result-card--over">
          <div class="bmi-result-num">{{ result.overwritten || 0 }}</div>
          <div class="bmi-result-label">已覆盖</div>
        </div>
        <div class="bmi-result-card bmi-result-card--err">
          <div class="bmi-result-num">{{ result.errors?.length || 0 }}</div>
          <div class="bmi-result-label">失败</div>
        </div>
      </div>
      <button v-if="result.errors && result.errors.length > 0" class="bmi-btn-link" @click="downloadErrors">
        ↓ 下载失败明细
      </button>
    </div>

    <template #footer>
      <button class="bmi-btn-plain" @click="handleCancel" :disabled="importing">{{ result ? '关闭' : '取消' }}</button>
      <button v-if="!result" class="bmi-btn-accent" :loading="importing" :disabled="!file" @click="handleImport">
        {{ importing ? '导入中...' : '开始导入' }}
      </button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { downloadBrandModelTemplate, parseBrandModelFile, downloadErrorCsv, type ParsedRow } from '@/utils/excel'
import { importBrandModels } from '@/api/product'

interface Props { visible: boolean }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:visible': [val: boolean] }>()

const file = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const isDragover = ref(false)
const previewRows = ref<ParsedRow[]>([])
const totalRows = ref(0)
const conflictMode = ref<'skip' | 'overwrite'>('skip')
const importing = ref(false)
const result = ref<{ success: number; skipped: number; overwritten?: number; errors?: Array<{ row: number; message: string }> } | null>(null)

watch(() => props.visible, (v) => {
  if (v) resetAll()
})

function resetAll() {
  file.value = null
  previewRows.value = []
  totalRows.value = 0
  conflictMode.value = 'skip'
  result.value = null
  importing.value = false
}

function resetFile() {
  file.value = null
  previewRows.value = []
  totalRows.value = 0
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function loadFile(f: File) {
  file.value = f
  result.value = null
  try {
    const rows = await parseBrandModelFile(f)
    previewRows.value = rows
    totalRows.value = rows.length
  } catch (err: any) {
    ElMessage.error('文件解析失败：' + (err?.message || '未知错误'))
    resetFile()
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) loadFile(target.files[0])
}

function onDrop(e: DragEvent) {
  isDragover.value = false
  if (e.dataTransfer?.files?.[0]) loadFile(e.dataTransfer.files[0])
}

async function handleImport() {
  if (!file.value) return
  importing.value = true
  try {
    const res = await importBrandModels(file.value, conflictMode.value)
    result.value = res
    ElMessage.success(`导入完成：新建 ${res.success} / 跳过 ${res.skipped} / 覆盖 ${res.overwritten || 0} / 失败 ${res.errors?.length || 0}`)
  } catch (err: any) {
    ElMessage.error('导入失败：' + (err?.message || '未知错误'))
  } finally {
    importing.value = false
  }
}

function handleCancel() {
  emit('update:visible', false)
}

function downloadErrors() {
  if (!result.value?.errors) return
  downloadErrorCsv(result.value.errors)
}
</script>

<style scoped>
.bmi-step { display: flex; gap: 12px; margin-bottom: 18px; }
.bmi-step-num {
  flex-shrink: 0; width: 24px; height: 24px;
  background: #c9953c; color: #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
}
.bmi-step-content { flex: 1; }
.bmi-step-title { font-size: 13px; font-weight: 500; color: #2c2418; margin-bottom: 6px; }

.bmi-dropzone {
  border: 1.5px dashed #e5ddd3; border-radius: 6px;
  padding: 24px; text-align: center; cursor: pointer; transition: all 0.15s;
  background: #faf7f4;
}
.bmi-dropzone:hover, .bmi-dropzone.is-dragover {
  border-color: #c9953c; background: rgba(201,149,60,0.05);
}
.bmi-dropzone.has-file { background: #fff; border-style: solid; cursor: default; }
.bmi-dropzone-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  color: #8a7f72; font-size: 13px;
}
.bmi-link { color: #c9953c; margin-left: 4px; }
.bmi-dropzone-filled {
  display: flex; align-items: center; gap: 8px; font-size: 13px; color: #2c2418;
}
.bmi-filename { font-weight: 500; }
.bmi-filesize { color: #8a7f72; font-size: 12px; }

.bmi-preview { margin: 18px 0; }
.bmi-preview-title { font-size: 12px; color: #8a7f72; margin-bottom: 6px; }

.bmi-result { margin-top: 18px; padding: 16px; background: #faf7f4; border-radius: 6px; }
.bmi-result-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #2c2418; }
.bmi-result-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
.bmi-result-card { padding: 12px; border-radius: 4px; text-align: center; }
.bmi-result-num { font-size: 24px; font-weight: 600; }
.bmi-result-label { font-size: 11px; color: #8a7f72; margin-top: 4px; }
.bmi-result-card--ok { background: rgba(40,167,69,0.1); color: #28a745; }
.bmi-result-card--skip { background: rgba(108,117,125,0.1); color: #6c757d; }
.bmi-result-card--over { background: rgba(59,130,246,0.1); color: #3b82f6; }
.bmi-result-card--err { background: rgba(220,53,69,0.1); color: #dc3545; }

.bmi-btn-link {
  background: none; border: none; color: #3b82f6; cursor: pointer;
  font-size: 13px; padding: 4px 0;
}
.bmi-btn-link:hover { text-decoration: underline; }

.bmi-btn-accent {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; background: #c9953c; color: #fff;
  border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.bmi-btn-accent:hover:not(:disabled) { background: #dba84a; }
.bmi-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; }

.bmi-btn-plain {
  padding: 8px 18px; background: transparent; color: #8a7f72;
  border: 1px solid #e5ddd3; border-radius: 4px; font-size: 13px; cursor: pointer;
}
.bmi-btn-plain:hover:not(:disabled) { color: #2c2418; border-color: #8a7f72; }
.bmi-btn-plain:disabled { opacity: 0.5; cursor: not-allowed; }

.bmi-btn-mini {
  padding: 3px 10px; background: transparent; color: #3b82f6;
  border: 1px solid #e5ddd3; border-radius: 3px; font-size: 11px; cursor: pointer;
}
.bmi-btn-mini:hover { background: rgba(59,130,246,0.12); }
</style>

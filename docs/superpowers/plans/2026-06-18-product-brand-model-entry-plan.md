# 品牌与型号录入模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化后台品牌与型号录入体验：将"品牌+型号"合并为一个一体化弹窗（手风琴可添加 N 个型号），加入实时重复校验，并新增 Excel 批量导入能力（支持跳过/覆盖两种重复处理模式）。

**Architecture:** 前端在 `client/src/views/product/components/` 下新增 `BrandModelEditDialog.vue`（一体化弹窗）和 `BatchImportDialog.vue`（导入弹窗），重构 `ProductBrandModel.vue` 整合入口。后端在 `server/src/routes/products.ts` 追加 `POST /products/import` 端点。客户端新增 `xlsx` 依赖用于模板下载与前端预览。

**Tech Stack:** Vue 3 (Composition API + `<script setup lang="ts">`), Element Plus, TypeScript, Express, Prisma, `xlsx` (前端+后端均使用), `multer` (后端文件上传，已存在)

**Spec:** `docs/superpowers/specs/2026-06-18-product-brand-model-entry-design.md` (本计划的源真理)

---

## 文件结构

| 文件 | 状态 | 职责 |
|------|------|------|
| `client/src/views/product/components/BrandModelEditDialog.vue` | 新建 | 一体化弹窗：品牌信息 + 手风琴型号列表 + 重复校验 |
| `client/src/views/product/components/BatchImportDialog.vue` | 新建 | Excel 导入弹窗：模板下载 + 文件选择 + 预览 + 重复模式选择 + 结果展示 |
| `client/src/utils/excel.ts` | 新建 | 前端 xlsx 工具：下载模板、解析前 N 行预览、生成失败明细 CSV |
| `client/src/api/product.ts` | 修改 | 新增 `importBrandModels(file, conflictMode)` |
| `client/src/views/product/ProductBrandModel.vue` | 修改 | 删除 3 个旧弹窗状态及方法，整合新组件 + 导入按钮 |
| `client/package.json` | 修改 | 新增 `xlsx` 依赖 |
| `server/src/routes/products.ts` | 修改 | 新增 `POST /products/import` 端点 |

**单一职责原则**:
- `BrandModelEditDialog.vue`：只负责弹窗的 UI 与表单状态，不直接调后端 API，提交时通过 emit 让父组件决定
- `BatchImportDialog.vue`：只负责上传与结果展示，调 `importBrandModels` 完成导入
- `excel.ts`：纯函数工具，封装 xlsx 读写
- 后端 `POST /products/import`：解析 + 按品牌分组 + upsert 逻辑

**变更边界**:
- 不修改 `server/prisma/schema.prisma`
- 不修改 `BrandList.vue` / `ModelList.vue`
- 不修改其它路由文件
- 不引入新依赖（除 `client` 端的 `xlsx`）

---

## Task 1: 客户端新增 `xlsx` 依赖

**Files:**
- Modify: `client/package.json:8-22`

- [ ] **Step 1: 切换到 client 目录并安装 xlsx**

Run: `cd d:\qxy\手机销售门户网站\client && npm install xlsx@0.18.5`
Expected: 安装完成，`package.json` 中 `dependencies` 出现 `"xlsx": "^0.18.5"`，`package-lock.json` 同步更新。

- [ ] **Step 2: 验证 package.json 已更新**

Run: `cd d:\qxy\手机销售门户网站\client && Select-String "xlsx" package.json`
Expected: 命中 1 行 `"xlsx": "^0.18.5"`

- [ ] **Step 3: 提交**

```bash
cd "d:\qxy\手机销售门户网站"
git add client/package.json client/package-lock.json
git commit -m "chore(client): add xlsx dependency for batch import"
```

---

## Task 2: 新建前端 xlsx 工具 `client/src/utils/excel.ts`

**Files:**
- Create: `client/src/utils/excel.ts`

- [ ] **Step 1: 创建文件**

在 `client/src/utils/` 目录下新建 `excel.ts`，内容如下：

```ts
import * as XLSX from 'xlsx'

export interface ImportTemplateColumn {
  header: string
  width?: number
  example?: string
}

export const BRAND_MODEL_TEMPLATE_COLUMNS: ImportTemplateColumn[] = [
  { header: '品牌名', width: 16, example: 'Apple' },
  { header: '型号名', width: 22, example: 'iPhone 15 Pro Max' },
  { header: '颜色', width: 12, example: '深黑色' },
  { header: '操作系统', width: 10, example: 'iOS' },
  { header: '屏幕尺寸', width: 12, example: '6.7英寸' },
  { header: '处理器', width: 16, example: 'A17 Pro' },
  { header: '运行内存', width: 10, example: '8GB' },
  { header: '存储容量', width: 10, example: '256GB' },
  { header: '电池容量', width: 12, example: '4422mAh' },
  { header: '网络制式', width: 10, example: '5G' },
  { header: '上市年份', width: 10, example: '2023' },
  { header: '条码', width: 18, example: '6901234567890' },
  { header: '描述', width: 24, example: '旗舰机型' },
]

const COLUMN_FIELD_MAP: Record<string, string> = {
  '品牌名': 'brandName',
  '型号名': 'name',
  '颜色': 'color',
  '操作系统': 'osType',
  '屏幕尺寸': 'screenSize',
  '处理器': 'cpu',
  '运行内存': 'ram',
  '存储容量': 'rom',
  '电池容量': 'battery',
  '网络制式': 'networkType',
  '上市年份': 'launchYear',
  '条码': 'barcode',
  '描述': 'description',
}

export function downloadBrandModelTemplate(): void {
  const headers = BRAND_MODEL_TEMPLATE_COLUMNS.map(c => c.header)
  const exampleRow = BRAND_MODEL_TEMPLATE_COLUMNS.map(c => c.example || '')
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])
  ws['!cols'] = BRAND_MODEL_TEMPLATE_COLUMNS.map(c => ({ wch: c.width || 12 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '品牌与型号模板')
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '品牌与型号导入模板.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ParsedRow {
  brandName: string
  name: string
  color?: string
  osType?: string
  screenSize?: string
  cpu?: string
  ram?: string
  rom?: string
  battery?: string
  networkType?: string
  launchYear?: number
  barcode?: string
  description?: string
  _rowIndex: number
}

export function parseBrandModelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' })
        const rows: ParsedRow[] = json.map((row, idx) => {
          const mapped: any = { _rowIndex: idx + 2 }
          for (const [zh, field] of Object.entries(COLUMN_FIELD_MAP)) {
            const v = row[zh]
            if (v === undefined || v === null || v === '') continue
            if (field === 'launchYear') {
              const num = Number(v)
              if (!isNaN(num)) mapped[field] = num
            } else {
              mapped[field] = String(v).trim()
            }
          }
          return mapped as ParsedRow
        })
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export function downloadErrorCsv(errors: Array<{ row: number; message: string }>, filename = '导入失败明细.csv'): void {
  const headers = ['行号', '错误信息']
  const rows = errors.map(e => [String(e.row), e.message])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = [{ wch: 8 }, { wch: 50 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '失败明细')
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd d:\qxy\手机销售门户网站\client && npx vue-tsc --noEmit 2>&1 | Select-String "excel.ts" | Select-Object -First 5`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
cd "d:\qxy\手机销售门户网站"
git add client/src/utils/excel.ts
git commit -m "feat(client): add excel utility for brand/model import"
```

---

## Task 3: 新建 `BrandModelEditDialog.vue` 一体化弹窗

**Files:**
- Create: `client/src/views/product/components/BrandModelEditDialog.vue`
- Create: `client/src/views/product/components/` (目录)

- [ ] **Step 1: 创建目录**

Run: `New-Item -ItemType Directory -Force -Path "d:\qxy\手机销售门户网站\client\src\views\product\components"`
Expected: 目录创建成功，无报错

- [ ] **Step 2: 创建 `BrandModelEditDialog.vue`**

在 `client/src/views/product/components/` 下新建 `BrandModelEditDialog.vue`，完整的 vue 代码如下：

```vue
<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(v) => emit('update:visible', v)"
    :title="dialogTitle"
    width="800px"
    top="4vh"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    class="bme-dialog"
  >
    <div v-if="errorBanner" class="bme-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>{{ errorBanner }}</span>
    </div>

    <el-form ref="brandFormRef" :model="brandForm" :rules="brandRules" label-width="80px" size="default">
      <div class="bme-section-title">品牌信息</div>
      <div class="bme-form-row">
        <el-form-item label="品牌名称" prop="name" :error="brandError">
          <el-input v-model="brandForm.name" placeholder="例：Apple, Samsung" @blur="checkBrandDuplicate" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="brandForm.description" placeholder="可选描述" />
        </el-form-item>
      </div>
    </el-form>

    <div class="bme-section-title">
      型号清单 <span class="bme-section-count">({{ modelList.length }})</span>
      <button class="bme-btn-ghost" @click="addModel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>新增型号</span>
      </button>
    </div>

    <div class="bme-collapse-wrap">
      <el-collapse v-model="activeNames" accordion>
        <el-collapse-item
          v-for="(m, idx) in modelList"
          :key="m._key"
          :name="m._key"
          :class="{ 'is-duplicate': !!modelErrors[idx] }"
        >
          <template #title>
            <div class="bme-collapse-title">
              <span class="bme-collapse-num">#{{ idx + 1 }}</span>
              <span class="bme-collapse-name" :class="{ 'is-error': !!modelErrors[idx] }">
                {{ m.name || '未命名型号' }}
              </span>
              <span v-if="modelErrors[idx]" class="bme-collapse-err">{{ modelErrors[idx] }}</span>
            </div>
          </template>
          <div class="bme-collapse-actions">
            <button class="bme-btn-mini" @click="duplicateModel(idx)" :disabled="modelList.length >= 20">复制</button>
            <button class="bme-btn-mini bme-btn-mini--danger" @click="removeModel(idx)" :disabled="modelList.length <= 1">删除</button>
          </div>
          <div class="bme-model-grid">
            <el-form-item label="型号名称" :error="modelErrors[idx]">
              <el-input v-model="m.name" placeholder="例：iPhone 15 Pro Max" @blur="checkModelDuplicate(idx)" />
            </el-form-item>
            <el-form-item label="颜色">
              <el-input v-model="m.color" placeholder="深黑色 / 白色" />
            </el-form-item>
            <el-form-item label="操作系统">
              <el-input v-model="m.osType" placeholder="iOS / Android" />
            </el-form-item>
            <el-form-item label="屏幕尺寸">
              <el-input v-model="m.screenSize" placeholder="6.7英寸" />
            </el-form-item>
            <el-form-item label="上市年份">
              <el-input-number v-model="m.launchYear" :min="2000" :max="2099" controls-position="right" style="width:100%;" placeholder="2024" />
            </el-form-item>
            <el-form-item label="网络制式">
              <el-select v-model="m.networkType" placeholder="选择" clearable>
                <el-option label="5G" value="5G" />
                <el-option label="4G" value="4G" />
                <el-option label="5G+4G" value="5G+4G" />
              </el-select>
            </el-form-item>
            <el-form-item label="运行内存">
              <el-input v-model="m.ram" placeholder="8GB" />
            </el-form-item>
            <el-form-item label="存储容量">
              <el-input v-model="m.rom" placeholder="256GB" />
            </el-form-item>
          </div>
          <el-collapse class="bme-sub-collapse">
            <el-collapse-item title="更多规格（CPU / 电池 / 条码 / 描述）" name="more">
              <div class="bme-model-grid">
                <el-form-item label="处理器">
                  <el-input v-model="m.cpu" placeholder="A17 Pro" />
                </el-form-item>
                <el-form-item label="电池容量">
                  <el-input v-model="m.battery" placeholder="4422mAh" />
                </el-form-item>
                <el-form-item label="出厂条码">
                  <el-input v-model="m.barcode" placeholder="6901234567890" />
                </el-form-item>
                <el-form-item label="描述" class="bme-form-full">
                  <el-input v-model="m.description" type="textarea" :rows="2" placeholder="可选备注" />
                </el-form-item>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-collapse-item>
      </el-collapse>
    </div>

    <template #footer>
      <button class="bme-btn-plain" @click="handleCancel">取消</button>
      <button class="bme-btn-plain" :disabled="hasError" @click="handleSaveAndNew">保存并新增品牌</button>
      <button class="bme-btn-accent" :disabled="hasError" @click="handleSave">保存</button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { BrandData, ModelData } from '@/api/product'

export type DialogMode = 'create' | 'edit-brand' | 'edit-model'

interface Props {
  visible: boolean
  mode: DialogMode
  brand?: BrandData | null
  model?: ModelData | null
  existingBrands: BrandData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  brand: null,
  model: null,
  loading: false,
})

const emit = defineEmits<{
  'update:visible': [val: boolean]
  'save': [payload: { brand: { name: string; description?: string; id?: number }; models: Partial<ModelData>[] }]
  'save-and-new': [payload: { brand: { name: string; description?: string; id?: number }; models: Partial<ModelData>[] }]
}>()

interface ModelFormState extends Partial<ModelData> {
  _key: string
  _isExisting?: boolean
  _id?: number
}

const brandFormRef = ref<FormInstance>()
const brandForm = ref<{ name: string; description: string }>({ name: '', description: '' })
const modelList = ref<ModelFormState[]>([])
const activeNames = ref<string>('')
const brandError = ref('')
const modelErrors = ref<Record<number, string>>({})
const submitting = ref(false)
const isDirty = ref(false)

const brandRules: FormRules = {
  name: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
}

const dialogTitle = computed(() => {
  if (props.mode === 'edit-brand') return '编辑品牌与型号'
  if (props.mode === 'edit-model') return '编辑型号'
  return '新增品牌与型号'
})

const errorBanner = computed(() => {
  const dupModels = Object.values(modelErrors.value).filter(Boolean).length
  if (brandError.value && dupModels) return `品牌名重复；存在 ${dupModels} 个重复型号`
  if (brandError.value) return brandError.value
  if (dupModels) return `存在 ${dupModels} 个重复型号，请修改后再保存`
  return ''
})

const hasError = computed(() => !!brandError.value || Object.values(modelErrors.value).some(Boolean))

function makeKey() { return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

function makeEmptyModel(): ModelFormState {
  return { _key: makeKey(), name: '', brandId: props.brand?.id || 0 }
}

function initForm() {
  isDirty.value = false
  brandError.value = ''
  modelErrors.value = {}

  if (props.mode === 'edit-brand' && props.brand) {
    brandForm.value = { name: props.brand.name || '', description: props.brand.description || '' }
    const existing = (props.brand.models || []) as ModelData[]
    modelList.value = existing.length > 0
      ? existing.map(m => ({ ...m, _key: makeKey(), _isExisting: true, _id: m.id }))
      : [makeEmptyModel()]
    activeNames.value = modelList.value[0]?._key || ''
  } else if (props.mode === 'edit-model' && props.brand && props.model) {
    brandForm.value = { name: props.brand.name || '', description: props.brand.description || '' }
    modelList.value = [{ ...props.model, _key: makeKey(), _isExisting: true, _id: props.model.id }]
    activeNames.value = modelList.value[0]._key
  } else {
    brandForm.value = { name: '', description: '' }
    modelList.value = [makeEmptyModel()]
    activeNames.value = modelList.value[0]._key
  }
}

watch(() => props.visible, (v) => { if (v) nextTick(initForm) })

function checkBrandDuplicate() {
  const name = brandForm.value.name.trim()
  if (!name) { brandError.value = ''; return }
  const normalized = name.toLowerCase()
  const dup = props.existingBrands.find(b =>
    b.name.trim().toLowerCase() === normalized && b.id !== props.brand?.id
  )
  brandError.value = dup ? `品牌「${dup.name}」已存在` : ''
}

function checkModelDuplicate(idx: number) {
  const m = modelList.value[idx]
  const name = (m.name || '').trim()
  if (!name) { delete modelErrors.value[idx]; modelErrors.value = { ...modelErrors.value }; return }
  const normalized = name.toLowerCase()
  // 与手风琴内其它型号比对
  for (let i = 0; i < modelList.value.length; i++) {
    if (i === idx) continue
    const other = modelList.value[i]
    if ((other.name || '').trim().toLowerCase() === normalized) {
      modelErrors.value[idx] = `与第 ${i + 1} 个型号重名`
      modelErrors.value = { ...modelErrors.value }
      return
    }
  }
  // 与后端已有型号比对（仅编辑现有品牌时）
  if (props.brand?.models) {
    const dup = (props.brand.models as any[]).find((dm: any) =>
      dm.name?.trim().toLowerCase() === normalized && dm.id !== m._id
    )
    if (dup) {
      modelErrors.value[idx] = `该品牌下已存在型号「${dup.name}」`
      modelErrors.value = { ...modelErrors.value }
      return
    }
  }
  delete modelErrors.value[idx]
  modelErrors.value = { ...modelErrors.value }
}

function addModel() {
  if (modelList.value.length >= 20) { ElMessage.warning('单次最多 20 个型号'); return }
  const m = makeEmptyModel()
  modelList.value.push(m)
  activeNames.value = m._key
  isDirty.value = true
}

function duplicateModel(idx: number) {
  const src = modelList.value[idx]
  const copy: ModelFormState = { ...src, _key: makeKey(), _isExisting: false, name: (src.name || '') + ' (副本)' }
  modelList.value.splice(idx + 1, 0, copy)
  activeNames.value = copy._key
  isDirty.value = true
}

async function removeModel(idx: number) {
  if (modelList.value.length <= 1) return
  try {
    await ElMessageBox.confirm('确定删除此型号？', '确认', { type: 'warning' })
    modelList.value.splice(idx, 1)
    // 重排 error 索引
    const newErr: Record<number, string> = {}
    for (const k of Object.keys(modelErrors.value)) {
      const n = Number(k)
      if (n > idx) newErr[n - 1] = modelErrors.value[n]
      else if (n < idx) newErr[n] = modelErrors.value[n]
    }
    modelErrors.value = newErr
    isDirty.value = true
  } catch { /* cancelled */ }
}

async function validateAll(): Promise<boolean> {
  const valid = await brandFormRef.value?.validate().catch(() => false)
  if (!valid) return false
  checkBrandDuplicate()
  modelList.value.forEach((_, i) => checkModelDuplicate(i))
  if (hasError.value) {
    ElMessage.warning('存在重复数据，请修改后保存')
    return false
  }
  if (modelList.value.length === 0) {
    ElMessage.warning('请至少添加一个型号')
    return false
  }
  for (let i = 0; i < modelList.value.length; i++) {
    if (!modelList.value[i].name?.trim()) {
      ElMessage.warning(`第 ${i + 1} 个型号名称不能为空`)
      return false
    }
  }
  return true
}

function buildPayload() {
  return {
    brand: {
      id: props.brand?.id,
      name: brandForm.value.name.trim(),
      description: brandForm.value.description?.trim() || undefined,
    },
    models: modelList.value.map(m => ({
      id: m._isExisting ? m._id : undefined,
      brandId: props.brand?.id || 0,
      name: (m.name || '').trim(),
      color: m.color || undefined,
      ram: m.ram || undefined,
      rom: m.rom || undefined,
      osType: m.osType || undefined,
      launchYear: m.launchYear || undefined,
      networkType: m.networkType || undefined,
      screenSize: m.screenSize || undefined,
      cpu: m.cpu || undefined,
      battery: m.battery || undefined,
      barcode: m.barcode || undefined,
      description: m.description || undefined,
    })),
  }
}

async function handleSave() {
  if (!(await validateAll())) return
  submitting.value = true
  isDirty.value = false
  try {
    emit('save', buildPayload())
  } finally {
    submitting.value = false
  }
}

async function handleSaveAndNew() {
  if (!(await validateAll())) return
  submitting.value = true
  isDirty.value = false
  try {
    emit('save-and-new', buildPayload())
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  emit('update:visible', false)
}

async function handleBeforeClose(done: () => void) {
  if (isDirty.value) {
    try {
      await ElMessageBox.confirm('有未保存的修改，确定关闭吗？', '提示', { type: 'warning' })
      done()
    } catch { /* cancelled */ }
  } else {
    done()
  }
}

watch([brandForm, modelList], () => { isDirty.value = true }, { deep: true })
</script>

<style scoped>
.bme-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #8a7f72;
  margin: 16px 0 10px;
  font-family: "SF Mono", monospace;
}
.bme-section-count { color: #c9953c; font-weight: 500; }
.bme-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
.bme-model-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; padding: 8px 0 0; }
.bme-form-full { grid-column: 1 / -1; }

.bme-collapse-wrap { max-height: 50vh; overflow-y: auto; padding: 4px; }
.bme-collapse-title { display: flex; align-items: center; gap: 10px; flex: 1; }
.bme-collapse-num { font-size: 11px; color: #8a7f72; font-family: "SF Mono", monospace; }
.bme-collapse-name { font-weight: 500; }
.bme-collapse-name.is-error { color: #dc3545; }
.bme-collapse-err { font-size: 12px; color: #dc3545; }

.bme-collapse-actions { display: flex; gap: 6px; margin-bottom: 8px; justify-content: flex-end; }

:deep(.is-duplicate > .el-collapse-item__header) {
  background: rgba(220,53,69,0.06);
  border-left: 3px solid #dc3545;
}
:deep(.bme-sub-collapse) { margin-top: 8px; }
:deep(.bme-sub-collapse .el-collapse-item__header) { font-size: 12px; padding-left: 12px; }

.bme-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(220,53,69,0.08);
  color: #c82333;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 12px;
}

.bme-btn-accent {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; background: #c9953c; color: #fff;
  border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.bme-btn-accent:hover:not(:disabled) { background: #dba84a; }
.bme-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; }

.bme-btn-plain {
  padding: 8px 18px; background: transparent; color: #8a7f72;
  border: 1px solid #e5ddd3; border-radius: 4px; font-size: 13px; cursor: pointer;
}
.bme-btn-plain:hover:not(:disabled) { color: #2c2418; border-color: #8a7f72; }
.bme-btn-plain:disabled { opacity: 0.5; cursor: not-allowed; }

.bme-btn-ghost {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; margin-left: auto;
  background: transparent; color: #3b82f6;
  border: 1px solid #e5ddd3; border-radius: 4px; font-size: 12px; cursor: pointer;
}
.bme-btn-ghost:hover { background: rgba(59,130,246,0.12); border-color: #3b82f6; }

.bme-btn-mini {
  padding: 3px 10px; background: transparent; color: #3b82f6;
  border: 1px solid #e5ddd3; border-radius: 3px; font-size: 11px; cursor: pointer;
}
.bme-btn-mini:hover:not(:disabled) { background: rgba(59,130,246,0.12); }
.bme-btn-mini--danger { color: #dc3545; }
.bme-btn-mini--danger:hover:not(:disabled) { background: rgba(220,53,69,0.08); }
.bme-btn-mini:disabled { opacity: 0.35; cursor: not-allowed; }
</style>
```

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `cd d:\qxy\手机销售门户网站\client && npx vue-tsc --noEmit 2>&1 | Select-String "BrandModelEditDialog" | Select-Object -First 5`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
cd "d:\qxy\手机销售门户网站"
git add client/src/views/product/components/BrandModelEditDialog.vue
git commit -m "feat(client): add BrandModelEditDialog unified entry"
```

---

## Task 4: 新建 `BatchImportDialog.vue` Excel 导入弹窗

**Files:**
- Create: `client/src/views/product/components/BatchImportDialog.vue`

- [ ] **Step 1: 创建 `BatchImportDialog.vue`**

在 `client/src/views/product/components/` 下新建 `BatchImportDialog.vue`，完整的 vue 代码如下：

```vue
<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(v) => emit('update:visible', v)"
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
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd d:\qxy\手机销售门户网站\client && npx vue-tsc --noEmit 2>&1 | Select-String "BatchImportDialog" | Select-Object -First 5`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
cd "d:\qxy\手机销售门户网站"
git add client/src/views/product/components/BatchImportDialog.vue
git commit -m "feat(client): add BatchImportDialog for excel upload"
```

---

## Task 5: 新增 `importBrandModels` API

**Files:**
- Modify: `client/src/api/product.ts` (文件末尾追加)

- [ ] **Step 1: 在 `product.ts` 末尾追加导入函数**

打开 `client/src/api/product.ts`，在 `scanBarcode` 函数之后追加：

```ts
export async function importBrandModels(
  file: File,
  conflictMode: 'skip' | 'overwrite' = 'skip',
): Promise<{
  success: number
  skipped: number
  overwritten: number
  errors: Array<{ row: number; message: string }>
}> {
  const formData = new FormData()
  formData.append('file', file)
  const res: any = await request.post(`/products/import?conflictMode=${conflictMode}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data || { success: 0, skipped: 0, overwritten: 0, errors: [] }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd d:\qxy\手机销售门户网站\client && npx vue-tsc --noEmit 2>&1 | Select-String "product.ts" | Select-Object -First 5`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
cd "d:\qxy\手机销售门户网站"
git add client/src/api/product.ts
git commit -m "feat(client): add importBrandModels API"
```

---

## Task 6: 新增后端 `POST /products/import` 端点

**Files:**
- Modify: `server/src/routes/products.ts` (imports + 追加端点到 export default 之前)

- [ ] **Step 1: 确认 multer 中间件已可用**

Run: `cd d:\qxy\手机销售门户网站\server && Select-String "multer" package.json`
Expected: 命中 1-2 行，包含 `"multer"` 和 `@types/multer`

- [ ] **Step 2: 修改 `products.ts` 顶部 imports**

将 `products.ts` 顶部：

```ts
import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import * as XLSX from 'xlsx';
```

改为：

```ts
import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import * as XLSX from 'xlsx';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
```

- [ ] **Step 3: 在 `export default router;` 之前插入新端点**

在 `products.ts` 末尾（`export default router;` 之前）插入以下代码：

```ts
// 批量导入品牌与型号
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const conflictMode = (req.query.conflictMode as string) === 'overwrite' ? 'overwrite' : 'skip';

    if (!req.file) {
      const r: ApiResponse = { code: 400, message: '请上传 xlsx 文件' };
      return res.status(400).json(r);
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const errors: Array<{ row: number; message: string }> = [];
    let success = 0;
    let skipped = 0;
    let overwritten = 0;

    const colMap: Record<string, string> = {
      '品牌名': 'brandName', '品牌': 'brandName', 'brand': 'brandName', 'brandName': 'brandName',
      '型号名': 'name', '型号名称': 'name', '型号': 'name', 'name': 'name',
      '颜色': 'color', 'color': 'color',
      '操作系统': 'osType', '系统': 'osType', 'osType': 'osType',
      '屏幕尺寸': 'screenSize', '屏幕': 'screenSize', 'screenSize': 'screenSize',
      '处理器': 'cpu', 'cpu': 'cpu',
      '运行内存': 'ram', '内存': 'ram', 'ram': 'ram',
      '存储容量': 'rom', '存储': 'rom', 'rom': 'rom',
      '电池容量': 'battery', '电池': 'battery', 'battery': 'battery',
      '网络制式': 'networkType', '网络': 'networkType', 'networkType': 'networkType',
      '上市年份': 'launchYear', '年份': 'launchYear', 'launchYear': 'launchYear',
      '条码': 'barcode', '出厂条码': 'barcode', 'barcode': 'barcode',
      '描述': 'description', 'description': 'description',
    };

    // 按品牌分组
    const brandGroups: Record<string, Array<{ rowIndex: number; data: any }>> = {};
    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const mapped: any = {};
      for (const k of Object.keys(raw)) {
        const field = colMap[k];
        if (field) mapped[field] = raw[k];
      }
      const brandName = String(mapped.brandName || '').trim();
      const modelName = String(mapped.name || '').trim();
      if (!brandName || !modelName) {
        errors.push({ row: i + 2, message: !brandName ? '品牌名不能为空' : '型号名不能为空' });
        continue;
      }
      const key = brandName.toLowerCase();
      if (!brandGroups[key]) brandGroups[key] = [];
      brandGroups[key].push({ rowIndex: i + 2, data: mapped });
    }

    // 处理每个品牌
    for (const [, group] of Object.entries(brandGroups)) {
      const firstRow = group[0].data;
      const brandName = String(firstRow.brandName).trim();
      const brandDescription = String(firstRow.description || '').trim() || undefined;

      let brand = await prisma.pdt_brand.findFirst({ where: { name: brandName } });
      if (!brand) {
        brand = await prisma.pdt_brand.create({ data: { name: brandName, description: brandDescription } });
      } else if (conflictMode === 'overwrite' && brandDescription) {
        brand = await prisma.pdt_brand.update({ where: { id: brand.id }, data: { description: brandDescription } });
      }

      for (const { rowIndex, data } of group) {
        const modelName = String(data.name).trim();
        const existingModel = await prisma.pdt_model.findFirst({
          where: { brand_id: brand.id, name: modelName },
        });

        const modelData: any = {
          brand_id: brand.id,
          name: modelName,
          color: data.color || null,
          ram: data.ram || null,
          rom: data.rom || null,
          sale_price: 0,
          cost_price: null,
          manufacturer_barcode: data.barcode || null,
          os_type: data.osType || null,
          launch_year: data.launchYear ? Number(data.launchYear) : null,
          network_type: data.networkType || null,
          screen_size: data.screenSize || null,
          cpu: data.cpu || null,
          battery: data.battery || null,
          description: data.description || null,
        };

        try {
          if (existingModel) {
            if (conflictMode === 'overwrite') {
              await prisma.pdt_model.update({ where: { id: existingModel.id }, data: modelData });
              overwritten++;
            } else {
              skipped++;
            }
          } else {
            await prisma.pdt_model.create({ data: modelData });
            success++;
          }
        } catch (err: any) {
          errors.push({ row: rowIndex, message: err.message || '保存失败' });
        }
      }
    }

    const r: ApiResponse = { code: 200, message: 'success', data: { success, skipped, overwritten, errors } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '导入失败' };
    return res.status(500).json(r);
  }
});
```

- [ ] **Step 4: 验证后端 TypeScript 编译**

Run: `cd d:\qxy\手机销售门户网站\server && npx tsc --noEmit 2>&1 | Select-String "products.ts" | Select-Object -First 5`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
cd "d:\qxy\手机销售门户网站"
git add server/src/routes/products.ts
git commit -m "feat(server): add POST /products/import endpoint"
```

---

## Task 7: 重构 `ProductBrandModel.vue` 整合新组件

**Files:**
- Modify: `client/src/views/product/ProductBrandModel.vue` (整个 `<script setup>` 和 template 中 3 个 dialog 区块)

- [ ] **Step 1: 替换 import 区段**

将 `ProductBrandModel.vue` 顶部 `<script setup>` 内的所有 import 替换为：

```ts
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type ElTree from 'element-plus/es/components/tree'
import { getBrands, getModels, createBrand, updateBrand, deleteBrand, createModel, updateModel, deleteModel } from '@/api/product'
import type { BrandData, ModelData } from '@/api/product'
import { exportWithQuery } from '@/api/tools'
import BrandModelEditDialog from './components/BrandModelEditDialog.vue'
import BatchImportDialog from './components/BatchImportDialog.vue'
import type { DialogMode } from './components/BrandModelEditDialog.vue'
```

删除 `import { createScanner } from '@/utils/scanner'` 这行。

- [ ] **Step 2: 替换状态变量声明**

在 `const currentNodeKey = ref<string | null>(null)` 之后追加：

```ts
// 一体化弹窗状态
const editDialogVisible = ref(false)
const editDialogMode = ref<DialogMode>('create')
const editDialogBrand = ref<BrandData | null>(null)
const editDialogModel = ref<ModelData | null>(null)
const editDialogLoading = ref(false)

// 导入弹窗状态
const importDialogVisible = ref(false)
```

将原代码中的以下状态变量**全部删除**：
- `const brandDialogVisible = ref(false)`
- `const brandIsEdit = ref(false)`
- `const brandEditId = ref<number | null>(null)`
- `const brandSubmitLoading = ref(false)`
- `const brandFormRef = ref<FormInstance>()`
- `const brandForm = ref<BrandData>({ name: '', description: '' })`
- `const brandRules: FormRules = {...}`
- `const modelDialogVisible = ref(false)`
- `const modelIsEdit = ref(false)`
- `const modelEditId = ref<number | null>(null)`
- `const modelSubmitLoading = ref(false)`
- `const modelFormRef = ref<FormInstance>()`
- `const modelForm = ref<ModelData>({ brandId: 0, name: '' })`
- `const modelRules: FormRules = {...}`
- `const quickDialogVisible = ref(false)`
- `const quickSubmitLoading = ref(false)`
- `const quickFormRef = ref<FormInstance>()`
- `const scanInputRef = ref()`
- `const quickForm = ref({ barcode: '', brandName: '', modelName: '' })`
- `const quickRules: FormRules = {...}`
- `const scanResult = ref<...>(null)`
- `let scanner: ReturnType<typeof createScanner> | null = null`
- `function resetModelForm() {...}`

- [ ] **Step 3: 替换 template 中 3 个 dialog 区块**

将 template 中：

```html
<el-dialog v-model="brandDialogVisible" ...>...</el-dialog>
<el-dialog v-model="modelDialogVisible" ...>...</el-dialog>
<el-dialog v-model="quickDialogVisible" ...>...</el-dialog>
```

整三段（包括内部 form）**全部删除**，替换为：

```html
<BrandModelEditDialog
  v-model:visible="editDialogVisible"
  :mode="editDialogMode"
  :brand="editDialogBrand"
  :model="editDialogModel"
  :existing-brands="brands"
  :loading="editDialogLoading"
  @save="handleUnifiedSave"
  @save-and-new="handleUnifiedSaveAndNew"
/>

<BatchImportDialog v-model:visible="importDialogVisible" />
```

- [ ] **Step 4: 替换方法实现**

在 `<script setup>` 中：

**替换** `openBrandDialog`：
```ts
function openBrandDialog(row?: BrandData) {
  editDialogMode.value = row ? 'edit-brand' : 'create'
  editDialogBrand.value = row || null
  editDialogModel.value = null
  editDialogVisible.value = true
}
```

**替换** `openModelDialog`：
```ts
function openModelDialog(row?: ModelData) {
  editDialogMode.value = row ? 'edit-model' : 'create'
  editDialogBrand.value = selectedBrand.value
  editDialogModel.value = row || null
  editDialogVisible.value = true
}
```

**替换** `openQuickAddDialog`：
```ts
function openQuickAddDialog() {
  editDialogMode.value = 'create'
  editDialogBrand.value = null
  editDialogModel.value = null
  editDialogVisible.value = true
}
```

**删除**以下方法：
- `handleBrandSubmit`
- `handleModelSubmit`
- `handleScanBarcode`
- `quickSaveBrand`
- `handleQuickSubmit`
- `resetModelForm`（如未在 Step 2 删除）

**新增**处理保存的方法：
```ts
async function handleUnifiedSave(payload: { brand: { id?: number; name: string; description?: string }; models: Partial<ModelData>[] }) {
  await performSave(payload, false)
}

async function handleUnifiedSaveAndNew(payload: { brand: { id?: number; name: string; description?: string }; models: Partial<ModelData>[] }) {
  await performSave(payload, true)
}

async function performSave(payload: { brand: { id?: number; name: string; description?: string }; models: Partial<ModelData>[] }, keepDialogOpen: boolean) {
  editDialogLoading.value = true
  try {
    let brandId = payload.brand.id
    if (brandId) {
      await updateBrand(brandId, { name: payload.brand.name, description: payload.brand.description })
    } else {
      const created = await createBrand({ name: payload.brand.name, description: payload.brand.description })
      brandId = created.id!
    }

    for (const m of payload.models) {
      if (m.id) {
        await updateModel(m.id, { ...m, brandId })
      } else {
        await createModel({ ...m, brandId })
      }
    }

    ElMessage.success(`保存成功：${payload.models.length} 个型号`)
    await loadBrands()
    if (brandId) {
      const updated = brands.value.find(b => b.id === brandId)
      if (updated) {
        selectedBrand.value = updated
        currentNodeKey.value = `brand-${updated.id}`
        await loadModels()
      }
    }

    if (keepDialogOpen) {
      editDialogBrand.value = null
      editDialogModel.value = null
      editDialogMode.value = 'create'
    } else {
      editDialogVisible.value = false
    }
  } catch (err: any) {
    ElMessage.error('保存失败：' + (err?.message || '未知错误'))
  } finally {
    editDialogLoading.value = false
  }
}
```

- [ ] **Step 5: 修改 `onMounted`**

将原 `onMounted` 替换为：
```ts
onMounted(() => {
  loadBrands()
})
```

- [ ] **Step 6: 删除 `onUnmounted`**

删除 `onUnmounted(() => { if (scanner) scanner.detach() })` 块（已无 scanner 需要清理）。

- [ ] **Step 7: 在 template 头部新增"导入"按钮**

在 `<button class="pbm-btn-accent" @click="openQuickAddDialog">` 之后追加：

```html
<button class="pbm-btn-plain" @click="importDialogVisible = true">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  <span>导入</span>
</button>
```

- [ ] **Step 8: 验证前端编译**

Run: `cd d:\qxy\手机销售门户网站\client && npx vue-tsc --noEmit 2>&1 | Select-String "ProductBrandModel" | Select-Object -First 10`
Expected: 无错误

- [ ] **Step 9: 提交**

```bash
cd "d:\qxy\手机销售门户网站"
git add client/src/views/product/ProductBrandModel.vue
git commit -m "refactor(client): integrate new dialogs into ProductBrandModel"
```

---

## Task 8: 端到端手动验证

**Files:** 无

- [ ] **Step 1: 启动后端**

Run: `cd d:\qxy\手机销售门户网站\server && npm run dev`
Expected: 服务启动在 3000 端口，无报错

- [ ] **Step 2: 启动前端**

在另一个终端：
Run: `cd d:\qxy\手机销售门户网站\client && npm run dev`
Expected: Vite 启动，控制台显示 Local: http://localhost:5173/

- [ ] **Step 3: 新建品牌与型号**

1. 浏览器打开 http://localhost:5173，登录后台
2. 进入"品牌与型号管理"
3. 点击右上角"快速新增"按钮
4. 预期：弹出一体化弹窗，标题"新增品牌与型号"，品牌信息区可见，型号区默认 1 个折叠项（默认展开）
5. 品牌名输入"TestBrandA"，Tab 失焦 → 无错误
6. 型号名称输入"TestModel1"，Tab 失焦 → 无错误
7. 点击"保存"按钮
8. 预期：弹窗关闭，左侧品牌树出现"TestBrandA"，型号表格出现"TestModel1"

- [ ] **Step 4: 重复品牌名校验**

1. 再次点击"快速新增"
2. 品牌名输入"testbranda"（小写）
3. Tab 失焦 → 预期：输入框下方红字"品牌「TestBrandA」已存在"，保存按钮禁用

- [ ] **Step 5: 重复型号校验**

1. 在弹窗中：品牌名改为"TestBrandB"（新名称），型号名输入"TestModel1"
2. 失焦后无错误
3. 点击"新增型号"按钮，再添加一个折叠项
4. 第二个型号名输入"TestModel1"
5. 失焦 → 预期：该折叠项标红 + 标题变红 + 顶部红条"存在 1 个重复型号" + 保存禁用

- [ ] **Step 6: 编辑品牌**

1. 点击"保存并新增品牌"按钮
2. 预期：弹窗重置（品牌+型号清空），左侧出现"TestBrandB"
3. 关闭弹窗
4. 在左侧品牌树点击"TestBrandA"的"编辑"图标
5. 预期：弹窗打开，标题"编辑品牌与型号"，品牌名预填"TestBrandA"，型号区预填"TestModel1"
6. 关闭弹窗

- [ ] **Step 7: Excel 导入**

1. 点击"导入"按钮
2. 预期：弹出导入弹窗，步骤 1 显示"下载模板"
3. 点击"↓ 下载 .xlsx 模板" → 下载一个 .xlsx 文件
4. 打开下载的模板，向第二行填入测试数据：TestImportBrand, TestImportModel1, 深黑色, iOS, 6.1英寸, A18, 8GB, 128GB, ...
5. 保存文件后拖拽到上传区
6. 预期：出现预览，显示 1 行数据
7. 确认"重复数据处理"为"跳过已存在"
8. 点击"开始导入"
9. 预期：结果区显示"导入完成"，新建成功 1 / 跳过 0 / 覆盖 0 / 失败 0
10. 左侧品牌树出现"TestImportBrand"，型号表格出现"TestImportModel1"

- [ ] **Step 8: 验证导入覆盖模式**

1. 准备同一个文件再次导入
2. 选择"用文件数据覆盖"
3. 点击"开始导入"
4. 预期：覆盖 1（或跳过 1，取决于 isDuplicate 判定），无新建

- [ ] **Step 9: 验证关闭前有未保存修改的提示**

1. 打开一体化弹窗，随便修改任何字段
2. 点击取消或关闭按钮
3. 预期：弹出"有未保存的修改，确定关闭吗？"确认框
4. 点取消 → 保持弹窗打开

- [ ] **Step 10: 停止服务**

Run: `Stop-Command <command-id>` (分别停止 server 和 client)

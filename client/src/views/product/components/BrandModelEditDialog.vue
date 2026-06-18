<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(v: boolean) => emit('update:visible', v)"
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

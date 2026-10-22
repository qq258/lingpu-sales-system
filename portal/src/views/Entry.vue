<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">采购入库</h1>
      <span class="title-line"></span>
    </div>

    <div class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <label class="field-label">供应商</label>
      <el-select
        v-model="supplierId"
        placeholder="请选择供应商（可输入搜索）"
        filterable
        remote
        :remote-method="searchSuppliers"
        :loading="supplierLoading"
        size="large"
        style="width:100%;"
        @visible-change="onSupplierDropdownOpen"
      >
        <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
        <template #footer>
          <div v-if="supplierSearchText && !suppliers.some(s => s.name === supplierSearchText)" class="supplier-add-row">
            <button class="supplier-add-btn" @mousedown.prevent @click.stop="openAddSupplier">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              新增供应商：{{ supplierSearchText }}
            </button>
          </div>
        </template>
      </el-select>
    </div>

    <div class="section-divider">添加手机</div>
    <div style="margin-bottom:16px;display:flex;justify-content:flex-end;"><el-button type="primary" size="large" @click="openPhotoDialog">拍照识别标签</el-button></div>

    <div class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <div class="add-row">
        <el-select v-model="brandId" placeholder="品牌" filterable size="large" style="width:160px;" @change="onBrandChange">
          <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
        <el-select v-model="modelId" placeholder="型号" filterable size="large" style="width:260px;" :disabled="!brandId">
          <el-option v-for="m in models" :key="m.id" :label="`${m.name} ${m.color||''} ${m.memory||''}`.trim()" :value="m.id" />
        </el-select>
      </div>
      <div class="imei-row">
        <div class="imei-input-wrap">
          <input ref="imeiRef" v-model="imeiInput" class="input-field" :class="{ 'input-error': imeiError }" placeholder="扫码或输入 IMEI（必填）" />
          <div v-if="imeiError" class="imei-error-tip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ imeiError }}
          </div>
          <div v-if="imeiChecking" class="imei-checking">
            <span class="checking-spinner"></span> 校验中...
          </div>
        </div>
        <button class="action-btn" @click="handleAdd">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          添加
        </button>
      </div>
      <div class="extra-row">
        <div class="extra-field">
          <span class="extra-label">IMEI2</span>
          <input ref="imei2Ref" v-model="imei2Input" class="extra-input" placeholder="双卡 IMEI2（选填）" />
        </div>
        <div class="extra-field">
          <span class="extra-label">SN码</span>
          <input v-model="snCodeInput" class="extra-input" placeholder="序列号（选填）" />
        </div>
      </div>
    </div>

    <div class="section-divider">本次入库清单 ({{ items.length }} 台)</div>

    <div v-if="items.length" class="items-list">
      <div v-for="(item, i) in items" :key="i" class="item-row glass">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/></svg>
        <div class="item-info">
          <div class="item-name">{{ item.brandName }} {{ item.modelName }}</div>
          <div class="item-imei">{{ item.imei }}<template v-if="item.imei2"> / IMEI2: {{ item.imei2 }}</template><template v-if="item.snCode"> / SN: {{ item.snCode }}</template></div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        <button class="item-del" @click="items.splice(i, 1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div v-else class="empty-hint">尚未添加任何手机</div>

    <div v-if="items.length" class="summary-bar glass">
      <span>共 {{ items.length }} 台</span>
    </div>

    <button v-if="items.length" class="confirm-btn" @click="showConfirm = true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      确认入库  {{ items.length }} 台
    </button>

    <ConfirmDialog
      :visible="showConfirm" title="确认入库"
      :message="`共 ${items.length} 台手机`"
      type="success" confirm-text="确认入库" cancel-text="再想想"
      @confirm="handleConfirm" @cancel="showConfirm = false"
    />

    <el-dialog v-model="photoVisible" title="AI 拍照录入手机" width="min(94vw, 620px)" :close-on-click-modal="false">
      <div class="photo-form">
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" @change="onPhotoSelected" />
        <p class="photo-hint">图片会发送到后端 DeepSeek 服务；识别结果仅添加入库清单，最终确认入库前不会创建商品。</p>
        <el-alert v-if="photoError" type="error" :closable="false" :title="photoError" />
        <template v-if="photoResult">
          <el-alert v-for="(warning, idx) in photoResult.warnings" :key="idx" type="warning" :closable="false" :title="warning" />
          <el-form label-width="94px" style="margin-top:10px">
            <el-form-item label="品牌"><el-input v-model="photoFields.brand" /></el-form-item>
            <el-form-item label="商品名称"><el-input v-model="photoFields.productName" /></el-form-item>
            <el-form-item label="厂家型号"><el-input v-model="photoFields.modelCode" /></el-form-item>
            <el-form-item label="内存"><el-input v-model="photoFields.memory" /></el-form-item>
            <el-form-item label="颜色"><el-input v-model="photoFields.color" /></el-form-item>
            <el-form-item label="商品处理">
              <el-radio-group v-model="photoProductMode">
                <el-radio value="existing">关联已有商品</el-radio>
                <el-radio value="new">自动建档新商品</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="photoProductMode === 'existing'" label="已有商品" required>
              <el-select v-model="photoModelId" filterable placeholder="选择正确的商品规格" style="width:100%">
                <el-option v-for="m in photoAvailableModels" :key="m.id" :value="m.id" :label="`${m.brand?.name || ''} ${m.name} ${m.color || ''} ${m.memory || ''}`" />
              </el-select>
            </el-form-item>
            <el-alert v-else type="info" :closable="false" title="新品牌/规格会在最终确认入库时建档，取消入库不会创建商品。" style="margin-bottom:12px" />
            <el-form-item label="IMEI1" required><el-input v-model="photoFields.imei1" /></el-form-item>
            <el-form-item label="IMEI2"><el-input v-model="photoFields.imei2" /></el-form-item>
            <el-form-item label="SN"><el-input v-model="photoFields.sn" /></el-form-item>
          </el-form>
          <el-checkbox v-model="photoReviewed">已对照包装标签核对设备编号及商品规格</el-checkbox>
        </template>
      </div>
      <template #footer>
        <el-button @click="photoVisible=false">取消</el-button>
        <el-button v-if="!photoResult" type="primary" :loading="photoLoading" :disabled="!photoFile" @click="recognizePhoto">开始识别</el-button>
        <el-button v-else type="primary" :disabled="!photoReviewed || (photoProductMode === 'existing' && !photoModelId)" @click="addPhotoItem">添加到入库清单</el-button>
      </template>
    </el-dialog>

    <!-- 新增供应商 -->
    <el-dialog v-model="addSupplierVisible" title="新增供应商" width="440px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="addSupplierForm.name" placeholder="供应商名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="addSupplierForm.contact_person" placeholder="可选" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="addSupplierForm.phone" placeholder="可选" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="addSupplierForm.address" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addSupplierVisible = false">取消</el-button>
        <el-button type="primary" :loading="addSupplierSaving" @click="saveSupplier">保存并选中</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getSuppliers, createSupplier, checkImeiExists, quickConfirmPurchaseEntry } from '@/api/purchase'
import { getBrands, getModels } from '@/api/product'
import { recognizePhoneLabel } from '@/api/label-recognition'
import type { LabelRecognitionResult } from '@/api/label-recognition'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const photoVisible = ref(false)
const photoFile = ref<File | null>(null)
const photoLoading = ref(false)
const photoError = ref('')
const photoResult = ref<LabelRecognitionResult | null>(null)
const photoFields = ref({brand:'',productName:'',modelCode:'',memory:'',color:'',imei1:'',imei2:'',sn:''})
const photoProductMode = ref<'existing' | 'new'>('new')
const photoModelId = ref<number | null>(null)
const photoAvailableModels = ref<any[]>([])
const photoReviewed = ref(false)

function openPhotoDialog() {
  photoVisible.value = true
  photoFile.value = null
  photoResult.value = null
  photoError.value = ''
  photoReviewed.value = false
  photoModelId.value = null
  photoProductMode.value = 'new'
}
function onPhotoSelected(event: Event) {
  photoFile.value = (event.target as HTMLInputElement).files?.[0] || null
  photoResult.value = null
  photoReviewed.value = false
  photoModelId.value = null
  photoError.value = ''
}
async function recognizePhoto() {
  if (!photoFile.value) return
  photoLoading.value = true
  photoError.value = ''
  try {
    const result = await recognizePhoneLabel(photoFile.value)
    photoResult.value = result
    photoFields.value = Object.fromEntries(Object.entries(result.fields).map(([k,v])=>[k,v || ''])) as typeof photoFields.value
    photoAvailableModels.value = await getModels()
    if (result.matches.length === 1 && result.matches[0].score >= 105) {
      photoModelId.value = result.matches[0].id
      photoProductMode.value = 'existing'
    } else photoProductMode.value = 'new'
  } catch (error: any) {
    photoError.value = error?.response?.data?.message || error?.message || '识别失败'
  } finally {
    photoLoading.value = false
  }
}
function photoImeiValid(value: string): boolean {
  if (!new RegExp('^[0-9]{15}
const imeiRef = ref<HTMLInputElement>()
const imei2Ref = ref<HTMLInputElement>()
const suppliers = ref<any[]>([])
const brands = ref<any[]>([])
const models = ref<any[]>([])
const supplierId = ref<number | null>(null)
const supplierLoading = ref(false)
const supplierSearchText = ref('')
const addSupplierVisible = ref(false)
const addSupplierSaving = ref(false)
const addSupplierForm = ref({ name: '', contact_person: '', phone: '', address: '' })
const brandId = ref<number | null>(null)
const modelId = ref<number | null>(null)
const imeiInput = ref('')
const imei2Input = ref('')
const snCodeInput = ref('')
const items = ref<Array<{ brandName: string; modelName: string; imei: string; imei2?: string; snCode?: string; unitPrice: number; modelId?: number; newModel?: {brand:string;name:string;color:string;memory:string} }>>([])
const showConfirm = ref(false)
const imeiError = ref('')
const imeiChecking = ref(false)
let imeiCheckTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  try { suppliers.value = await getSuppliers() } catch {}
  try { brands.value = await getBrands() } catch {}
  nextTick(() => imeiRef.value?.focus())
})

async function onBrandChange() {
  modelId.value = null
  if (!brandId.value) { models.value = []; return }
  try { models.value = await getModels(brandId.value) } catch { models.value = [] }
}

// ---- 供应商：远程过滤 + 快捷新增 ----
async function searchSuppliers(query: string) {
  supplierSearchText.value = query.trim()
  supplierLoading.value = true
  try {
    suppliers.value = await getSuppliers(supplierSearchText.value || undefined)
  } catch {
    suppliers.value = []
  } finally {
    supplierLoading.value = false
  }
}

async function onSupplierDropdownOpen(open: boolean) {
  if (open) {
    supplierSearchText.value = ''
    supplierLoading.value = true
    try { suppliers.value = await getSuppliers() } catch { suppliers.value = [] }
    finally { supplierLoading.value = false }
  }
}

function openAddSupplier() {
  addSupplierForm.value = { name: supplierSearchText.value, contact_person: '', phone: '', address: '' }
  addSupplierVisible.value = true
}

async function saveSupplier() {
  if (!addSupplierForm.value.name.trim()) {
    ElMessage.warning('请填写供应商名称')
    return
  }
  addSupplierSaving.value = true
  try {
    const created = await createSupplier({
      name: addSupplierForm.value.name,
      contact_person: addSupplierForm.value.contact_person,
      phone: addSupplierForm.value.phone,
      address: addSupplierForm.value.address,
    })
    supplierId.value = created.id
    supplierSearchText.value = ''
    addSupplierVisible.value = false
    try { suppliers.value = await getSuppliers() } catch { suppliers.value = [] }
    ElMessage.success('供应商已新增并选中')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '新增失败')
  } finally {
    addSupplierSaving.value = false
  }
}

// 扫码自动校验 IMEI 重复性（任意输入防抖触发后端校验）
watch(imeiInput, (val) => {
  const trimmed = val.trim()
  // 输入为空时清除错误
  if (!trimmed) {
    imeiError.value = ''
    if (imeiCheckTimer) { clearTimeout(imeiCheckTimer); imeiCheckTimer = null }
    return
  }
  // 先检查当前列表中是否重复（本地即时校验）
  if (items.value.some(i => i.imei === trimmed)) {
    imeiError.value = 'IMEI 已存在于本次入库清单中'
    return
  }
  // 输入达到一定长度后自动触发后端校验（不依赖固定 15 位，兼容双卡/境外设备）
  if (trimmed.length >= 8) {
    if (imeiCheckTimer) clearTimeout(imeiCheckTimer)
    imeiCheckTimer = setTimeout(async () => {
      imeiChecking.value = true
      try {
        const data = await checkImeiExists(trimmed)
        if (data?.exists) {
          const status = data.record?.status === 'sold' ? '已售出' : '已在库'
          imeiError.value = `IMEI ${trimmed} ${status}，无法重复入库`
        } else {
          imeiError.value = ''
        }
      } catch {
        // 后端校验失败时不阻塞用户操作，仅静默跳过
      } finally {
        imeiChecking.value = false
      }
    }, 300)
  } else {
    imeiError.value = ''
  }
})

function handleAdd() {
  const imei = imeiInput.value.trim()
  if (!imei) { ElMessage.warning('请输入 IMEI'); return }
  if (!modelId.value) { ElMessage.warning('请选择品牌和型号'); return }
  const m = models.value.find((x: any) => x.id === modelId.value)
  if (!m) return
  // 本地清单重复校验
  if (items.value.some(i => i.imei === imei)) { ElMessage.warning('IMEI 已存在于本次入库清单中'); return }
  // 后端校验未通过时禁止添加
  if (imeiError.value) { ElMessage.warning(imeiError.value); return }
  items.value.push({
    brandName: brands.value.find((b: any) => b.id === brandId.value)?.name || '',
    modelName: `${m.name} ${m.color || ''} ${m.memory||''}`.trim(),
    imei, imei2: imei2Input.value.trim() || undefined, snCode: snCodeInput.value.trim() || undefined,
    unitPrice: 0, modelId: modelId.value,
  })
  imeiError.value = ''
  imeiInput.value = ''; imei2Input.value = ''; snCodeInput.value = ''
  nextTick(() => { imeiRef.value?.focus() })
}

async function handleConfirm() {
  showConfirm.value = false
  try {
    await quickConfirmPurchaseEntry({
      supplierId: supplierId.value, storeId: userStore.effectiveStoreId || undefined,
      items: items.value.map(i => ({ modelId: i.modelId, newModel: i.newModel, imei: i.imei, imei2: i.imei2, snCode: i.snCode, unitPrice: i.unitPrice })),
    })
    ElMessage.success({ message: `入库成功！共 ${items.value.length} 台`, duration: 3000 })
    items.value = []; supplierId.value = null; brandId.value = null; modelId.value = null
    supplierSearchText.value = ''
    imeiInput.value = ''
    nextTick(() => imeiRef.value?.focus())
  } catch (e: any) { ElMessage.error(e?.message || '入库失败') }
}
</script>

<style scoped>
.photo-form { display:flex; flex-direction:column; gap:8px; }
.photo-hint { margin:0 0 8px; font-size:12px; color:var(--text-tertiary); line-height:1.6; }
.field-label { display: block; font-size: 14px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px; }
.supplier-add-row { padding: 6px 12px; border-top: 1px solid var(--border); }
.supplier-add-btn { display: flex; align-items: center; gap: 6px; width: 100%; padding: 8px 12px; border: none; border-radius: var(--radius-sm); background: var(--primary-light); color: var(--primary); font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); text-align: left; }
.supplier-add-btn:hover { background: var(--primary); color: #fff; }
.section-divider { text-align: center; font-size: 13px; color: var(--text-tertiary); margin: 20px 0; letter-spacing: 1.5px; position: relative; }
.section-divider::before, .section-divider::after { content: ''; position: absolute; top: 50%; width: 60px; height: 1px; background: var(--border); }
.section-divider::before { right: calc(50% + 50px); }
.section-divider::after { left: calc(50% + 50px); }
.add-row { display: flex; gap: 12px; align-items: flex-end; margin-bottom: 16px; flex-wrap: wrap; }
.imei-row { display: flex; gap: 12px; }
.imei-input-wrap { flex: 1; }
.input-field { width: 100%; height: 48px; padding: 0 16px; font-size: 17px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.input-field:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.input-field::placeholder { color: var(--text-tertiary); font-size: 15px; }
.input-field.input-error { border-color: var(--danger); box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.imei-input-wrap { position: relative; }
.imei-error-tip { display: flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 13px; color: var(--danger); }
.imei-checking { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 13px; color: var(--text-tertiary); }
.checking-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.extra-row { display: flex; gap: 12px; margin-top: 12px; }
.extra-field { display: flex; align-items: center; gap: 8px; flex: 1; }
.extra-label { font-size: 13px; color: var(--text-tertiary); white-space: nowrap; font-weight: 500; }
.extra-input { flex: 1; height: 42px; padding: 0 14px; font-size: 15px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.extra-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.extra-input::placeholder { color: var(--text-tertiary); font-size: 14px; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; height: 48px; padding: 0 24px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); flex-shrink: 0; }
.action-btn:hover { background: var(--primary-dark); }
.items-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.item-row { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: var(--radius); }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 16px; font-weight: 500; color: var(--text); }
.item-imei { font-size: 14px; color: var(--text-tertiary); font-family: monospace; margin-top: 2px; }
.item-price { font-size: 17px; font-weight: 600; color: var(--text); font-family: monospace; white-space: nowrap; }
.item-del { width: 34px; height: 34px; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(239,68,68,0.1); color: var(--danger); cursor: pointer; transition: var(--transition); }
.item-del:hover { background: var(--danger); color: #fff; }
.summary-bar { padding: 14px 20px; border-radius: var(--radius-sm); font-size: 17px; font-weight: 600; color: var(--text); text-align: right; margin-bottom: 20px; }
.confirm-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 56px; border: none; border-radius: var(--radius); background: var(--success); color: #fff; font-size: 20px; font-weight: 700; cursor: pointer; font-family: inherit; transition: var(--transition); }
.confirm-btn:hover { filter: brightness(0.92); box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
:deep(.el-select) { --el-component-size: 44px; }
:deep(.el-input-number) { --el-component-size: 44px; }
</style>
).test(value)) return false
  let sum=0
  for(let i=0;i<15;i++){
    let digit=Number(value[i])
    if(i%2===1){digit*=2;if(digit>9)digit-=9}
    sum+=digit
  }
  return sum%10===0
}
async function addPhotoItem() {
  if (!photoReviewed.value) return
  const values=photoFields.value
  const imei=values.imei1.trim()
  const imei2=values.imei2.trim()
  if(!photoImeiValid(imei) || (imei2 && !photoImeiValid(imei2)) || (imei2 && imei===imei2)){
    ElMessage.warning('IMEI 校验失败，请核对图片')
    return
  }
  if(items.value.some(item=>[item.imei,item.imei2].includes(imei) || (!!imei2 && [item.imei,item.imei2].includes(imei2)))){
    ElMessage.warning('设备已存在于本次入库清单')
    return
  }
  try {
    const checks=await Promise.all([imei,...(imei2?[imei2]:[])].map(code=>checkImeiExists(code)))
    if(checks.some(result=>result?.exists)){
      ElMessage.warning('设备编号已存在系统中，无法重复入库')
      return
    }
  } catch {
    ElMessage.warning('设备编号查重失败，请检查网络后重试')
    return
  }
  let model:any=null
  if(photoProductMode.value==='existing'){
    model=photoAvailableModels.value.find(m=>m.id===photoModelId.value)
    if(!model){ElMessage.warning('请选择已有商品规格');return}
  }else if(![values.brand,values.productName,values.memory,values.color].every(s=>s.trim())){
    ElMessage.warning('新商品需要品牌、名称、内存和颜色')
    return
  }
  items.value.push({
    brandName:model?.brand?.name || values.brand.trim(),
    modelName:model ? [model.name,model.color,model.memory].filter(Boolean).join(' ') : [values.productName,values.color,values.memory].filter(Boolean).join(' '),
    imei, imei2:imei2 || undefined, snCode:values.sn.trim() || undefined,
    modelId:model?.id,
    newModel:photoProductMode.value==='new' ? {brand:values.brand.trim(), name:values.productName.trim(), color:values.color.trim(), memory:values.memory.trim()} : undefined,
    unitPrice:0,
  })
  photoVisible.value=false
  ElMessage.success('已加入入库清单，最终确认前不会保存设备')
}
const userStore = useUserStore()
const imeiRef = ref<HTMLInputElement>()
const imei2Ref = ref<HTMLInputElement>()
const suppliers = ref<any[]>([])
const brands = ref<any[]>([])
const models = ref<any[]>([])
const supplierId = ref<number | null>(null)
const supplierLoading = ref(false)
const supplierSearchText = ref('')
const addSupplierVisible = ref(false)
const addSupplierSaving = ref(false)
const addSupplierForm = ref({ name: '', contact_person: '', phone: '', address: '' })
const brandId = ref<number | null>(null)
const modelId = ref<number | null>(null)
const imeiInput = ref('')
const imei2Input = ref('')
const snCodeInput = ref('')
const items = ref<Array<{ brandName: string; modelName: string; imei: string; imei2?: string; snCode?: string; unitPrice: number; modelId: number }>>([])
const showConfirm = ref(false)
const imeiError = ref('')
const imeiChecking = ref(false)
let imeiCheckTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  try { suppliers.value = await getSuppliers() } catch {}
  try { brands.value = await getBrands() } catch {}
  nextTick(() => imeiRef.value?.focus())
})

async function onBrandChange() {
  modelId.value = null
  if (!brandId.value) { models.value = []; return }
  try { models.value = await getModels(brandId.value) } catch { models.value = [] }
}

// ---- 供应商：远程过滤 + 快捷新增 ----
async function searchSuppliers(query: string) {
  supplierSearchText.value = query.trim()
  supplierLoading.value = true
  try {
    suppliers.value = await getSuppliers(supplierSearchText.value || undefined)
  } catch {
    suppliers.value = []
  } finally {
    supplierLoading.value = false
  }
}

async function onSupplierDropdownOpen(open: boolean) {
  if (open) {
    supplierSearchText.value = ''
    supplierLoading.value = true
    try { suppliers.value = await getSuppliers() } catch { suppliers.value = [] }
    finally { supplierLoading.value = false }
  }
}

function openAddSupplier() {
  addSupplierForm.value = { name: supplierSearchText.value, contact_person: '', phone: '', address: '' }
  addSupplierVisible.value = true
}

async function saveSupplier() {
  if (!addSupplierForm.value.name.trim()) {
    ElMessage.warning('请填写供应商名称')
    return
  }
  addSupplierSaving.value = true
  try {
    const created = await createSupplier({
      name: addSupplierForm.value.name,
      contact_person: addSupplierForm.value.contact_person,
      phone: addSupplierForm.value.phone,
      address: addSupplierForm.value.address,
    })
    supplierId.value = created.id
    supplierSearchText.value = ''
    addSupplierVisible.value = false
    try { suppliers.value = await getSuppliers() } catch { suppliers.value = [] }
    ElMessage.success('供应商已新增并选中')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '新增失败')
  } finally {
    addSupplierSaving.value = false
  }
}

// 扫码自动校验 IMEI 重复性（任意输入防抖触发后端校验）
watch(imeiInput, (val) => {
  const trimmed = val.trim()
  // 输入为空时清除错误
  if (!trimmed) {
    imeiError.value = ''
    if (imeiCheckTimer) { clearTimeout(imeiCheckTimer); imeiCheckTimer = null }
    return
  }
  // 先检查当前列表中是否重复（本地即时校验）
  if (items.value.some(i => i.imei === trimmed)) {
    imeiError.value = 'IMEI 已存在于本次入库清单中'
    return
  }
  // 输入达到一定长度后自动触发后端校验（不依赖固定 15 位，兼容双卡/境外设备）
  if (trimmed.length >= 8) {
    if (imeiCheckTimer) clearTimeout(imeiCheckTimer)
    imeiCheckTimer = setTimeout(async () => {
      imeiChecking.value = true
      try {
        const data = await checkImeiExists(trimmed)
        if (data?.exists) {
          const status = data.record?.status === 'sold' ? '已售出' : '已在库'
          imeiError.value = `IMEI ${trimmed} ${status}，无法重复入库`
        } else {
          imeiError.value = ''
        }
      } catch {
        // 后端校验失败时不阻塞用户操作，仅静默跳过
      } finally {
        imeiChecking.value = false
      }
    }, 300)
  } else {
    imeiError.value = ''
  }
})

function handleAdd() {
  const imei = imeiInput.value.trim()
  if (!imei) { ElMessage.warning('请输入 IMEI'); return }
  if (!modelId.value) { ElMessage.warning('请选择品牌和型号'); return }
  const m = models.value.find((x: any) => x.id === modelId.value)
  if (!m) return
  // 本地清单重复校验
  if (items.value.some(i => i.imei === imei)) { ElMessage.warning('IMEI 已存在于本次入库清单中'); return }
  // 后端校验未通过时禁止添加
  if (imeiError.value) { ElMessage.warning(imeiError.value); return }
  items.value.push({
    brandName: brands.value.find((b: any) => b.id === brandId.value)?.name || '',
    modelName: `${m.name} ${m.color || ''} ${m.memory||''}`.trim(),
    imei, imei2: imei2Input.value.trim() || undefined, snCode: snCodeInput.value.trim() || undefined,
    unitPrice: 0, modelId: modelId.value,
  })
  imeiError.value = ''
  imeiInput.value = ''; imei2Input.value = ''; snCodeInput.value = ''
  nextTick(() => { imeiRef.value?.focus() })
}

async function handleConfirm() {
  showConfirm.value = false
  try {
    await quickConfirmPurchaseEntry({
      supplierId: supplierId.value, storeId: userStore.effectiveStoreId || undefined,
      items: items.value.map(i => ({ modelId: i.modelId, imei: i.imei, imei2: i.imei2, snCode: i.snCode, unitPrice: i.unitPrice })),
    })
    ElMessage.success({ message: `入库成功！共 ${items.value.length} 台`, duration: 3000 })
    items.value = []; supplierId.value = null; brandId.value = null; modelId.value = null
    supplierSearchText.value = ''
    imeiInput.value = ''
    nextTick(() => imeiRef.value?.focus())
  } catch (e: any) { ElMessage.error(e?.message || '入库失败') }
}
</script>

<style scoped>
.field-label { display: block; font-size: 14px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px; }
.supplier-add-row { padding: 6px 12px; border-top: 1px solid var(--border); }
.supplier-add-btn { display: flex; align-items: center; gap: 6px; width: 100%; padding: 8px 12px; border: none; border-radius: var(--radius-sm); background: var(--primary-light); color: var(--primary); font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); text-align: left; }
.supplier-add-btn:hover { background: var(--primary); color: #fff; }
.section-divider { text-align: center; font-size: 13px; color: var(--text-tertiary); margin: 20px 0; letter-spacing: 1.5px; position: relative; }
.section-divider::before, .section-divider::after { content: ''; position: absolute; top: 50%; width: 60px; height: 1px; background: var(--border); }
.section-divider::before { right: calc(50% + 50px); }
.section-divider::after { left: calc(50% + 50px); }
.add-row { display: flex; gap: 12px; align-items: flex-end; margin-bottom: 16px; flex-wrap: wrap; }
.imei-row { display: flex; gap: 12px; }
.imei-input-wrap { flex: 1; }
.input-field { width: 100%; height: 48px; padding: 0 16px; font-size: 17px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.input-field:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.input-field::placeholder { color: var(--text-tertiary); font-size: 15px; }
.input-field.input-error { border-color: var(--danger); box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.imei-input-wrap { position: relative; }
.imei-error-tip { display: flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 13px; color: var(--danger); }
.imei-checking { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 13px; color: var(--text-tertiary); }
.checking-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.extra-row { display: flex; gap: 12px; margin-top: 12px; }
.extra-field { display: flex; align-items: center; gap: 8px; flex: 1; }
.extra-label { font-size: 13px; color: var(--text-tertiary); white-space: nowrap; font-weight: 500; }
.extra-input { flex: 1; height: 42px; padding: 0 14px; font-size: 15px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.extra-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.extra-input::placeholder { color: var(--text-tertiary); font-size: 14px; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; height: 48px; padding: 0 24px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); flex-shrink: 0; }
.action-btn:hover { background: var(--primary-dark); }
.items-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.item-row { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: var(--radius); }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 16px; font-weight: 500; color: var(--text); }
.item-imei { font-size: 14px; color: var(--text-tertiary); font-family: monospace; margin-top: 2px; }
.item-price { font-size: 17px; font-weight: 600; color: var(--text); font-family: monospace; white-space: nowrap; }
.item-del { width: 34px; height: 34px; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(239,68,68,0.1); color: var(--danger); cursor: pointer; transition: var(--transition); }
.item-del:hover { background: var(--danger); color: #fff; }
.summary-bar { padding: 14px 20px; border-radius: var(--radius-sm); font-size: 17px; font-weight: 600; color: var(--text); text-align: right; margin-bottom: 20px; }
.confirm-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 56px; border: none; border-radius: var(--radius); background: var(--success); color: #fff; font-size: 20px; font-weight: 700; cursor: pointer; font-family: inherit; transition: var(--transition); }
.confirm-btn:hover { filter: brightness(0.92); box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
:deep(.el-select) { --el-component-size: 44px; }
:deep(.el-input-number) { --el-component-size: 44px; }
</style>

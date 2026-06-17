<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <router-link to="/after-sales/list" class="pbm-back-link">← 返回</router-link>
        <h1 class="pbm-title">新建售后工单</h1>
        <span class="pbm-subtitle">New After-Sales Order</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-form-wrap">
        <el-form label-position="top" class="pbm-form">
          <div class="pbm-form-grid">
            <el-form-item label="手机 IMEI" required>
              <el-input v-model="imeiSearch" placeholder="扫码或输入 IMEI" @keyup.enter="searchImei">
                <template #append>
                  <el-button @click="searchImei">搜索</el-button>
                </template>
              </el-input>
              <div v-if="matchedImei" class="pbm-match-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <div><strong>{{ matchedImei.brandName }} {{ matchedImei.modelName }}</strong></div>
                  <div style="font-size:12px;color:#666;">{{ matchedImei.color }} / {{ matchedImei.storage }}</div>
                  <div v-if="matchedImei.saleRecord" style="font-size:12px;color:#666;">售出时间：{{ formatDate(matchedImei.saleRecord.created_at) }}</div>
                  <div v-else style="font-size:12px;color:#666;">状态：{{ matchedImei.status === 'in_stock' ? '在库' : matchedImei.status }}</div>
                </div>
              </div>
              <div v-if="matchError" class="pbm-error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>{{ matchError }}</span>
              </div>
            </el-form-item>

            <div>
              <el-form-item label="客户姓名" required>
                <el-input v-model="form.customer_name" placeholder="客户姓名" />
              </el-form-item>
              <el-form-item label="客户电话">
                <el-input v-model="form.customer_phone" placeholder="客户电话" />
              </el-form-item>
              <el-form-item label="客户地址">
                <el-input v-model="form.customer_address" placeholder="客户地址" />
              </el-form-item>
            </div>
          </div>

          <el-form-item label="故障描述 / 售后原因" required>
            <el-input v-model="form.fault_description" type="textarea" :rows="3" placeholder="请描述故障现象或售后原因" />
          </el-form-item>

          <el-form-item label="检测结果">
            <el-select v-model="form.detection_result" placeholder="检测结果" clearable style="width:100%;">
              <el-option label="确认故障" value="确认故障" />
              <el-option label="无故障" value="无故障" />
              <el-option label="需联系供应商" value="需联系供应商" />
            </el-select>
          </el-form-item>

          <el-form-item label="处理方式">
            <el-select v-model="form.process_type" placeholder="处理方式" clearable style="width:100%;">
              <el-option label="维修" value="repair" />
              <el-option label="换货" value="exchange" />
              <el-option label="退款" value="refund" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="form.process_type === 'repair'" label="维修级别">
            <el-select v-model="form.repair_level" placeholder="维修级别" clearable style="width:100%;">
              <el-option label="当场维修" value="minor" />
              <el-option label="店里维修" value="medium" />
              <el-option label="返厂维修" value="major" />
            </el-select>
          </el-form-item>

          <el-form-item label="费用">
            <el-input v-model.number="form.cost" placeholder="费用" type="number" />
          </el-form-item>

          <el-form-item label="供应商联系人">
            <el-input v-model="form.supplier_contact" placeholder="供应商联系人" />
          </el-form-item>

          <el-form-item label="供应商状态">
            <el-select v-model="form.supplier_status" placeholder="供应商状态" clearable style="width:100%;">
              <el-option label="无需供应商" value="none" />
              <el-option label="待联系" value="pending" />
              <el-option label="处理中" value="in_progress" />
              <el-option label="已处理" value="completed" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <div class="pbm-form-actions">
              <button class="pbm-btn-accent" @click="handleSubmit" :disabled="submitting">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>{{ submitting ? '提交中...' : '创建工单' }}</span>
              </button>
              <router-link to="/after-sales/list"><button class="pbm-btn-plain">取消</button></router-link>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createAfterSale } from '@/api/after-sales'
import request from '@/api/request'

const router = useRouter()
const submitting = ref(false)
const imeiSearch = ref('')
const matchedImei = ref<any>(null)
const matchError = ref('')
const form = reactive({
  customer_name: '',
  customer_phone: '',
  customer_address: '',
  fault_description: '',
  detection_result: '',
  process_type: '',
  repair_level: '',
  cost: 0,
  cost_remark: '',
  supplier_contact: '',
  supplier_status: 'none',
  supplier_result: '',
})

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function searchImei() {
  matchError.value = ''
  if (!imeiSearch.value.trim()) {
    ElMessage.warning('请输入 IMEI')
    return
  }
  try {
    const res: any = await request.get('/inventory/imei-query', { params: { imei: imeiSearch.value.trim() } })
    matchedImei.value = res.data
    // 查到后自动填充客户信息
    if (res.data?.saleRecord) {
      const sr = res.data.saleRecord
      if (sr.customer_name && sr.customer_name !== '-') form.customer_name = sr.customer_name
      if (sr.customer_phone) form.customer_phone = sr.customer_phone
    }
  } catch {
    matchedImei.value = null
    matchError.value = '未找到该手机，请检查 IMEI 是否正确'
  }
}

async function handleSubmit() {
  if (!matchedImei.value) {
    ElMessage.warning('请先搜索并选择手机')
    return
  }
  if (!form.customer_name.trim()) {
    ElMessage.warning('请输入客户姓名')
    return
  }
  if (!form.fault_description.trim()) {
    ElMessage.warning('请输入故障描述')
    return
  }
  submitting.value = true
  try {
    await createAfterSale({
      imei_id: matchedImei.value.id,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_address: form.customer_address,
      fault_description: form.fault_description,
      detection_result: form.detection_result || undefined,
      process_type: form.process_type || undefined,
      repair_level: form.repair_level || undefined,
      cost: form.cost || undefined,
      cost_remark: form.cost_remark || undefined,
      supplier_contact: form.supplier_contact || undefined,
      supplier_status: form.supplier_status !== 'none' ? form.supplier_status : undefined,
      supplier_result: form.supplier_result || undefined,
    })
    ElMessage.success('工单创建成功')
    router.push('/after-sales/list')
  } catch {
    // handled
  } finally {
    submitting.value = false
  }
}
</script>

<style>
.pbm-root {
  --pbm-bg: #f5f0eb;
  --pbm-surface: #ffffff;
  --pbm-surface-hover: #f0ebe5;
  --pbm-border: #e5ddd3;
  --pbm-text: #2c2418;
  --pbm-text-dim: #8a7f72;
  --pbm-accent: #c9953c;
  --pbm-accent-glow: rgba(201,149,60,0.12);
  --pbm-blue: #3b82f6;
  --pbm-blue-dim: rgba(59,130,246,0.12);
  --pbm-red: #dc3545;
  --pbm-red-dim: rgba(220,53,69,0.12);
  --pbm-radius: 6px;
  --pbm-font: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --pbm-mono: "SF Mono", "JetBrains Mono", "Cascadia Code", monospace;
}
</style>

<style scoped>
.pbm-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: var(--pbm-text);
  font-family: var(--pbm-font);
  background: var(--pbm-bg);
}

.pbm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--pbm-border);
}
.pbm-header-left { display: flex; align-items: center; gap: 12px; }
.pbm-title { font-size: 20px; font-weight: 600; letter-spacing: -0.3px; color: var(--pbm-text); margin: 0; }
.pbm-subtitle { font-size: 12px; color: var(--pbm-text-dim); letter-spacing: 0.4px; text-transform: uppercase; font-family: var(--pbm-mono); }
.pbm-back-link { font-size: 14px; color: var(--pbm-blue); text-decoration: none; }
.pbm-back-link:hover { text-decoration: underline; }

.pbm-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.pbm-form-wrap {
  max-width: 800px;
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  padding: 32px;
}

.pbm-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}

.pbm-match-box {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.7;
}
.pbm-error-box {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ff4d4f;
}

.pbm-btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--pbm-accent);
  color: #fff;
  border: none;
  border-radius: var(--pbm-radius);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
}
.pbm-btn-accent:hover { background: #dba84a; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(201,149,60,0.3); }
.pbm-btn-accent:active { transform: translateY(0); }
.pbm-btn-accent--sm { padding: 6px 14px; font-size: 12px; }
.pbm-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.pbm-btn-plain {
  padding: 8px 20px;
  background: transparent;
  color: var(--pbm-text-dim);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-plain:hover { color: var(--pbm-text); border-color: var(--pbm-text-dim); }

.pbm-form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.pbm-form :deep(.el-form-item__label) { font-size: 12px; color: var(--pbm-text-dim); font-weight: 600; letter-spacing: 0.3px; padding-bottom: 4px; }
.pbm-form :deep(.el-input__wrapper) { box-shadow: 0 0 0 1px var(--pbm-border) inset; border-radius: var(--pbm-radius); }
.pbm-form :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px var(--pbm-accent) inset; }
.pbm-form :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px var(--pbm-accent) inset; }
.pbm-form :deep(.el-textarea__inner) { box-shadow: 0 0 0 1px var(--pbm-border) inset; border-radius: var(--pbm-radius); }
.pbm-form :deep(.el-textarea__inner:focus) { box-shadow: 0 0 0 1px var(--pbm-accent) inset; }
</style>

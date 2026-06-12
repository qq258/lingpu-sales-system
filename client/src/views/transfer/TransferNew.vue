<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">发起调货</h1>
        <span class="pbm-subtitle">New Transfer Request</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-section-card">
        <h3 class="pbm-section-card-title">调货信息</h3>
        <el-form :model="form" label-width="120px">
          <el-form-item label="来源门店">
            <span style="font-weight: 600;">{{ userStore.currentStoreName }}</span>
          </el-form-item>
          <el-form-item label="目标门店" required>
            <el-select v-model="form.toStoreId" placeholder="选择目标门店" filterable style="width: 300px;">
              <el-option
                v-for="s in availableTargetStores"
                :key="s.id"
                :label="s.name"
                :value="s.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" style="width: 300px;" placeholder="可选备注" />
          </el-form-item>
        </el-form>
      </div>

      <div class="pbm-section-card">
        <h3 class="pbm-section-card-title">选择调货商品</h3>
        <SkuSelector mode="sale" @select="addSku" />

        <div class="pbm-table-wrapper">
          <el-table :data="items" border stripe max-height="400" element-loading-background="rgba(245,240,235,0.8)">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="商品" min-width="200">
              <template #default="{ row }">
                <el-tag size="small" type="primary">{{ row.brandName }}</el-tag>
                {{ row.modelName }} - {{ row.color }} / {{ row.storage }}
              </template>
            </el-table-column>
            <el-table-column label="可用库存" width="100">
              <template #default="{ row }">
                <el-tag :type="(row.stock ?? 0) <= 0 ? 'danger' : 'success'" size="small">
                  {{ row.stock ?? 0 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="调货数量" width="140">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="row.stock || 999"
                  size="small"
                  controls-position="right"
                  style="width: 130px;"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row, $index }">
                <button class="pbm-icon-btn pbm-icon-btn--sm pbm-icon-btn--danger" title="删除" @click="removeItem($index)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-if="items.length === 0" class="pbm-table-empty">请扫码或搜索添加调货商品</div>
      </div>

      <div class="pbm-form-actions">
        <button class="pbm-btn-plain" @click="resetForm">重置</button>
        <button
          class="pbm-btn-accent"
          :disabled="!form.toStoreId || items.length === 0"
          @click="handleSubmit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{{ submitLoading ? '提交中...' : '提交调货申请' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { createTransfer } from '@/api/transfer'
import SkuSelector from '@/components/SkuSelector.vue'

const userStore = useUserStore()

const form = ref({ toStoreId: null as number | null, remark: '' })
const items = ref<Array<{
  skuId: number
  brandName: string
  modelName: string
  color: string
  storage: string
  stock: number
  quantity: number
}>>([])
const submitLoading = ref(false)

const availableTargetStores = computed(() => {
  return userStore.availableStores.filter(s => s.id !== userStore.effectiveStoreId)
})

function addSku(sku: any) {
  const existing = items.value.find(i => i.skuId === sku.id)
  if (existing) {
    existing.quantity += 1
    ElMessage.info('已增加数量')
  } else {
    items.value.push({
      skuId: sku.id,
      brandName: sku.brandName || '',
      modelName: sku.modelName || '',
      color: sku.color || '',
      storage: sku.storage || '',
      stock: sku.stock ?? 0,
      quantity: 1,
    })
    ElMessage.success('已添加商品')
  }
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

async function handleSubmit() {
  if (!form.value.toStoreId) {
    ElMessage.warning('请选择目标门店')
    return
  }
  if (items.value.length === 0) {
    ElMessage.warning('请添加调货商品')
    return
  }

  submitLoading.value = true
  try {
    await createTransfer({
      toStoreId: form.value.toStoreId,
      items: items.value.map(i => ({ skuId: i.skuId, quantity: i.quantity })),
      remark: form.value.remark,
    })
    ElMessage.success('调货申请已提交')
    resetForm()
  } catch {
    // handled by interceptor
  } finally {
    submitLoading.value = false
  }
}

function resetForm() {
  form.value = { toStoreId: null, remark: '' }
  items.value = []
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
.pbm-header-left { display: flex; align-items: baseline; gap: 12px; }
.pbm-title { font-size: 20px; font-weight: 600; letter-spacing: -0.3px; color: var(--pbm-text); margin: 0; }
.pbm-subtitle { font-size: 12px; color: var(--pbm-text-dim); letter-spacing: 0.4px; text-transform: uppercase; font-family: var(--pbm-mono); }

.pbm-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 24px 24px;
  gap: 16px;
}

.pbm-section-card {
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  padding: 20px;
  margin-bottom: 0;
}
.pbm-section-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--pbm-text);
  margin: 0 0 16px;
}
.pbm-table-empty {
  text-align: center;
  padding: 20px;
  color: var(--pbm-text-dim);
  font-size: 13px;
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
}
.pbm-btn-accent:hover { background: #dba84a; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(201,149,60,0.3); }
.pbm-btn-accent:active { transform: translateY(0); }
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

.pbm-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--pbm-text-dim);
  cursor: pointer;
  transition: all 0.12s;
}
.pbm-icon-btn:hover { background: var(--pbm-blue-dim); color: var(--pbm-blue); }
.pbm-icon-btn--danger:hover { background: var(--pbm-red-dim); color: var(--pbm-red); }
.pbm-icon-btn--sm { width: 24px; height: 24px; }

.pbm-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.pbm-table-wrapper :deep(.el-table) {
  --el-table-border-color: var(--pbm-border);
  --el-table-header-bg-color: #f0ebe5;
  --el-table-tr-bg-color: #fff;
  --el-table-row-hover-bg-color: var(--pbm-surface-hover);
  --el-table-current-row-bg-color: rgba(201,149,60,0.06);
  --el-table-text-color: var(--pbm-text);
  --el-table-header-text-color: var(--pbm-text-dim);
  background: var(--pbm-surface);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
}
.pbm-table-wrapper :deep(.el-table__header-wrapper) { border-bottom: 1px solid var(--pbm-border); }
.pbm-table-wrapper :deep(.el-table__header th) { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.pbm-table-wrapper :deep(.el-table__body tr.el-table__row--striped) { background: #faf7f4; }
.pbm-table-wrapper :deep(.el-table__inner-wrapper::before),
.pbm-table-wrapper :deep(.el-table__inner-wrapper::after) { display: none; }
.pbm-table-wrapper :deep(.el-table__body-wrapper) { overflow-y: auto; }
.pbm-table-wrapper :deep(.el-table__body-wrapper::-webkit-scrollbar) { width: 5px; }
.pbm-table-wrapper :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) { background: var(--pbm-border); border-radius: 3px; }

:deep(.el-form-item__label) { color: var(--pbm-text-dim); font-size: 13px; }
:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-textarea__inner) {
  background: #f5f0eb;
  border: 1px solid var(--pbm-border);
  box-shadow: none;
  border-radius: var(--pbm-radius);
  color: var(--pbm-text);
}
:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover),
:deep(.el-textarea__inner:hover) { border-color: var(--pbm-text-dim); }
:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focus),
:deep(.el-textarea__inner:focus) { border-color: var(--pbm-accent); box-shadow: 0 0 0 2px var(--pbm-accent-glow); }
:deep(.el-input__inner) { color: var(--pbm-text); }
:deep(.el-input__inner::placeholder) { color: rgba(138,127,114,0.4); }
:deep(.el-input-number__increase),
:deep(.el-input-number__decrease) { background: #f0ebe5; color: var(--pbm-text-dim); border-color: var(--pbm-border); }

.pbm-body::-webkit-scrollbar { width: 4px; }
.pbm-body::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
</style>

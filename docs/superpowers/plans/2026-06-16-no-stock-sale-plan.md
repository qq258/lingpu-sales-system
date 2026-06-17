# 无库存销售功能 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 portal 销售开单页面增加"无库存销售"模式，支持手动录入品牌型号、扫码录入 IMEI，收款后自动补建品牌型号和库存记录。

**Architecture:** 在现有 Sale.vue 中集成，通过 radio 切换普通/无库存销售模式。后端新增 `POST /sales/no-stock` 接口处理无库存销售的完整事务（品牌型号创建 + IMEI 录入 + 销售订单 + 库存记录）。扩展 `GET /products/models` 支持 keyword 模糊搜索。

**Tech Stack:** Vue 3 + Composition API, Element Plus, Express + Prisma + SQLite

---

### Task 1: 后端 — GET /products/models 增加 keyword 搜索

**Files:**
- Modify: `server/src/routes/products.ts`

- [ ] **Step 1: 在 GET /models 路由中添加 keyword 参数**

```typescript
// server/src/routes/products.ts — GET /models 路由
router.get('/models', async (req: Request, res: Response) => {
  try {
    const { brand_id, keyword } = req.query;
    const where: any = {};
    if (brand_id) where.brand_id = parseInt(brand_id as string);
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { brand: { name: { contains: keyword as string } } },
      ];
    }
    const models = await prisma.pdt_model.findMany({
      where,
      orderBy: { id: 'asc' },
      include: { brand: { select: { id: true, name: true } } },
    });
    const r: ApiResponse = { code: 200, message: 'success', data: models };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});
```

### Task 2: 后端 — POST /sales/no-stock 无库存销售接口

**Files:**
- Modify: `server/src/routes/sales.ts`

- [ ] **Step 1: 新增 POST /sales/no-stock 路由**

在 `server/src/routes/sales.ts` 中 `router.use(storeScopeMiddleware);` 之后、已有路由之前，新增路由：

```typescript
router.post('/sales/no-stock', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }

    const { items, actual_amount, customer_name, customer_address, customer_phone, remark } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      const r: ApiResponse = { code: 400, message: '商品列表不能为空' };
      return res.status(400).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
    if (!store) {
      const r: ApiResponse = { code: 404, message: '门店不存在' };
      return res.status(404).json(r);
    }

    const orderNo = await generateOrderNo('SA', store.code);

    const result = await prisma.$transaction(async (tx) => {
      interface ItemInput {
        brand_name: string;
        model_name: string;
        model_id?: number | null;
        color?: string;
        storage?: string;
        imei: string;
        imei2?: string | null;
        sn_code?: string | null;
        unit_price: number;
      }

      const processedItems: Array<{
        modelId: number;
        brandName: string;
        modelName: string;
        color: string;
        storage: string;
        imei: string;
        imei2: string | null;
        sn_code: string | null;
        unitPrice: number;
      }> = [];

      for (const item of items) {
        let modelId = item.model_id;

        if (!modelId) {
          // 查找或创建品牌
          let brand = await tx.pdt_brand.findFirst({
            where: { name: item.brand_name },
          });
          if (!brand) {
            brand = await tx.pdt_brand.create({
              data: { name: item.brand_name },
            });
          }

          // 查找或创建型号
          let model = await tx.pdt_model.findFirst({
            where: { brand_id: brand.id, name: item.model_name },
          });
          if (!model) {
            model = await tx.pdt_model.create({
              data: {
                brand_id: brand.id,
                name: item.model_name,
                color: item.color || '',
                ram: item.storage?.split('/')[0] || '',
                rom: item.storage?.split('/')[1] || '',
                sale_price: item.unit_price,
              },
            });
          }
          modelId = model.id;
        }

        // 创建 IMEI 记录（已售状态）
        await tx.wh_inventory_imei.create({
          data: {
            model_id: modelId,
            store_id: storeId,
            imei: item.imei,
            imei2: item.imei2 || null,
            sn_code: item.sn_code || null,
            status: 'sold',
            sold_at: new Date(),
          },
        });

        // 获取型号完整信息
        const modelRec = await tx.pdt_model.findUnique({
          where: { id: modelId },
          include: { brand: { select: { name: true } } },
        });

        processedItems.push({
          modelId,
          brandName: modelRec?.brand?.name || item.brand_name,
          modelName: modelRec?.name || item.model_name,
          color: modelRec?.color || item.color || '',
          storage: [modelRec?.ram, modelRec?.rom].filter(Boolean).join('/') || item.storage || '',
          imei: item.imei,
          imei2: item.imei2 || null,
          sn_code: item.sn_code || null,
          unitPrice: item.unit_price,
        });
      }

      // 更新 wh_inventory 汇总库存
      const modelGroups: Record<number, number> = {};
      for (const pi of processedItems) {
        modelGroups[pi.modelId] = (modelGroups[pi.modelId] || 0) + 1;
      }

      for (const [modelIdStr, count] of Object.entries(modelGroups)) {
        const modelId = parseInt(modelIdStr);
        const pi = processedItems.find(p => p.modelId === modelId)!;

        let inventory = await tx.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id: modelId, store_id: storeId } },
        });

        const qtyBefore = inventory?.quantity || 0;
        // 汇总库存 +count 再 -count，净增 0 但确保记录存在
        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: { quantity: qtyBefore },
          });
        } else {
          await tx.wh_inventory.create({
            data: {
              model_id: modelId,
              store_id: storeId,
              quantity: 0,
              brand_name: pi.brandName,
              model_name: pi.modelName,
              color: pi.color,
              storage: pi.storage,
              sale_price: pi.unitPrice,
            },
          });
        }

        await tx.wh_inventory_log.create({
          data: {
            model_id: modelId,
            store_id: storeId,
            change_type: 'sale_out',
            qty_before: qtyBefore,
            qty_change: 0,
            qty_after: qtyBefore,
            ref_type: 'sale_order',
            ref_id: 0, // placeholder, will update after sale order created
            operator_id: req.user!.userId,
            remark: `无库存销售: ${orderNo}`,
          },
        });
      }

      // 创建销售订单
      const totalAmount = processedItems.reduce((s, i) => s + i.unitPrice, 0);
      const firstItem = processedItems[0];
      const firstModelName = `${firstItem.brandName} ${firstItem.modelName} - ${firstItem.color}/${firstItem.storage}`.trim();

      const saleOrder = await tx.sale_order.create({
        data: {
          order_no: orderNo,
          store_id: storeId,
          model_id: firstItem.modelId,
          model_name: firstModelName,
          quantity: processedItems.length,
          unit_price: firstItem.unitPrice || 0,
          total_amount: totalAmount,
          actual_amount,
          change_amount: Math.max(0, actual_amount - totalAmount),
          customer_name,
          customer_address,
          customer_phone,
          remark,
          operator_id: req.user!.userId,
        },
      });

      // 创建销售订单明细
      for (const pi of processedItems) {
        const modelNameStr = `${pi.brandName} ${pi.modelName} - ${pi.color}/${pi.storage}`.trim();
        await tx.sale_order_item.create({
          data: {
            sale_order_id: saleOrder.id,
            model_id: pi.modelId,
            model_name: modelNameStr,
            imei: pi.imei,
            imei2: pi.imei2,
            sn_code: pi.sn_code,
            quantity: 1,
            unit_price: pi.unitPrice,
            total_price: pi.unitPrice,
          },
        });
      }

      // 更新日志的 ref_id
      await tx.wh_inventory_log.updateMany({
        where: { ref_type: 'sale_order', ref_id: 0 },
        data: { ref_id: saleOrder.id },
      });

      // 更新 sale_order 的 model_name 为完整商品列表
      const fullModelName = processedItems.map(p => `${p.brandName} ${p.modelName} - ${p.color}/${p.storage}`.trim()).join('; ');
      return tx.sale_order.update({
        where: { id: saleOrder.id },
        data: { model_name: fullModelName },
      });
    });

    const r: ApiResponse = { code: 200, message: '开单成功', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '开单失败' };
    return res.status(500).json(r);
  }
});
```

### Task 3: 前端 API — 新增 no-stock 接口调用

**Files:**
- Modify: `portal/src/api/product.ts`
- Modify: `portal/src/api/sales.ts`

- [ ] **Step 1: product.ts 增加 keyword 参数**

```typescript
// portal/src/api/product.ts
export async function getModels(brandId?: number, keyword?: string) {
  const params: any = {};
  if (brandId) params.brand_id = brandId;
  if (keyword) params.keyword = keyword;
  const res: any = await request.get('/products/models', { params })
  return res.data || []
}
```

- [ ] **Step 2: sales.ts 新增 createNoStockSale**

```typescript
// portal/src/api/sales.ts
export async function createNoStockSale(data: {
  items: Array<{
    brand_name: string;
    model_name: string;
    model_id?: number | null;
    color?: string;
    storage?: string;
    imei: string;
    imei2?: string | null;
    sn_code?: string | null;
    unit_price: number;
  }>;
  actual_amount: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  remark?: string;
}) {
  const res: any = await request.post('/sales/no-stock', data)
  return res.data
}
```

### Task 4: 前端 — CartItemCard 增加 IMEI1/IMEI2/SN 行内编辑

**Files:**
- Modify: `portal/src/components/CartItemCard.vue`

- [ ] **Step 1: 修改 CartItemCard.vue 增加 IMEI/SN 行内编辑**

```vue
<template>
  <div class="cart-card glass">
    <div class="cart-left">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="15" y2="10"/></svg>
      <div class="cart-details">
        <div class="cart-name">{{ item.brandName }} {{ item.modelName }}</div>
        <div class="cart-spec">{{ item.color }}{{ item.color && item.storage ? ' · ' : '' }}{{ item.storage }}</div>
        <div class="cart-imei-row">
          <span class="cart-imei-tag" v-if="item.imei">IMEI1: {{ item.imei }}</span>
          <span v-else class="cart-imei-missing" @click="editImei('1')">IMEI1: [待录入]</span>
          <span class="cart-imei-sep">|</span>
          <span class="cart-imei-tag" v-if="item.imei2">IMEI2: {{ item.imei2 }}</span>
          <span v-else class="cart-imei-missing" @click="editImei('2')">IMEI2: [待录入]</span>
          <span class="cart-imei-sep">|</span>
          <span class="cart-imei-tag" v-if="item.snCode">SN: {{ item.snCode }}</span>
          <span v-else class="cart-imei-missing" @click="editImei('sn')">SN: [待录入]</span>
        </div>
      </div>
    </div>
    <div class="cart-right">
      <el-input-number v-model="item.price" :min="0" :precision="2" :step="100" size="large" controls-position="right" style="width:150px;" />
      <button class="cart-remove" @click="$emit('remove')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- IMEI 行内编辑弹出框 -->
    <div v-if="showImeiEditor" class="imei-overlay" @click.self="showImeiEditor = false">
      <div class="imei-editor-box glass-strong">
        <div class="imei-editor-title">录入 {{ imeiEditTarget === 'sn' ? 'S/N 码' : `IMEI${imeiEditTarget}` }}</div>
        <input
          ref="imeiEditInputRef"
          v-model="imeiEditValue"
          class="imei-edit-input"
          :placeholder="imeiEditTarget === 'sn' ? '扫码或输入 S/N 码' : `扫码或输入 IMEI${imeiEditTarget}`"
          @keyup.enter="confirmImeiEdit"
        />
        <div class="imei-editor-actions">
          <button class="imei-btn imei-btn-cancel" @click="showImeiEditor = false">取消</button>
          <button class="imei-btn imei-btn-confirm" @click="confirmImeiEdit">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{ item: any }>()
const emit = defineEmits<{ remove: []; update: [field: string, value: string] }>()

const showImeiEditor = ref(false)
const imeiEditTarget = ref<'1' | '2' | 'sn'>('1')
const imeiEditValue = ref('')
const imeiEditInputRef = ref<HTMLInputElement>()

function editImei(target: '1' | '2' | 'sn') {
  imeiEditTarget.value = target
  imeiEditValue.value = ''
  showImeiEditor.value = true
  nextTick(() => imeiEditInputRef.value?.focus())
}

function confirmImeiEdit() {
  const val = imeiEditValue.value.trim()
  if (!val) {
    showImeiEditor.value = false
    return
  }
  const key = imeiEditTarget.value === '1' ? 'imei' : imeiEditTarget.value === '2' ? 'imei2' : 'snCode'
  props.item[key] = val
  emit('update', key, val)
  showImeiEditor.value = false
}
</script>

<style scoped>
.cart-card { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; gap: 16px; position: relative; }
.cart-left { display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1; }
.cart-details { min-width: 0; }
.cart-name { font-size: 16px; font-weight: 600; color: var(--text); }
.cart-spec { font-size: 14px; color: var(--text-secondary); margin-top: 2px; }
.cart-imei-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
.cart-imei-tag { font-size: 12px; color: var(--text-tertiary); font-family: monospace; }
.cart-imei-missing { font-size: 12px; color: var(--warning); cursor: pointer; font-family: monospace; text-decoration: underline dotted; }
.cart-imei-missing:hover { color: var(--danger); }
.cart-imei-sep { color: var(--border); font-size: 12px; }
.cart-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.cart-remove { width: 36px; height: 36px; border: none; border-radius: 50%; background: rgba(239,68,68,0.1); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--danger); transition: var(--transition); }
.cart-remove:hover { background: var(--danger); color: #fff; }
:deep(.el-input-number) { --el-component-size: 40px; }
:deep(.el-input-number .el-input__inner) { font-size: 15px; font-weight: 600; }

.imei-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.3); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.imei-editor-box { padding: 24px; border-radius: var(--radius); max-width: 380px; width: 90%; }
.imei-editor-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text); }
.imei-edit-input { width: 100%; height: 44px; padding: 0 14px; font-size: 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: monospace; background: #fff; }
.imei-edit-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.imei-editor-actions { display: flex; gap: 10px; margin-top: 16px; }
.imei-btn { flex: 1; height: 40px; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
.imei-btn-cancel { background: var(--border); color: var(--text-secondary); }
.imei-btn-confirm { background: var(--primary); color: #fff; }
.imei-btn:hover { filter: brightness(0.95); }
</style>
```

### Task 5: 前端 — 创建 SaveBrandDialog 组件

**Files:**
- Create: `portal/src/components/SaveBrandDialog.vue`

- [ ] **Step 1: 创建 SaveBrandDialog.vue**

```vue
<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible" class="sbd-overlay" @click.self="() => {}">
        <div class="sbd-box glass-strong">
          <div class="sbd-header">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            <span>确认新增品牌型号</span>
          </div>
          <div class="sbd-desc">以下品牌型号尚未录入系统，请确认后保存</div>

          <div class="sbd-accordion">
            <div v-for="(item, idx) in items" :key="idx" class="sbd-panel">
              <div class="sbd-panel-header" @click="togglePanel(idx)">
                <svg :class="['sbd-arrow', { open: openPanel === idx }]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                <span class="sbd-panel-title">{{ item.rawText }}</span>
              </div>
              <div v-show="openPanel === idx" class="sbd-panel-body">
                <div class="sbd-field-row">
                  <label class="sbd-label">品牌</label>
                  <input v-model="item.brand" class="sbd-field-input" placeholder="品牌名称" />
                </div>
                <div class="sbd-field-row">
                  <label class="sbd-label">型号</label>
                  <input v-model="item.model" class="sbd-field-input" placeholder="型号名称" />
                </div>
              </div>
            </div>
          </div>

          <div class="sbd-actions">
            <button class="sbd-btn sbd-btn-primary" :disabled="saving" @click="handleConfirm">
              {{ saving ? '保存中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getBrands, createBrand, createModel } from '@/api/product'

export interface BrandModelItem {
  rawText: string
  brand: string
  model: string
}

const props = defineProps<{
  visible: boolean
  items: BrandModelItem[]
}>()
const emit = defineEmits<{
  confirm: [savedItems: BrandModelItem[]]
}>()

const openPanel = ref(0)
const saving = ref(false)

function togglePanel(idx: number) {
  openPanel.value = openPanel.value === idx ? -1 : idx
}

async function handleConfirm() {
  saving.value = true
  try {
    const saved: BrandModelItem[] = []
    // 获取所有品牌列表
    const brands = await getBrands()
    for (const item of props.items) {
      if (!item.brand.trim() || !item.model.trim()) continue
      // 检查品牌是否已存在
      let brandId: number | null = null
      const existing = brands.find((b: any) => b.name === item.brand.trim())
      if (existing) {
        brandId = existing.id
      } else {
        const brandRes: any = await createBrand(item.brand.trim())
        brandId = brandRes?.data?.id || brandRes?.id
      }
      if (brandId) {
        await createModel(brandId, item.model.trim())
        saved.push({ ...item })
      }
    }
    emit('confirm', saved)
  } catch (e: any) {
    // error handled by interceptor
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.sbd-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 2100; backdrop-filter: blur(6px); }
.sbd-box { border-radius: var(--radius-lg); padding: 28px; max-width: 440px; width: 92%; }
.sbd-header { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.sbd-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; }
.sbd-accordion { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; max-height: 320px; overflow-y: auto; }
.sbd-panel { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.sbd-panel-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; cursor: pointer; background: var(--bg); user-select: none; }
.sbd-panel-header:hover { background: var(--bg-hover); }
.sbd-arrow { flex-shrink: 0; transition: transform 0.2s; }
.sbd-arrow.open { transform: rotate(0deg); }
.sbd-arrow:not(.open) { transform: rotate(-90deg); }
.sbd-panel-title { font-size: 14px; font-weight: 600; color: var(--text); }
.sbd-panel-body { padding: 12px 14px 16px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; }
.sbd-field-row { display: flex; align-items: center; gap: 12px; }
.sbd-label { font-size: 13px; color: var(--text-secondary); min-width: 40px; font-weight: 500; }
.sbd-field-input { flex: 1; height: 38px; padding: 0 12px; font-size: 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; background: #fff; font-family: inherit; }
.sbd-field-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.sbd-actions { display: flex; }
.sbd-btn { flex: 1; height: 46px; border: none; border-radius: var(--radius-sm); font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.sbd-btn-primary { background: var(--primary); color: #fff; }
.sbd-btn-primary:hover { filter: brightness(0.95); }
.sbd-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.dialog-enter-active { transition: all 0.2s ease; }
.dialog-leave-active { transition: all 0.15s ease; }
.dialog-enter-from { opacity: 0; transform: scale(0.92); }
.dialog-leave-to { opacity: 0; transform: scale(0.92); }
</style>
```

### Task 6: 前端 — Sale.vue 整体改造

**Files:**
- Modify: `portal/src/views/Sale.vue`

这是最大的改动，需要重新编写整个 Sale.vue。包含以下变更：
1. 销售类型 radio 切换
2. 无库存销售：品牌型号搜索 + 下拉匹配
3. 无库存销售：IMEI 录入区（含售出价格）
4. 购物车列表使用改造后的 CartItemCard
5. 确认收款流程：检查品牌型号 → SaveBrandDialog → 调 no-stock 接口
6. 普通销售扫码未匹配时弹窗跳转

- [ ] **Step 1: 替换 Sale.vue template 部分**

```vue
<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">销售开单</h1>
      <span class="title-line"></span>
    </div>

    <!-- 销售类型切换 -->
    <div class="glass" style="padding:16px 22px;border-radius:var(--radius);margin-bottom:16px;">
      <div class="sale-type-row">
        <span class="sale-type-label">销售类型</span>
        <label :class="['sale-type-radio', { active: saleType === 'normal' }]" @click="switchType('normal')">
          <span class="radio-dot"></span> 普通销售
        </label>
        <label :class="['sale-type-radio', { active: saleType === 'no-stock' }]" @click="switchType('no-stock')">
          <span class="radio-dot"></span> 无库存销售
        </label>
      </div>
    </div>

    <!-- 普通销售：扫码 IMEI -->
    <div v-if="saleType === 'normal'" class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <h3 class="card-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
        扫描 IMEI 码
      </h3>
      <div class="scan-row">
        <div class="scan-input-wrap">
          <input ref="scanRef" v-model="scanInput" class="scan-input" placeholder="扫码枪扫描或输入 IMEI 后按回车" @keyup.enter="handleScan" />
        </div>
      </div>
      <div v-if="scanning" class="scan-status"><span class="spinner"></span> 正在查询...</div>
      <div v-if="scanError" class="scan-error">{{ scanError }}</div>
    </div>

    <!-- 无库存销售：品牌型号搜索 + IMEI 录入 -->
    <div v-if="saleType === 'no-stock'" class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <h3 class="card-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
        品牌型号
      </h3>
      <div class="brand-search-wrap">
        <input
          ref="brandInputRef"
          v-model="brandInput"
          class="scan-input"
          placeholder="搜索或输入品牌型号"
          @input="onBrandInput"
          @keydown="onBrandKeydown"
          @keyup.enter="onBrandEnter"
        />
        <!-- 下拉匹配列表 -->
        <div v-if="brandSuggestions.length > 0 && brandDropdownOpen" class="brand-dropdown">
          <div
            v-for="(m, idx) in brandSuggestions"
            :key="idx"
            :class="['brand-dropdown-item', { active: brandHighlightIdx === idx }]"
            @click="selectBrandSuggestion(m)"
            @mouseenter="brandHighlightIdx = idx"
          >
            <span class="brand-dd-name">{{ m.brand?.name }} {{ m.name }}</span>
            <span class="brand-dd-spec">{{ [m.color, [m.ram, m.rom].filter(Boolean).join('/')].filter(Boolean).join(' · ') }}</span>
            <span class="brand-dd-price">¥{{ (m.sale_price || 0).toFixed(2) }}</span>
          </div>
          <div v-if="brandInput.trim() && !brandExactMatch" class="brand-dropdown-empty">
            <span>未找到匹配项，将保存为新品牌型号</span>
            <button class="brand-save-btn" @click.stop="openSaveBrandFromSearch">保存</button>
          </div>
        </div>
        <!-- 已选品牌型号标签 -->
        <div v-if="selectedModel" class="brand-selected-tag">
          <span>{{ selectedModel.brand?.name }} {{ selectedModel.name }} - {{ selectedModel.color || '' }} {{ selectedModel.ram || '' }}{{ selectedModel.rom ? '/' + selectedModel.rom : '' }}</span>
          <button class="brand-selected-clear" @click="clearSelectedModel">&times;</button>
        </div>
      </div>

      <!-- IMEI 录入区 -->
      <div v-if="selectedModel || (brandInput.trim() && !brandSuggestions.length && !brandSearching)" class="imei-entry-section" style="margin-top:16px;">
        <div class="imei-entry-row">
          <span class="settle-label">售出价格</span>
          <el-input-number v-model="noStockPrice" :min="0" :precision="2" size="large" controls-position="right" style="width:200px;" />
        </div>
        <div class="imei-entry-row" style="margin-top:12px;">
          <span class="settle-label">IMEI1</span>
          <input ref="imei1Ref" v-model="noStockImei1" class="imei-entry-input" placeholder="扫码或输入 IMEI1" @keyup.enter="focusImei2" />
        </div>
        <div class="imei-entry-row">
          <span class="settle-label">IMEI2</span>
          <input ref="imei2Ref" v-model="noStockImei2" class="imei-entry-input" placeholder="扫码或输入 IMEI2（可选）" @keyup.enter="focusSn" />
        </div>
        <div class="imei-entry-row">
          <span class="settle-label">S/N</span>
          <input ref="snRef" v-model="noStockSn" class="imei-entry-input" placeholder="扫码或输入 S/N 码（可选）" @keyup.enter="addNoStockItem" />
        </div>
        <button class="imei-add-btn" @click="addNoStockItem">添加至购物车</button>
      </div>
    </div>

    <div class="section-header">
      <span class="section-title">已选商品</span>
      <span v-if="cart.length" class="section-badge">{{ cart.length }} 件</span>
    </div>

    <div v-if="cart.length" class="cart-list">
      <CartItemCard v-for="(item, i) in cart" :key="i" :item="item" @remove="cart.splice(i, 1)" />
    </div>
    <div v-else class="empty-hint" style="margin:20px 0;">购物车为空，请扫码添加商品</div>

    <div v-if="cart.length" class="glass" style="padding:22px;border-radius:var(--radius);margin-bottom:20px;">
      <div class="total-row">
        <span class="total-label">合计</span>
        <span class="total-value">¥{{ totalAmount.toFixed(2) }}</span>
      </div>

      <div class="settle-row">
        <span class="settle-label">收款金额</span>
        <el-input-number v-model="paidAmount" :min="0" :precision="2" size="large" controls-position="right" style="width:200px;" />
      </div>

      <div class="settle-row">
        <span class="settle-label">找零</span>
        <span :class="['change-value', changeAmount < 0 ? 'change-err' : '']">
          ¥{{ Math.abs(changeAmount).toFixed(2) }}{{ changeAmount < 0 ? ' (不足)' : '' }}
        </span>
      </div>

      <div class="customer-row">
        <div class="customer-field">
          <span class="settle-label">客户姓名</span>
          <el-input v-model="customerName" placeholder="选填" size="large" style="width:200px;" />
        </div>
        <div class="customer-field">
          <span class="settle-label">客户电话</span>
          <el-input v-model="customerPhone" placeholder="选填" size="large" style="width:200px;" />
        </div>
      </div>
      <div class="customer-row" style="margin-top:10px;">
        <div class="customer-field">
          <span class="settle-label">客户地址</span>
          <el-input v-model="customerAddress" placeholder="选填" size="large" style="width:260px;" />
        </div>
        <div class="customer-field">
          <span class="settle-label">备注</span>
          <el-input v-model="remark" placeholder="选填" size="large" style="width:260px;" />
        </div>
      </div>
    </div>

    <button v-if="cart.length" class="pay-btn" @click="handlePay">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      {{ saleType === 'no-stock' ? '确认收款（无库存）' : '确认收款' }}  ¥{{ totalAmount.toFixed(2) }}
    </button>

    <ConfirmDialog
      :visible="showConfirm" title="确认收款"
      :message="`共 ${cart.length} 件商品，应收 ¥${totalAmount.toFixed(2)}，实收 ¥${paidAmount.toFixed(2)}`"
      type="success" confirm-text="确认收款" cancel-text="再想想"
      @confirm="confirmPay" @cancel="showConfirm = false"
    />

    <SaveBrandDialog
      :visible="showSaveBrand"
      :items="pendingBrandItems"
      @confirm="onBrandSaved"
    />
  </div>
</template>
```

- [ ] **Step 2: 替换 Sale.vue script 部分**

```vue
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { scanImeiForSale } from '@/api/inventory'
import { createSale, createNoStockSale } from '@/api/sales'
import { getModels, getBrands } from '@/api/product'
import CartItemCard from '@/components/CartItemCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SaveBrandDialog from '@/components/SaveBrandDialog.vue'
import type { BrandModelItem } from '@/components/SaveBrandDialog.vue'

const userStore = useUserStore()

// -- 销售类型 --
const saleType = ref<'normal' | 'no-stock'>('normal')

// -- 普通销售 --
const scanRef = ref<HTMLInputElement>()
const scanInput = ref('')
const scanning = ref(false)
const scanError = ref('')

// -- 无库存销售 --
const brandInputRef = ref<HTMLInputElement>()
const brandInput = ref('')
const brandSearching = ref(false)
const brandSuggestions = ref<any[]>([])
const brandDropdownOpen = ref(false)
const brandHighlightIdx = ref(-1)
const brandExactMatch = ref(false)
const selectedModel = ref<any>(null)
const noStockPrice = ref(0)
const noStockImei1 = ref('')
const noStockImei2 = ref('')
const noStockSn = ref('')
const imei1Ref = ref<HTMLInputElement>()
const imei2Ref = ref<HTMLInputElement>()
const snRef = ref<HTMLInputElement>()
const brandSaveMarked = ref<Set<string>>(new Set()) // 已提前保存的品牌型号标记

// -- 购物车 --
interface CartItem {
  brandName: string
  modelName: string
  color: string
  storage: string
  imei: string
  imei2: string | null
  snCode: string | null
  price: number
  modelId?: number | null
  // 无库存销售时使用
  rawText?: string
  brandText?: string
  modelText?: string
}

const cart = ref<CartItem[]>([])
const paidAmount = ref(0)
const customerName = ref('')
const customerPhone = ref('')
const customerAddress = ref('')
const remark = ref('')
const showConfirm = ref(false)

// -- 品牌型号保存 --
const showSaveBrand = ref(false)
const pendingBrandItems = ref<BrandModelItem[]>([])

const totalAmount = computed(() => cart.value.reduce((s, i) => s + (i.price || 0), 0))
const changeAmount = computed(() => paidAmount.value - totalAmount.value)

// -- 扫描仪初始化 --
let scannerAttached = false
const scanner = {
  attach() { scannerAttached = true },
  detach() { scannerAttached = false },
}

onMounted(() => {
  nextTick(() => {
    if (saleType.value === 'normal') {
      scanRef.value?.focus()
    }
  })
})

// -- 销售类型切换 --
function switchType(type: 'normal' | 'no-stock') {
  if (type === saleType.value) return
  if (cart.value.length > 0) {
    ElMessageBox.confirm('切换销售类型将清空购物车，是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      doSwitch(type)
    }).catch(() => {})
  } else {
    doSwitch(type)
  }
}

function doSwitch(type: 'normal' | 'no-stock') {
  saleType.value = type
  resetAll()
  nextTick(() => {
    if (type === 'normal') {
      scanRef.value?.focus()
    } else {
      brandInputRef.value?.focus()
    }
  })
}

// -- 普通销售：扫码 --
async function handleScan() {
  const imei = scanInput.value.trim()
  if (!imei) return
  scanning.value = true
  scanError.value = ''
  try {
    const item = await scanImeiForSale(imei, userStore.effectiveStoreId || undefined)
    if (!item) {
      // 未匹配到库存，询问是否切换到无库存销售
      promptSwitchToNoStock(imei)
      return
    }
    if (item.isSold || item.status === 'sold') {
      scanError.value = '该手机已售出'
      return
    }
    if (cart.value.some(c => c.imei === imei)) {
      scanError.value = '已在购物车中'
      return
    }
    cart.value.push({
      brandName: item.brandName || '',
      modelName: item.modelName || '',
      color: item.color || '',
      storage: item.storage || '',
      imei: item.imei,
      imei2: item.imei2,
      snCode: null,
      price: item.salePrice || item.model?.salePrice || 0,
    })
    paidAmount.value = totalAmount.value
    scanInput.value = ''
    scanError.value = ''
    nextTick(() => scanRef.value?.focus())
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 404) {
      // 未找到 IMEI，询问是否切换到无库存销售
      promptSwitchToNoStock(imei)
    } else {
      scanError.value = e?.response?.data?.message || e?.message || '查询失败'
    }
  } finally {
    scanning.value = false
  }
}

function promptSwitchToNoStock(imei: string) {
  ElMessageBox.confirm(
    `未找到 IMEI "${imei}" 的库存记录，是否切换到无库存销售模式？`,
    '未匹配到库存',
    {
      confirmButtonText: '切换到无库存销售',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    saleType.value = 'no-stock'
    cart.value = []
    noStockImei1.value = imei
    nextTick(() => {
      brandInputRef.value?.focus()
    })
  }).catch(() => {
    scanInput.value = ''
    nextTick(() => scanRef.value?.focus())
  })
}

// -- 无库存销售：品牌型号搜索 --
let brandSearchTimer: ReturnType<typeof setTimeout> | null = null

async function onBrandInput() {
  if (brandSearchTimer) clearTimeout(brandSearchTimer)
  const val = brandInput.value.trim()
  if (!val) {
    brandSuggestions.value = []
    brandDropdownOpen.value = false
    selectedModel.value = null
    return
  }
  brandSearchTimer = setTimeout(async () => {
    brandSearching.value = true
    try {
      const models = await getModels(undefined, val)
      const filtered = models.filter((m: any) => {
        const fullName = `${m.brand?.name || ''} ${m.name}`.toLowerCase()
        return fullName.includes(val.toLowerCase())
      })
      brandSuggestions.value = filtered
      brandExactMatch.value = filtered.some((m: any) =>
        `${m.brand?.name} ${m.name}` === val
      )
      brandDropdownOpen.value = filtered.length > 0 || val.length > 0
      brandHighlightIdx.value = -1
    } catch {
      brandSuggestions.value = []
    } finally {
      brandSearching.value = false
    }
  }, 300)
}

function onBrandKeydown(e: KeyboardEvent) {
  if (!brandDropdownOpen.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    brandHighlightIdx.value = Math.min(brandHighlightIdx.value + 1, brandSuggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    brandHighlightIdx.value = Math.max(brandHighlightIdx.value - 1, -1)
  } else if (e.key === 'Enter' && brandHighlightIdx.value >= 0) {
    e.preventDefault()
    selectBrandSuggestion(brandSuggestions.value[brandHighlightIdx.value])
  }
}

function onBrandEnter() {
  if (brandHighlightIdx.value >= 0 && brandSuggestions.value[brandHighlightIdx.value]) {
    selectBrandSuggestion(brandSuggestions.value[brandHighlightIdx.value])
  } else if (brandInput.value.trim()) {
    // 无匹配，直接进入 IMEI 录入
    brandDropdownOpen.value = false
    selectedModel.value = null
    updateNoStockPrice(0)
    nextTick(() => imei1Ref.value?.focus())
  }
}

function selectBrandSuggestion(model: any) {
  selectedModel.value = model
  brandInput.value = `${model.brand?.name} ${model.name}`
  brandDropdownOpen.value = false
  updateNoStockPrice(model.sale_price || 0)
  nextTick(() => imei1Ref.value?.focus())
}

function clearSelectedModel() {
  selectedModel.value = null
  brandInput.value = ''
  brandSuggestions.value = []
  brandDropdownOpen.value = false
  nextTick(() => brandInputRef.value?.focus())
}

function updateNoStockPrice(price: number) {
  noStockPrice.value = price
}

// -- 无库存销售：IMEI 焦点跳转 --
function focusImei2() {
  nextTick(() => imei2Ref.value?.focus())
}
function focusSn() {
  nextTick(() => snRef.value?.focus())
}

// -- 无库存销售：添加到购物车 --
function addNoStockItem() {
  if (!brandInput.value.trim()) {
    ElMessage.warning('请输入品牌型号')
    return
  }
  if (!noStockImei1.value.trim()) {
    ElMessage.warning('请输入 IMEI1')
    return
  }

  const rawText = brandInput.value.trim()
  const brand = selectedModel.value?.brand?.name || ''
  const modelName = selectedModel.value?.name || ''

  cart.value.push({
    brandName: brand || rawText,
    modelName: modelName || '',
    color: selectedModel.value?.color || '',
    storage: [selectedModel.value?.ram, selectedModel.value?.rom].filter(Boolean).join('/') || '',
    imei: noStockImei1.value.trim(),
    imei2: noStockImei2.value.trim() || null,
    snCode: noStockSn.value.trim() || null,
    price: noStockPrice.value,
    modelId: selectedModel.value?.id || null,
    rawText: rawText,
    brandText: brand,
    modelText: modelName,
  })

  paidAmount.value = totalAmount.value

  // 清空录入区
  noStockImei1.value = ''
  noStockImei2.value = ''
  noStockSn.value = ''
  noStockPrice.value = selectedModel.value?.sale_price || 0
  if (!selectedModel.value) {
    brandInput.value = ''
  }
  nextTick(() => imei1Ref.value?.focus())
}

// -- 提前保存品牌型号 --
async function openSaveBrandFromSearch() {
  if (!brandInput.value.trim()) return
  const rawText = brandInput.value.trim()
  const spaceIdx = rawText.indexOf(' ')
  const brand = spaceIdx > 0 ? rawText.slice(0, spaceIdx) : rawText
  const model = spaceIdx > 0 ? rawText.slice(spaceIdx + 1) : ''
  pendingBrandItems.value = [{ rawText, brand, model }]
  showSaveBrand.value = true
}

// -- 确认收款 --
function handlePay() {
  if (paidAmount.value < totalAmount.value) {
    ElMessage.warning('收款金额不足')
    return
  }
  showConfirm.value = true
}

async function confirmPay() {
  showConfirm.value = false
  if (saleType.value === 'normal') {
    await doNormalPay()
  } else {
    await doNoStockPay()
  }
}

async function doNormalPay() {
  try {
    await createSale({
      items: cart.value.map(i => ({ imei: i.imei, unit_price: i.price })),
      actual_amount: totalAmount.value,
      customer_name: customerName.value || undefined,
      customer_phone: customerPhone.value || undefined,
    })
    ElMessage.success({ message: `开单成功！共 ${cart.value.length} 件 ¥${totalAmount.value.toFixed(2)}`, duration: 4000 })
    resetAll()
    nextTick(() => scanRef.value?.focus())
  } catch (e: any) {
    ElMessage.error(e?.message || '开单失败')
  }
}

// -- 无库存销售：确认收款 --
async function doNoStockPay() {
  // 检查品牌型号是否需要新增
  const toSave: BrandModelItem[] = []
  for (const item of cart.value) {
    if (item.modelId) continue // 已有 modelId，无需新增
    const rawText = item.rawText || `${item.brandName} ${item.modelName}`.trim()
    if (brandSaveMarked.value.has(rawText)) continue // 已提前保存
    const spaceIdx = rawText.indexOf(' ')
    const brand = spaceIdx > 0 ? rawText.slice(0, spaceIdx) : rawText
    const model = spaceIdx > 0 ? rawText.slice(spaceIdx + 1) : ''
    toSave.push({ rawText, brand, model })
  }

  if (toSave.length > 0) {
    pendingBrandItems.value = toSave
    showSaveBrand.value = true
    // 等待 SaveBrandDialog 确认后继续
    return
  }

  // 无需新增品牌型号，直接销售
  await submitNoStockSale()
}

async function onBrandSaved(savedItems: BrandModelItem[]) {
  showSaveBrand.value = false
  for (const item of savedItems) {
    brandSaveMarked.value.add(item.rawText)
  }
  // 继续提交销售
  await submitNoStockSale()
}

async function submitNoStockSale() {
  try {
    await createNoStockSale({
      items: cart.value.map(i => ({
        brand_name: i.brandName,
        model_name: i.modelName || i.brandName,
        model_id: i.modelId || null,
        color: i.color || '',
        storage: i.storage || '',
        imei: i.imei,
        imei2: i.imei2 || null,
        sn_code: i.snCode || null,
        unit_price: i.price,
      })),
      actual_amount: totalAmount.value,
      customer_name: customerName.value || undefined,
      customer_phone: customerPhone.value || undefined,
      customer_address: customerAddress.value || undefined,
      remark: remark.value || undefined,
    })
    ElMessage.success({ message: `无库存开单成功！共 ${cart.value.length} 件 ¥${totalAmount.value.toFixed(2)}`, duration: 4000 })
    resetAll()
    nextTick(() => brandInputRef.value?.focus())
  } catch (e: any) {
    ElMessage.error(e?.message || '开单失败')
  }
}

// -- 重置 --
function resetAll() {
  cart.value = []
  paidAmount.value = 0
  customerName.value = ''
  customerPhone.value = ''
  customerAddress.value = ''
  remark.value = ''
  scanInput.value = ''
  scanError.value = ''
  brandInput.value = ''
  brandSuggestions.value = []
  brandDropdownOpen.value = false
  selectedModel.value = null
  noStockPrice.value = 0
  noStockImei1.value = ''
  noStockImei2.value = ''
  noStockSn.value = ''
  brandSaveMarked.value = new Set()
}
</script>
```

- [ ] **Step 3: 替换 Sale.vue style 部分（追加新样式）**

在现有 style scoped 块内追加：

```css
/* 销售类型切换 */
.sale-type-row { display: flex; align-items: center; gap: 16px; }
.sale-type-label { font-size: 14px; color: var(--text-secondary); font-weight: 500; min-width: 60px; }
.sale-type-radio { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; color: var(--text-secondary); padding: 6px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); transition: var(--transition); user-select: none; }
.sale-type-radio:hover { border-color: var(--primary); color: var(--text); }
.sale-type-radio.active { border-color: var(--primary); color: var(--primary); background: var(--primary-light); font-weight: 600; }
.radio-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); display: inline-block; transition: var(--transition); }
.sale-type-radio.active .radio-dot { border-color: var(--primary); border-width: 5px; }

/* 品牌型号搜索 */
.brand-search-wrap { position: relative; }
.brand-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-sm); max-height: 240px; overflow-y: auto; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.brand-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background 0.1s; }
.brand-dropdown-item:hover,
.brand-dropdown-item.active { background: var(--primary-light); }
.brand-dd-name { flex: 1; font-size: 14px; font-weight: 500; color: var(--text); }
.brand-dd-spec { font-size: 12px; color: var(--text-tertiary); }
.brand-dd-price { font-size: 14px; font-weight: 600; color: var(--text); font-family: monospace; }
.brand-dropdown-empty { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; font-size: 13px; color: var(--text-tertiary); border-top: 1px solid var(--border); }
.brand-save-btn { padding: 4px 12px; font-size: 12px; border: 1px solid var(--primary); border-radius: var(--radius-sm); background: #fff; color: var(--primary); cursor: pointer; font-family: inherit; }
.brand-save-btn:hover { background: var(--primary-light); }
.brand-selected-tag { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 14px; background: var(--primary-light); border-radius: var(--radius-sm); font-size: 14px; color: var(--primary); font-weight: 500; }
.brand-selected-clear { width: 20px; height: 20px; border: none; border-radius: 50%; background: rgba(37,99,235,0.15); color: var(--primary); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; line-height: 1; }

/* IMEI 录入区 */
.imei-entry-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.imei-entry-input { flex: 1; max-width: 300px; height: 42px; padding: 0 14px; font-size: 15px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: monospace; background: #fff; }
.imei-entry-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.imei-add-btn { margin-top: 8px; padding: 10px 28px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
.imei-add-btn:hover { filter: brightness(0.92); }
```

### Task 7: 前端 API — 新增 createBrand / createModel 工具函数

**Files:**
- Modify: `portal/src/api/product.ts`

- [ ] **Step 1: 在 product.ts 底部新增 createBrand 和 createModel**

```typescript
// portal/src/api/product.ts — 追加
export async function createBrand(name: string, description?: string) {
  const res: any = await request.post('/products/brands', { name, description })
  return res.data
}

export async function createModel(brandId: number, name: string, data?: {
  color?: string
  ram?: string
  rom?: string
  sale_price?: number
  cost_price?: number
}) {
  const res: any = await request.post('/products/models', {
    brand_id: brandId,
    name,
    ...data,
  })
  return res.data
}
```

# IMEI 查询功能完善 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善 Dashboard 中 IMEI 查询弹窗功能，支持展示手机完整追踪链路（入库记录 + 销售记录）

**Architecture:**
- 后端新增 `GET /api/v1/inventory/imei-query` API，统一查询 `wh_inventory_imei`、`pch_purchase_entry`、`sale_order` 三张表
- 前端改造 `ImeiQueryDialog.vue`，根据 status 字段区分在库/已售两种场景展示
- 电话地址默认脱敏，可点击显示详情

**Tech Stack:** Vue 3 + Element Plus, Express + Prisma + SQLite

---

### Task 1: 后端新增 imei-query API

**Files:**
- Modify: `server/src/routes/inventory.ts` (在 scan-imei 路由后新增)
- Modify: `接口文档.md` (更新 API 文档)
- Test: 手动用 curl/Postman 测试

- [ ] **Step 1: 在 inventory.ts 中新增 imei-query 路由**

在 `server/src/routes/inventory.ts` 的 `scan-imei` 路由（约 179 行）之后，新增以下路由：

```typescript
// IMEI 完整信息查询（追踪链路）
router.get('/imei-query', async (req: Request, res: Response) => {
  try {
    const { imei } = req.query;
    if (!imei) {
      const r: ApiResponse = { code: 400, message: 'IMEI不能为空' };
      return res.status(400).json(r);
    }

    // 1. 查询 IMEI 基础信息
    const record = await prisma.wh_inventory_imei.findUnique({
      where: { imei: imei as string },
      include: {
        model: {
          include: { brand: { select: { id: true, name: true } } },
        },
        store: { select: { id: true, name: true } },
      },
    });

    if (!record) {
      const r: ApiResponse = { code: 404, message: '未找到该 IMEI 对应的记录' };
      return res.status(404).json(r);
    }

    // 2. 查询入库记录（通过 entry_id）
    let entryRecord = null;
    if (record.entry_id) {
      const entry = await prisma.pch_purchase_entry.findUnique({
        where: { id: record.entry_id },
        include: {
          supplier: { select: { id: true, name: true } },
        },
      });
      if (entry) {
        entryRecord = {
          entry_no: entry.entry_no,
          supplierName: entry.supplier?.name || '-',
          created_at: entry.created_at,
        };
      }
    }

    // 3. 查询销售记录（已售状态下通过 sale_order_item 关联）
    let saleRecord = null;
    if (record.status === 'sold') {
      const saleItem = await prisma.sale_order_item.findFirst({
        where: { imei: imei as string },
        include: {
          sale_order: {
            include: {
              store: { select: { id: true, name: true } },
              operator: { select: { id: true, real_name: true } },
            },
          },
        },
      });
      if (saleItem && saleItem.sale_order) {
        const order = saleItem.sale_order;
        saleRecord = {
          order_no: order.order_no,
          storeName: order.store?.name || '-',
          created_at: order.created_at,
          total_amount: order.total_amount,
          actual_amount: order.actual_amount,
          change_amount: order.change_amount,
          customer_name: order.customer_name || '-',
          customer_phone: order.customer_phone || '',
          customer_address: order.customer_address || '',
          operatorName: order.operator?.real_name || '-',
        };
      }
    }

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: {
        id: record.id,
        modelId: record.model_id,
        imei: record.imei,
        imei2: record.imei2,
        sn_code: record.sn_code,
        brandName: record.model?.brand?.name || '',
        modelName: record.model?.name || '',
        color: record.model?.color || '',
        storage: [record.model?.ram, record.model?.rom].filter(Boolean).join('/') || '',
        salePrice: record.model?.sale_price || 0,
        storeName: record.store?.name || '',
        status: record.status,
        entryRecord,
        saleRecord,
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});
```

- [ ] **Step 2: 更新接口文档.md**

在 `接口文档.md` 的 `### 5.2` 节之后，插入新的 `### 5.3` 节（原 5.3 及之后序号 +1）：

新增内容：

```markdown
### 5.3 IMEI 信息查询（完整追踪链路）

```
GET /api/v1/inventory/imei-query?imei=356938123456789
```

**说明**：按 IMEI 查询手机完整追踪链路信息，包括基础信息、入库记录、销售记录。与 scan-imei 不同，该接口不校验门店归属、不校验是否已售，返回该 IMEI 在系统中的全部关联数据。

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| imei | string | 是 | 完整的 IMEI 码 |

**响应示例（已售）**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "modelId": 1,
    "imei": "356938123456789",
    "imei2": null,
    "sn_code": "SN123456",
    "brandName": "Apple",
    "modelName": "iPhone 17 Pro Max",
    "color": "深黑",
    "storage": "8GB/256GB",
    "salePrice": 6999,
    "storeName": "分店A",
    "status": "sold",
    "entryRecord": {
      "entry_no": "PO20240617001",
      "supplierName": "深圳华强北供应商",
      "created_at": "2024-06-15T10:30:00.000Z"
    },
    "saleRecord": {
      "order_no": "SA20240617001",
      "storeName": "分店A",
      "created_at": "2024-06-17T14:30:00.000Z",
      "total_amount": 6999,
      "actual_amount": 7000,
      "change_amount": 1,
      "customer_name": "张三",
      "customer_phone": "13800138000",
      "customer_address": "北京市朝阳区 xxx 街道",
      "operatorName": "收银员小王"
    }
  }
}
```

**响应示例（未售出）**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "modelId": 1,
    "imei": "356938123456789",
    "imei2": null,
    "sn_code": "SN123456",
    "brandName": "Apple",
    "modelName": "iPhone 17 Pro Max",
    "color": "深黑",
    "storage": "8GB/256GB",
    "salePrice": 6999,
    "storeName": "分店A",
    "status": "in_stock",
    "entryRecord": {
      "entry_no": "PO20240617001",
      "supplierName": "深圳华强北供应商",
      "created_at": "2024-06-15T10:30:00.000Z"
    },
    "saleRecord": null
  }
}
```

**错误**：
- `{ "code": 404, "message": "未找到该 IMEI 对应的记录" }`
```

找到 `接口文档.md` 中 `### 5.3 IMEI 库存列表` 那行，将其改为 `### 5.4 IMEI 库存列表`，后续序号顺延（5.4 → 5.5, 5.5 → 5.6 等）。

- [ ] **Step 3: 重启后端验证**

运行 `npm run dev` 重启后端，确保编译通过无报错。

---

### Task 2: 前端新增 imeiQuery API 方法

**Files:**
- Modify: `portal/src/api/inventory.ts`

- [ ] **Step 1: 新增 imeiQuery 方法**

在 `portal/src/api/inventory.ts` 文件末尾添加：

```typescript
export async function imeiQuery(imei: string) {
  const res: any = await request.get('/inventory/imei-query', { params: { imei } })
  return res.data
}
```

---

### Task 3: 改造 ImeiQueryDialog.vue — 脚本逻辑

**Files:**
- Modify: `portal/src/components/ImeiQueryDialog.vue`

- [ ] **Step 1: 更新 import 和组件状态**

将 `import { scanImeiForSale } from '@/api/inventory'` 改为 `import { imeiQuery } from '@/api/inventory'`

删除 `saleRecords` 和 `entryRecords` 两个 ref（不再需要），在 `result` 之后新增隐私控制状态：

```typescript
const result = ref<any>(null)
const showPhone = ref(false)
const showAddress = ref(false)
```

- [ ] **Step 2: 重写 handleQuery 方法**

```typescript
async function handleQuery() {
  const imei = imeiInput.value.trim()
  if (!imei) { queryError.value = '请输入 IMEI'; return }
  queryLoading.value = true; queryError.value = ''
  showPhone.value = false
  showAddress.value = false
  try {
    const data = await imeiQuery(imei)
    if (!data) { queryError.value = '未找到该 IMEI 对应的记录'; result.value = null; return }
    result.value = data
  } catch (e: any) {
    queryError.value = e?.response?.data?.message || e?.message || '查询失败'
    result.value = null
  } finally {
    queryLoading.value = false
  }
}
```

- [ ] **Step 3: 新增隐私脱敏辅助方法**

在 `formatTime` 方法之后添加：

```typescript
function maskPhone(phone: string) {
  if (!phone || phone.length < 7) return phone || '-'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

function maskAddress(addr: string) {
  if (!addr) return '-'
  if (addr.length <= 3) return addr + '****'
  return addr.slice(0, 3) + '****'
}
```

- [ ] **Step 4: 清理 watch 中不需要的变量**

在 `watch(() => props.visible, ...)` 中移除 `saleRecords` 和 `entryRecords` 的清零代码：

```typescript
watch(() => props.visible, (v) => {
  if (v) {
    imeiInput.value = ''
    result.value = null
    queryError.value = ''
    showPhone.value = false
    showAddress.value = false
    nextTick(() => queryRef.value?.focus())
  }
})
```

---

### Task 4: 改造 ImeiQueryDialog.vue — 模板 UI

**Files:**
- Modify: `portal/src/components/ImeiQueryDialog.vue`

- [ ] **Step 1: 替换结果区域模板**

将现有的 `result-area` div 整个替换为：

```html
<div v-if="result" class="result-area">
  <!-- 手机信息 -->
  <div class="result-section">
    <h4 class="result-section-title">手机信息</h4>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">品牌</span><span class="info-value">{{ result.brandName || '-' }}</span></div>
      <div class="info-item"><span class="info-label">型号</span><span class="info-value">{{ result.modelName || '-' }}</span></div>
      <div class="info-item"><span class="info-label">颜色</span><span class="info-value">{{ result.color || '-' }}</span></div>
      <div class="info-item"><span class="info-label">存储</span><span class="info-value">{{ result.storage || '-' }}</span></div>
      <div class="info-item"><span class="info-label">IMEI</span><span class="info-value mono">{{ result.imei || '-' }}</span></div>
      <div class="info-item"><span class="info-label">IMEI2</span><span class="info-value mono">{{ result.imei2 || '-' }}</span></div>
      <div class="info-item"><span class="info-label">SN码</span><span class="info-value mono">{{ result.sn_code || '-' }}</span></div>
      <div class="info-item"><span class="info-label">状态</span><span :class="['status-badge', result.status === 'in_stock' ? 'status-ok' : 'status-sold']">{{ result.status === 'in_stock' ? '在库' : '已售' }}</span></div>
      <div class="info-item"><span class="info-label">所在门店</span><span class="info-value">{{ result.storeName || '-' }}</span></div>
      <div class="info-item"><span class="info-label">售价</span><span class="info-value">¥{{ (result.salePrice || 0).toFixed(2) }}</span></div>
    </div>
  </div>

  <!-- 入库记录 -->
  <div v-if="result.entryRecord" class="result-section">
    <h4 class="result-section-title">入库记录</h4>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">入库单号</span><span class="info-value mono">{{ result.entryRecord.entry_no || '-' }}</span></div>
      <div class="info-item"><span class="info-label">供应商</span><span class="info-value">{{ result.entryRecord.supplierName || '-' }}</span></div>
      <div class="info-item"><span class="info-label">入库时间</span><span class="info-value">{{ formatTime(result.entryRecord.created_at) }}</span></div>
    </div>
  </div>

  <!-- 销售记录（仅已售） -->
  <div v-if="result.saleRecord" class="result-section">
    <h4 class="result-section-title">销售记录</h4>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">订单号</span><span class="info-value mono">{{ result.saleRecord.order_no || '-' }}</span></div>
      <div class="info-item"><span class="info-label">售出门店</span><span class="info-value">{{ result.saleRecord.storeName || '-' }}</span></div>
      <div class="info-item"><span class="info-label">售出时间</span><span class="info-value">{{ formatTime(result.saleRecord.created_at) }}</span></div>
      <div class="info-item"><span class="info-label">应收金额</span><span class="info-value">¥{{ (result.saleRecord.total_amount || 0).toFixed(2) }}</span></div>
      <div class="info-item"><span class="info-label">实收金额</span><span class="info-value">¥{{ (result.saleRecord.actual_amount || 0).toFixed(2) }}</span></div>
      <div class="info-item"><span class="info-label">找零</span><span class="info-value">¥{{ (result.saleRecord.change_amount || 0).toFixed(2) }}</span></div>
      <div class="info-item"><span class="info-label">客户</span><span class="info-value">{{ result.saleRecord.customer_name || '-' }}</span></div>
      <div class="info-item">
        <span class="info-label">电话</span>
        <span class="info-value">
          <template v-if="result.saleRecord.customer_phone">
            {{ showPhone ? result.saleRecord.customer_phone : maskPhone(result.saleRecord.customer_phone) }}
            <button class="privacy-toggle" @click="showPhone = !showPhone">{{ showPhone ? '隐藏' : '显示详情' }}</button>
          </template>
          <template v-else>-</template>
        </span>
      </div>
      <div class="info-item">
        <span class="info-label">地址</span>
        <span class="info-value">
          <template v-if="result.saleRecord.customer_address">
            {{ showAddress ? result.saleRecord.customer_address : maskAddress(result.saleRecord.customer_address) }}
            <button class="privacy-toggle" @click="showAddress = !showAddress">{{ showAddress ? '隐藏' : '显示详情' }}</button>
          </template>
          <template v-else>-</template>
        </span>
      </div>
      <div class="info-item"><span class="info-label">收银员</span><span class="info-value">{{ result.saleRecord.operatorName || '-' }}</span></div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: 新增 privacy-toggle 按钮样式**

在 `<style scoped>` 内部末尾添加：

```css
.privacy-toggle { font-size: 12px; color: var(--primary); background: none; border: none; cursor: pointer; padding: 0 4px; font-family: inherit; text-decoration: underline dashed; text-underline-offset: 2px; }
.privacy-toggle:hover { color: var(--primary-dark); }
```

---

### Task 5: 验证并提交

- [ ] **Step 1: 重启前后端**

先确认后端编译无报错，再确认前端编译无报错。

- [ ] **Step 2: 功能验证**

1. 打开 Dashboard 页面，点击 IMEI 查询按钮
2. 输入一个在库状态的 IMEI → 应看到手机信息 + 入库记录，无销售记录
3. 输入一个已售状态的 IMEI → 应看到手机信息 + 入库记录 + 销售记录（含售出门店）
4. 检查电话脱敏显示，点击「显示详情」→ 显示完整电话，按钮变为「隐藏」
5. 检查地址脱敏显示，点击「显示详情」→ 显示完整地址，按钮变为「隐藏」
6. 输入不存在的 IMEI → 显示错误提示

- [ ] **Step 3: 回归验证**

打开 Dashboard 快速开单区域，扫码输入一个在库 IMEI → 应正常添加到购物车（确保 scan-imei API 未受影响）

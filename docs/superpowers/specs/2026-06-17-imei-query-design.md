# IMEI 查询功能完善 — 设计文档

> **日期**：2026-06-17
> **状态**：已批准待实施
> **关联文件**：`portal/src/components/ImeiQueryDialog.vue`、`server/src/routes/inventory.ts`

---

## 1. 背景与现状

### 现状问题
- **IMEI查询弹窗** (`ImeiQueryDialog.vue`) 中的查询功能不完善
- 调用的是 `scan-imei` API（销售扫码校验用），该 API **仅对 `in_stock` 状态的手机返回数据**，已售手机返回 400 错误
- 弹窗中入库记录和销售记录区域为空（标有 TODO）
- 信息展示不完整，无法形成手机的完整追踪链路

### 约束
- `scan-imei` API 在 Dashboard.vue、Sale.vue、client 端也被用于销售开单扫码，**必须保持原有行为**（已售手机返回 400）
- 因此需要**新建专用 API**，不能改造现有 `scan-imei`

---

## 2. 需求概述

### 2.1 IMEI 查询的两种场景

| 场景 | 手机状态 | 展示内容 |
|------|---------|---------|
| 未售出 | `in_stock` | 手机基础信息 + 入库记录 |
| 已售出 | `sold` | 手机基础信息 + 入库记录 + 销售记录 |

### 2.2 展示字段

**手机基础信息**（两种场景都展示）：
品牌、型号、颜色、存储、IMEI、IMEI2、SN码、状态（在库/已售）、所在门店、售价

**入库记录**（两种场景都展示）：
入库单号、供应商名称、入库时间

> ⚠️ 入库单价**不展示**（涉及成本信息，有被客户看到的隐私风险）

**销售记录**（仅已售场景展示）：
订单号、售出门店、售出时间、应收金额、实收金额、找零、客户姓名
客户电话（默认脱敏，可点击显示详情）
客户地址（默认脱敏，可点击显示详情）
收银员

---

## 3. 后端设计

### 3.1 新增 API

```
GET /api/v1/inventory/imei-query?imei=356938123456789
```

**说明**：按完整 IMEI 查询手机完整信息。与 `scan-imei` 不同，该 API 不校验门店归属、不校验是否已售，返回完整的追踪链路数据。

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| imei | string | 是 | 完整的 IMEI 码 |

**响应示例**（已售场景）：

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

**响应示例**（未售出场景）：

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

**错误响应**：

```json
{ "code": 404, "message": "未找到该 IMEI 对应的记录" }
```

### 3.2 数据查询逻辑

1. 根据 IMEI 查询 `wh_inventory_imei` 表（唯一索引），获取手机基础信息、状态、关联的 `entry_id`
2. 通过 `entry_id` 关联 `pch_purchase_entry` 表，获取入库单号、供应商名称、入库时间
3. 通过 `sale_order_item.imei` 关联 `sale_order` 表，获取销售记录（仅 `sold` 状态时存在）
4. 返回完整数据

---

## 4. 前端设计

### 4.1 文件变更

**修改文件**：`portal/src/components/ImeiQueryDialog.vue`

**新增 API 调用**：在 `portal/src/api/inventory.ts` 中新增 `imeiQuery(imei)` 方法

### 4.2 组件状态变更

```typescript
// 新增状态 - 隐私字段独立控制
const showPhone = ref(false)   // 电话脱敏切换
const showAddress = ref(false) // 地址脱敏切换
```

### 4.3 UI 布局

```
┌─────────────────────────────────────┐
│  IMEI 查询                    [✕]   │
├─────────────────────────────────────┤
│  [输入 IMEI 码..................] [查询] │
├─────────────────────────────────────┤
│  ── 手机信息 ──                      │
│  品牌: Apple   型号: iPhone 17 Pro Max│
│  颜色: 深黑    存储: 8GB/256GB       │
│  IMEI: 35693...  IMEI2: -           │
│  SN码: SN123456  状态: ● 在库/已售   │
│  所在门店: 分店A   售价: ¥6999       │
│                                      │
│  ── 入库记录 ──                      │
│  入库单号: PO20240617001             │
│  供应商: 深圳华强北供应商             │
│  入库时间: 2024-06-15 10:30          │
│                                      │
│  ── 销售记录 ──  (仅已售时显示)       │
│  订单号: SA20240617001               │
│  售出门店: 分店A                     │
│  售出时间: 2024-06-17 14:30          │
│  应收: ¥6999  实收: ¥7000  找零: ¥1  │
│  客户: 张三                          │
│  电话: 138****8000  [显示详情]       │
│  地址: 北京市****     [显示详情]      │
│  收银员: 收银员小王                   │
└─────────────────────────────────────┘
```

### 4.4 隐私控制逻辑

- 默认客户电话显示为 `138****8000` 格式（中间4位隐藏）
- 默认客户地址只显示前3个字符 + `****`
- 每个隐私字段（电话、地址）有独立的「显示详情」/「隐藏详情」切换按钮
- 点击「显示详情」后该字段显示完整信息，按钮变为「隐藏详情」
- 各自独立切换，互不影响

### 4.5 样式说明

- 保持与现有弹窗一致的玻璃态风格（`glass-strong`）
- 入库记录和销售记录使用独立 section，与手机信息区分
- 状态标签使用不同颜色：在库=绿色，已售=灰色

---

## 5. 接口文档更新

在 `接口文档.md` 的 5.2 节之后新增 5.3 节（原 5.3 及之后序号顺延）：

### 5.3 IMEI 信息查询（完整链路）

```
GET /api/v1/inventory/imei-query?imei=356938123456789
```

**说明**：按 IMEI 查询手机完整信息，包括基础信息、入库记录、销售记录。与 `scan-imei` 不同，该接口不校验门店归属、不校验是否已售，返回完整追踪链路。

---

## 6. 实施范围

### 后端
1. `server/src/routes/inventory.ts` — 新增 `imei-query` 路由
2. `接口文档.md` — 更新 API 文档

### 前端
1. `portal/src/api/inventory.ts` — 新增 `imeiQuery` API 方法
2. `portal/src/components/ImeiQueryDialog.vue` — 改造查询逻辑和展示 UI

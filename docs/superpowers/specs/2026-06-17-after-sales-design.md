# 售后记录模块 — 设计文档

> **日期**：2026-06-17
> **状态**：已批准待实施
> **涉及项目**：server（后端）、client（管理后台）、portal（门户）

---

## 1. 背景与目标

### 1.1 业务背景

作为手机销售中间商，门店经常收到客户的售后服务请求，涉及**维修**、**换货**、**退款**三种场景。处理过程中需要：

- 关联到具体的手机个体（IMEI），快速定位原销售信息
- 跟踪检测、维修、供应商沟通等全流程
- 换货时从库存调出另一台手机（可不限同品牌型号）
- 退货手机标记为"已退货"状态，库存记录关联售后
- 全过程记录与供货商的沟通及处理结果

### 1.2 核心流程

```
客户申报 → 检测 → 分场景处理 → 交付客户 → 完结
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      维修        换货        退款
  ┌───┬───┬───┐   │           │
  ▼   ▼   ▼   ▼   ▼           ▼
当场 店里 返厂 完成 库存出库   原手机标记
 修  修  修       换新机      已退货
```

### 1.3 售后场景覆盖

| 场景 | 说明 |
|------|------|
| 维修 (repair) | 当场维修 / 店里维修 / 返厂维修 |
| 换货 (exchange) | 原手机退回，从库存换新机（可不限品牌型号） |
| 退款 (refund) | 原手机退回，退款给客户 |

---

## 2. 数据模型

### 2.1 新建表：`after_sale_order` — 售后工单主表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Int | PK autoincrement | 主键 |
| order_no | String | Unique | 售后单号，格式 `AS{yyMMddHHmmss}+3位随机` |
| store_id | Int | FK → sys_store | 所属门店 |
| imei_id | Int | FK → wh_inventory_imei | 关联的具体手机 |
| customer_name | String? | | 客户姓名 |
| customer_phone | String? | | 客户电话 |
| customer_address | String? | | 客户地址 |
| fault_description | String | | 故障描述/售后原因 |
| detection_result | String? | | 检测结果 |
| process_type | String | | 处理方式：`repair` / `exchange` / `refund` |
| repair_level | String? | | 维修级别（process_type=repair 时）：`minor`(当场) / `medium`(店里) / `major`(返厂) |
| cost | Float? | | 费用 |
| cost_remark | String? | | 费用说明 |
| handler_id | Int | FK → sys_user | 处理人 |
| supplier_contact | String? | | 供应商联系人信息 |
| supplier_status | String | 默认 `none` | 供应商状态：`none` / `pending` / `in_progress` / `completed` |
| supplier_result | String? | | 供应商处理结果 |
| exchange_model_id | Int? | FK → pdt_model | 换货时新手机型号 |
| exchange_imei_id | Int? | FK → wh_inventory_imei | 换货时新手机 IMEI |
| result | String? | | 最终处理结果 |
| status | String | 默认 `pending` | 工单状态（见 2.3） |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

### 2.2 新建表：`after_sale_log` — 操作日志/供应商沟通记录

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Int | PK autoincrement | 主键 |
| order_id | Int | FK → after_sale_order | 关联工单 |
| action | String | | 操作类型 |
| operator_id | Int? | FK → sys_user | 操作人 |
| content | String | | 操作内容描述 |
| created_at | DateTime | | 创建时间 |

**action 枚举值**：`created` / `detected` / `repairing` / `repaired` / `exchanging` / `exchanged` / `refunding` / `refunded` / `supplier_contact` / `supplier_done` / `completed` / `remark`

### 2.3 工单状态流转

主状态 `status` 和供应商子状态 `supplier_status` 是**两个独立维度**。主状态跟踪工单整体进度，供应商状态跟踪与供应商的对接进度。

**主状态流转**：

```
pending（待处理）
  → detecting（检测中）
    → repairing（维修中）→ repaired（已维修）
    → exchanging（换货中）→ exchanged（已换货）
    → refunding（退款中）→ refunded（已退款）
    → completed（已完成）— 上述任一路径完成后进入终结态
  → cancelled（已取消）
```

**供应商子状态流转**（独立于主状态运行）：

```
none（无需供应商）
  → pending（待联系供应商）
    → in_progress（供应商处理中）
      → completed（供应商已处理）
```

供应商状态可在主状态的任意阶段触发（如检测后确定需要退货给供应商），完成后回到主状态的对应分支继续流转。

### 2.4 对现有表的修改

**`wh_inventory_imei` 表**：

| 变更 | 说明 |
|------|------|
| status 新增枚举值 | 新增 `returned`(已退货)、`exchanged`(已换货)、`repairing`(维修中) |
| 新增字段 `after_sale_order_id?` | Int? FK → after_sale_order，关联售后工单 |

status 完整枚举：`in_stock`(在库) / `sold`(已售) / `returned`(已退货) / `exchanged`(已换货) / `repairing`(维修中)

---

## 3. 后端 API 设计

新建路由文件 `server/src/routes/after-sales.ts`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/after-sales` | store_scope | 工单列表（分页+筛选） |
| GET | `/api/after-sales/:id` | store_scope | 工单详情（含手机信息+日志） |
| POST | `/api/after-sales` | store_scope | 创建工单 |
| PUT | `/api/after-sales/:id` | store_scope | 更新工单（状态流转+处理信息） |
| POST | `/api/after-sales/:id/log` | store_scope | 添加操作日志/供应商沟通 |
| GET | `/api/after-sales/:id/logs` | store_scope | 获取工单日志列表 |

### 3.1 列表筛选参数

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| pageSize | number | 每页条数 |
| keyword | string? | 搜索 IMEI、客户姓名、客户电话 |
| status | string? | 筛选状态 |
| process_type | string? | 筛选处理方式 |
| store_id | number? | 筛选门店（仅超管可用） |
| start_date | string? | 开始日期 |
| end_date | string? | 结束日期 |

### 3.2 工单号生成规则

格式：`AS` + `yyMMddHHmmss` + 3位随机数字或字母

示例：`AS202606171530A3F`

### 3.3 换货逻辑

当 `process_type = exchange` 时：
1. 原手机 IMEI 状态改为 `exchanged`，关联 `after_sale_order_id`
2. 新手机 IMEI 从库存出库（状态从 `in_stock` 改为 `sold`）
3. 新建 `wh_inventory_log` 记录库存变更
4. 换货后可选择不创建新销售单（被换出的手机不走正常销售流程）

### 3.4 退款逻辑

当 `process_type = refund` 时：
1. 原手机 IMEI 状态改为 `returned`，关联 `after_sale_order_id`
2. 原销售单状态不变（已售事实不变）

### 3.5 维修逻辑

当 `process_type = repair` 时：
1. 原手机 IMEI 状态改为 `repairing`
2. 工单完结后 IMEI 状态回到 `sold`
3. 根据 `repair_level` 确定维修方式

### 3.6 供应商环节

工单下设 `supplier_status` 状态：
- `none`：无需供应商参与
- `pending`：待联系供应商
- `in_progress`：供应商处理中
- `completed`：供应商已处理完成

供应商沟通记录通过 `after_sale_log` 表记录，action 使用 `supplier_contact`、`supplier_done`。

---

## 4. 前端页面设计

### 4.1 管理后台 (client)

| 路由 | 页面 | 说明 |
|------|------|------|
| `/after-sales/list` | 售后工单列表 | 表格展示，支持筛选、分页、新建和查看详情 |
| `/after-sales/new` | 新建工单 | 扫码/搜索 IMEI，自动匹配手机和原销售信息，填写客户和故障 |
| `/after-sales/:id` | 工单详情/处理 | 工单全貌 + 状态流转操作 + 供应商沟通 + 操作日志 |

**导航**：左侧菜单新增「售后管理」项，图标为 `ChatDotSquare` 或 `Service`

**列表字段**：工单号、IMEI、客户姓名、品牌型号、处理方式、状态（带颜色标签）、创建时间、操作（查看）

**新建工单布局**：
- 左半：IMEI 输入区（扫码/搜索 + 匹配结果展示）
- 右半：客户信息（姓名、电话、地址）
- 下方：故障描述（textarea）
- 底部：取消 / 创建按钮

**工单详情布局**（三块信息区 + 操作区 + 日志区）：
- 顶部三卡片：手机信息 | 客户信息 | 当前状态（含状态标签）
- 故障描述展示
- 处理操作区（检测结果下拉、处理方式下拉、费用、供应商信息、保存按钮）
- 操作日志流（时间线样式 + 底部输入框添加日志）

### 4.2 门户 (portal)

| 路由 | 页面 | 说明 |
|------|------|------|
| `/after-sales` | 售后工单列表 | 卡片式概览，支持快捷操作 |
| `/after-sales/:id` | 工单详情 | 查看进度、操作记录 |

**导航**：顶部新增「售后」Tab

---

## 5. 路由配置

### client 端新增路由

```typescript
{ path: 'after-sales/list', component: () => import('@/views/after-sales/AfterSaleList.vue'), meta: { title: '售后工单' } },
{ path: 'after-sales/new', component: () => import('@/views/after-sales/AfterSaleNew.vue'), meta: { title: '新建工单' } },
{ path: 'after-sales/:id', component: () => import('@/views/after-sales/AfterSaleDetail.vue'), meta: { title: '工单详情' } },
```

### portal 端新增路由

```typescript
{ path: 'after-sales', component: () => import('@/views/AfterSales.vue'), meta: { title: '售后' } },
{ path: 'after-sales/:id', component: () => import('@/views/AfterSaleDetail.vue'), meta: { title: '售后详情' } },
```

---

## 6. Prisma Schema 变更

```prisma
model after_sale_order {
  id                 Int      @id @default(autoincrement())
  order_no           String   @unique
  store_id           Int
  imei_id            Int
  customer_name      String?
  customer_phone     String?
  customer_address   String?
  fault_description  String
  detection_result   String?
  process_type       String
  repair_level       String?
  cost               Float?
  cost_remark        String?
  handler_id         Int
  supplier_contact   String?
  supplier_status    String   @default("none")
  supplier_result    String?
  exchange_model_id  Int?
  exchange_imei_id   Int?
  result             String?
  status             String   @default("pending")
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt

  store    sys_store          @relation(fields: [store_id], references: [id])
  imei     wh_inventory_imei  @relation(fields: [imei_id], references: [id])
  handler  sys_user           @relation(fields: [handler_id], references: [id])
  logs     after_sale_log[]

  @@index([store_id])
  @@index([status])
  @@index([created_at])
  @@index([imei_id])
}

model after_sale_log {
  id          Int      @id @default(autoincrement())
  order_id    Int
  action      String
  operator_id Int?
  content     String
  created_at  DateTime @default(now())

  order   after_sale_order @relation(fields: [order_id], references: [id])
  operator sys_user?       @relation(fields: [operator_id], references: [id])

  @@index([order_id])
}

// wh_inventory_imei 新增字段
// after_sale_order_id Int? -- 关联售后工单
```

---

## 7. 与现有系统的交互

| 交互点 | 说明 |
|--------|------|
| wh_inventory_imei | 状态扩展 + 关联 after_sale_order_id |
| wh_inventory_log | 换货时记录库存变更 |
| wh_inventory | 换货时扣减库存（qty -1）（通过现有库存更新逻辑） |
| sale_order | 通过 IMEI 查询原销售单，不直接修改 |
| sys_store | 门店关联 |
| sys_user | 处理人/操作人关联 |

# 库存查询列表支持 IMEI2 / SN 码搜索与补录

## 背景

数据库 `wh_inventory_imei` 表已经包含 `imei2` 和 `sn_code` 字段，库存查询列表（门户端 `Inventory.vue`）当前仅支持按 IMEI、商品名称和厂商条码搜索，卡片也仅展示 IMEI。需要在列表中支持 IMEI2 和 SN 码的搜索、展示及补录功能。

## 修改范围

### 1. 后端 —— 搜索接口增加字段

**接口**: `GET /inventory/imei-list`

在关键词搜索的 `OR` 条件中增加 `imei2` 和 `sn_code` 字段，使搜索框输入 IMEI2 或 SN 码时可以匹配到对应记录。

**文件**: `server/src/routes/inventory.ts`

### 2. 后端 —— 新增补录接口

**接口**: `PUT /inventory/imei/:id`

- 请求体: `{ imei2?: string, sn_code?: string }`
- 更新 `wh_inventory_imei` 表中对应记录的 `imei2` 和/或 `sn_code`
- 验证至少提供一个字段

**文件**: `server/src/routes/inventory.ts`

### 3. 后端 —— 新增客户端 API 函数

在门户端 API 层增加 `updateImeiInfo` 函数，调用补录接口。

**文件**: `portal/src/api/inventory.ts`

### 4. 前端 —— ProductCard 增加展开/补录功能

**文件**: `portal/src/components/ProductCard.vue`

- 在卡片 IMEI 行下方增加展开区域（默认收起，点击展开按钮切换）
- 展开后显示 IMEI2 和 SN 码
- 若某字段为空，显示补录按钮
- 点击补录后内联变为输入框，保存后请求补录接口并更新卡片状态

### 5. 前端 —— 搜索框提示更新

**文件**: `portal/src/views/Inventory.vue`

- 搜索框 placeholder 改为 `搜索 IMEI / IMEI2 / SN码 / 商品名称...`

## 交互流程

1. 用户进入库存查询列表
2. 搜索框可输入 IMEI、IMEI2、SN 码或商品名称，后端统一匹配
3. 列表卡片默认展示品牌、型号、规格、IMEI
4. 用户点击卡片上的展开按钮，显示 IMEI2 和 SN 码
5. 如果某字段为空，显示"补录"按钮
6. 点击"补录"，内联变为输入框，用户输入后回车确认
7. 调用后端接口更新，成功后刷新卡片显示

## 数据流

```
用户输入关键词 → GET /inventory/imei-list?keyword=xxx
  → 后端 OR 匹配 imei / imei2 / sn_code / model.name / manufacturer_barcode
  → 返回匹配的 IMEI 列表（含 imei2 / sn_code）

用户点击补录 → PUT /inventory/imei/:id { imei2: "xxx" }
  → 后端更新 wh_inventory_imei 表
  → 返回更新后的记录
```

## 涉及文件清单

| 文件 | 改动说明 |
|------|---------|
| `server/src/routes/inventory.ts` | 搜索增加 imei2/sn_code 匹配；新增 PUT /imei/:id 补录接口 |
| `portal/src/api/inventory.ts` | 新增 `updateImeiInfo(id, data)` API |
| `portal/src/components/ProductCard.vue` | 增加展开区域、IMEI2/SN码展示、补录交互 |
| `portal/src/views/Inventory.vue` | 更新搜索框 placeholder |

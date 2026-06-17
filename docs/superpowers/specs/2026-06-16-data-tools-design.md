# 数据工具模块设计文档

## 概述

在手机销售管理系统中新增数据备份、导入、导出功能模块，支持整库备份、按表导出 Excel、从 Excel 导入数据，并在常用模块页面添加快捷导出按钮。

## 功能入口

采用「独立页面 + 模块按钮」结合的方式：

1. **侧边栏新增「数据工具」菜单** — 统一管理备份/导入/导出操作
2. **各模块列表页添加「导出 Excel」按钮** — 供应商、库存、销售、品牌型号、入库记录、库存流水

## API 接口设计

### 数据工具模块 (`/api/v1/tools`)

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/tools/tables` | 获取所有可操作的数据表列表（含中文名和记录数） |
| `GET` | `/tools/backup/download` | 下载整库备份（返回 .sqlite 文件） |
| `GET` | `/tools/export/:table` | 按表导出 Excel |
| `POST` | `/tools/import/:table` | 上传 Excel 导入数据到指定表 |

`:table` 可选值：`suppliers`, `inventory`, `sales`, `brands`, `models`, `purchase_entries`, `inventory_logs`

### 各模块快捷导出

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/purchase/suppliers/export` | 导出供应商（支持 keyword 筛选） |
| `GET` | `/inventory/export` | 导出库存（支持 storeId/keyword 筛选） |
| `GET` | `/inventory/logs/export` | 导出库存流水（支持 changeType/日期筛选） |
| `GET` | `/sales/sales/export` | 导出销售记录（支持日期/门店筛选） |
| `GET` | `/products/brands/export` | 导出品牌（含型号数量） |
| `GET` | `/products/models/export` | 导出型号（含品牌名） |

所有导出接口均携带当前页面的筛选条件参数。

## 前端设计

### 数据工具独立页面 (`DataTools.vue`)

路由 `/tools`，使用 Element Plus Tabs 分三个选项卡：

1. **数据备份** — 显示数据库信息、下载整库备份、按表导出
2. **数据导入** — 选择目标表、上传 Excel、预览、确认导入
3. **数据导出** — 表格展示所有可导出的表，支持筛选后导出

### 模块导出按钮

在每个列表页面的工具栏右侧添加 `el-button`，点击后调用对应 export API 触发浏览器下载。

## 后端技术方案

### 依赖

在 `server/` 安装 `xlsx` 库。

### 文件结构

- `server/src/routes/tools.ts` — 备份/导入/导出主路由
- 在各模块 route 文件中追加 `GET /export` 路由

### 整库备份

使用 `fs.createReadStream` 读取 `server/data/database.sqlite`，以 `application/octet-stream` 返回下载。

### Excel 导出

使用 `xlsx` 库构建 workbook：
- 查询数据（带筛选条件）
- 将字段名映射为中文表头
- 设置列宽自适应
- 以流形式返回 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### Excel 导入

使用 `multer` 接收上传的 Excel 文件：
- `xlsx` 解析为 JSON
- 按表执行字段校验（必填项、唯一性、外键存在性）
- 逐行写入数据库（事务保护）
- 返回导入结果（成功/失败行数 + 错误详情）

### 导入校验规则

| 表 | 必填字段 | 校验 |
|----|---------|------|
| 供应商 | name | 名称不能为空 |
| 品牌 | name | 名称不能重复 |
| 型号 | brand_id, name | 同一品牌下型号不能重复 |
| 库存 | model_id, store_id, quantity | 型号/门店必须存在 |
| 销售记录 | order_no | 单号不能重复 |

## 路由注册

在 `server/src/index.ts` 中注册：
```ts
import toolsRoutes from './routes/tools';
app.use('/api/v1/tools', toolsRoutes);
```

## 侧边栏菜单

在 `MainLayout.vue` 中新增：
```
<el-menu-item index="/tools">
  <el-icon><Tools /></el-icon>
  <template #title>数据工具</template>
</el-menu-item>
```

## 路由配置

在 `router/index.ts` 中新增：
```ts
{ path: 'tools', component: () => import('@/views/tools/DataTools.vue'), meta: { title: '数据工具' } }
```

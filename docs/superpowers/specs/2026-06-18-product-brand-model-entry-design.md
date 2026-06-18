# 品牌与型号录入模块 — 设计文档

> **日期**：2026-06-18
> **状态**：已批准待实施
> **涉及项目**：client（管理后台）、server（后端）

---

## 1. 背景与目标

### 1.1 现状问题

`ProductBrandModel.vue`（995 行）是后台管理端录入品牌与型号的核心模块，当前存在以下痛点：

1. **新增/编辑弹窗太重**：型号弹窗有 12 个规格字段（OS、屏幕、CPU、电池、内存、存储、颜色、网络、年份、条码、描述等），全部平铺在 2 列网格中，视觉与认知负担大。
2. **"快速新增"与"型号弹窗"割裂**：两个入口、两套逻辑。新建一个轻量型号要走快速新增，补充规格又要走型号弹窗，体验不连贯。
3. **无批量录入能力**：录入 N 个型号只能一个一个开弹窗填，没有表格导入入口。
4. **无重复校验**：没有品牌名/型号名的查重提示，可能产生重复数据。

### 1.2 目标

1. 将"品牌"与"型号"录入合并为一个一体化弹窗
2. 弹窗支持"1 品牌 + N 型号"，型号区使用手风琴组件可折叠
3. 提供 Excel 批量导入能力
4. 在录入时实时校验重复（品牌名、型号名），重复时禁止保存

### 1.3 非目标

- 暂不接入外部商品条码 API
- 暂不修改数据库 unique 约束（重复校验在应用层完成）
- 不改动主页面布局（侧边栏品牌树 + 型号表格 + 规格详情保持不变）

---

## 2. 整体设计

### 2.1 改造前 vs 改造后

| 入口 | 改造前 | 改造后 |
|------|--------|--------|
| 顶部"快速新增" | 极简弹窗（条码+品牌+型号名） | 一体化弹窗 |
| 侧边栏品牌"+" / "编辑" | 品牌弹窗 | 一体化弹窗（预填品牌+已有型号） |
| 型号列表"新增型号" | 12 字段重弹窗 | 一体化弹窗（预填品牌，型号区空） |
| 型号行"编辑" | 12 字段重弹窗 | 一体化弹窗（预填品牌+该型号 1 个） |
| 顶部"导入" | 无 | 新增，弹出 Excel 导入弹窗 |

### 2.2 一体化弹窗形态

```
┌─────────────────────────────────────────────────────────┐
│  新增品牌与型号                                       ×   │
├─────────────────────────────────────────────────────────┤
│  品牌信息                                               │
│  ┌─────────────────────┐  ┌───────────────────────┐     │
│  │ 品牌名称 *           │  │ 描述                  │     │
│  │ [Apple            ] │  │ [                  ] │     │
│  └─────────────────────┘  └───────────────────────┘     │
│                                                          │
│  型号清单 (3)                              [+ 新增型号]  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ▼ iPhone 15 Pro Max                  [复制] [×] │    │
│  │   ┌────────────────┐  ┌────────────────┐         │    │
│  │   │ 型号名称 *       │  │ 颜色           │         │    │
│  │   └────────────────┘  └────────────────┘         │    │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐         │    │
│  │   │ 操作系统  │ │ 屏幕尺寸  │ │ 上市年份  │         │    │
│  │   └──────────┘ └──────────┘ └──────────┘         │    │
│  │   ┌──────────┐ ┌──────────┐                      │    │
│  │   │ 运行内存  │ │ 存储容量  │                      │    │
│  │   └──────────┘ └──────────┘                      │    │
│  │   ▶ 更多规格 (CPU / 电池 / 网络 / 条码 / 描述)   │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ ▶ iPhone 15                                [×]  │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ ▶ iPhone 15 Plus                             [×]  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│            [ 取消 ]  [ 保存并新增品牌 ]  [ 保存 ]        │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Excel 导入弹窗形态

```
┌─────────────────────────────────────────────────┐
│  批量导入品牌与型号                          ×  │
├─────────────────────────────────────────────────┤
│  1. 下载模板                                  [↓] │
│                                                  │
│  2. 上传文件                                    │
│  ┌─────────────────────────────────────────┐    │
│  │           拖拽 .xlsx 到此                │    │
│  │           或 [选择文件]                  │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  重复数据处理方式：                              │
│    ( ) 跳过已存在的记录（默认）                  │
│    ( ) 用文件中的数据覆盖已存在的记录            │
│                                                  │
│  预览（前 10 行 / 共 50 行）：                  │
│  ┌────┬──────┬──────┬──────┬─────┐             │
│  │  # │ 品牌 │ 型号 │ 内存 │ ... │             │
│  ├────┼──────┼──────┼──────┼─────┤             │
│  │  1 │ Apple│ ...  │ ...  │ ... │             │
│  └────┴──────┴──────┴──────┴─────┘             │
│                                                  │
│  [ 取消 ]                       [ 开始导入 ]     │
└─────────────────────────────────────────────────┘
```

---

## 3. 重复校验策略

### 3.1 校验层级

| 层级 | 校验内容 | 时机 | 行为 |
|------|---------|------|------|
| 品牌名 | 与已加载品牌列表比对（不区分大小写、去除首尾空格） | 品牌名称输入框 `blur` 时 | 输入框红色边框 + 提示「品牌『Apple』已存在」；保存按钮禁用 |
| 型号名 | 同一品牌下是否已存在同名型号（不区分大小写） | 型号名称输入框 `blur` 时 | 该型号卡片标题变红 + 顶部红色提示条累计「N 个重复型号」；保存按钮禁用 |
| Excel 导入 | 逐行校验 | 解析时 | 重复行根据用户选择的处理方式（跳过/覆盖）执行 |

### 3.2 边界情况

- **新建品牌时**：与全部已有品牌比对
- **编辑现有品牌时**：从比对中排除自身（同名不视为重复）
- **新建型号时**：与目标品牌下全部已有型号比对
- **编辑现有型号时**：从比对中排除自身（同名不视为重复）
- **手风琴内同时存在多个重复**：分别标红，累计数量展示
- **保存期间用户继续修改导致新重复**：保存前再次全量校验

---

## 4. 组件设计

### 4.1 新建组件

#### `BrandModelEditDialog.vue`（一体化弹窗）

**Props：**
```ts
interface Props {
  visible: boolean
  mode: 'create' | 'edit-brand' | 'edit-model'
  brand?: BrandData          // edit-brand 模式必填
  model?: ModelData          // edit-model 模式必填
  existingBrands: BrandData[] // 用于重复校验
}
```

**Emits：**
```ts
emit('update:visible', val: boolean)
emit('saved', payload: { brand: BrandData; models: ModelData[] })
```

**内部状态：**
```ts
const brandForm = ref({ name: '', description: '' })
const modelList = ref<ModelData[]>([])    // 手风琴内的型号列表
const activeModelNames = ref<string[]>([])  // el-collapse 展开项
const brandError = ref('')                  // 品牌名重复提示
const modelErrors = ref<Record<number, string>>({}) // 型号 id -> 错误信息
const submitting = ref(false)
```

**关键方法：**
- `checkBrandDuplicate()` — 品牌名 blur 时调用，更新 `brandError`
- `checkModelDuplicate(idx)` — 型号名 blur 时调用，更新 `modelErrors`
- `addModel()` — 追加空型号，默认展开
- `duplicateModel(idx)` — 复制型号规格，名称加 " (副本)"
- `removeModel(idx)` — 移除型号
- `validateAll()` — 保存前全量校验，返回是否通过
- `handleSave()` — 创建或更新（编辑模式）
- `handleSaveAndNew()` — 保存后重置弹窗内容

#### `BatchImportDialog.vue`（导入弹窗）

**内部状态：**
```ts
const file = ref<File | null>(null)
const previewRows = ref<any[]>([])
const conflictMode = ref<'skip' | 'overwrite')  // 默认 'skip'
const importing = ref(false)
const result = ref<{ success: number; skipped: number; errors: any[] } | null>(null)
```

**流程：**
1. 选文件 → 客户端用 xlsx 解析前 N 行做预览
2. 提交时附带 `conflictMode` 参数到后端
3. 后端返回结果 → 前端展示
4. 提供"下载失败明细"按钮（生成 CSV）

### 4.2 修改组件

#### `ProductBrandModel.vue`

- 删除原有 `brandDialogVisible`、`modelDialogVisible`、`quickDialogVisible` 三个弹窗状态
- 新增 `editDialogVisible`、`editDialogMode`、`editDialogContext` 三个状态
- 新增 `importDialogVisible` 状态
- 保留"快速新增"按钮，但改为打开一体化弹窗（create 模式）
- 顶部新增"导入"按钮
- 监听 `@saved` 事件刷新品牌/型号数据

---

## 5. 数据流与接口

### 5.1 前端 API 变更

`client/src/api/product.ts` 新增：

```ts
export async function importBrandModels(
  file: File,
  conflictMode: 'skip' | 'overwrite'
): Promise<{
  success: number
  skipped: number
  overwritten: number
  errors: Array<{ row: number; message: string }>
}>
```

### 5.2 后端 API 新增

`server/src/routes/products.ts` 新增端点：

```
POST /api/v1/products/import
Content-Type: multipart/form-data
Body:
  - file: xlsx
  - conflictMode: 'skip' | 'overwrite'

Response 200:
{
  code: 200,
  data: {
    success: 50,        // 新建成功
    skipped: 5,         // 跳过已存在
    overwritten: 0,     // 覆盖更新
    errors: [
      { row: 12, message: "品牌名称为空" }
    ]
  }
}
```

**后端处理逻辑：**
1. 解析 xlsx → 转为对象数组
2. 按品牌名分组（去重 + 规范化大小写）
3. 对每个品牌：
   - 不存在 → 创建
   - 已存在 + 模式 skip → 跳过该品牌下所有型号
   - 已存在 + 模式 overwrite → 保留品牌 ID，遍历其下型号
4. 对每个型号：
   - 不存在 → 创建
   - 已存在 + 模式 skip → 计入 skipped
   - 已存在 + 模式 overwrite → update
5. 行级错误（缺必填、解析失败）计入 errors

**依赖库：**
- 后端使用 `xlsx`（已存在于 `server/src/routes/products.ts`）
- 前端使用 `xlsx`（需新增依赖：`npm i xlsx` 在 `client/`）

### 5.3 数据库

**本轮不修改** `pdt_brand` / `pdt_model` 的 unique 约束。重复校验完全在应用层完成。

---

## 6. 错误处理

| 场景 | 行为 |
|------|------|
| 品牌名与现有重复 | 输入框红边 + 提示文案，保存按钮禁用 |
| 型号名与同品牌下现有重复 | 该卡片标题变红 + 顶部错误条 + 保存按钮禁用 |
| 手风琴内两个型号同名（同品牌内） | 第二个标红，保存按钮禁用 |
| Excel 导入某行缺必填（品牌/型号） | 计入 errors，不中断后续行 |
| Excel 导入某行解析失败（非字符串字段类型错误） | 计入 errors |
| Excel 导入网络错误 | ElMessage 错误，弹窗保留可重试 |
| 编辑现有品牌时填了别的品牌名 | 视为重命名：搜索是否与其它品牌冲突，冲突则禁止 |
| 弹窗有未保存修改关闭 | 二次确认 |

---

## 7. 验收标准

### 7.1 一体化弹窗

- [ ] 顶部"快速新增"打开新弹窗，弹窗含品牌区 + 1 个默认空型号
- [ ] 弹窗可添加 1-N 个型号，超过 3 个时弹窗内部出现滚动
- [ ] 手风琴使用 `el-collapse`，默认展开第一个
- [ ] 复制按钮可复制当前型号，名称自动加 " (副本)"
- [ ] 「保存并新增品牌」可保存并重置弹窗
- [ ] 关闭弹窗前如有未保存修改有二次确认
- [ ] 编辑现有品牌时弹窗预填品牌信息和所有已有型号
- [ ] 编辑单个型号时弹窗预填品牌+该型号（1 个）

### 7.2 重复校验

- [ ] 品牌名输入框失焦时校验重复
- [ ] 重复品牌名：输入框红边 + 提示 + 保存禁用
- [ ] 型号名输入框失焦时校验重复
- [ ] 重复型号：该卡片标红 + 顶部错误条 + 保存禁用
- [ ] 编辑现有品牌/型号时自身不算重复
- [ ] 跨品牌同名型号不互相干扰

### 7.3 Excel 导入

- [ ] 顶部"导入"按钮可打开导入弹窗
- [ ] 可下载 .xlsx 模板（含表头与 1-2 行示例）
- [ ] 可拖拽或选择 .xlsx 文件
- [ ] 选择文件后展示前 10 行预览
- [ ] 「重复数据处理方式」单选：跳过（默认）/ 覆盖
- [ ] 导入完成后展示 {成功, 跳过, 覆盖, 失败} 四项统计
- [ ] 「下载失败明细」按钮生成 CSV
- [ ] 导入成功后自动刷新品牌/型号列表

### 7.4 兼容性

- [ ] 原 `QuickAddDialog` 相关代码全部移除，不留死代码
- [ ] 现有的导出（品牌/型号）、删除、详情查看功能不受影响
- [ ] 主页面布局（侧边栏 + 表格 + 详情）保持不变

---

## 8. 实施影响

### 8.1 新增文件

- `client/src/views/product/components/BrandModelEditDialog.vue`
- `client/src/views/product/components/BatchImportDialog.vue`
- `client/src/utils/excel.ts`（封装前端 xlsx 解析）
- `client/src/views/product/components/`（目录，如不存在）

### 8.2 修改文件

- `client/src/views/product/ProductBrandModel.vue` — 替换弹窗区块、添加导入按钮
- `client/src/api/product.ts` — 新增 `importBrandModels`
- `server/src/routes/products.ts` — 新增 `POST /products/import`

### 8.3 删除代码

- `ProductBrandModel.vue` 中：
  - `brandDialogVisible` / `brandForm` / `brandRules` / `openBrandDialog` / `handleBrandSubmit`（编辑品牌统一改用新弹窗，方法删除）
  - `modelDialogVisible` / `modelForm` / `modelRules` / `openModelDialog` / `handleModelSubmit`（编辑型号统一改用新弹窗，方法删除）
  - `quickDialogVisible` / `quickForm` / `quickRules` / `openQuickAddDialog` / `handleScanBarcode` / `quickSaveBrand` / `handleQuickSubmit`
  - 相关 `scanner` 创建/销毁逻辑（弹窗内自管）

> 注：`handleDeleteBrand` / `handleDeleteModel` 保留在 `ProductBrandModel.vue` 顶层，删除动作仍用 `ElMessageBox` 二次确认弹窗，与编辑/新建解耦。

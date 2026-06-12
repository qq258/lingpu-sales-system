# 前端设计规范 — Warm Editorial 主题

> 基于品牌与型号管理页面（ProductBrandModel.vue）提取的设计规范，指导后续页面样式开发与修改。

---

## 1. 设计令牌（Design Tokens）

所有自定义 CSS 属性统一以 `--pbm-` 为前缀，定义在根节点 `.pbm-root` 的 `:not(scoped)` 样式中。

### 1.1 色彩系统

| 令牌 | 色值 | 用途 |
|------|------|------|
| `--pbm-bg` | `#f5f0eb` | 页面主背景色，暖米白 |
| `--pbm-surface` | `#ffffff` | 卡片/面板/容器表面色 |
| `--pbm-surface-hover` | `#f0ebe5` | 悬浮/悬停态背景 |
| `--pbm-border` | `#e5ddd3` | 所有边框色 |
| `--pbm-text` | `#2c2418` | 正文/标题文字色 |
| `--pbm-text-dim` | `#8a7f72` | 次要/辅助文字色 |
| `--pbm-accent` | `#c9953c` | 强调色（金色）：选中态、品牌名、主要按钮 |
| `--pbm-accent-glow` | `rgba(201,149,60,0.12)` | 强调色发光/背景微光 |
| `--pbm-blue` | `#3b82f6` | 操作色（蓝色）：常规交互按钮 |
| `--pbm-blue-dim` | `rgba(59,130,246,0.12)` | 蓝色按钮悬停背景 |
| `--pbm-red` | `#dc3545` | 危险色：删除操作 |
| `--pbm-red-dim` | `rgba(220,53,69,0.12)` | 红色按钮悬停背景 |

### 1.2 排版

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--pbm-font` | `"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | 正文/界面字体 |
| `--pbm-mono` | `"SF Mono", "JetBrains Mono", "Cascadia Code", monospace` | 等宽字体：数据标签、计数徽标、副标题 |
| `--pbm-radius` | `6px` | 通用圆角 |

### 1.3 固定色值（硬编码）

以下色值不作为 CSS 变量，但在多处复用：

| 色值 | 用途 |
|------|------|
| `#ede7e0` | 计数徽标背景色 |
| `#f0ebe5` | 表格表头背景色 |
| `#faf7f4` | 表格条纹行背景色 |
| `#d5ccc0` | 自定义滚动条颜色 |
| `#f5f0eb` | Dialog 输入框背景色 |
| `#fff` | 按钮文字色（金色按钮上） |
| `rgba(138,127,114,0.4)` | 输入框 placeholder 文字色 |

---

## 2. 命名规范

### 2.1 CSS 类名前缀

所有自定义类使用 `pbm-` 前缀（取自 **P**rand **B**rand **M**odel），避免与 Element Plus 全局样式冲突。

```
pbm-root          → 页面根容器
pbm-{component}   → 组件容器
pbm-{component}--{modifier}  → 组件变体
pbm-{component}__{child}     → 组件子元素（BEM 风格）
```

### 2.2 常用组合模式

```
.pbm-{block}
.pbm-{block}--{modifier}    → 例如 pbm-icon-btn--danger、pbm-spec-value--muted
.pbm-{block}-head            → 区块标题栏
.pbm-{block}-empty           → 空状态
.pbm-{block}-grid            → 网格容器
.pbm-{block}-actions         → 操作按钮组
```

---

## 3. 组件规范

### 3.1 页面布局结构

```
.pbm-root                           → flex列，100%高度
├── .pbm-header                     → 顶部栏，border-bottom
├── .pbm-body                       → 主体区域，flex行，min-height:0
│   ├── .pbm-sidebar                → 侧边栏，固定宽度270px，flex列
│   │   ├── .pbm-sidebar-head       → 侧边栏标题栏
│   │   └── .pbm-tree-container     → 树容器，flex:1，overflow-y:auto
│   └── .pbm-main                   → 主区域，flex:1，flex列
│       ├── .pbm-main-head          → 主区域标题栏
│       ├── .pbm-table-wrapper      → 表格容器，固定高度230px
│       └── .pbm-detail-panel       → 详情面板，flex:1，min-height:0
```

**关键约束：**

- 所有 `flex` 容器必须设置 `min-height: 0` 或 `min-width: 0` 以允许子项收缩（Firefox 兼容）
- 固定尺寸的区块要加 `flex-shrink: 0` 防止压缩
- 嵌套 flex 列时，中间层级也要显式设置 `display: flex; flex-direction: column; min-height: 0`

### 3.2 按钮系统

#### (a) 强调按钮 `.pbm-btn-accent`

- 金色背景 + 白色文字
- 带图标时 flex gap 6px
- 悬停：颜色微亮 + 上移 1px + 金色阴影
- 禁用态：用 `:disabled`，在不支持按钮上设置 opacity

```css
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
```

#### (b) 幽灵按钮 `.pbm-btn-ghost`

- 透明背景 + 蓝色文字
- 有边框（`1px solid var(--pbm-border)`）
- 悬停：蓝色边框 + 蓝色背景微光
- 禁用态：opacity 0.35 + 指针样式

```css
.pbm-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: transparent;
  color: var(--pbm-blue);
  border: 1px solid var(--pbm-border);
  border-radius: var(--pbm-radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-ghost:hover { background: var(--pbm-blue-dim); border-color: var(--pbm-blue); }
.pbm-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }
```

#### (c) 纯按钮 `.pbm-btn-plain`

- 透明背景 + 灰色文字（用于取消等次要操作）
- 有边框
- 悬停：加深

```css
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
```

#### (d) 图标按钮 `.pbm-icon-btn`

- 正方形，内嵌 SVG 图标
- 无边框，透明背景
- 悬停：蓝色/红色背景微光

```css
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
```

### 3.3 品牌树（Sidebar Tree）

```
.pbm-tree-container                → 容器，flex:1，overflow-y:auto
  el-tree
    .pbm-tree-node                 → flex行，width:100%
      .pbm-tree-indicator          → 选中态金条指示器，3px宽
      .pbm-tree-icon               → SVG图标，18x18
      .pbm-tree-label-group        → flex:1，min-width:0
        .pbm-tree-label            → 品牌名称，text-overflow:ellipsis
        .pbm-tree-count            → 型号计数徽标，圆角10px
      .pbm-tree-actions            → 操作图标组，margin-left:auto
```

**交互规则：**

- `highlight-current` + `current-node-key` 控制选中态
- 选中行左侧显示发光金条指示器
- 选中态背景色：`rgba(212,168,83,0.08)`
- 操作按钮 `v-show="node.isCurrent"` 仅在选中节点时显示
- 操作按钮通过 `margin-left: auto` 右对齐
- 图标使用内联 SVG，`currentColor` 继承

### 3.4 表格（Table Overrides）

Element Plus `el-table` 通过 CSS 变量覆盖样式：

```css
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
```

**表头样式：** 全部大写、11px、letter-spacing 0.5px

**表格高度：** 固定 230px，超出滚动

### 3.5 详情面板（Detail Panel）

```
.pbm-detail-panel                  → flex:1，border-top
  .pbm-detail-bar                  → 标题栏，monospace字体
    .pbm-detail-bar-dot            → 金色圆点指示器 6x6
    .pbm-detail-bar-label          → "规格详情" 大写字幕
    .pbm-detail-bar-sep            → 分隔符 "|"
    .pbm-detail-bar-name           → 型号名，金色
  .pbm-detail-grid                 → auto-fill 网格，minmax(200px,1fr)
    .pbm-spec-card                 → 每个规格卡片
      .pbm-spec-label              → 标签，10px，大写，monospace
      .pbm-spec-value              → 值，14px，500字重
```

**规格网格特性：**

- 网格本身 `gap: 1px` 且背景为 `--pbm-border`，产生 1px 分割线效果
- 每个卡片背景白色，悬停变色
- 空值显示 `—`，加 `pbm-spec-value--muted` 变灰

### 3.6 Dialog 弹窗（Element Plus Override）

所有弹窗通过 `.pbm-dialog` 类覆盖 Element Plus 默认样式：

| 层级 | 覆盖内容 |
|------|---------|
| `.el-dialog` | 背景色、边框、圆角、阴影（`0 24px 80px rgba(0,0,0,0.15)`） |
| `.el-dialog__header` | 16px 24px 内边距，底部边框 |
| `.el-dialog__body` | 20px 24px 内边距 |
| `.el-dialog__footer` | 12px 24px 16px，flex 右对齐，按钮间距 8px |
| `el-form-item__label` | 13px，灰色 |
| `el-input/el-select/el-textarea` | 暖色背景 `#f5f0eb`，聚焦时金色发光边框 |
| `el-input-number` 按钮 | 浅灰背景 |
| `el-select-dropdown` | 白色背景，选中项金色 |
| `el-divider` | 边框色匹配 |

**表单布局：**

```
.pbm-dialog-grid           → 2列网格，gap:0 16px
.pbm-form-full              → grid-column: 1/-1 跨列
```

### 3.7 扫码结果条

```
.pbm-scan-result             → flex 行，10px 14px 内边距
.pbm-scan-result--ok         → 金色半透明背景 + 深金色文字
.pbm-scan-result--miss       → 红色半透明背景 + 深红色文字
```

### 3.8 SVG 图标规范

- 尺寸：大图标 16-18px，小图标 13-14px
- 描边宽度：按钮图标 2-2.5，装饰图标 1.2-1.8
- 颜色：使用 `currentColor` 继承父元素
- 图标在按钮内的间距：`gap: 5-6px`
- 行内 SVG 直接写在 template 中，不引入外部图标库

常用图标：

| 用途 | VIEWBOX | 描边宽 | 描述 |
|------|---------|--------|------|
| 增加/新增 | `0 0 24 24` | 2.5 | 十字线 |
| 编辑 | `0 0 24 24` | 2 | 笔+纸 |
| 删除 | `0 0 24 24` | 2 | 垃圾桶 |
| 品牌列表 | `0 0 24 24` | 1.8 | 4格方块 |
| 扫码 | `0 0 24 24` | 2 | 扫码框 |
| 搜索 | `0 0 24 24` | 1.2 | 放大镜 |

---

## 4. 动效规范

| 场景 | 动画 | 持续时间 |
|------|------|---------|
| 按钮悬停 | 背景色 + 变换 | 0.15s |
| 树节点悬停 | 背景色 | 0.12s |
| 操作按钮出现 | `fadeIn`（从右 4px 淡入） | 0.15s |
| 强调按钮悬停 | 上移 1px + 阴影 | 0.15s |
| 金条指示器 | 背景色 + 阴影 | 0.2s |
| 规格卡片悬停 | 背景色 | 0.12s |

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
```

---

## 5. 滚动条规范

所有需要滚动的容器自定义滚动条：

```css
/* 宽 4-5px */
/* 滑块颜色 #d5ccc0 圆角 2-3px */
.pbm-sidebar::-webkit-scrollbar,
.pbm-detail-panel::-webkit-scrollbar,
.pbm-tree-container::-webkit-scrollbar { width: 4px; }
.pbm-sidebar::-webkit-scrollbar-thumb,
.pbm-detail-panel::-webkit-scrollbar-thumb,
.pbm-tree-container::-webkit-scrollbar-thumb { background: #d5ccc0; border-radius: 2px; }
```

---

## 6. 新页面接入规范

创建新页面时建议遵循以下步骤：

1. **根容器**：外层 div 使用 `.pbm-root` 类，`scoped` 样式中设置 `height: 100%; display: flex; flex-direction: column;`
2. **CSS 变量**：在 `:not(scoped)` 的 `<style>` 块中定义完整的 `--pbm-*` 令牌集
3. **命名**：所有自定义类名以 `pbm-` 开头，避免与其他组件冲突
4. **布局模式**：优先使用 flex 布局，侧边栏固定宽度 + 主区域 flex:1
5. **按钮**：使用已有的 `.pbm-btn-accent` / `.pbm-btn-ghost` / `.pbm-btn-plain` / `.pbm-icon-btn` 类
6. **表格**：通过 CSS 变量覆盖 Element Plus 表格样式
7. **弹窗**：添加 `class="pbm-dialog"` 到 `el-dialog` 组件
8. **滚动**：添加自定义滚动条样式
9. **SVG**：使用内联 SVG 图标，`currentColor` 继承
10. **暗/亮兼容**：所有颜色通过 CSS 变量引用，一处修改全局生效

---

## 7. 编写约定速查

| 场景 | 量值 |
|------|------|
| 页面 main 背景 | `var(--pbm-bg)` |
| 卡片/面板背景 | `var(--pbm-surface)` |
| 页面元素内边距 | `16px 24px` / `12px 20px` |
| 区块标题 | `15-16px`，600 weight |
| 二级标题栏 | `11-12px`，大写，monospace，灰色 |
| 小标签/徽标 | `11px`，600 weight，monospace，`#ede7e0` 背景 |
| 表格表头 | `11px`，大写，600 weight |
| 一般按钮 | `12-13px` |
| 规格标签 | `10px`，大写，monospace，600 weight |
| 规格值 | `14px`，500 weight |
| 禁用态 | `opacity: 0.35` |

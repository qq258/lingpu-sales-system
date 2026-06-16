# 库存查询列表支持 IMEI2 / SN 码搜索与补录 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在库存查询列表页支持按 IMEI2 / SN 码搜索，并在卡片上展开查看和补录 IMEI2 / SN 码。

**Architecture:** 后端扩展 `/inventory/imei-list` 搜索关键词范围，新增 `PUT /inventory/imei/:id` 补录接口；前端 ProductCard 增加可展开区域展示 IMEI2/SN 码，并支持内联补录。

**Tech Stack:** Express.js + Prisma + SQLite（后端），Vue 3 + TypeScript（前端门户）

---

### Task 1: 后端 — 关键词搜索增加 imei2 / sn_code

**Files:**
- Modify: `server/src/routes/inventory.ts`（搜索条件部分）

- [ ] **Step 1: 在 imei-list 路由的关键词匹配中增加 imei2 和 sn_code**

定位到文件中的 `router.get('/imei-list', ...)` 部分，找到以下关键词匹配逻辑：

```typescript
if (keyword) {
  const keywordFilter = [
    { imei: { contains: keyword as string } },
    { model: { name: { contains: keyword as string } } },
    { model: { manufacturer_barcode: { contains: keyword as string } } },
  ];
```

在数组中增加 `imei2` 和 `sn_code` 匹配：

```typescript
if (keyword) {
  const keywordFilter = [
    { imei: { contains: keyword as string } },
    { imei2: { contains: keyword as string } },
    { sn_code: { contains: keyword as string } },
    { model: { name: { contains: keyword as string } } },
    { model: { manufacturer_barcode: { contains: keyword as string } } },
  ];
```

- [ ] **Step 2: 验证修改**

确认文件语法正确（无 TypeScript 报错）。

- [ ] **Step 3: 提交**

```bash
git add server/src/routes/inventory.ts
git commit -m "feat: add imei2 and sn_code to inventory imei-list keyword search"
```

---

### Task 2: 后端 — 新增 IMEI 补录接口

**Files:**
- Modify: `server/src/routes/inventory.ts`

- [ ] **Step 1: 新增 PUT /inventory/imei/:id 路由**

在 `router.get('/imei-list', ...)` 之后（或其他适当位置，在文件末尾 `export default router` 之前）添加：

```typescript
router.put('/imei/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { imei2, sn_code } = req.body;

    if (!imei2 && !sn_code) {
      const r: ApiResponse = { code: 400, message: 'IMEI2 和 SN 码至少提供一个' };
      return res.status(400).json(r);
    }

    const record = await prisma.wh_inventory_imei.findUnique({ where: { id } });
    if (!record) {
      const r: ApiResponse = { code: 404, message: '记录不存在' };
      return res.status(404).json(r);
    }

    const updated = await prisma.wh_inventory_imei.update({
      where: { id },
      data: {
        ...(imei2 !== undefined ? { imei2 } : {}),
        ...(sn_code !== undefined ? { sn_code } : {}),
      },
    });

    const r: ApiResponse = { code: 200, message: '更新成功', data: updated };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});
```

- [ ] **Step 2: 验证语法**

确认 TypeScript 编译无报错。

- [ ] **Step 3: 提交**

```bash
git add server/src/routes/inventory.ts
git commit -m "feat: add PUT /inventory/imei/:id endpoint for updating imei2/sn_code"
```

---

### Task 3: 前端 API — 新增 updateImeiInfo 函数

**Files:**
- Modify: `portal/src/api/inventory.ts`

- [ ] **Step 1: 新增 updateImeiInfo 函数**

在文件末尾（`getBrandInventory` 函数之后）添加：

```typescript
export async function updateImeiInfo(id: number, data: { imei2?: string; sn_code?: string }) {
  const res: any = await request.put(`/inventory/imei/${id}`, data)
  return res.data
}
```

- [ ] **Step 2: 提交**

```bash
git add portal/src/api/inventory.ts
git commit -m "feat: add updateImeiInfo API function"
```

---

### Task 4: 前端 ProductCard — 增加展开区域与补录功能

**Files:**
- Modify: `portal/src/components/ProductCard.vue`

- [ ] **Step 1: 在模板中展开按钮和展开区域**

在现有模板中，在 `.card-footer` 之前或之后增加展开按钮和展开区域。在 `card-imei` 行增加展开折叠按钮：

```vue
<div class="card-imei-row">
  <div class="card-imei">{{ product.imei }}</div>
  <button v-if="hasExpandable" class="card-expand-btn" @click="expanded = !expanded">
    <svg :class="['expand-icon', { 'expand-icon--open': expanded }]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
  </button>
</div>
<div v-if="expanded" class="card-extra">
  <div class="card-extra-item">
    <span class="card-extra-label">IMEI2</span>
    <template v-if="product.imei2">
      <span class="card-extra-value mono">{{ product.imei2 }}</span>
    </template>
    <template v-else>
      <div class="card-extra-edit">
        <input v-model="editImei2" class="extra-input" placeholder="输入 IMEI2" />
        <button class="extra-save-btn" @click="handleSave('imei2')">保存</button>
      </div>
    </template>
  </div>
  <div class="card-extra-item">
    <span class="card-extra-label">SN码</span>
    <template v-if="product.sn_code">
      <span class="card-extra-value mono">{{ product.sn_code }}</span>
    </template>
    <template v-else>
      <div class="card-extra-edit">
        <input v-model="editSnCode" class="extra-input" placeholder="输入 SN 码" />
        <button class="extra-save-btn" @click="handleSave('sn_code')">保存</button>
      </div>
    </template>
  </div>
</div>
```

- [ ] **Step 2: 更新脚本逻辑**

在 `<script setup>` 中增加状态和方法：

```typescript
import { ref, computed } from 'vue'
import { updateImeiInfo } from '@/api/inventory'

const props = defineProps<{ product: any }>()
const emit = defineEmits<{ updated: [] }>()

const expanded = ref(false)
const editImei2 = ref('')
const editSnCode = ref('')
const saving = ref(false)

const hasExpandable = computed(() => !props.product.imei2 || !props.product.sn_code)

async function handleSave(field: 'imei2' | 'sn_code') {
  const data: any = {}
  if (field === 'imei2') {
    if (!editImei2.value.trim()) return
    data.imei2 = editImei2.value.trim()
  } else {
    if (!editSnCode.value.trim()) return
    data.sn_code = editSnCode.value.trim()
  }
  saving.value = true
  try {
    await updateImeiInfo(props.product.id, data)
    // 更新本地 product 对象
    if (data.imei2) props.product.imei2 = data.imei2
    if (data.sn_code) props.product.sn_code = data.sn_code
    editImei2.value = ''
    editSnCode.value = ''
    emit('updated')
  } catch (e: any) {
    // 静默失败，可由父组件处理
  } finally {
    saving.value = false
  }
}
```

- [ ] **Step 3: 更新样式**

在 `<style scoped>` 中增加展开区域相关样式：

```css
.card-imei-row { display: flex; align-items: center; gap: 6px; }
.card-imei { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 14px; color: var(--text); background: rgba(226,232,240,0.4); padding: 6px 10px; border-radius: 6px; letter-spacing: 0.3px; flex: 1; }
.card-expand-btn { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 6px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: var(--transition); flex-shrink: 0; }
.card-expand-btn:hover { border-color: var(--primary); color: var(--primary); }
.expand-icon { transition: transform 0.2s; }
.expand-icon--open { transform: rotate(180deg); }
.card-extra { margin-top: 8px; padding: 10px 12px; background: rgba(226,232,240,0.25); border-radius: 8px; display: flex; flex-direction: column; gap: 8px; animation: slideDown 0.15s ease; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.card-extra-item { display: flex; align-items: center; gap: 8px; }
.card-extra-label { font-size: 12px; font-weight: 600; color: var(--text-tertiary); min-width: 48px; }
.card-extra-value { font-size: 13px; color: var(--text); }
.card-extra-value.mono { font-family: 'SF Mono', 'Cascadia Code', monospace; }
.card-extra-edit { display: flex; gap: 6px; flex: 1; }
.extra-input { flex: 1; height: 28px; padding: 0 8px; font-size: 13px; font-family: 'SF Mono', 'Cascadia Code', monospace; border: 1.5px solid var(--border); border-radius: 4px; outline: none; background: #fff; transition: var(--transition); }
.extra-input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-glow); }
.extra-save-btn { height: 28px; padding: 0 10px; border: none; border-radius: 4px; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); white-space: nowrap; }
.extra-save-btn:hover { background: var(--primary-dark); }
.extra-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
```

- [ ] **Step 4: 提交**

```bash
git add portal/src/components/ProductCard.vue
git commit -m "feat: add expandable area for imei2/sn_code display and fill-in in ProductCard"
```

---

### Task 5: 前端 — 更新搜索框提示

**Files:**
- Modify: `portal/src/views/Inventory.vue`

- [ ] **Step 1: 修改搜索框 placeholder**

将：

```vue
<input ref="searchRef" v-model="keyword" class="search-input" placeholder="搜索 IMEI / 商品名称..." @keyup.enter="doSearch" />
```

改为：

```vue
<input ref="searchRef" v-model="keyword" class="search-input" placeholder="搜索 IMEI / IMEI2 / SN码 / 商品名称..." @keyup.enter="doSearch" />
```

- [ ] **Step 2: 提交**

```bash
git add portal/src/views/Inventory.vue
git commit -m "feat: update search placeholder to include imei2 and sn_code hints"
```

---

### Task 6: 端到端验证

- [ ] **Step 1: 重启后端和前端服务**

```bash
# 停止当前服务，重新启动
```

- [ ] **Step 2: 功能验证**

1. 打开库存查询列表页
2. 搜索一个已知的 IMEI2 或 SN 码，确认能匹配到对应记录
3. 找到一条 IMEI2 或 SN 码为空的记录
4. 点击展开按钮，确认展开区域显示正确
5. 在空字段输入内容，点击保存
6. 确认保存成功后字段显示更新后的值
7. 刷新页面，确认数据持久化

- [ ] **Step 3: 提交最终修改（如有）**

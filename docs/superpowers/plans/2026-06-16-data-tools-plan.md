# 数据工具模块 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现数据表的整库备份、按表导出 Excel、从 Excel 导入数据，并为供应商/库存/销售/品牌型号/入库记录/库存流水模块添加快捷导出功能。

**Architecture:** 后端使用 `xlsx` 库在服务端生成 Excel 文件流返回下载，前端通过 API 调用触发浏览器下载。备份功能直接读取 SQLite 文件。数据工具作为独立页面（Tabs 分三个选项卡）+ 各模块页面添加快捷导出按钮。

**Tech Stack:** Express + Prisma + SQLite + xlsx (后端), Vue 3 + Element Plus + Axios (前端)

---

### Task 1: 安装后端 xlsx 依赖

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: 安装 xlsx 库**

```bash
cd d:\qxy\手机销售门户网站\server
npm install xlsx @types/xlsx
```

---

### Task 2: 创建后端 tools.ts 路由（备份/导出/导入）

**Files:**
- Create: `server/src/routes/tools.ts`

- [ ] **Step 1: 创建 tools.ts 文件**

```typescript
import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import * as XLSX from 'xlsx';
import multer from 'multer';

const router = Router();
router.use(authMiddleware);

const upload = multer({ dest: path.resolve(__dirname, '../../uploads/temp/') });

// 表名映射
const TABLE_MAP: Record<string, { label: string; model: string }> = {
  suppliers: { label: '供应商', model: 'pch_supplier' },
  inventory: { label: '库存', model: 'wh_inventory' },
  sales: { label: '销售记录', model: 'sale_order' },
  brands: { label: '品牌', model: 'pdt_brand' },
  models: { label: '型号', model: 'pdt_model' },
  purchase_entries: { label: '入库记录', model: 'pch_purchase_entry' },
  inventory_logs: { label: '库存流水', model: 'wh_inventory_log' },
};

// 获取所有可操作的表列表
router.get('/tables', async (_req: Request, res: Response) => {
  try {
    const result: Array<{ key: string; label: string; count: number }> = [];
    for (const [key, info] of Object.entries(TABLE_MAP)) {
      try {
        const count = await (prisma as any)[info.model].count();
        result.push({ key, label: info.label, count });
      } catch {
        result.push({ key, label: info.label, count: 0 });
      }
    }
    const r: ApiResponse = { code: 200, message: 'success', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 下载整库备份
router.get('/backup/download', async (_req: Request, res: Response) => {
  try {
    const dbPath = path.resolve(__dirname, '../../data/database.sqlite');
    if (!fs.existsSync(dbPath)) {
      const r: ApiResponse = { code: 404, message: '数据库文件不存在' };
      return res.status(404).json(r);
    }
    const stat = fs.statSync(dbPath);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=backup_${dateStr}.sqlite`);
    res.setHeader('Content-Length', stat.size);
    const stream = fs.createReadStream(dbPath);
    stream.pipe(res);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 按表导出 Excel
router.get('/export/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    if (!TABLE_MAP[table]) {
      const r: ApiResponse = { code: 400, message: `不支持的表: ${table}` };
      return res.status(400).json(r);
    }

    let data: any[] = [];
    const model = (prisma as any)[TABLE_MAP[table].model];

    switch (table) {
      case 'suppliers': {
        data = await model.findMany({
          select: { id: true, name: true, contact_person: true, phone: true, address: true, remark: true, status: true, created_at: true },
          orderBy: { id: 'desc' },
        });
        data = data.map((r: any) => ({
          '编号': r.id,
          '供应商名称': r.name,
          '联系人': r.contact_person || '',
          '联系电话': r.phone || '',
          '地址': r.address || '',
          '备注': r.remark || '',
          '状态': r.status === 1 ? '启用' : '禁用',
          '创建时间': formatDate(r.created_at),
        }));
        break;
      }
      case 'inventory': {
        const invData = await model.findMany({
          include: { model: { select: { name: true, color: true, ram: true, rom: true } }, store: { select: { name: true } } },
          orderBy: { id: 'desc' },
        });
        data = invData.map((r: any) => ({
          '编号': r.id,
          '门店': r.store?.name || '',
          '品牌名称': r.brand_name || '',
          '型号名称': r.model_name || '',
          '颜色': r.color || '',
          '存储': r.storage || '',
          '数量': r.quantity,
          '成本价': r.cost_price || 0,
          '售价': r.sale_price || 0,
        }));
        break;
      }
      case 'sales': {
        const saleData = await model.findMany({
          include: { store: { select: { name: true } }, operator: { select: { real_name: true } }, items: true },
          orderBy: { id: 'desc' },
        });
        data = saleData.map((r: any) => ({
          '单号': r.order_no,
          '门店': r.store?.name || '',
          '商品': r.model_name || '',
          '数量': r.quantity,
          '单价': r.unit_price || 0,
          '应收': r.total_amount || 0,
          '实收': r.actual_amount || 0,
          '客户': r.customer_name || '',
          '收银员': r.operator?.real_name || '',
          '时间': formatDate(r.created_at),
          '备注': r.remark || '',
        }));
        break;
      }
      case 'brands': {
        const brandData = await model.findMany({
          include: { _count: { select: { models: true } } },
          orderBy: { id: 'asc' },
        });
        data = brandData.map((r: any) => ({
          '编号': r.id,
          '品牌名称': r.name,
          '描述': r.description || '',
          '型号数量': r._count?.models || 0,
          '状态': r.status === 1 ? '启用' : '禁用',
          '创建时间': formatDate(r.created_at),
        }));
        break;
      }
      case 'models': {
        const modelData = await model.findMany({
          include: { brand: { select: { name: true } } },
          orderBy: { id: 'asc' },
        });
        data = modelData.map((r: any) => ({
          '编号': r.id,
          '品牌': r.brand?.name || '',
          '型号名称': r.name,
          '颜色': r.color || '',
          'RAM': r.ram || '',
          'ROM': r.rom || '',
          '售价': r.sale_price || 0,
          '成本价': r.cost_price || 0,
          '条码': r.manufacturer_barcode || '',
          '状态': r.status === 1 ? '启用' : '禁用',
        }));
        break;
      }
      case 'purchase_entries': {
        const entryData = await model.findMany({
          include: { store: { select: { name: true } }, supplier: { select: { name: true } }, operator: { select: { real_name: true } }, _count: { select: { items: true } } },
          orderBy: { id: 'desc' },
        });
        data = entryData.map((r: any) => ({
          '入库单号': r.entry_no || r.id,
          '门店': r.store?.name || '',
          '供应商': r.supplier?.name || '',
          '数量': r._count?.items || 0,
          '总金额': r.total_amount || 0,
          '状态': r.status === 'completed' ? '已完成' : '待确认',
          '操作人': r.operator?.real_name || '',
          '备注': r.remark || '',
          '创建时间': formatDate(r.created_at),
        }));
        break;
      }
      case 'inventory_logs': {
        const logData = await model.findMany({
          include: { model: { select: { name: true } }, store: { select: { name: true } } },
          orderBy: { id: 'desc' },
          take: 5000,
        });
        data = logData.map((r: any) => ({
          '编号': r.id,
          '门店': r.store?.name || '',
          '型号': r.model?.name || '',
          '变动类型': changeTypeLabel(r.change_type),
          '变动前数量': r.qty_before,
          '变动数量': r.qty_change,
          '变动后数量': r.qty_after,
          '备注': r.remark || '',
          '时间': formatDate(r.created_at),
        }));
        break;
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // 列宽自适应
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length * 2, 10),
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, TABLE_MAP[table].label);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${TABLE_MAP[table].label}_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导入 Excel 到指定表
router.post('/import/:table', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    if (!TABLE_MAP[table]) {
      const r: ApiResponse = { code: 400, message: `不支持的表: ${table}` };
      return res.status(400).json(r);
    }

    const file = req.file;
    if (!file) {
      const r: ApiResponse = { code: 400, message: '请上传 Excel 文件' };
      return res.status(400).json(r);
    }

    const wb = XLSX.readFile(file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);

    if (rows.length === 0) {
      const r: ApiResponse = { code: 400, message: 'Excel 文件为空' };
      return res.status(400).json(r);
    }

    // 删除临时文件
    fs.unlink(file.path, () => {});

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for header and 0-index
      try {
        switch (table) {
          case 'suppliers': {
            const name = row['供应商名称'] || row['name'];
            if (!name) { errors.push(`第${rowNum}行: 供应商名称不能为空`); continue; }
            await prisma.pch_supplier.create({
              data: {
                name,
                contact_person: row['联系人'] || row['contact_person'] || '',
                phone: row['联系电话'] || row['phone'] || '',
                address: row['地址'] || row['address'] || '',
                remark: row['备注'] || row['remark'] || '',
              },
            });
            success++;
            break;
          }
          case 'brands': {
            const name = row['品牌名称'] || row['name'];
            if (!name) { errors.push(`第${rowNum}行: 品牌名称不能为空`); continue; }
            const existing = await prisma.pdt_brand.findUnique({ where: { name } });
            if (existing) { errors.push(`第${rowNum}行: 品牌「${name}」已存在`); continue; }
            await prisma.pdt_brand.create({ data: { name, description: row['描述'] || row['description'] || '' } });
            success++;
            break;
          }
          default:
            errors.push(`第${rowNum}行: 表 ${table} 暂不支持导入`);
        }
      } catch (err: any) {
        errors.push(`第${rowNum}行: ${err.message}`);
      }
    }

    const r: ApiResponse = {
      code: 200,
      message: `导入完成: 成功 ${success} 条, 失败 ${errors.length} 条`,
      data: { success, errors },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

function formatDate(d: any): string {
  if (!d) return '';
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
}

function changeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    purchase_in: '采购入库',
    sale_out: '销售出库',
    transfer_out: '调货出库',
    transfer_in: '调货入库',
    check_adjust: '盘点调整',
    initial: '期初录入',
  };
  return map[type] || type;
}

export default router;
```

- [ ] **Step 2: 确保上传临时目录存在**

```bash
mkdir -p d:\qxy\手机销售门户网站\server\uploads\temp
```

---

### Task 3: 在 server/index.ts 注册 tools 路由

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: 添加 import 和路由注册**

在 `server/src/index.ts` 中，在 `import uploadRoutes from './routes/upload';` 之后添加：

```typescript
import toolsRoutes from './routes/tools';
```

在 `app.use('/api/v1/upload', uploadRoutes);` 之后添加：

```typescript
app.use('/api/v1/tools', toolsRoutes);
```

---

### Task 4: 在 purchase.ts 中添加供应商导出接口

**Files:**
- Modify: `server/src/routes/purchase.ts`

- [ ] **Step 1: 在文件顶部添加 xlsx 导入**

```typescript
import * as XLSX from 'xlsx';
```

- [ ] **Step 2: 在 `router.delete('/suppliers/:id', ...)` 之后添加导出路由**

```typescript
// 导出供应商
router.get('/suppliers/export', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { contact_person: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
      ];
    }
    const suppliers = await prisma.pch_supplier.findMany({ where, orderBy: { id: 'desc' } });
    const data = suppliers.map((r) => ({
      '编号': r.id,
      '供应商名称': r.name,
      '联系人': r.contact_person || '',
      '联系电话': r.phone || '',
      '地址': r.address || '',
      '备注': r.remark || '',
      '状态': r.status === 1 ? '启用' : '禁用',
      '创建时间': r.created_at?.toISOString().slice(0, 16).replace('T', ' ') || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '供应商');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=suppliers_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});
```

---

### Task 5: 在 inventory.ts 中添加库存导出接口和库存流水导出接口

**Files:**
- Modify: `server/src/routes/inventory.ts`

- [ ] **Step 1: 在文件顶部添加 xlsx 导入**

```typescript
import * as XLSX from 'xlsx';
```

- [ ] **Step 2: 在文件末尾（`export default router;` 之前）添加库存导出路由**

```typescript
// 导出库存
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { brand_name: { contains: keyword as string } },
        { model_name: { contains: keyword as string } },
      ];
    }
    const invData = await prisma.wh_inventory.findMany({
      where,
      include: { model: { select: { name: true, color: true, ram: true, rom: true } }, store: { select: { name: true } } },
      orderBy: { id: 'desc' },
    });
    const data = invData.map((r) => ({
      '编号': r.id,
      '门店': r.store?.name || '',
      '品牌名称': r.brand_name || '',
      '型号名称': r.model_name || '',
      '颜色': r.color || '',
      '存储': r.storage || '',
      '数量': r.quantity,
      '成本价': r.cost_price || 0,
      '售价': r.sale_price || 0,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '库存');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导出库存流水
router.get('/logs/export', async (req: Request, res: Response) => {
  try {
    const { changeType, startDate, endDate } = req.query;
    const where: any = {};
    if (changeType) where.change_type = changeType as string;
    if (startDate && endDate) {
      where.created_at = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string + 'T23:59:59'),
      };
    }
    const logData = await prisma.wh_inventory_log.findMany({
      where,
      include: { model: { select: { name: true } }, store: { select: { name: true } } },
      orderBy: { id: 'desc' },
      take: 5000,
    });
    const typeMap: Record<string, string> = {
      purchase_in: '采购入库', sale_out: '销售出库', transfer_out: '调货出库',
      transfer_in: '调货入库', check_adjust: '盘点调整', initial: '期初录入',
    };
    const data = logData.map((r) => ({
      '编号': r.id,
      '门店': r.store?.name || '',
      '型号': r.model?.name || '',
      '变动类型': typeMap[r.change_type] || r.change_type,
      '变动前数量': r.qty_before,
      '变动数量': r.qty_change,
      '变动后数量': r.qty_after,
      '备注': r.remark || '',
      '时间': r.created_at?.toISOString().slice(0, 16).replace('T', ' ') || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '库存流水');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_logs_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});
```

---

### Task 6: 在 sales.ts 中添加销售记录导出接口

**Files:**
- Modify: `server/src/routes/sales.ts`

- [ ] **Step 1: 在文件顶部添加 xlsx 导入**

```typescript
import * as XLSX from 'xlsx';
```

- [ ] **Step 2: 在销售路由文件末尾（`export default router;` 之前）添加导出路由**

```typescript
// 导出销售记录
router.get('/sales/export', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const where: any = {};
    if (startDate && endDate) {
      where.created_at = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string + 'T23:59:59'),
      };
    }
    if (storeId) where.store_id = parseInt(storeId as string);
    const sales = await prisma.sale_order.findMany({
      where,
      include: { store: { select: { name: true } }, operator: { select: { real_name: true } } },
      orderBy: { id: 'desc' },
    });
    const data = sales.map((r) => ({
      '编号': r.id,
      '单号': r.order_no,
      '门店': r.store?.name || '',
      '商品': r.model_name || '',
      '数量': r.quantity,
      '单价': r.unit_price || 0,
      '应收': r.total_amount || 0,
      '实收': r.actual_amount || 0,
      '找零': r.change_amount || 0,
      '客户': r.customer_name || '',
      '客户电话': r.customer_phone || '',
      '收银员': r.operator?.real_name || '',
      '时间': r.created_at?.toISOString().slice(0, 16).replace('T', ' ') || '',
      '备注': r.remark || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '销售记录');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});
```

---

### Task 7: 在 products.ts 中添加品牌和型号导出接口

**Files:**
- Modify: `server/src/routes/products.ts`

- [ ] **Step 1: 在文件顶部添加 xlsx 导入**

```typescript
import * as XLSX from 'xlsx';
```

- [ ] **Step 2: 在 `router.get('/models/:id', ...)` 之后，`export default router;` 之前添加导出路由**

```typescript
// 导出品牌
router.get('/brands/export', async (req: Request, res: Response) => {
  try {
    const brands = await prisma.pdt_brand.findMany({
      include: { _count: { select: { models: true } } },
      orderBy: { id: 'asc' },
    });
    const data = brands.map((r) => ({
      '编号': r.id,
      '品牌名称': r.name,
      '描述': r.description || '',
      '型号数量': r._count?.models || 0,
      '状态': r.status === 1 ? '启用' : '禁用',
      '创建时间': r.created_at?.toISOString().slice(0, 16).replace('T', ' ') || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '品牌');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=brands_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导出型号
router.get('/models/export', async (req: Request, res: Response) => {
  try {
    const models = await prisma.pdt_model.findMany({
      include: { brand: { select: { name: true } } },
      orderBy: { id: 'asc' },
    });
    const data = models.map((r) => ({
      '编号': r.id,
      '品牌': r.brand?.name || '',
      '型号名称': r.name,
      '颜色': r.color || '',
      'RAM': r.ram || '',
      'ROM': r.rom || '',
      '售价': r.sale_price || 0,
      '成本价': r.cost_price || 0,
      '条码': r.manufacturer_barcode || '',
      '状态': r.status === 1 ? '启用' : '禁用',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '型号');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=models_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});
```

---

### Task 8: 创建前端 API 文件 tools.ts

**Files:**
- Create: `client/src/api/tools.ts`

- [ ] **Step 1: 创建 tools.ts**

```typescript
import request from './request'

export interface TableInfo {
  key: string
  label: string
  count: number
}

export async function getTables(): Promise<TableInfo[]> {
  const res: any = await request.get('/tools/tables')
  return res.data || []
}

export function downloadBackup(): void {
  const token = localStorage.getItem('token')
  const url = `/api/v1/tools/backup/download`
  const link = document.createElement('a')
  link.href = url
  link.style.display = 'none'
  // 添加 token 到 header 无法通过 a 标签实现，使用 fetch
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.download = `backup_${dateStr}.sqlite`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(() => {})
}

export function exportTable(tableKey: string, filename?: string): void {
  const token = localStorage.getItem('token')
  const url = `/api/v1/tools/export/${tableKey}`
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `${tableKey}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(() => {})
}

export async function importTable(tableKey: string, file: File): Promise<{ success: number; errors: string[] }> {
  const formData = new FormData()
  formData.append('file', file)
  const res: any = await request.post(`/tools/import/${tableKey}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data || { success: 0, errors: [] }
}

// 模块快捷导出 - 通过后端 API 直接触发下载（带筛选参数）
export function exportWithQuery(url: string, params: Record<string, any> = {}): void {
  const token = localStorage.getItem('token')
  const queryStr = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
  const fullUrl = `/api/v1${url}${queryStr ? '?' + queryStr : ''}`
  fetch(fullUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error('导出失败')
      return res.blob()
    })
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = (blob as any).name || 'export.xlsx'
      a.download = disposition
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(() => {})
}
```

---

### Task 9: 创建前端 DataTools.vue 页面

**Files:**
- Create: `client/src/views/tools/DataTools.vue`

- [ ] **Step 1: 创建 DataTools.vue**

```vue
<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">数据工具</h1>
        <span class="pbm-subtitle">Data Tools</span>
      </div>
    </header>

    <div class="pbm-body">
      <el-tabs v-model="activeTab" class="pbm-tabs">
        <el-tab-pane label="数据备份" name="backup">
          <div class="pbm-tab-content">
            <div class="pbm-card">
              <h3 class="pbm-card-title">整库备份</h3>
              <p class="pbm-card-desc">下载当前数据库的完整备份文件（.sqlite 格式），可用于数据恢复。</p>
              <div class="pbm-card-info">
                <span>数据库类型: SQLite</span>
                <span>文件路径: data/database.sqlite</span>
              </div>
              <button class="pbm-btn-accent" :loading="backupLoading" @click="handleBackup">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>下载整库备份</span>
              </button>
            </div>

            <div class="pbm-card">
              <h3 class="pbm-card-title">按表导出</h3>
              <p class="pbm-card-desc">选择需要导出的数据表，导出为 Excel 文件。</p>
              <div class="pbm-card-row">
                <el-select v-model="exportTableKey" placeholder="请选择数据表" style="width: 240px;">
                  <el-option v-for="t in tables" :key="t.key" :label="t.label" :value="t.key" />
                </el-select>
                <button class="pbm-btn-accent" :disabled="!exportTableKey" @click="handleExportTable">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>导出 Excel</span>
                </button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据导入" name="import">
          <div class="pbm-tab-content">
            <div class="pbm-card">
              <h3 class="pbm-card-title">从 Excel 导入数据</h3>
              <p class="pbm-card-desc">选择目标数据表并上传 Excel 文件，导入数据到系统中。</p>
              <div class="pbm-card-row">
                <el-select v-model="importTableKey" placeholder="请选择目标数据表" style="width: 240px;">
                  <el-option v-for="t in importableTables" :key="t.key" :label="t.label" :value="t.key" />
                </el-select>
              </div>
              <div class="pbm-card-row">
                <el-upload
                  ref="uploadRef"
                  :auto-upload="false"
                  :show-file-list="true"
                  accept=".xlsx,.xls"
                  :limit="1"
                  :on-change="onFileChange"
                >
                  <template #trigger>
                    <el-button type="primary" plain>选择文件</el-button>
                  </template>
                  <el-button class="pbm-btn-accent" style="margin-left: 10px;" :disabled="!selectedFile || !importTableKey" :loading="importLoading" @click="handleImport">
                    确认导入
                  </el-button>
                  <template #tip>
                    <div class="pbm-tip">仅支持 .xlsx / .xls 文件</div>
                  </template>
                </el-upload>
              </div>
              <div v-if="importResult" class="pbm-import-result">
                <div :class="['pbm-import-summary', importResult.errors.length === 0 ? 'pbm-import-success' : 'pbm-import-warn']">
                  {{ importResult.msg }}
                </div>
                <div v-if="importResult.errors.length > 0" class="pbm-import-errors">
                  <div v-for="(err, i) in importResult.errors" :key="i" class="pbm-import-error">{{ err }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据导出" name="export">
          <div class="pbm-tab-content">
            <div class="pbm-card">
              <h3 class="pbm-card-title">数据表列表</h3>
              <p class="pbm-card-desc">所有可导出的数据表，点击「导出 Excel」下载数据。</p>
              <el-table :data="tables" stripe size="small">
                <el-table-column prop="label" label="数据表" min-width="200" />
                <el-table-column prop="count" label="记录数" width="120" align="center" />
                <el-table-column label="操作" width="140" align="center">
                  <template #default="{ row }">
                    <button class="pbm-btn-accent pbm-btn-accent--sm" @click="exportTable(row.key)">
                      导出 Excel
                    </button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadInstance, UploadFile } from 'element-plus'
import { getTables, downloadBackup, exportTable, importTable } from '@/api/tools'
import type { TableInfo } from '@/api/tools'

const activeTab = ref('backup')
const backupLoading = ref(false)
const tables = ref<TableInfo[]>([])
const exportTableKey = ref('')
const importTableKey = ref('')
const importLoading = ref(false)
const selectedFile = ref<File | null>(null)
const uploadRef = ref<UploadInstance>()
const importResult = ref<{ msg: string; errors: string[] } | null>(null)

const importableTables = computed(() =>
  tables.value.filter(t => ['suppliers', 'brands'].includes(t.key))
)

async function loadTables() {
  try {
    tables.value = await getTables()
  } catch {
    tables.value = []
  }
}

function handleBackup() {
  backupLoading.value = true
  try {
    downloadBackup()
    ElMessage.success('备份文件下载中...')
  } catch {
    ElMessage.error('备份失败')
  } finally {
    backupLoading.value = false
  }
}

function handleExportTable() {
  if (!exportTableKey.value) return
  const table = tables.value.find(t => t.key === exportTableKey.value)
  exportTable(exportTableKey.value, `${table?.label || exportTableKey.value}.xlsx`)
  ElMessage.success('导出中...')
}

function onFileChange(uploadFile: UploadFile) {
  if (uploadFile.raw) {
    selectedFile.value = uploadFile.raw
  }
}

async function handleImport() {
  if (!importTableKey.value || !selectedFile.value) return
  importLoading.value = true
  importResult.value = null
  try {
    const result = await importTable(importTableKey.value, selectedFile.value)
    importResult.value = {
      msg: result.errors.length === 0
        ? `✅ 成功导入 ${result.success} 条数据`
        : `⚠️ 成功 ${result.success} 条，失败 ${result.errors.length} 条`,
      errors: result.errors || [],
    }
    ElMessage.success('导入完成')
    loadTables()
  } catch (e: any) {
    importResult.value = { msg: `❌ 导入失败: ${e.message || '未知错误'}`, errors: [] }
  } finally {
    importLoading.value = false
  }
}

onMounted(() => {
  loadTables()
})
</script>

<style scoped>
.pbm-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #2c2418;
  font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f5f0eb;
}
.pbm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  flex-shrink: 0;
  border-bottom: 1px solid #e5ddd3;
}
.pbm-header-left { display: flex; align-items: baseline; gap: 12px; }
.pbm-title { font-size: 20px; font-weight: 600; margin: 0; }
.pbm-subtitle { font-size: 12px; color: #8a7f72; text-transform: uppercase; letter-spacing: 0.4px; font-family: "SF Mono", monospace; }
.pbm-body { flex: 1; padding: 24px; overflow-y: auto; }
.pbm-tabs :deep(.el-tabs__header) { margin: 0 0 20px; }
.pbm-tabs :deep(.el-tabs__item) { font-size: 14px; font-weight: 500; color: #8a7f72; }
.pbm-tabs :deep(.el-tabs__item.is-active) { color: #c9953c; }
.pbm-tabs :deep(.el-tabs__active-bar) { background: #c9953c; }
.pbm-tab-content { display: flex; flex-direction: column; gap: 20px; }
.pbm-card {
  background: #fff;
  border: 1px solid #e5ddd3;
  border-radius: 6px;
  padding: 24px;
}
.pbm-card-title { font-size: 16px; font-weight: 600; margin: 0 0 8px; }
.pbm-card-desc { font-size: 13px; color: #8a7f72; margin: 0 0 16px; }
.pbm-card-info { display: flex; gap: 24px; font-size: 12px; color: #8a7f72; margin-bottom: 16px; font-family: "SF Mono", monospace; }
.pbm-card-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.pbm-btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: #c9953c;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-accent:hover { background: #dba84a; }
.pbm-btn-accent:disabled { opacity: 0.5; cursor: not-allowed; }
.pbm-btn-accent--sm { padding: 4px 12px; font-size: 12px; }
.pbm-tip { font-size: 12px; color: #8a7f72; margin-top: 4px; }
.pbm-import-result { margin-top: 12px; }
.pbm-import-summary { padding: 8px 12px; border-radius: 4px; font-size: 13px; font-weight: 500; }
.pbm-import-success { background: rgba(34,197,94,0.12); color: #16a34a; }
.pbm-import-warn { background: rgba(234,179,8,0.12); color: #ca8a04; }
.pbm-import-errors { margin-top: 8px; max-height: 200px; overflow-y: auto; }
.pbm-import-error { padding: 4px 8px; font-size: 12px; color: #dc3545; font-family: "SF Mono", monospace; }
</style>
```

---

### Task 10: 添加前端路由和侧边栏菜单

**Files:**
- Modify: `client/src/router/index.ts`
- Modify: `client/src/layouts/MainLayout.vue`

- [ ] **Step 1: 在 router/index.ts 中添加 tools 路由**

在 children 数组中添加：
```typescript
{ path: 'tools', component: () => import('@/views/tools/DataTools.vue'), meta: { title: '数据工具' } },
```

- [ ] **Step 2: 在 MainLayout.vue 侧边栏中添加菜单项**

在 `<el-menu-item index="/system/user" ...>` 之前添加：
```html
<el-menu-item index="/tools">
  <el-icon><Tools /></el-icon>
  <template #title>数据工具</template>
</el-menu-item>
```

在 script 的 `import` 中添加 `Tools` 图标：
```typescript
import { ..., Tools, ... } from '@element-plus/icons-vue'
```

---

### Task 11: 在 SupplierList.vue 中添加导出按钮

**Files:**
- Modify: `client/src/views/purchase/SupplierList.vue`

- [ ] **Step 1: 在 header 中的"新增供应商"按钮旁边添加导出按钮**

在 `<button class="pbm-btn-accent" @click="openDialog()">` 之前添加：
```html
<button class="pbm-btn-plain" @click="handleExport" style="margin-right:8px;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  <span>导出 Excel</span>
</button>
```

- [ ] **Step 2: 在 script setup 中添加导出方法**

```typescript
import { exportWithQuery } from '@/api/tools'

function handleExport() {
  exportWithQuery('/purchase/suppliers/export', { keyword: searchKeyword.value })
}
```

---

### Task 12: 在 InventoryList.vue 中添加导出按钮

**Files:**
- Modify: `client/src/views/inventory/InventoryList.vue`

- [ ] **Step 1: 在查询按钮旁边添加导出按钮**

在 `button class="pbm-btn-accent" @click="loadImeiList"` 之后添加：
```html
<button class="pbm-btn-plain" @click="handleExport">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  <span>导出 Excel</span>
</button>
```

- [ ] **Step 2: 在 script setup 中添加导出方法**

```typescript
import { exportWithQuery } from '@/api/tools'

function handleExport() {
  exportWithQuery('/inventory/export', {
    keyword: searchKeyword.value || undefined,
    brand_id: searchBrandId.value || undefined,
    model_id: searchModelId.value || undefined,
  })
}
```

- [ ] **Step 3: 添加 .pbm-btn-plain 样式**

```css
.pbm-btn-plain {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: transparent;
  color: #8a7f72;
  border: 1px solid #e5ddd3;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.pbm-btn-plain:hover { color: #2c2418; border-color: #8a7f72; }
```

---

### Task 13: 在 InventoryLogs.vue 中添加导出按钮

**Files:**
- Modify: `client/src/views/inventory/InventoryLogs.vue`

- [ ] **Step 1: 在查询按钮旁边添加导出按钮**

在 `button class="pbm-btn-accent" @click="loadLogs"` 之后添加：
```html
<button class="pbm-btn-plain" @click="handleExport">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  <span>导出 Excel</span>
</button>
```

- [ ] **Step 2: 在 script setup 中添加导出方法**

```typescript
import { exportWithQuery } from '@/api/tools'

function handleExport() {
  exportWithQuery('/inventory/logs/export', {
    changeType: searchType.value || undefined,
    // logs 页面暂无条件传递日期范围，如果页面有则添加
  })
}
```

- [ ] **Step 3: 添加 .pbm-btn-plain 样式**（与 Task 12 相同）

---

### Task 14: 在 SaleList.vue 中添加导出按钮

**Files:**
- Modify: `client/src/views/sales/SaleList.vue`

- [ ] **Step 1: 在查询按钮旁边添加导出按钮**

在 `<button class="pbm-btn-accent" @click="loadSales">查询</button>` 之后添加：
```html
<button class="pbm-btn-plain" @click="handleExport">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  <span>导出 Excel</span>
</button>
```

- [ ] **Step 2: 在 script setup 中添加导出方法**

```typescript
import { exportWithQuery } from '@/api/tools'

function handleExport() {
  exportWithQuery('/sales/sales/export', {
    startDate: dateRange.value?.[0] || undefined,
    endDate: dateRange.value?.[1] || undefined,
    storeId: userStore.effectiveStoreId || undefined,
  })
}
```

---

### Task 15: 在 ProductBrandModel.vue 中添加导出按钮

**Files:**
- Modify: `client/src/views/product/ProductBrandModel.vue`

- [ ] **Step 1: 在 header 中的"快速新增"按钮旁边添加导出按钮**

在 `<button class="pbm-btn-accent" @click="openQuickAddDialog">` 之前添加：
```html
<button class="pbm-btn-plain" @click="handleExportBrands" style="margin-right:8px;">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  <span>导出品牌</span>
</button>
<button class="pbm-btn-plain" @click="handleExportModels" style="margin-right:8px;">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  <span>导出型号</span>
</button>
```

- [ ] **Step 2: 在 script setup 中添加导出方法**

```typescript
import { exportWithQuery } from '@/api/tools'

function handleExportBrands() {
  exportWithQuery('/products/brands/export')
}

function handleExportModels() {
  exportWithQuery('/products/models/export')
}
```

---

### Task 16: 在 PurchaseEntryList.vue 中添加导出按钮

**Files:**
- Modify: `client/src/views/purchase/PurchaseEntryList.vue`

- [ ] **Step 1: 在查询按钮旁边添加导出按钮**

在 `<button class="pbm-btn-accent pbm-btn-accent--sm" @click="loadEntries">查询</button>` 之后添加：
```html
<button class="pbm-btn-plain pbm-btn-plain--sm" @click="handleExport">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  <span>导出 Excel</span>
</button>
```

- [ ] **Step 2: 在 script setup 中添加导出方法**

```typescript
import { exportWithQuery } from '@/api/tools'

function handleExport() {
  exportWithQuery('/tools/export/purchase_entries', {
    supplierId: searchSupplierId.value || undefined,
    status: searchStatus.value || undefined,
  })
}
```

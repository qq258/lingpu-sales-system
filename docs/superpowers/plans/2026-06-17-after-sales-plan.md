# 售后记录模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增售后记录模块，支持维修/换货/退款三种售后场景，关联具体手机（IMEI），跟踪供应商沟通，部署在管理后台和门户两端。

**Architecture:** Prisma schema 新增 `after_sale_order` + `after_sale_log` 两张表，扩展 `wh_inventory_imei` 状态。后端新增 Express 路由 `/api/v1/after-sales`，管理后台 (client) 新增 3 个页面，门户 (portal) 新增 2 个页面。

**Tech Stack:** Node.js + Express + Prisma + SQLite, Vue 3 + Element Plus (client), Vue 3 (portal)

---

### Task 1: Prisma Schema — 新增 `after_sale_order` 和 `after_sale_log` 模型，修改 `wh_inventory_imei`

**Files:**
- Modify: `server/prisma/schema.prisma` (追加两个模型 + 修改 wh_inventory_imei)

- [ ] **Step 1: 在 schema.prisma 末尾追加以下两个模型**

在 `model wh_transfer` 的结束 `}` 之后，追加：

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
```

- [ ] **Step 2: 修改 `wh_inventory_imei` 模型，添加 `after_sale_order_id` 字段**

找到 `model wh_inventory_imei {`，在 `sold_at    DateTime?` 行之后、`created_at DateTime @default(now())` 行之前添加：

```prisma
  after_sale_order_id Int?
```

同时在该模型的 `store sys_store @relation(...)` 行之后添加关系：

```prisma
  after_sale_order after_sale_order? @relation(fields: [after_sale_order_id], references: [id])
```

- [ ] **Step 3: 运行 `cd server && npx prisma migrate dev --name add_after_sales` 生成迁移**

```bash
cd d:\qxy\手机销售门户网站\server
npx prisma migrate dev --name add_after_sales
```

Expected: Migration created and applied successfully. SQLite database updated with new tables and columns.

---

### Task 2: Server — 订单号生成工具添加 `AS` 前缀支持

**Files:**
- Modify: `server/src/utils/order-no.ts`

- [ ] **Step 1: 在 `generateOrderNo` 函数的 `else if (prefix === 'SA')` block 之后添加 `AS` 分支**

```typescript
  } else if (prefix === 'AS') {
    lastRecord = await prisma.after_sale_order.findFirst({
      where: { order_no: { startsWith: baseNo } },
      orderBy: { order_no: 'desc' },
      select: { order_no: true },
    });
  }
```

---

### Task 3: Server — 新建 `after-sales.ts` 路由

**Files:**
- Create: `server/src/routes/after-sales.ts`

- [ ] **Step 1: 创建路由文件，实现全部 6 个 API 端点**

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { storeScopeMiddleware } from '../middleware/store-scope';
import { generateOrderNo } from '../utils/order-no';

const router = Router();

router.use(authMiddleware);
router.use(storeScopeMiddleware);

function getStoreId(req: Request): number | null {
  return (req as any).effectiveStoreId ?? null;
}

// POST /api/v1/after-sales — 创建工单
router.post('/', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }

    const { imei_id, customer_name, customer_phone, customer_address, fault_description } = req.body;

    if (!imei_id) {
      const r: ApiResponse = { code: 400, message: '请选择手机' };
      return res.status(400).json(r);
    }
    if (!fault_description) {
      const r: ApiResponse = { code: 400, message: '请描述故障或售后原因' };
      return res.status(400).json(r);
    }

    // 验证 IMEI 存在
    const imei = await prisma.wh_inventory_imei.findUnique({ where: { id: imei_id } });
    if (!imei) {
      const r: ApiResponse = { code: 404, message: '未找到该手机' };
      return res.status(404).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
    const orderNo = await generateOrderNo('AS', store!.code);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.after_sale_order.create({
        data: {
          order_no: orderNo,
          store_id: storeId,
          imei_id,
          customer_name: customer_name || imei.customer_name,
          customer_phone: customer_phone || imei.customer_phone,
          customer_address,
          fault_description,
          handler_id: req.user!.userId,
          status: 'pending',
        },
        include: {
          imei: {
            include: { model: { include: { brand: { select: { name: true } } } } },
          },
          handler: { select: { id: true, real_name: true } },
        },
      });

      // 创建初始日志
      await tx.after_sale_log.create({
        data: {
          order_id: order.id,
          action: 'created',
          operator_id: req.user!.userId,
          content: `创建售后工单，故障描述：${fault_description}`,
        },
      });

      return order;
    });

    const r: ApiResponse = { code: 200, message: '工单创建成功', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// GET /api/v1/after-sales — 工单列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    const { keyword, status, process_type, start_date, end_date, page = '1', pageSize = '20' } = req.query;

    const where: any = {};

    if (storeId) {
      where.store_id = storeId;
    }
    if (status) where.status = status;
    if (process_type) where.process_type = process_type;

    if (keyword) {
      where.OR = [
        { imei: { imei: { contains: keyword as string } } },
        { customer_name: { contains: keyword as string } },
        { customer_phone: { contains: keyword as string } },
        { order_no: { contains: keyword as string } },
      ];
    }

    if (start_date) {
      where.created_at = { ...where.created_at, gte: new Date(start_date as string) };
    }
    if (end_date) {
      where.created_at = { ...where.created_at, lte: new Date(end_date as string + 'T23:59:59.999Z') };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    const [list, total] = await Promise.all([
      prisma.after_sale_order.findMany({
        where,
        skip,
        take: parseInt(pageSize as string),
        orderBy: { created_at: 'desc' },
        include: {
          imei: {
            include: { model: { include: { brand: { select: { name: true } } } } },
          },
          handler: { select: { id: true, real_name: true } },
        },
      }),
      prisma.after_sale_order.count({ where }),
    ]);

    const r: ApiResponse = { code: 200, message: 'ok', data: { list, total } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// GET /api/v1/after-sales/:id — 工单详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.after_sale_order.findUnique({
      where: { id },
      include: {
        imei: {
          include: { model: { include: { brand: { select: { name: true } } } } },
        },
        handler: { select: { id: true, real_name: true } },
        logs: {
          include: { operator: { select: { id: true, real_name: true } } },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!order) {
      const r: ApiResponse = { code: 404, message: '工单不存在' };
      return res.status(404).json(r);
    }

    const r: ApiResponse = { code: 200, message: 'ok', data: order };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// PUT /api/v1/after-sales/:id — 更新工单
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { detection_result, process_type, repair_level, status, cost, cost_remark, supplier_contact, supplier_status, supplier_result, exchange_model_id, exchange_imei_id, result } = req.body;

    const existing = await prisma.after_sale_order.findUnique({ where: { id } });
    if (!existing) {
      const r: ApiResponse = { code: 404, message: '工单不存在' };
      return res.status(404).json(r);
    }

    const updateData: any = {};
    if (detection_result !== undefined) updateData.detection_result = detection_result;
    if (process_type !== undefined) updateData.process_type = process_type;
    if (repair_level !== undefined) updateData.repair_level = repair_level;
    if (status !== undefined) updateData.status = status;
    if (cost !== undefined) updateData.cost = cost;
    if (cost_remark !== undefined) updateData.cost_remark = cost_remark;
    if (supplier_contact !== undefined) updateData.supplier_contact = supplier_contact;
    if (supplier_status !== undefined) updateData.supplier_status = supplier_status;
    if (supplier_result !== undefined) updateData.supplier_result = supplier_result;
    if (exchange_model_id !== undefined) updateData.exchange_model_id = exchange_model_id;
    if (exchange_imei_id !== undefined) updateData.exchange_imei_id = exchange_imei_id;
    if (result !== undefined) updateData.result = result;

    const resultData = await prisma.$transaction(async (tx) => {
      // 更新工单
      const updated = await tx.after_sale_order.update({
        where: { id },
        data: updateData,
        include: {
          imei: {
            include: { model: { include: { brand: { select: { name: true } } } } },
          },
          handler: { select: { id: true, real_name: true } },
        },
      });

      // 状态变更时创建日志
      if (status && status !== existing.status) {
        const statusLabels: Record<string, string> = {
          pending: '待处理', detecting: '检测中', repairing: '维修中',
          repaired: '已维修', exchanging: '换货中', exchanged: '已换货',
          refunding: '退款中', refunded: '已退款', completed: '已完成', cancelled: '已取消',
        };
        const oldLabel = statusLabels[existing.status] || existing.status;
        const newLabel = statusLabels[status] || status;
        await tx.after_sale_log.create({
          data: {
            order_id: id,
            action: status,
            operator_id: req.user!.userId,
            content: `状态变更：${oldLabel} → ${newLabel}`,
          },
        });
      }

      // 处理方式变更日志
      if (process_type && process_type !== existing.process_type) {
        const ptLabels: Record<string, string> = {
          repair: '维修', exchange: '换货', refund: '退款',
        };
        await tx.after_sale_log.create({
          data: {
            order_id: id,
            action: process_type === 'repair' ? 'repairing' : process_type === 'exchange' ? 'exchanging' : 'refunding',
            operator_id: req.user!.userId,
            content: `处理方式设为：${ptLabels[process_type] || process_type}`,
          },
        });
      }

      // 检测结果日志
      if (detection_result !== undefined && detection_result !== existing.detection_result) {
        await tx.after_sale_log.create({
          data: {
            order_id: id,
            action: 'detected',
            operator_id: req.user!.userId,
            content: `检测结果：${detection_result}`,
          },
        });
      }

      // 换货逻辑：更新原手机 IMEI 状态为 exchanged，新手机 IMEI 状态为 sold
      if (exchange_imei_id && (process_type === 'exchange' || existing.process_type === 'exchange')) {
        // 原手机标记为 exchanged
        await tx.wh_inventory_imei.update({
          where: { id: updated.imei_id },
          data: { status: 'exchanged', after_sale_order_id: id },
        });
        // 新手机标记为 sold（从库存出库）
        if (exchange_imei_id && exchange_imei_id !== updated.imei_id) {
          await tx.wh_inventory_imei.update({
            where: { id: exchange_imei_id },
            data: { status: 'sold' },
          });
          // 库存扣减
          const modelId = exchange_model_id || updated.imei?.model_id;
          if (modelId) {
            const inv = await tx.wh_inventory.findUnique({
              where: { model_id_store_id: { model_id: modelId, store_id: updated.store_id } },
            });
            if (inv && inv.quantity > 0) {
              await tx.wh_inventory.update({
                where: { model_id_store_id: { model_id: modelId, store_id: updated.store_id } },
                data: { quantity: { decrement: 1 } },
              });
              await tx.wh_inventory_log.create({
                data: {
                  model_id: modelId,
                  store_id: updated.store_id,
                  change_type: 'exchange_out',
                  qty_before: inv.quantity,
                  qty_change: -1,
                  qty_after: inv.quantity - 1,
                  ref_type: 'after_sale',
                  ref_id: id,
                  remark: `换货出库：工单 ${updated.order_no}`,
                  operator_id: req.user!.userId,
                },
              });
            }
          }
        }
      }

      // 退款逻辑：将原手机 IMEI 状态改为 returned
      if (process_type === 'refund' && status === 'refunded') {
        await tx.wh_inventory_imei.update({
          where: { id: updated.imei_id },
          data: { status: 'returned', after_sale_order_id: id },
        });
      }

      // 维修逻辑：设置 IMEI 状态为 repairing；完结后回到 sold
      if (process_type === 'repair') {
        if (status === 'repairing') {
          await tx.wh_inventory_imei.update({
            where: { id: updated.imei_id },
            data: { status: 'repairing', after_sale_order_id: id },
          });
        } else if (status === 'completed' || status === 'repaired') {
          await tx.wh_inventory_imei.update({
            where: { id: updated.imei_id },
            data: { status: 'sold' },
          });
        }
      }

      // 完结时自动设置 supplier_status = none 的处理
      if (status === 'completed') {
        // 已完成的工单，如果之前标记了 exchanged/returned/repairing，确保状态正确
      }

      // 供应商状态变更日志
      if (supplier_status && supplier_status !== existing.supplier_status) {
        const slLabels: Record<string, string> = {
          none: '无需供应商', pending: '待联系供应商', in_progress: '供应商处理中', completed: '供应商已处理',
        };
        const action = supplier_status === 'completed' ? 'supplier_done' : 'supplier_contact';
        await tx.after_sale_log.create({
          data: {
            order_id: id,
            action,
            operator_id: req.user!.userId,
            content: `供应商状态：${slLabels[supplier_status] || supplier_status}`,
          },
        });
      }

      return updated;
    });

    const r: ApiResponse = { code: 200, message: '更新成功', data: resultData };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// POST /api/v1/after-sales/:id/log — 添加操作日志
router.post('/:id/log', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { action, content } = req.body;

    if (!content) {
      const r: ApiResponse = { code: 400, message: '日志内容不能为空' };
      return res.status(400).json(r);
    }

    const order = await prisma.after_sale_order.findUnique({ where: { id: orderId } });
    if (!order) {
      const r: ApiResponse = { code: 404, message: '工单不存在' };
      return res.status(404).json(r);
    }

    const log = await prisma.after_sale_log.create({
      data: {
        order_id: orderId,
        action: action || 'remark',
        operator_id: req.user!.userId,
        content,
      },
      include: {
        operator: { select: { id: true, real_name: true } },
      },
    });

    const r: ApiResponse = { code: 200, message: 'ok', data: log };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// GET /api/v1/after-sales/:id/logs — 获取工单日志列表
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const logs = await prisma.after_sale_log.findMany({
      where: { order_id: orderId },
      include: {
        operator: { select: { id: true, real_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const r: ApiResponse = { code: 200, message: 'ok', data: logs };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;
```

---

### Task 4: Server — 在 `index.ts` 中注册 `after-sales` 路由

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: 添加 import**

在 `import toolsRoutes from './routes/tools';` 之后添加：

```typescript
import afterSalesRoutes from './routes/after-sales';
```

- [ ] **Step 2: 注册路由**

在 `app.use('/api/v1/tools', toolsRoutes);` 之后添加：

```typescript
app.use('/api/v1/after-sales', afterSalesRoutes);
```

---

### Task 5: Client — 新建 `after-sales` API 层

**Files:**
- Create: `client/src/api/after-sales.ts`

- [ ] **Step 1: 创建 API 文件**

```typescript
import request from './request'

export async function getAfterSalesList(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  process_type?: string
  start_date?: string
  end_date?: string
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/after-sales', { params })
  return res.data
}

export async function getAfterSaleDetail(id: number): Promise<any> {
  const res: any = await request.get(`/after-sales/${id}`)
  return res.data
}

export async function createAfterSale(data: {
  imei_id: number
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  fault_description: string
}): Promise<any> {
  const res: any = await request.post('/after-sales', data)
  return res.data
}

export async function updateAfterSale(id: number, data: {
  detection_result?: string
  process_type?: string
  repair_level?: string
  status?: string
  cost?: number
  cost_remark?: string
  supplier_contact?: string
  supplier_status?: string
  supplier_result?: string
  exchange_model_id?: number
  exchange_imei_id?: number
  result?: string
}): Promise<any> {
  const res: any = await request.put(`/after-sales/${id}`, data)
  return res.data
}

export async function addAfterSaleLog(orderId: number, data: {
  action?: string
  content: string
}): Promise<any> {
  const res: any = await request.post(`/after-sales/${orderId}/log`, data)
  return res.data
}

export async function getAfterSaleLogs(orderId: number): Promise<any[]> {
  const res: any = await request.get(`/after-sales/${orderId}/logs`)
  return res.data
}
```

---

### Task 6: Client — 路由配置新增售后管理页面路由

**Files:**
- Modify: `client/src/router/index.ts`

- [ ] **Step 1: 在数组中添加三个售后路由**

在 `{ path: 'tools', component: () => import('@/views/tools/DataTools.vue'), meta: { title: '数据工具' } },` 之后添加：

```typescript
      { path: 'after-sales/list', component: () => import('@/views/after-sales/AfterSaleList.vue'), meta: { title: '售后工单' } },
      { path: 'after-sales/new', component: () => import('@/views/after-sales/AfterSaleNew.vue'), meta: { title: '新建工单' } },
      { path: 'after-sales/:id', component: () => import('@/views/after-sales/AfterSaleDetail.vue'), meta: { title: '工单详情' } },
```

同时在 `MainLayout.vue` 的导航菜单中添加「售后管理」菜单项（检查是否需添加）。

---

### Task 7: Client — 创建 `AfterSaleList.vue` 售后工单列表页

**Files:**
- Create: `client/src/views/after-sales/AfterSaleList.vue`

- [ ] **Step 1: 创建列表页面**

参照 `client/src/views/transfer/TransferList.vue` 的样式和结构，创建以下模板：

```vue
<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">售后工单</h1>
        <span class="pbm-subtitle">After-Sales Orders</span>
      </div>
    </header>

    <div class="pbm-body">
      <div class="pbm-main-head">
        <div class="pbm-search-group">
          <el-input v-model="keyword" placeholder="搜索 IMEI / 客户姓名 / 电话" clearable style="width:260px;" @keyup.enter="doSearch" />
          <el-select v-model="searchStatus" placeholder="筛选状态" clearable style="width:150px;">
            <el-option label="待处理" value="pending" />
            <el-option label="检测中" value="detecting" />
            <el-option label="维修中" value="repairing" />
            <el-option label="换货中" value="exchanging" />
            <el-option label="退款中" value="refunding" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-select v-model="searchProcessType" placeholder="处理方式" clearable style="width:120px;">
            <el-option label="维修" value="repair" />
            <el-option label="换货" value="exchange" />
            <el-option label="退款" value="refund" />
          </el-select>
          <button class="pbm-btn-ghost" @click="doSearch">查询</button>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="pbm-section-count">{{ total }} 条记录</span>
          <router-link to="/after-sales/new">
            <button class="pbm-btn-primary">+ 新建工单</button>
          </router-link>
        </div>
      </div>

      <div class="pbm-table-wrapper">
        <el-table :data="list" border stripe v-loading="loading">
          <el-table-column label="工单号" width="180">
            <template #default="{ row }">
              <router-link :to="`/after-sales/${row.id}`" style="color:#1677ff;text-decoration:none;">{{ row.order_no }}</router-link>
            </template>
          </el-table-column>
          <el-table-column label="IMEI" width="150">
            <template #default="{ row }">{{ row.imei?.imei || '-' }}</template>
          </el-table-column>
          <el-table-column label="客户" width="120">
            <template #default="{ row }">{{ row.customer_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="品牌型号" min-width="160">
            <template #default="{ row }">
              <template v-if="row.imei?.model">
                <el-tag size="small">{{ row.imei.model.brand?.name }}</el-tag>
                {{ row.imei.model.name }}
              </template>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="处理方式" width="100">
            <template #default="{ row }">
              {{ { repair: '维修', exchange: '换货', refund: '退款' }[row.process_type] || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <router-link :to="`/after-sales/${row.id}`">
                <button class="pbm-icon-btn pbm-icon-btn--sm" title="详情">查看</button>
              </router-link>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pbm-pagination-wrapper" v-if="total > 0">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next" @change="loadData" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAfterSalesList } from '@/api/after-sales'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const searchStatus = ref<string | undefined>()
const searchProcessType = ref<string | undefined>()

function statusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning', detecting: 'warning', repairing: 'warning',
    exchanged: 'success', refunded: 'success', completed: 'success',
    cancelled: 'info',
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待处理', detecting: '检测中', repairing: '维修中', repaired: '已维修',
    exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
    completed: '已完成', cancelled: '已取消',
  }
  return map[status] || status
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function doSearch() { page.value = 1; loadData() }

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (searchStatus.value) params.status = searchStatus.value
    if (searchProcessType.value) params.process_type = searchProcessType.value
    const result = await getAfterSalesList(params)
    list.value = result.list
    total.value = result.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })
</script>

<style scoped>
/* 复用 TransferList.vue 的 .pbm-* 样式 — 引入全局样式即可 */
</style>
```

---

### Task 8: Client — 创建 `AfterSaleNew.vue` 新建工单页

**Files:**
- Create: `client/src/views/after-sales/AfterSaleNew.vue`

- [ ] **Step 1: 创建新建工单页面**

```vue
<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <h1 class="pbm-title">新建售后工单</h1>
        <span class="pbm-subtitle">New After-Sales Order</span>
      </div>
    </header>

    <div class="pbm-body" style="padding:24px;">
      <el-form label-position="top" style="max-width:800px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px 24px;">
          <!-- IMEI 选择区 -->
          <el-form-item label="手机 IMEI" required>
            <div style="display:flex; gap:8px; width:100%;">
              <el-input v-model="imeiSearch" placeholder="扫码或输入 IMEI" style="flex:1;" />
              <el-button @click="searchImei">搜索</el-button>
            </div>
            <div v-if="matchedImei" style="margin-top:8px; padding:8px 12px; background:#f6ffed; border:1px solid #b7eb8f; border-radius:4px; font-size:13px;">
              <div>✅ 已匹配：<strong>{{ matchedImei.model?.brand?.name }} {{ matchedImei.model?.name }}</strong></div>
              <div>IMEI：{{ matchedImei.imei }}</div>
              <div v-if="matchedImei.saleRecord" style="color:#888;">原销售单：{{ matchedImei.saleRecord.order_no }} · {{ formatDate(matchedImei.saleRecord.created_at) }}</div>
            </div>
          </el-form-item>

          <!-- 客户信息区 -->
          <div>
            <el-form-item label="客户姓名" required>
              <el-input v-model="form.customer_name" placeholder="客户姓名" />
            </el-form-item>
            <el-form-item label="客户电话">
              <el-input v-model="form.customer_phone" placeholder="客户电话" />
            </el-form-item>
            <el-form-item label="客户地址">
              <el-input v-model="form.customer_address" placeholder="客户地址" />
            </el-form-item>
          </div>
        </div>

        <el-form-item label="故障描述 / 售后原因" required>
          <el-input v-model="form.fault_description" type="textarea" :rows="3" placeholder="请描述故障现象或售后原因" />
        </el-form-item>

        <el-form-item>
          <div style="display:flex; gap:12px;">
            <el-button type="primary" @click="handleSubmit" :loading="submitting" style="background:#1677ff;">创建工单</el-button>
            <router-link to="/after-sales/list"><el-button>取消</el-button></router-link>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createAfterSale } from '@/api/after-sales'
// 需要引入 inventory API 来搜索 IMEI
import request from '@/api/request'

const router = useRouter()
const submitting = ref(false)
const imeiSearch = ref('')
const matchedImei = ref<any>(null)
const form = reactive({
  customer_name: '',
  customer_phone: '',
  customer_address: '',
  fault_description: '',
})

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function searchImei() {
  if (!imeiSearch.value.trim()) {
    ElMessage.warning('请输入 IMEI')
    return
  }
  try {
    const res: any = await request.get('/inventory/imei-query', { params: { imei: imeiSearch.value.trim() } })
    matchedImei.value = res.data
  } catch {
    matchedImei.value = null
    ElMessage.error('未找到该手机')
  }
}

async function handleSubmit() {
  if (!matchedImei.value) {
    ElMessage.warning('请先搜索并选择手机')
    return
  }
  if (!form.fault_description.trim()) {
    ElMessage.warning('请输入故障描述')
    return
  }
  submitting.value = true
  try {
    await createAfterSale({
      imei_id: matchedImei.value.id,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_address: form.customer_address,
      fault_description: form.fault_description,
    })
    ElMessage.success('工单创建成功')
    router.push('/after-sales/list')
  } catch {
    // handled
  } finally {
    submitting.value = false
  }
}
</script>
```

---

### Task 9: Client — 创建 `AfterSaleDetail.vue` 工单详情/处理页

**Files:**
- Create: `client/src/views/after-sales/AfterSaleDetail.vue`

- [ ] **Step 1: 创建工单详情页面（参照设计稿：三栏信息区 + 处理操作区 + 日志区）**

```vue
<template>
  <div class="pbm-root">
    <header class="pbm-header">
      <div class="pbm-header-left">
        <router-link to="/after-sales/list" class="pbm-back-link">← 返回列表</router-link>
        <h1 class="pbm-title">工单详情</h1>
        <span class="pbm-subtitle">{{ order?.order_no }}</span>
      </div>
    </header>

    <div class="pbm-body" style="padding:24px;overflow-y:auto;" v-loading="loading">
      <template v-if="order">
        <!-- 顶部三卡片：手机信息 + 客户信息 + 状态 -->
        <div class="detail-cards">
          <div class="detail-card">
            <div class="detail-card-label">手机信息</div>
            <div class="detail-card-content">
              <div>IMEI：<strong>{{ order.imei?.imei || '-' }}</strong></div>
              <div>品牌型号：<el-tag size="small">{{ order.imei?.model?.brand?.name }}</el-tag> {{ order.imei?.model?.name }}</div>
              <div>当前状态：<el-tag :type="imeiStatusType(order.imei?.status)" size="small">{{ imeiStatusLabel(order.imei?.status) }}</el-tag></div>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-card-label">客户信息</div>
            <div class="detail-card-content">
              <div>姓名：{{ order.customer_name || '-' }}</div>
              <div>电话：{{ order.customer_phone || '-' }}</div>
              <div>地址：{{ order.customer_address || '-' }}</div>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-card-label">当前状态</div>
            <div class="detail-card-content">
              <div><el-tag :type="statusType(order.status)" size="large">{{ statusLabel(order.status) }}</el-tag></div>
              <div style="font-size:12px;color:#888;margin-top:4px;">创建时间：{{ formatDate(order.created_at) }}</div>
              <div style="font-size:12px;color:#888;">处理人：{{ order.handler?.real_name }}</div>
            </div>
          </div>
        </div>

        <!-- 故障描述 -->
        <div class="detail-section">
          <div class="detail-section-label">故障描述</div>
          <div style="font-size:14px;">{{ order.fault_description }}</div>
        </div>

        <!-- 检测结果 -->
        <div class="detail-section" v-if="order.detection_result">
          <div class="detail-section-label">检测结果</div>
          <div style="font-size:14px;">{{ order.detection_result }}</div>
        </div>

        <!-- 处理操作区 -->
        <div class="detail-operations">
          <div class="detail-section-label">处理操作</div>
          <el-form label-position="top" size="small">
            <div style="display:flex; gap:16px; flex-wrap:wrap;">
              <el-form-item label="检测结果" style="flex:1;min-width:140px;">
                <el-select v-model="editForm.detection_result" placeholder="检测结果" clearable>
                  <el-option label="确认故障" value="确认故障" />
                  <el-option label="无故障" value="无故障" />
                  <el-option label="需联系供应商" value="需联系供应商" />
                </el-select>
              </el-form-item>
              <el-form-item label="处理方式" style="flex:1;min-width:130px;">
                <el-select v-model="editForm.process_type" placeholder="处理方式" clearable>
                  <el-option label="维修" value="repair" />
                  <el-option label="换货" value="exchange" />
                  <el-option label="退款" value="refund" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="editForm.process_type === 'repair'" label="维修级别" style="flex:1;min-width:140px;">
                <el-select v-model="editForm.repair_level" placeholder="维修级别" clearable>
                  <el-option label="当场维修" value="minor" />
                  <el-option label="店里维修" value="medium" />
                  <el-option label="返厂维修" value="major" />
                </el-select>
              </el-form-item>
              <el-form-item label="费用" style="width:120px;">
                <el-input v-model.number="editForm.cost" placeholder="费用" type="number" />
              </el-form-item>
              <el-form-item label="费用说明" style="flex:1;min-width:140px;">
                <el-input v-model="editForm.cost_remark" placeholder="费用说明" />
              </el-form-item>
            </div>
            <div style="display:flex; gap:16px; flex-wrap:wrap; margin-top:8px;">
              <el-form-item label="供应商联系人" style="flex:1;min-width:160px;">
                <el-input v-model="editForm.supplier_contact" placeholder="供应商联系人/电话" />
              </el-form-item>
              <el-form-item label="供应商状态" style="flex:1;min-width:150px;">
                <el-select v-model="editForm.supplier_status" placeholder="供应商状态" clearable>
                  <el-option label="无需供应商" value="none" />
                  <el-option label="待联系" value="pending" />
                  <el-option label="处理中" value="in_progress" />
                  <el-option label="已处理" value="completed" />
                </el-select>
              </el-form-item>
              <el-form-item label="供应商处理结果" style="flex:2;min-width:200px;">
                <el-input v-model="editForm.supplier_result" placeholder="供应商处理结果" />
              </el-form-item>
            </div>
            <div v-if="editForm.process_type === 'exchange'" style="display:flex; gap:16px; flex-wrap:wrap; margin-top:8px;">
              <el-form-item label="换货型号 ID" style="width:160px;">
                <el-input v-model.number="editForm.exchange_model_id" placeholder="新手机型号 ID" type="number" />
              </el-form-item>
              <el-form-item label="换货 IMEI ID" style="width:160px;">
                <el-input v-model.number="editForm.exchange_imei_id" placeholder="新手机 IMEI ID" type="number" />
              </el-form-item>
            </div>
            <div style="display:flex; gap:16px; flex-wrap:wrap; margin-top:8px;">
              <el-form-item label="状态" style="flex:1;min-width:150px;">
                <el-select v-model="editForm.status" placeholder="变更状态">
                  <el-option label="待处理" value="pending" />
                  <el-option label="检测中" value="detecting" />
                  <el-option label="维修中" value="repairing" />
                  <el-option label="已维修" value="repaired" />
                  <el-option label="换货中" value="exchanging" />
                  <el-option label="已换货" value="exchanged" />
                  <el-option label="退款中" value="refunding" />
                  <el-option label="已退款" value="refunded" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已取消" value="cancelled" />
                </el-select>
              </el-form-item>
              <el-form-item label="最终处理结果" style="flex:2;min-width:200px;">
                <el-input v-model="editForm.result" placeholder="最终处理结果" />
              </el-form-item>
            </div>
            <el-form-item style="margin-top:8px;">
              <el-button type="primary" style="background:#1677ff;" @click="handleUpdate" :loading="saving">保存更新</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 操作日志 -->
        <div class="detail-section">
          <div class="detail-section-label">操作日志 / 供应商沟通记录</div>
          <div style="margin-top:12px;">
            <div v-for="log in logs" :key="log.id" style="padding:8px 0; border-bottom:1px solid #f0f0f0; font-size:13px;">
              <div><strong>{{ log.operator?.real_name || '系统' }}</strong> · <span style="color:#888;">{{ log.actionLabel || log.action }}</span> · {{ formatDate(log.created_at) }}</div>
              <div style="color:#555; margin-top:2px;">{{ log.content }}</div>
            </div>
            <div v-if="!logs.length" style="color:#888; font-size:13px; padding:8px 0;">暂无操作记录</div>
          </div>
          <div style="display:flex; gap:8px; margin-top:12px;">
            <el-input v-model="logContent" placeholder="添加日志 / 供应商沟通记录..." style="flex:1;" />
            <el-button @click="handleAddLog" :loading="logSubmitting">添加记录</el-button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAfterSaleDetail, updateAfterSale, addAfterSaleLog, getAfterSaleLogs } from '@/api/after-sales'

const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const order = ref<any>(null)
const logs = ref<any[]>([])
const logContent = ref('')
const logSubmitting = ref(false)

const editForm = reactive({
  detection_result: '',
  process_type: '',
  repair_level: '',
  status: '',
  cost: 0,
  cost_remark: '',
  supplier_contact: '',
  supplier_status: '',
  supplier_result: '',
  exchange_model_id: undefined as number | undefined,
  exchange_imei_id: undefined as number | undefined,
  result: '',
})

function statusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning', detecting: 'warning', repairing: 'warning',
    exchanged: 'success', refunded: 'success', completed: 'success',
    cancelled: 'info',
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待处理', detecting: '检测中', repairing: '维修中', repaired: '已维修',
    exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
    completed: '已完成', cancelled: '已取消',
  }
  return map[status] || status
}

function imeiStatusType(status: string) {
  const map: Record<string, string> = { in_stock: 'success', sold: 'primary', returned: 'warning', exchanged: 'warning', repairing: 'warning' }
  return map[status] || 'info'
}

function imeiStatusLabel(status: string) {
  const map: Record<string, string> = { in_stock: '在库', sold: '已售', returned: '已退货', exchanged: '已换货', repairing: '维修中' }
  return map[status] || status
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const actionLabels: Record<string, string> = {
  created: '创建工单', detected: '检测', repairing: '维修中', repaired: '已维修',
  exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
  completed: '已完成', cancelled: '已取消',
  supplier_contact: '供应商沟通', supplier_done: '供应商处理完成', remark: '备注',
}

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const data = await getAfterSaleDetail(id)
    order.value = data
    // 回填编辑表单
    editForm.detection_result = data.detection_result || ''
    editForm.process_type = data.process_type || ''
    editForm.repair_level = data.repair_level || ''
    editForm.status = data.status || ''
    editForm.cost = data.cost || 0
    editForm.cost_remark = data.cost_remark || ''
    editForm.supplier_contact = data.supplier_contact || ''
    editForm.supplier_status = data.supplier_status || ''
    editForm.supplier_result = data.supplier_result || ''
    editForm.exchange_model_id = data.exchange_model_id || undefined
    editForm.exchange_imei_id = data.exchange_imei_id || undefined
    editForm.result = data.result || ''

    // 处理日志（从详情返回的 logs）
    if (data.logs) {
      logs.value = data.logs.map((l: any) => ({ ...l, actionLabel: actionLabels[l.action] || l.action }))
    }
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

async function handleUpdate() {
  const id = Number(route.params.id)
  if (!id) return
  saving.value = true
  try {
    const payload: any = {}
    if (editForm.detection_result) payload.detection_result = editForm.detection_result
    if (editForm.process_type) payload.process_type = editForm.process_type
    if (editForm.repair_level) payload.repair_level = editForm.repair_level
    if (editForm.status) payload.status = editForm.status
    if (editForm.cost) payload.cost = editForm.cost
    if (editForm.cost_remark) payload.cost_remark = editForm.cost_remark
    if (editForm.supplier_contact) payload.supplier_contact = editForm.supplier_contact
    if (editForm.supplier_status) payload.supplier_status = editForm.supplier_status
    if (editForm.supplier_result) payload.supplier_result = editForm.supplier_result
    if (editForm.exchange_model_id) payload.exchange_model_id = editForm.exchange_model_id
    if (editForm.exchange_imei_id) payload.exchange_imei_id = editForm.exchange_imei_id
    if (editForm.result) payload.result = editForm.result

    await updateAfterSale(id, payload)
    ElMessage.success('保存成功')
    await loadDetail()
  } catch {
    // handled
  } finally {
    saving.value = false
  }
}

async function handleAddLog() {
  if (!logContent.value.trim()) {
    ElMessage.warning('请输入日志内容')
    return
  }
  const id = Number(route.params.id)
  logSubmitting.value = true
  try {
    await addAfterSaleLog(id, { content: logContent.value.trim() })
    logContent.value = ''
    ElMessage.success('添加成功')
    await loadDetail()
  } catch {
    // handled
  } finally {
    logSubmitting.value = false
  }
}

onMounted(() => { loadDetail() })
</script>

<style scoped>
.detail-cards { display: flex; gap: 16px; margin-bottom: 20px; }
.detail-card { flex: 1; padding: 16px; background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; }
.detail-card-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.detail-card-content { font-size: 14px; line-height: 1.8; }
.detail-section { margin-bottom: 20px; padding: 16px; background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; }
.detail-section-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.detail-operations { margin-bottom: 20px; padding: 16px; background: #fafafa; border: 1px solid #e8e8e8; border-radius: 8px; }
</style>
```

---

### Task 10: Portal — 新建 `after-sales` API 层

**Files:**
- Create: `portal/src/api/after-sales.ts`

- [ ] **Step 1: 创建 API 文件**

```typescript
import request from './request'

export async function getAfterSalesList(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}): Promise<{ list: any[]; total: number }> {
  const res: any = await request.get('/after-sales', { params })
  return res.data
}

export async function getAfterSaleDetail(id: number): Promise<any> {
  const res: any = await request.get(`/after-sales/${id}`)
  return res.data
}

export async function createAfterSale(data: {
  imei_id: number
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  fault_description: string
}): Promise<any> {
  const res: any = await request.post('/after-sales', data)
  return res.data
}

export async function getAfterSaleLogs(orderId: number): Promise<any[]> {
  const res: any = await request.get(`/after-sales/${orderId}/logs`)
  return res.data
}
```

---

### Task 11: Portal — 路由配置新增售后页面

**Files:**
- Modify: `portal/src/router/index.ts`

- [ ] **Step 1: 在 routes 数组中添加两个路由**

```typescript
{ path: 'after-sales', component: () => import('@/views/AfterSales.vue'), meta: { title: '售后' } },
```

放在 `{ path: 'manual', ... }` 之前。

---

### Task 12: Portal — 创建 `AfterSales.vue` 售后工单列表

**Files:**
- Create: `portal/src/views/AfterSales.vue`

- [ ] **Step 1: 创建列表页面（参照 SalesRecord.vue 的卡片式风格）**

```vue
<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">售后工单</h1>
      <span class="title-line"></span>
    </div>

    <div class="search-section">
      <div class="search-row">
        <div class="search-input-wrap">
          <input v-model="keyword" class="search-input" placeholder="搜索 IMEI / 客户姓名..." @keyup.enter="doSearch" />
        </div>
        <button class="search-btn" @click="doSearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          搜索
        </button>
      </div>
      <div class="filter-row">
        <el-select v-model="searchStatus" placeholder="筛选状态" clearable size="large" style="width:140px;">
          <el-option label="待处理" value="pending" />
          <el-option label="检测中" value="detecting" />
          <el-option label="维修中" value="repairing" />
          <el-option label="换货中" value="exchanging" />
          <el-option label="退款中" value="refunding" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <button class="glass filter-btn" @click="doSearch">查询</button>
        <span class="result-count">共 {{ total }} 条记录</span>
      </div>
    </div>

    <div v-if="loading" class="loading-list">
      <div v-for="i in 5" :key="i" class="skeleton-row" :style="{ animationDelay: (i * 0.06) + 's' }"></div>
    </div>
    <div v-else-if="list.length" class="record-list">
      <div v-for="item in list" :key="item.id" class="after-sale-card glass" @click="$router.push(`/after-sales/${item.id}`)">
        <div class="card-header">
          <span class="card-order-no">{{ item.order_no }}</span>
          <el-tag :type="statusType(item.status)" size="small">{{ statusLabel(item.status) }}</el-tag>
        </div>
        <div class="card-body">
          <div class="card-row"><span class="card-label">IMEI</span><span class="card-value">{{ item.imei?.imei || '-' }}</span></div>
          <div class="card-row"><span class="card-label">客户</span><span class="card-value">{{ item.customer_name || '-' }}</span></div>
          <div class="card-row"><span class="card-label">品牌型号</span><span class="card-value">{{ item.imei?.model?.brand?.name }} {{ item.imei?.model?.name }}</span></div>
          <div class="card-row"><span class="card-label">处理方式</span><span class="card-value">{{ { repair: '维修', exchange: '换货', refund: '退款' }[item.process_type] || '-' }}</span></div>
        </div>
        <div class="card-footer">
          <span>{{ formatDate(item.created_at) }}</span>
          <span class="card-arrow">→</span>
        </div>
      </div>
    </div>
    <div v-else class="empty-hint">暂无售后工单</div>

    <div v-if="total > pageSize" class="pagination-row">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="prev, pager, next" size="large" @change="loadData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAfterSalesList } from '@/api/after-sales'

const keyword = ref('')
const searchStatus = ref<string | undefined>()
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

function statusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning', detecting: 'warning', repairing: 'warning',
    exchanged: 'success', refunded: 'success', completed: 'success', cancelled: 'info',
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待处理', detecting: '检测中', repairing: '维修中', repaired: '已维修',
    exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
    completed: '已完成', cancelled: '已取消',
  }
  return map[status] || status
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function doSearch() { page.value = 1; loadData() }

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (searchStatus.value) params.status = searchStatus.value
    const result = await getAfterSalesList(params)
    list.value = result.list
    total.value = result.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })
</script>

<style scoped>
.after-sale-card { padding: 16px; border-radius: 12px; cursor: pointer; transition: var(--transition); margin-bottom: 12px; }
.after-sale-card:hover { transform: translateY(-1px); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.card-order-no { font-weight: 600; font-size: 14px; color: var(--primary); }
.card-body { font-size: 14px; line-height: 2; }
.card-row { display: flex; }
.card-label { width: 70px; color: #888; flex-shrink: 0; }
.card-value { color: #333; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #999; }
.card-arrow { font-size: 16px; color: var(--primary); }
</style>
```

---

### Task 13: Portal — 创建 `AfterSaleDetail.vue` 售后工单详情页

**Files:**
- Create: `portal/src/views/AfterSaleDetail.vue`

- [ ] **Step 1: 创建详情页面**

```vue
<template>
  <div class="page-container">
    <div class="page-title-row">
      <button class="back-btn" @click="$router.push('/after-sales')">← 返回</button>
      <h1 class="page-title">售后详情</h1>
      <span class="title-line"></span>
    </div>

    <div v-if="loading" class="loading-list">
      <div v-for="i in 5" :key="i" class="skeleton-row" :style="{ animationDelay: (i * 0.06) + 's' }"></div>
    </div>
    <template v-else-if="order">
      <div class="detail-section glass">
        <div class="detail-header">
          <span class="detail-order-no">{{ order.order_no }}</span>
          <el-tag :type="statusType(order.status)" size="large">{{ statusLabel(order.status) }}</el-tag>
        </div>
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">IMEI</span><span class="detail-value">{{ order.imei?.imei || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">品牌型号</span><span class="detail-value">{{ order.imei?.model?.brand?.name }} {{ order.imei?.model?.name }}</span></div>
          <div class="detail-item"><span class="detail-label">客户姓名</span><span class="detail-value">{{ order.customer_name || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">客户电话</span><span class="detail-value">{{ order.customer_phone || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">处理方式</span><span class="detail-value">{{ { repair: '维修', exchange: '换货', refund: '退款' }[order.process_type] || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">处理人</span><span class="detail-value">{{ order.handler?.real_name || '-' }}</span></div>
          <div class="detail-item"><span class="detail-label">创建时间</span><span class="detail-value">{{ formatDate(order.created_at) }}</span></div>
          <div class="detail-item" v-if="order.cost"><span class="detail-label">费用</span><span class="detail-value">{{ order.cost }} 元</span></div>
        </div>
        <div style="margin-top:16px;">
          <div class="detail-label">故障描述</div>
          <div style="font-size:14px;color:#555;">{{ order.fault_description }}</div>
        </div>
        <div v-if="order.detection_result" style="margin-top:12px;">
          <div class="detail-label">检测结果</div>
          <div style="font-size:14px;color:#555;">{{ order.detection_result }}</div>
        </div>
        <div v-if="order.result" style="margin-top:12px;">
          <div class="detail-label">最终处理结果</div>
          <div style="font-size:14px;color:#555;">{{ order.result }}</div>
        </div>
      </div>

      <div class="detail-section glass" style="margin-top:16px;">
        <div class="detail-label">操作日志</div>
        <div v-if="logs.length" style="margin-top:12px;">
          <div v-for="log in logs" :key="log.id" class="log-item">
            <div class="log-header">
              <strong>{{ log.operator?.real_name || '系统' }}</strong>
              <span class="log-badge">{{ log.actionLabel || log.action }}</span>
              <span class="log-time">{{ formatDate(log.created_at) }}</span>
            </div>
            <div class="log-content">{{ log.content }}</div>
          </div>
        </div>
        <div v-else style="margin-top:12px;color:#999;">暂无操作记录</div>
      </div>
    </template>
    <div v-else class="empty-hint">工单不存在</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAfterSaleDetail } from '@/api/after-sales'

const route = useRoute()
const loading = ref(false)
const order = ref<any>(null)
const logs = ref<any[]>([])

const actionLabels: Record<string, string> = {
  created: '创建工单', detected: '检测', repairing: '维修中', repaired: '已维修',
  exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
  completed: '已完成', cancelled: '已取消',
  supplier_contact: '供应商沟通', supplier_done: '供应商处理完成', remark: '备注',
}

function statusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning', detecting: 'warning', repairing: 'warning',
    exchanged: 'success', refunded: 'success', completed: 'success', cancelled: 'info',
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待处理', detecting: '检测中', repairing: '维修中', repaired: '已维修',
    exchanging: '换货中', exchanged: '已换货', refunding: '退款中', refunded: '已退款',
    completed: '已完成', cancelled: '已取消',
  }
  return map[status] || status
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const data = await getAfterSaleDetail(id)
    order.value = data
    if (data.logs) {
      logs.value = data.logs.map((l: any) => ({ ...l, actionLabel: actionLabels[l.action] || l.action }))
    }
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadDetail() })
</script>

<style scoped>
.detail-section { padding: 24px; border-radius: 16px; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.detail-order-no { font-size: 20px; font-weight: 700; color: var(--primary); }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { font-size: 14px; }
.detail-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.detail-value { color: #333; }
.log-item { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
.log-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.log-badge { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: rgba(37,99,235,0.1); color: var(--primary); }
.log-time { font-size: 12px; color: #999; margin-left: auto; }
.log-content { font-size: 13px; color: #555; }
.back-btn { background: none; border: none; color: var(--primary); font-size: 14px; cursor: pointer; padding: 0; margin-right: 12px; }
</style>
```

---

### Task 14: Portal — 顶部导航新增「售后」Tab

**Files:**
- Modify: `portal/src/components/TopNav.vue`

- [ ] **Step 1: 在 `navItems` 数组中添加售后导航项**

在 `{ path: '/manual', ... }` 项之前添加：

```typescript
{ path: '/after-sales', label: '售后', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
```

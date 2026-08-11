import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse, UserRole } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ==================== 菜单权限定义 ====================

export interface MenuOption {
  key: string;
  label: string;
  group: string;
}

// 客户端所有可配置菜单（key 与 client/src/router、MainLayout 保持一致）
export const MENU_OPTIONS: MenuOption[] = [
  { key: 'dashboard', label: '数据看板', group: '基础' },
  { key: 'product_brand', label: '品牌型号管理', group: '基础' },
  { key: 'store_list', label: '门店列表', group: '门店管理' },
  { key: 'purchase_entry', label: '入库管理', group: '采购管理' },
  { key: 'purchase_supplier', label: '供应商管理', group: '采购管理' },
  { key: 'inventory_list', label: '库存查询', group: '库存管理' },
  { key: 'inventory_initial', label: '期初库存', group: '库存管理' },
  { key: 'inventory_logs', label: '库存流水', group: '库存管理' },
  { key: 'sales_new', label: '销售开单', group: '销售管理' },
  { key: 'sales_list', label: '销售记录', group: '销售管理' },
  { key: 'tools', label: '数据工具', group: '基础' },
  { key: 'after_sales', label: '售后管理', group: '基础' },
  { key: 'system_user', label: '用户管理', group: '系统管理' },
  { key: 'system_permission', label: '权限管理', group: '系统管理' },
  { key: 'settings_warranty', label: '保修设置', group: '系统管理' },
];

const ALL_KEYS = MENU_OPTIONS.map((m) => m.key);
const ROLE_KEYS = [UserRole.SUPER_ADMIN, UserRole.STORE_ADMIN, UserRole.OPERATOR];

// 默认权限（与历史硬编码菜单可见性保持一致）
const DEFAULT_MENU_KEYS: Record<string, string[]> = {
  [UserRole.SUPER_ADMIN]: [...ALL_KEYS],
  [UserRole.STORE_ADMIN]: [
    'dashboard', 'product_brand',
    'purchase_entry', 'purchase_supplier',
    'inventory_list', 'inventory_initial', 'inventory_logs',
    'sales_new', 'sales_list', 'tools', 'after_sales',
    'system_user', 'settings_warranty',
  ],
  [UserRole.OPERATOR]: [
    'dashboard', 'product_brand',
    'purchase_entry', 'purchase_supplier',
    'inventory_list', 'inventory_logs',
    'sales_new', 'sales_list', 'after_sales',
    'settings_warranty',
  ],
};

function parseKeys(raw: string): string[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr.filter((k: unknown) => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

export async function getRoleMenuKeys(role: string): Promise<string[]> {
  const row = await prisma.sys_role_menu.findUnique({ where: { role } });
  if (row) return parseKeys(row.menu_keys);
  return DEFAULT_MENU_KEYS[role] || [];
}

// ==================== 路由 ====================

// 当前用户的菜单权限
router.get('/menus', authMiddleware, async (req: Request, res: Response) => {
  try {
    const keys = await getRoleMenuKeys(req.user!.role);
    const r: ApiResponse = { code: 200, message: 'success', data: keys };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 菜单定义（权限配置页使用，仅超管）
router.get('/menu-options', authMiddleware, async (req: Request, res: Response) => {
  if (req.user!.role !== UserRole.SUPER_ADMIN) {
    const r: ApiResponse = { code: 403, message: '权限不足' };
    return res.status(403).json(r);
  }
  const r: ApiResponse = { code: 200, message: 'success', data: MENU_OPTIONS };
  return res.json(r);
});

// 各角色当前权限（仅超管）
router.get('/roles', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== UserRole.SUPER_ADMIN) {
      const r: ApiResponse = { code: 403, message: '权限不足' };
      return res.status(403).json(r);
    }
    const rows = await prisma.sys_role_menu.findMany();
    const map = new Map(rows.map((r) => [r.role, parseKeys(r.menu_keys)]));
    const data = ROLE_KEYS.map((role) => ({
      role,
      menuKeys: map.get(role) || DEFAULT_MENU_KEYS[role] || [],
    }));
    const r: ApiResponse = { code: 200, message: 'success', data };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 更新角色权限（仅超管）
router.put('/roles/:role', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== UserRole.SUPER_ADMIN) {
      const r: ApiResponse = { code: 403, message: '权限不足' };
      return res.status(403).json(r);
    }
    const { role } = req.params;
    if (!ROLE_KEYS.includes(role as UserRole)) {
      const r: ApiResponse = { code: 400, message: '角色不存在' };
      return res.status(400).json(r);
    }
    const { menuKeys } = req.body;
    if (!Array.isArray(menuKeys)) {
      const r: ApiResponse = { code: 400, message: 'menuKeys 必须是数组' };
      return res.status(400).json(r);
    }

    // 过滤非法 key
    let valid = MENU_OPTIONS.filter((m) => menuKeys.includes(m.key)).map((m) => m.key);

    // 超管不可移除系统管理相关权限，避免把自己锁在门外
    if (role === UserRole.SUPER_ADMIN) {
      valid = [...new Set([...valid, 'system_permission', 'system_user'])];
    }

    await prisma.sys_role_menu.upsert({
      where: { role },
      update: { menu_keys: JSON.stringify(valid) },
      create: { role, menu_keys: JSON.stringify(valid) },
    });

    const r: ApiResponse = { code: 200, message: '保存成功', data: valid };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;

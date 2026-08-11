/**
 * 初始化角色菜单权限（不清理业务数据，可重复执行）
 * 用法: pnpm --filter @phone-sales/server exec tsx scripts/seed-role-menu.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roleMenuDefaults: Record<string, string[]> = {
  super_admin: [
    'dashboard', 'product_brand', 'store_list',
    'purchase_entry', 'purchase_supplier',
    'inventory_list', 'inventory_initial', 'inventory_logs',
    'sales_new', 'sales_list', 'tools', 'after_sales',
    'system_user', 'system_permission', 'settings_warranty',
  ],
  store_admin: [
    'dashboard', 'product_brand',
    'purchase_entry', 'purchase_supplier',
    'inventory_list', 'inventory_initial', 'inventory_logs',
    'sales_new', 'sales_list', 'tools', 'after_sales',
    'system_user', 'settings_warranty',
  ],
  operator: [
    'dashboard', 'product_brand',
    'purchase_entry', 'purchase_supplier',
    'inventory_list', 'inventory_logs',
    'sales_new', 'sales_list', 'after_sales',
    'settings_warranty',
  ],
};

async function main() {
  for (const [role, keys] of Object.entries(roleMenuDefaults)) {
    await prisma.sys_role_menu.upsert({
      where: { role },
      update: { menu_keys: JSON.stringify(keys) },
      create: { role, menu_keys: JSON.stringify(keys) },
    });
    console.log(`✓ ${role}: ${keys.length} 个菜单`);
  }
  console.log('角色菜单权限初始化完成');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * 清空业务数据（保留 sys_user / sys_store）
 *
 * 用法:
 *   node scripts/clear-business-data.js           # 清空（自动备份）
 *   node scripts/clear-business-data.js --dry-run  # 只打印计划，不执行
 */
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.resolve(__dirname, '../data/database.sqlite')}`,
    },
  },
});

const dryRun = process.argv.includes('--dry-run');

// 按依赖顺序排列：先删子表，再删父表
const TABLES_TO_CLEAR = [
  // ── 业务明细（最深子表） ──
  'pch_purchase_item',
  'wh_inventory_log',
  'wh_inventory_imei',
  'wh_inventory_check_item',
  'sale_order_item',
  'after_sale_log',
  // ── 业务主表 ──
  'wh_inventory_check',
  'wh_inventory',
  'pch_purchase_entry',
  'sale_order',
  'wh_transfer',
  'after_sale_order',
  'sys_operation_log',
  // ── 基础数据 ──
  'pdt_model',
  'pdt_brand',
  'pch_supplier',
  // ── 保留：sys_user / sys_store ──
];

async function main() {
  console.log('========================================');
  console.log('  清空业务数据' + (dryRun ? '（预览）' : ''));
  console.log('========================================\n');

  console.log('将清空以下表：');
  for (const t of TABLES_TO_CLEAR) console.log('  - ' + t);
  console.log('\n保留表：');
  console.log('  - sys_user');
  console.log('  - sys_store\n');

  // 1. 备份
  if (!dryRun) {
    const srcDb = path.resolve(__dirname, '../data/database.sqlite');
    const backup = srcDb + `.backup.${Date.now()}`;
    fs.copyFileSync(srcDb, backup);
    console.log('[1/3] 已备份: ' + backup + '\n');
  }

  // 2. 关闭外键约束
  if (!dryRun) {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
    console.log('[2/3] 已禁用外键约束\n');
  }

  // 3. 逐表清空
  console.log('[3/3] ' + (dryRun ? '预览清空' : '开始清空') + '...');
  for (const table of TABLES_TO_CLEAR) {
    try {
      if (dryRun) {
        const count = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as n FROM "${table}"`
        );
        console.log('  [预览] ' + table + ': ' + count[0].n + ' 行');
      } else {
        const result = await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
        // 重置自增 ID
        await prisma.$executeRawUnsafe(
          `DELETE FROM sqlite_sequence WHERE name = '${table}';`
        );
        console.log('  OK ' + table + ': 删除 ' + result + ' 行');
      }
    } catch (e) {
      console.error('  FAIL ' + table + ': ' + e.message);
    }
  }

  if (!dryRun) {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    console.log('\n已恢复外键约束');
  }

  // 4. VACUUM 回收空间
  if (!dryRun) {
    console.log('\n回收磁盘空间...');
    await prisma.$executeRawUnsafe('VACUUM;');
    console.log('完成');
  }

  console.log('\n========================================');
  console.log('  ' + (dryRun ? '预览完成（未实际执行）' : '清空完成'));
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

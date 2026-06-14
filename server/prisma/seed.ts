import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function pad(n: number, len: number = 2): string {
  return String(n).padStart(len, '0');
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(9, 20), randomInt(0, 59), randomInt(0, 59));
  return d;
}

function generateImei(index: number): string {
  // 生成15位数字IMEI
  const prefix = '35' + pad(index % 100, 2);
  const mid = pad(Math.floor(index / 100) % 10000, 4);
  const suffix = pad(index % 100000, 5);
  return `${prefix}${mid}${suffix}`;
}

async function main() {
  console.log('开始填充种子数据...');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');

  // ========== 门店 ==========
  const storeA = await prisma.sys_store.upsert({
    where: { code: 'A' },
    update: {},
    create: { name: '分店A', code: 'A', address: '北京市朝阳区某某路100号', phone: '010-88886666', status: 1 },
  });
  const storeB = await prisma.sys_store.upsert({
    where: { code: 'B' },
    update: {},
    create: { name: '分店B', code: 'B', address: '上海市浦东新区某某路200号', phone: '021-88887777', status: 1 },
  });
  console.log('✓ 门店创建完成');

  // ========== 用户 ==========
  const pw = bcrypt.hashSync('123456', 10);
  await prisma.sys_user.upsert({ where: { username: 'admin' }, update: {}, create: { username: 'admin', password: pw, real_name: '超级管理员', role: 'super_admin', store_id: null, status: 1 } });
  await prisma.sys_user.upsert({ where: { username: '店长A' }, update: {}, create: { username: '店长A', password: pw, real_name: '张三', role: 'store_admin', store_id: storeA.id, status: 1 } });
  await prisma.sys_user.upsert({ where: { username: '店员B' }, update: {}, create: { username: '店员B', password: pw, real_name: '李四', role: 'operator', store_id: storeB.id, status: 1 } });
  await prisma.sys_user.upsert({ where: { username: '店长B' }, update: {}, create: { username: '店长B', password: pw, real_name: '王五', role: 'store_admin', store_id: storeB.id, status: 1 } });
  console.log('✓ 用户创建完成');

  // ========== 品牌 ==========
  const brandData = [
    { name: 'Apple', description: '苹果公司' },
    { name: 'Samsung', description: '三星集团' },
    { name: 'Xiaomi', description: '小米科技' },
    { name: 'Huawei', description: '华为技术' },
    { name: 'OPPO', description: 'OPPO 广东移动通信' },
    { name: 'vivo', description: 'vivo 维沃移动通信' },
  ];
  const brands: Record<string, any> = {};
  for (const b of brandData) {
    brands[b.name] = await prisma.pdt_brand.upsert({ where: { name: b.name }, update: {}, create: b });
  }
  console.log('✓ 品牌创建完成');

  // ========== 型号 ==========
  const modelDefs = [
    { brand: 'Apple', name: 'iPhone 15 Pro Max', color: '黑色', ram: '8GB', rom: '256GB', sp: 9999, cp: 8500 },
    { brand: 'Apple', name: 'iPhone 15 Pro Max', color: '白色', ram: '8GB', rom: '256GB', sp: 9999, cp: 8500 },
    { brand: 'Apple', name: 'iPhone 15 Pro Max', color: '金色', ram: '8GB', rom: '512GB', sp: 11999, cp: 10200 },
    { brand: 'Apple', name: 'iPhone 15', color: '黑色', ram: '6GB', rom: '128GB', sp: 5999, cp: 5100 },
    { brand: 'Apple', name: 'iPhone 15', color: '蓝色', ram: '6GB', rom: '128GB', sp: 5999, cp: 5100 },
    { brand: 'Apple', name: 'iPhone 15', color: '粉色', ram: '6GB', rom: '256GB', sp: 6999, cp: 5900 },
    { brand: 'Samsung', name: 'Galaxy S24 Ultra', color: '灰色', ram: '12GB', rom: '256GB', sp: 9699, cp: 8200 },
    { brand: 'Samsung', name: 'Galaxy S24 Ultra', color: '黑色', ram: '12GB', rom: '512GB', sp: 10999, cp: 9300 },
    { brand: 'Samsung', name: 'Galaxy S24', color: '黄色', ram: '8GB', rom: '256GB', sp: 5999, cp: 5100 },
    { brand: 'Samsung', name: 'Galaxy S24', color: '紫色', ram: '8GB', rom: '128GB', sp: 4999, cp: 4200 },
    { brand: 'Xiaomi', name: '小米14 Ultra', color: '黑色', ram: '12GB', rom: '256GB', sp: 5999, cp: 5100 },
    { brand: 'Xiaomi', name: '小米14 Ultra', color: '白色', ram: '16GB', rom: '512GB', sp: 6799, cp: 5700 },
    { brand: 'Xiaomi', name: '红米K70 Pro', color: '黑色', ram: '12GB', rom: '256GB', sp: 3299, cp: 2800 },
    { brand: 'Xiaomi', name: '红米K70 Pro', color: '白色', ram: '12GB', rom: '256GB', sp: 3299, cp: 2800 },
    { brand: 'Huawei', name: 'Mate 60 Pro', color: '黑色', ram: '12GB', rom: '256GB', sp: 6999, cp: 5900 },
    { brand: 'Huawei', name: 'Mate 60 Pro', color: '绿色', ram: '12GB', rom: '512GB', sp: 7999, cp: 6700 },
    { brand: 'Huawei', name: 'Pura 70 Ultra', color: '白色', ram: '12GB', rom: '512GB', sp: 8999, cp: 7600 },
    { brand: 'Huawei', name: 'Pura 70 Ultra', color: '黑色', ram: '12GB', rom: '256GB', sp: 7999, cp: 6800 },
    { brand: 'OPPO', name: 'Find X7 Ultra', color: '黑色', ram: '12GB', rom: '256GB', sp: 5999, cp: 5000 },
    { brand: 'OPPO', name: 'Find X7 Ultra', color: '蓝色', ram: '16GB', rom: '512GB', sp: 6999, cp: 5800 },
    { brand: 'vivo', name: 'X100 Pro', color: '白色', ram: '12GB', rom: '256GB', sp: 4999, cp: 4200 },
    { brand: 'vivo', name: 'X100 Pro', color: '黑色', ram: '12GB', rom: '512GB', sp: 5699, cp: 4800 },
  ];

  // ========== 型号 ==========
  const models: any[] = [];
  for (const m of modelDefs) {
    const model = await prisma.pdt_model.create({
      data: {
        brand_id: brands[m.brand].id,
        name: m.name,
        color: m.color,
        ram: m.ram,
        rom: m.rom,
        sale_price: m.sp,
        cost_price: m.cp,
        launch_year: 2024,
        os_type: m.brand === 'Apple' ? 'iOS' : 'Android',
        network_type: '5G',
        battery: '5000mAh',
      },
    });
    models.push(model);
  }
  console.log(`✓ 型号创建完成 (${models.length} 个)`);

  // ========== 供应商 ==========
  await prisma.pch_supplier.deleteMany({});
  const suppliers = await Promise.all([
    prisma.pch_supplier.create({ data: { name: '中邮普泰', contact_person: '赵六', phone: '13900001111', address: '北京市西城区', remark: '一级代理商' } }),
    prisma.pch_supplier.create({ data: { name: '爱施德', contact_person: '钱七', phone: '13900002222', address: '深圳市福田区', remark: '全国代理商' } }),
    prisma.pch_supplier.create({ data: { name: '天音通信', contact_person: '孙八', phone: '13900003333', address: '广州市天河区', remark: '代理商' } }),
    prisma.pch_supplier.create({ data: { name: '华为直供', contact_person: '周九', phone: '13900004444', address: '深圳市龙岗区', remark: '厂商直供' } }),
    prisma.pch_supplier.create({ data: { name: '苹果授权商', contact_person: '吴十', phone: '13900005555', address: '上海市静安区', remark: '授权经销商' } }),
  ]);
  console.log('✓ 供应商创建完成');

  // ========== 清除旧数据（先删子表，保持型号不变） ==========
  await prisma.wh_inventory_imei.deleteMany({});
  await prisma.wh_inventory_log.deleteMany({});
  await prisma.wh_inventory.deleteMany({});
  await prisma.pch_purchase_item.deleteMany({});
  await prisma.pch_purchase_entry.deleteMany({});
  await prisma.sale_order_item.deleteMany({});
  await prisma.sale_order.deleteMany({});
  await prisma.wh_inventory_check_item.deleteMany({});
  await prisma.wh_inventory_check.deleteMany({});

  // ========== 入库 + 库存 (每个门店每个型号若干台) ==========
  let imeiIndex = 10000;
  let entryIndex = 0;
  const today = new Date();
  const todayStr = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;

  for (const store of [storeA, storeB]) {
    for (const model of models) {
      // 每个型号 3-12 台
      const qty = randomInt(3, 12);
      const entryCount = Math.ceil(qty / 5); // 每单最多5台
      let remaining = qty;

      for (let e = 0; e < entryCount && remaining > 0; e++) {
        const batchSize = Math.min(remaining, randomInt(1, 5));
        const supplier = suppliers[randomInt(0, suppliers.length - 1)];
        entryIndex++;
        const entryNo = `PO${store.code}${todayStr}${pad(entryIndex, 4)}`;
        const entryDate = randomDate(60);

        const entry = await prisma.pch_purchase_entry.create({
          data: {
            entry_no: entryNo,
            store_id: store.id,
            supplier_id: supplier.id,
            total_amount: 0,
            status: 'confirmed',
            operator_id: store.id === storeA.id ? 2 : 3,
            remark: '测试入库数据',
            created_at: entryDate,
          },
        });

        let entryTotal = 0;
        for (let i = 0; i < batchSize; i++) {
          imeiIndex++;
          const imei = generateImei(imeiIndex);
          const price = model.cost_price || model.sale_price * 0.85;

          await prisma.pch_purchase_item.create({
            data: {
              entry_id: entry.id,
              model_id: model.id,
              imei,
              unit_price: Math.round(price),
              subtotal: Math.round(price),
            },
          });

          await prisma.wh_inventory_imei.create({
            data: {
              model_id: model.id,
              store_id: store.id,
              imei,
              status: 'in_stock',
              entry_id: entry.id,
              created_at: entryDate,
            },
          });

          entryTotal += Math.round(price);
        }

        await prisma.pch_purchase_entry.update({
          where: { id: entry.id },
          data: { total_amount: entryTotal },
        });

        // 库存汇总
        const existingInv = await prisma.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id: model.id, store_id: store.id } },
        });
        if (existingInv) {
          await prisma.wh_inventory.update({
            where: { id: existingInv.id },
            data: { quantity: existingInv.quantity + batchSize },
          });
        } else {
          const m = modelDefs.find(md => md.name === model.name && md.color === model.color && md.ram === model.ram && md.rom === model.rom)!;
          await prisma.wh_inventory.create({
            data: {
              model_id: model.id,
              store_id: store.id,
              quantity: batchSize,
              brand_name: m?.brand || '',
              model_name: model.name,
              color: model.color || '',
              storage: [model.ram, model.rom].filter(Boolean).join('/'),
              cost_price: model.cost_price || 0,
              sale_price: model.sale_price || 0,
            },
          });
        }

        // 库存流水
        await prisma.wh_inventory_log.create({
          data: {
            model_id: model.id,
            store_id: store.id,
            change_type: 'purchase_in',
            qty_before: existingInv?.quantity || 0,
            qty_change: batchSize,
            qty_after: (existingInv?.quantity || 0) + batchSize,
            ref_type: 'purchase_entry',
            ref_id: entry.id,
            remark: `入库单: ${entryNo}`,
            operator_id: store.id === storeA.id ? 2 : 3,
            created_at: entryDate,
          },
        });

        remaining -= batchSize;
      }
    }
  }
  console.log('✓ 入库单 + IMEI库存 + 流水创建完成');

  // ========== 销售订单 ==========
  let saleIndex = 0;
  const allImeis = await prisma.wh_inventory_imei.findMany({
    where: { status: 'in_stock' },
    include: { model: { include: { brand: { select: { name: true } } } }, store: true },
  });

  // 取约30%的IMEI作为已售
  const toSellCount = Math.floor(allImeis.length * 0.3);
  const shuffled = [...allImeis].sort(() => Math.random() - 0.5);
  const toSell = shuffled.slice(0, toSellCount);

  // 按门店+日期分组销售
  const saleGroups: Record<string, typeof toSell> = {};
  for (const imei of toSell) {
    const key = `${imei.store_id}_${imei.created_at.toISOString().slice(0, 10)}`;
    if (!saleGroups[key]) saleGroups[key] = [];
    saleGroups[key].push(imei);
  }

  for (const [key, group] of Object.entries(saleGroups)) {
    const storeId = parseInt(key.split('_')[0]);
    const dateStr = key.split('_')[1];
    const store = storeId === storeA.id ? storeA : storeB;

    // 每组再按型号分组建单（每个型号一个单）
    const byModel: Record<number, typeof group> = {};
    for (const imei of group) {
      if (!byModel[imei.model_id]) byModel[imei.model_id] = [];
      byModel[imei.model_id].push(imei);
    }

    for (const [modelIdStr, imeiGroup] of Object.entries(byModel)) {
      saleIndex++;
      const orderNo = `SA${store.code}${dateStr.replace(/-/g, '')}${pad(saleIndex, 4)}`;
      const model = imeiGroup[0].model;
      const brandName = (model as any).brand?.name || '';
      const modelNameStr = `${brandName} ${model.name} - ${model.color}/${model.ram}/${model.rom}`;
      const unitPrice = model.sale_price;
      const qty = imeiGroup.length;
      const total = Math.round(unitPrice * qty);
      const actual = total - randomInt(0, 200);
      const saleDate = new Date(dateStr + 'T' + pad(randomInt(10, 19)) + ':' + pad(randomInt(0, 59)) + ':00');

      const order = await prisma.sale_order.create({
        data: {
          order_no: orderNo,
          store_id: store.id,
          model_id: model.id,
          model_name: modelNameStr,
          quantity: qty,
          unit_price: unitPrice,
          total_amount: total,
          actual_amount: actual,
          change_amount: Math.max(0, actual - total),
          customer_name: ['张先生', '李女士', '王先生', '赵女士', '陈先生', '刘女士'][randomInt(0, 5)],
          customer_phone: `138${pad(randomInt(0, 99999999), 8)}`,
          operator_id: store.id === storeA.id ? 2 : 3,
          status: 'active',
          created_at: saleDate,
        },
      });

      for (const imeiRec of imeiGroup) {
        await prisma.sale_order_item.create({
          data: {
            sale_order_id: order.id,
            model_id: imeiRec.model_id,
            model_name: modelNameStr,
            imei: imeiRec.imei,
            quantity: 1,
            unit_price: unitPrice,
            total_price: unitPrice,
          },
        });

        await prisma.wh_inventory_imei.update({
          where: { id: imeiRec.id },
          data: { status: 'sold', sold_at: saleDate },
        });

        // 扣减库存
        const inv = await prisma.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id: imeiRec.model_id, store_id: store.id } },
        });
        if (inv) {
          const newQty = Math.max(0, inv.quantity - 1);
          await prisma.wh_inventory.update({
            where: { id: inv.id },
            data: { quantity: newQty },
          });
        }
      }

      // 汇总库存流水
      const invBefore = await prisma.wh_inventory.findUnique({
        where: { model_id_store_id: { model_id: model.id, store_id: store.id } },
      });
      await prisma.wh_inventory_log.create({
        data: {
          model_id: model.id,
          store_id: store.id,
          change_type: 'sale_out',
          qty_before: (invBefore?.quantity || 0) + qty,
          qty_change: -qty,
          qty_after: invBefore?.quantity || 0,
          ref_type: 'sale_order',
          ref_id: order.id,
          remark: `销售出库: ${orderNo}`,
          operator_id: store.id === storeA.id ? 2 : 3,
          created_at: saleDate,
        },
      });
    }
  }
  console.log(`✓ 销售订单创建完成 (${saleIndex} 单, ${toSellCount} 台)`);

  // ========== 统计信息 ==========
  const totalImei = await prisma.wh_inventory_imei.count();
  const inStock = await prisma.wh_inventory_imei.count({ where: { status: 'in_stock' } });
  const sold = await prisma.wh_inventory_imei.count({ where: { status: 'sold' } });
  const totalEntries = await prisma.pch_purchase_entry.count();
  const totalSales = await prisma.sale_order.count();
  const totalInventory = await prisma.wh_inventory.count();

  console.log('');
  console.log('═══════════ 数据统计 ═══════════');
  console.log(`  型号总数:    ${models.length}`);
  console.log(`  供应商:      ${suppliers.length}`);
  console.log(`  入库单:      ${totalEntries}`);
  console.log(`  IMEI 总数:   ${totalImei}`);
  console.log(`  在库:        ${inStock}`);
  console.log(`  已售:        ${sold}`);
  console.log(`  库存SKU:     ${totalInventory}`);
  console.log(`  销售单:      ${totalSales}`);
  console.log('════════════════════════════════');
  console.log('种子数据填充完毕!');
}

main()
  .catch((e) => {
    console.error('种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

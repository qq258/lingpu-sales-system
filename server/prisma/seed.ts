import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始填充种子数据...');

  // 创建门店
  const storeA = await prisma.sys_store.upsert({
    where: { code: 'A' },
    update: {},
    create: {
      name: '分店A',
      code: 'A',
      address: '北京市朝阳区某某路100号',
      phone: '010-88886666',
      status: 1,
    },
  });

  const storeB = await prisma.sys_store.upsert({
    where: { code: 'B' },
    update: {},
    create: {
      name: '分店B',
      code: 'B',
      address: '上海市浦东新区某某路200号',
      phone: '021-88887777',
      status: 1,
    },
  });

  console.log('门店创建完成');

  // 创建用户
  const adminPassword = bcrypt.hashSync('123456', 10);

  await prisma.sys_user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      real_name: '超级管理员',
      role: 'super_admin',
      store_id: null,
      status: 1,
    },
  });

  await prisma.sys_user.upsert({
    where: { username: '店长A' },
    update: {},
    create: {
      username: '店长A',
      password: adminPassword,
      real_name: '店长A',
      role: 'store_admin',
      store_id: storeA.id,
      status: 1,
    },
  });

  await prisma.sys_user.upsert({
    where: { username: '店员B' },
    update: {},
    create: {
      username: '店员B',
      password: adminPassword,
      real_name: '店员B',
      role: 'operator',
      store_id: storeB.id,
      status: 1,
    },
  });

  console.log('用户创建完成');

  // 创建品牌
  const brands = [
    { name: 'Apple', description: '苹果公司' },
    { name: 'Samsung', description: '三星集团' },
    { name: 'Xiaomi', description: '小米科技' },
    { name: 'Huawei', description: '华为技术' },
  ];

  const brandRecords: Record<string, any> = {};
  for (const b of brands) {
    const brand = await prisma.pdt_brand.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
    brandRecords[b.name] = brand;
  }

  console.log('品牌创建完成');

  // 创建型号（每个 variant 为一条 model 记录）
  const modelsData = [
    { brandName: 'Apple', name: 'iPhone 15 Pro Max', color: '黑色', ram: '8GB', rom: '256GB', sale_price: 9999, cost_price: 8500, launch_year: 2023, os_type: 'iOS', network_type: '5G', screen_size: '6.7英寸', cpu: 'A17 Pro', battery: '4422mAh' },
    { brandName: 'Apple', name: 'iPhone 15 Pro Max', color: '白色', ram: '8GB', rom: '256GB', sale_price: 9999, cost_price: 8500, launch_year: 2023, os_type: 'iOS', network_type: '5G', screen_size: '6.7英寸', cpu: 'A17 Pro', battery: '4422mAh' },
    { brandName: 'Apple', name: 'iPhone 15 Pro Max', color: '黑色', ram: '8GB', rom: '512GB', sale_price: 11999, cost_price: 10200, launch_year: 2023, os_type: 'iOS', network_type: '5G', screen_size: '6.7英寸', cpu: 'A17 Pro', battery: '4422mAh' },
    { brandName: 'Apple', name: 'iPhone 15', color: '黑色', ram: '6GB', rom: '128GB', sale_price: 5999, cost_price: 5100, launch_year: 2023, os_type: 'iOS', network_type: '5G', screen_size: '6.1英寸', cpu: 'A16 Bionic', battery: '3349mAh' },
    { brandName: 'Apple', name: 'iPhone 15', color: '蓝色', ram: '6GB', rom: '128GB', sale_price: 5999, cost_price: 5100, launch_year: 2023, os_type: 'iOS', network_type: '5G', screen_size: '6.1英寸', cpu: 'A16 Bionic', battery: '3349mAh' },
    { brandName: 'Samsung', name: 'Galaxy S24 Ultra', color: '灰色', ram: '12GB', rom: '256GB', sale_price: 9699, cost_price: 8200, launch_year: 2024, os_type: 'Android', network_type: '5G', screen_size: '6.8英寸', cpu: 'Snapdragon 8 Gen 3', battery: '5000mAh' },
    { brandName: 'Samsung', name: 'Galaxy S24 Ultra', color: '黑色', ram: '12GB', rom: '256GB', sale_price: 9699, cost_price: 8200, launch_year: 2024, os_type: 'Android', network_type: '5G', screen_size: '6.8英寸', cpu: 'Snapdragon 8 Gen 3', battery: '5000mAh' },
    { brandName: 'Xiaomi', name: '小米14 Ultra', color: '黑色', ram: '12GB', rom: '256GB', sale_price: 5999, cost_price: 5100, launch_year: 2024, os_type: 'Android', network_type: '5G', screen_size: '6.73英寸', cpu: 'Snapdragon 8 Gen 3', battery: '5300mAh' },
    { brandName: 'Xiaomi', name: '小米14 Ultra', color: '白色', ram: '12GB', rom: '256GB', sale_price: 5999, cost_price: 5100, launch_year: 2024, os_type: 'Android', network_type: '5G', screen_size: '6.73英寸', cpu: 'Snapdragon 8 Gen 3', battery: '5300mAh' },
    { brandName: 'Huawei', name: 'Mate 60 Pro', color: '黑色', ram: '12GB', rom: '256GB', sale_price: 6999, cost_price: 5900, launch_year: 2023, os_type: 'HarmonyOS', network_type: '5G', screen_size: '6.82英寸', cpu: 'Kirin 9000S', battery: '5000mAh' },
    { brandName: 'Huawei', name: 'Mate 60 Pro', color: '绿色', ram: '12GB', rom: '256GB', sale_price: 6999, cost_price: 5900, launch_year: 2023, os_type: 'HarmonyOS', network_type: '5G', screen_size: '6.82英寸', cpu: 'Kirin 9000S', battery: '5000mAh' },
  ];

  for (const md of modelsData) {
    const brand = brandRecords[md.brandName];
    await prisma.pdt_model.create({
      data: {
        brand_id: brand.id,
        name: md.name,
        color: md.color,
        ram: md.ram,
        rom: md.rom,
        sale_price: md.sale_price,
        cost_price: md.cost_price,
        launch_year: md.launch_year,
        os_type: md.os_type,
        network_type: md.network_type,
        screen_size: md.screen_size,
        cpu: md.cpu,
        battery: md.battery,
      },
    });
  }

  console.log('型号创建完成');
  console.log('种子数据填充完毕');
}

main()
  .catch((e) => {
    console.error('种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

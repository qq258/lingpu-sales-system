import { PrismaClient } from '@prisma/client';
import path from 'path';

// 使用绝对路径确保数据库文件位置正确（兼容打包后运行环境）
const dbPath = path.resolve(__dirname, '../../data/database.sqlite');
const prisma = new PrismaClient({
  datasources: {
    db: { url: `file:${dbPath}` },
  },
});

export default prisma;

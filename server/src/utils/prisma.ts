import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// 使用绝对路径确保数据库文件位置正确
// 兼容 tsc (dist/utils/) 和 esbuild bundle (dist/) 两种目录结构
function resolveDbPath(): string {
  const candidates = [
    // tsc 编译后: dist/utils/prisma.js -> dist/data/database.sqlite
    path.resolve(__dirname, '../../data/database.sqlite'),
    // esbuild bundle 后: dist/index.js -> dist/data/database.sqlite
    path.resolve(__dirname, '../data/database.sqlite'),
    // 当前工作目录兜底
    path.resolve(process.cwd(), 'data/database.sqlite'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  // 都没找到时，返回 esbuild 的路径作为默认值（启动后会报错提示）
  return candidates[1];
}

const dbPath = resolveDbPath();
const prisma = new PrismaClient({
  datasources: {
    db: { url: `file:${dbPath}` },
  },
});

export default prisma;

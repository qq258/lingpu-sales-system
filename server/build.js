/**
 * Server 打包脚本（esbuild）
 *
 * 用法: node build.js
 * 输出: dist/index.js（单文件，仅 Prisma 外置）
 *
 * 与 package.json 的 bundle 脚本配合使用
 */
const esbuild = require('esbuild');
const { rm, mkdir } = require('fs/promises');
const { statSync } = require('fs');

async function build() {
  console.log('[1/2] Cleaning dist/...');
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });

  console.log('[2/2] Bundling with esbuild...');
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/index.js',
    format: 'cjs',
    // 关键：Prisma 必须外置（动态加载原生引擎二进制）
    external: [
      '@prisma/client',
      '.prisma/client',
      'prisma',
    ],
    banner: {
      js: '#!/usr/bin/env node\n// Bundled by esbuild',
    },
    sourcemap: true,
    minify: false,
    treeShaking: true,
    logLevel: 'info',
  });

  const size = statSync('dist/index.js').size;
  console.log(`\nBundle done: dist/index.js (${(size / 1024).toFixed(1)} KB)`);
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

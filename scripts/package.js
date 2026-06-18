/**
 * 手机销售系统 - Windows 便携式打包脚本
 * 
 * 用法: node scripts/package.js [--build]
 *   --build: 打包前先构建所有项目
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RELEASE_DIR = path.resolve(ROOT, 'release', '手机销售系统');

// Node.js LTS 版本
const NODE_VERSION = '22.14.0';
const NODE_URL = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip`;
const LOCAL_NODE_ZIP = path.join(ROOT, `node-v${NODE_VERSION}-win-x64.zip`);

function run(cmd, cwd = ROOT) {
  console.log(`  > ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

function ps(cmd) {
  // Run PowerShell command and return output
  const result = execSync(`powershell -NoProfile -Command "${cmd.replace(/"/g, '\\"')}"`, {
    stdio: 'pipe',
    encoding: 'utf-8',
    shell: true,
  });
  return result.trim();
}

function robocopy(src, dest) {
  const cmd = `robocopy "${src}" "${dest}" /E /R:1 /W:1 /NJH /NJS /NDL /NP`;
  try {
    execSync(cmd, { stdio: 'pipe', shell: true });
  } catch (e) {
    // robocopy exit codes:
    // 0 = no copy, 1 = copied, 2 = extra, 3 = 1+2, 4 = mismatch, 5-7 = combinations
    // These are all success cases. Only >= 8 means error.
    if (e.status && e.status >= 8) throw e;
  }
}

function downloadNodeJS(dest) {
  // Use PowerShell to download (more reliable for large files in Windows)
  const psCmd = `Invoke-WebRequest -Uri "${NODE_URL}" -OutFile "${dest}" -UseBasicParsing -ErrorAction Stop`;
  console.log(`  Downloading Node.js v${NODE_VERSION}...`);
  try {
    execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'pipe', shell: true, timeout: 120000 });
    console.log('  Download complete.');
    return true;
  } catch (e) {
    console.error(`  Download failed: ${e.message}`);
    return false;
  }
}

function writeBatFile(filePath, content) {
  // 写入系统默认编码（中文 Windows 为 GBK），确保 cmd.exe 能正确解析
  // 同时确保使用 CRLF（\r\n）行尾，cmd.exe 无法正确解析 LF-only 行尾
  const crlfContent = content.replace(/\r?\n/g, '\r\n');
  const tempPath = path.join(require('os').tmpdir(), 'bat-' + path.basename(filePath));
  fs.writeFileSync(tempPath, crlfContent, 'utf-8');
  try {
    // 用 PowerShell 读 UTF-8 临时文件，写为系统默认编码
    const psCmd = `$c = Get-Content '${tempPath.replace(/'/g, "''")}' -Raw -Encoding UTF8; [System.IO.File]::WriteAllText('${filePath.replace(/'/g, "''")}', $c, [System.Text.Encoding]::Default)`;
    execSync(`powershell -NoProfile -Command "${psCmd.replace(/"/g, '\\"')}"`, { stdio: 'pipe', shell: true });
  } finally {
    try { fs.unlinkSync(tempPath); } catch (e) {}
  }
}

function createLauncherScripts(targetDir) {
  const startBat = `@echo off
chcp 65001 >nul
cd /d %~dp0

echo ============================================
echo    手机销售后台管理系统 - 便携版
echo ============================================
echo.

REM Check Node.js
if not exist "%~dp0node\\node.exe" (
    echo [错误] 未找到 Node.js 运行时
    echo 请重新下载完整包或联系管理员
    pause
    exit /b 1
)

set "PATH=%~dp0node;%PATH%"

echo [1/3] Starting backend service (port 3000)...
start "Backend" /min cmd /c "%~dp0node\\node.exe %~dp0server\\dist\\index.js"

timeout /t 3 /nobreak >nul

echo [2/3] Starting admin panel (port 5173)...
start "Admin Panel" /min cmd /c "%~dp0node\\node.exe %~dp0scripts\\serve-static.js 5173 %~dp0client\\dist"

timeout /t 2 /nobreak >nul

echo [3/3] Starting store portal (port 5174)...
start "Store Portal" /min cmd /c "%~dp0node\\node.exe %~dp0scripts\\serve-static.js 5174 %~dp0portal\\dist"

echo.
echo ============================================
echo  All services started!
echo.
echo  Admin Panel: http://localhost:5173
echo  Store Portal: http://localhost:5174
echo  API Server:  http://localhost:3000
echo.
echo  Test account: admin / 123456
echo ============================================
echo.
echo  Press any key to open browser...
pause >nul
start http://localhost:5173
`;

  const stopBat = `@echo off
chcp 65001 >nul
echo Stopping all services...
taskkill /f /fi "WINDOWTITLE eq Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Admin Panel" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Store Portal" >nul 2>&1
echo All services stopped.
pause
`;

  const startServerBat = `@echo off
chcp 65001 >nul
cd /d %~dp0
if not exist "%~dp0node\\node.exe" (
    echo [Error] Node.js runtime not found
    pause
    exit /b 1
)
set "PATH=%~dp0node;%PATH%"
echo Starting backend service (port 3000)...
"%~dp0node\\node.exe" %~dp0server\\dist\\index.js
pause
`;

  writeBatFile(path.join(targetDir, 'start.bat'), startBat);
  writeBatFile(path.join(targetDir, 'stop.bat'), stopBat);
  writeBatFile(path.join(targetDir, 'start-server.bat'), startServerBat);
  console.log('  Launcher scripts created.');
}

// ==================== MAIN ====================
const shouldBuild = process.argv.includes('--build');

function main() {
  console.log('========================================');
  console.log('  手机销售系统 - Windows 便携式打包');
  console.log('========================================\n');

  // Step 1: Build
  if (shouldBuild) {
    console.log('[1/5] Building all projects...');
    // Prisma client 必须在 tsc 之前重新生成，否则类型检查会失败
    console.log('  Regenerating Prisma client...');
    run('pnpm --filter @phone-sales/server prisma:generate');
    run('pnpm build');
  } else {
    console.log('[1/5] Skipping build (use existing artifacts)');
  }

  // Verify builds
  const required = [
    path.join(ROOT, 'server', 'dist', 'index.js'),
    path.join(ROOT, 'client', 'dist', 'index.html'),
    path.join(ROOT, 'portal', 'dist', 'index.html'),
  ];
  for (const file of required) {
    if (!fs.existsSync(file)) {
      console.error(`ERROR: Build artifact not found: ${file}`);
      console.error('Please run: pnpm build');
      process.exit(1);
    }
  }

  // Step 2: Clean and prepare release directory
  console.log('\n[2/5] Preparing release directory...');
  if (fs.existsSync(RELEASE_DIR)) {
    try { fs.rmSync(RELEASE_DIR, { recursive: true, force: true }); } catch (e) {
      // If direct delete fails (long paths), try robocopy
      const emptyDir = path.join(ROOT, '.empty-delete');
      fs.mkdirSync(emptyDir, { recursive: true });
      robocopy(emptyDir, RELEASE_DIR);
      try { fs.rmSync(RELEASE_DIR, { recursive: true, force: true }); } catch (e2) {}
      try { fs.rmSync(emptyDir, { recursive: true, force: true }); } catch (e2) {}
    }
  }
  fs.mkdirSync(RELEASE_DIR, { recursive: true });

  // Create scripts subdirectory (may already exist if rmSync partially failed)
  const scriptsDir = path.join(RELEASE_DIR, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  // Step 3: Deploy server (esbuild bundled, no full node_modules)
  console.log('\n[3/5] Deploying server (esbuild bundled)...');

  // 3.1 Run esbuild bundle (produces server/dist/index.js, single file)
  console.log('  Bundling server with esbuild...');
  run('pnpm --filter @phone-sales/server bundle');

  // 3.2 Copy bundled dist to release
  console.log('  Copying bundled dist...');
  robocopy(
    path.join(ROOT, 'server', 'dist'),
    path.join(RELEASE_DIR, 'server', 'dist')
  );

  // 3.3 Copy Prisma engine + wrapper (the ONLY external deps the bundle needs)
  console.log('  Copying Prisma engine...');
  const releaseServerNodeModules = path.join(RELEASE_DIR, 'server', 'node_modules');
  const prismaGeneratedSrc = path.join(ROOT, 'node_modules', '.prisma', 'client');
  const prismaGeneratedDest = path.join(releaseServerNodeModules, '.prisma', 'client');
  if (fs.existsSync(prismaGeneratedSrc)) {
    fs.mkdirSync(path.dirname(prismaGeneratedDest), { recursive: true });
    robocopy(prismaGeneratedSrc, prismaGeneratedDest);
  } else {
    // pnpm store fallback
    const storePath = path.join(ROOT, 'node_modules', '.pnpm', '@prisma+client@5.22.0', 'node_modules', '.prisma', 'client');
    if (fs.existsSync(storePath)) {
      fs.mkdirSync(path.dirname(prismaGeneratedDest), { recursive: true });
      robocopy(storePath, prismaGeneratedDest);
    } else {
      console.warn('  WARNING: Prisma client engine not found! Prisma may not work.');
    }
  }

  // 3.4 Copy @prisma/client wrapper
  console.log('  Copying @prisma/client wrapper...');
  const prismaWrapperSrc = path.join(ROOT, 'node_modules', '@prisma', 'client');
  const prismaWrapperDest = path.join(releaseServerNodeModules, '@prisma', 'client');
  if (fs.existsSync(prismaWrapperSrc)) {
    fs.mkdirSync(path.dirname(prismaWrapperDest), { recursive: true });
    robocopy(prismaWrapperSrc, prismaWrapperDest);
  }

  // 3.5 Copy database
  console.log('  Copying database...');
  robocopy(
    path.join(ROOT, 'server', 'data'),
    path.join(RELEASE_DIR, 'server', 'data')
  );

  // 3.6 Copy uploads (optional)
  if (fs.existsSync(path.join(ROOT, 'server', 'uploads'))) {
    console.log('  Copying uploads...');
    robocopy(
      path.join(ROOT, 'server', 'uploads'),
      path.join(RELEASE_DIR, 'server', 'uploads')
    );
  }

  // 3.7 Copy server package.json (Prisma uses it to resolve schema location)
  fs.copyFileSync(
    path.join(ROOT, 'server', 'package.json'),
    path.join(RELEASE_DIR, 'server', 'package.json')
  );

  console.log('  Server deployed (node_modules contains only Prisma).');

  // Copy client dist
  console.log('  Copying admin panel...');
  robocopy(
    path.join(ROOT, 'client', 'dist'),
    path.join(RELEASE_DIR, 'client', 'dist')
  );

  // Copy portal dist
  console.log('  Copying store portal...');
  robocopy(
    path.join(ROOT, 'portal', 'dist'),
    path.join(RELEASE_DIR, 'portal', 'dist')
  );

  // Copy scripts
  console.log('  Copying helper scripts...');
  fs.copyFileSync(
    path.join(ROOT, 'scripts', 'serve-static.js'),
    path.join(RELEASE_DIR, 'scripts', 'serve-static.js')
  );

  // Step 4: Prepare portable Node.js runtime
  console.log('\n[4/5] Preparing Node.js runtime...');
  const nodeDir = path.join(RELEASE_DIR, 'node');
  fs.mkdirSync(nodeDir, { recursive: true });

  // Determine zip source: prefer local zip file, fallback to download
  let zipFile;
  let zipSource = 'local';

  if (fs.existsSync(LOCAL_NODE_ZIP)) {
    zipFile = LOCAL_NODE_ZIP;
    console.log(`  Using local zip: ${LOCAL_NODE_ZIP}`);
  } else {
    zipFile = path.join(RELEASE_DIR, 'node.zip');
    zipSource = 'download';
    const downloadOk = downloadNodeJS(zipFile);
    if (!downloadOk) {
      console.error(`\n  [WARNING] Failed to download Node.js.`);
      console.error(`  Please manually download and extract:`);
      console.error(`  ${NODE_URL}`);
      console.error(`  Put the files into: ${nodeDir}`);
      return; // Skip extraction
    }
  }

  console.log('  Extracting Node.js...');
  ps(`Expand-Archive -Path '${zipFile}' -DestinationPath '${nodeDir}' -Force`);

  // Move files from nested dir to node/
  const nestedDir = path.join(nodeDir, `node-v${NODE_VERSION}-win-x64`);
  if (fs.existsSync(nestedDir)) {
    const items = fs.readdirSync(nestedDir);
    for (const item of items) {
      const src = path.join(nestedDir, item);
      const dest = path.join(nodeDir, item);
      if (fs.existsSync(dest)) {
        if (fs.statSync(dest).isDirectory()) {
          robocopy(src, dest);
          fs.rmSync(src, { recursive: true, force: true });
        } else {
          fs.unlinkSync(dest);
          fs.renameSync(src, dest);
        }
      } else {
        fs.renameSync(src, dest);
      }
    }
    fs.rmdirSync(nestedDir);
  }

  // Only clean up zip if it was downloaded (keep local zip for future use)
  if (zipSource === 'download' && fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
  }
  console.log('  Node.js extracted successfully.');

  // Step 5: Create launcher scripts
  console.log('\n[5/5] Creating launcher scripts...');
  createLauncherScripts(RELEASE_DIR);

  // Summary
  const totalSize = getDirSize(RELEASE_DIR);
  console.log('\n========================================');
  console.log('  Package Complete!');
  console.log('========================================');
  console.log(`  Output: ${RELEASE_DIR}`);
  console.log(`  Size:   ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log('');
  console.log('  How to use:');
  console.log('  1. Copy "手机销售系统" folder to target Windows PC');
  console.log('  2. Run start.bat');
  console.log('');
  console.log('  URLs:');
  console.log('    Admin Panel:  http://localhost:5173');
  console.log('    Store Portal: http://localhost:5174');
  console.log('    API Server:   http://localhost:3000');
  console.log('');
  console.log('  Test account: admin / 123456');
  console.log('========================================\n');
}

function getDirSize(dirPath) {
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) total += getDirSize(fullPath);
      else if (entry.isFile()) total += fs.statSync(fullPath).size;
    }
  } catch (e) { /* skip */ }
  return total;
}

main();

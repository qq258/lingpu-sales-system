@echo off
cd /d %~dp0

echo ============================================
echo    手机销售系统 - 一键启动 (含门户)
echo ============================================

echo.
echo [1/3] 启动后端服务 (端口 3000)...
start "后端服务" cmd /c "cd /d %~dp0server && pnpm dev"

timeout /t 3 /nobreak >nul

echo [2/3] 启动管理后台 (端口 5173)...
start "管理后台" cmd /c "cd /d %~dp0client && pnpm dev"

timeout /t 2 /nobreak >nul

echo [3/3] 启动门店门户 (端口 5174)...
start "门店门户" cmd /c "cd /d %~dp0portal && pnpm dev"

echo.
echo ============================================
echo  后端服务:     http://localhost:3000
echo  管理后台:     http://localhost:5173
echo  门店门户:     http://localhost:5174
echo.
echo  测试账号: admin / 123456
echo ============================================
echo.
pause

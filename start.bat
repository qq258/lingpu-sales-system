@echo off
cd /d %~dp0

echo ============================================
echo    手机销售后台管理系统 - 一键启动 (Monorepo)
echo ============================================

echo.
echo [1/2] 启动后端服务 (端口 3000)...
start "后端服务" cmd /c "cd /d %~dp0server && pnpm dev"

timeout /t 3 /nobreak >nul

echo [2/2] 启动前端服务 (端口 5173)...
start "前端服务" cmd /c "cd /d %~dp0client && pnpm dev"

echo.
echo ============================================
echo  后端: http://localhost:3000
echo  前端: http://localhost:5173
echo  测试账号: admin / 123456
echo ============================================
echo.
pause

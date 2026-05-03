@echo off
chcp 65001 >nul
echo ========================================
echo   背单词网页版 - 快速启动
echo ========================================
echo.

echo [1/2] 检查依赖...
if not exist node_modules (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ 依赖安装失败！
        echo.
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo [2/2] 启动服务器...
echo.
echo ========================================
echo   后端服务器: http://localhost:5000
echo   前端开发服务器: 请打开新终端运行 npm run dev
echo ========================================
echo.
echo 提示：
echo 1. 后端服务器正在启动...
echo 2. 请打开新终端，运行: npm run dev
echo 3. 然后访问: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

call npm run server

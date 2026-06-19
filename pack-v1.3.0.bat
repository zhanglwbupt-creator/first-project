@echo off
echo ========================================
echo   背单词应用 - 打包 V1.3.0
echo ========================================
echo.

set PROJECT_DIR=d:\WORK\AI CODING TEST\wordbook\wordbook_20260405
set TEMP_DIR=%TEMP%\wordbook-v1.3.0-temp
set PACKAGE_NAME=wordbook-v1.3.0.zip

echo [1/5] 清理旧文件...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
if exist "%PROJECT_DIR%\%PACKAGE_NAME%" del "%PROJECT_DIR%\%PACKAGE_NAME%"
mkdir "%TEMP_DIR%"
echo ✓ 清理完成

echo.
echo [2/5] 复制前端源文件...
xcopy "%PROJECT_DIR%\src" "%TEMP_DIR%\src\" /E /I /Y >nul
copy "%PROJECT_DIR%\package.json" "%TEMP_DIR%\" >nul
copy "%PROJECT_DIR%\vite.config.js" "%TEMP_DIR%\" >nul
copy "%PROJECT_DIR%\index.html" "%TEMP_DIR%\" >nul
copy "%PROJECT_DIR%\.env.example" "%TEMP_DIR%\" >nul
echo ✓ 前端源文件复制完成

echo.
echo [3/5] 复制后端文件...
xcopy "%PROJECT_DIR%\backend" "%TEMP_DIR%\backend\" /E /I /Y >nul
echo ✓ 后端文件复制完成

echo.
echo [4/5] 复制构建产物...
if exist "%PROJECT_DIR%\dist" (
    xcopy "%PROJECT_DIR%\dist" "%TEMP_DIR%\dist\" /E /I /Y >nul
    echo ✓ 构建产物复制完成
) else (
    echo ⚠ dist 目录不存在
)

echo.
echo [5/5] 复制数据库...
if exist "%PROJECT_DIR%\data\wordbook.db" (
    mkdir "%TEMP_DIR%\data" >nul
    copy "%PROJECT_DIR%\data\wordbook.db" "%TEMP_DIR%\data\" >nul
    echo ✓ 数据库复制完成
) else (
    echo   数据库不存在
)

echo.
echo ========================================
echo   创建压缩包...
echo ========================================

powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%PROJECT_DIR%\%PACKAGE_NAME%' -Force"

rmdir /s /q "%TEMP_DIR%"

for %%A in ("%PROJECT_DIR%\%PACKAGE_NAME%") do set SIZE=%%~zA
set /a SIZE_MB=%SIZE%/1048576

echo.
echo ========================================
echo   ✅ V1.3.0 打包成功！
echo ========================================
echo.
echo  文件位置: %PROJECT_DIR%\%PACKAGE_NAME%
echo  文件大小: %SIZE_MB% MB
echo.
echo 📤 下一步操作:
echo   1. 使用 WinSCP/FileZilla 上传到服务器
echo      主机: 82.156.202.245
echo      端口: 2222
echo      用户: newuser
echo      目标: /home/newuser/
echo.
echo   2. SSH 连接到服务器并执行:
echo      ssh -p 2222 newuser@82.156.202.245
echo      cd ~
echo      mkdir -p wordbook-v1.3.0
echo      unzip -o wordbook-v1.3.0.zip -d wordbook-v1.3.0
echo      cd ~/wordbook-v1.3.0/backend ^&^& npm install --production
echo      cd ~/wordbook-v1.3.0 ^&^& npm install --production
echo      pm2 stop wordbook-backend || true
echo      pm2 delete wordbook-backend || true
echo      cd ~/wordbook-v1.3.0/backend ^&^& pm2 start server.js --name wordbook-backend
echo      pm2 save
echo      pm2 list
echo.
echo   3. 访问应用: http://82.156.202.245:5000
echo.

pause

@echo off
chcp 65001 >nul
echo ============================================
echo  单词本系统 - 一键部署脚本
echo ============================================
echo.

echo [1/4] 正在构建前端项目...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败！请检查错误信息
    pause
    exit /b 1
)
echo 前端构建成功！
echo.

echo [2/4] 正在准备部署文件...
if not exist deploy mkdir deploy
xcopy /E /I /Y backend deploy\backend
xcopy /E /I /Y dist deploy\dist
xcopy /E /I /Y data deploy\data
copy /Y .env.example deploy\.env
echo 部署文件准备完成！
echo.

echo [3/4] 正在打包...
cd deploy
tar -czf ../wordbook-deploy.tar.gz .
cd ..
echo 打包完成：wordbook-deploy.tar.gz
echo.

echo [4/4] 部署包信息：
for %%F in (wordbook-deploy.tar.gz) do (
    echo 文件大小: %%~zF 字节
)
echo.

echo ============================================
echo  下一步操作：
echo ============================================
echo 1. 将 wordbook-deploy.tar.gz 上传到云主机
echo    scp wordbook-deploy.tar.gz root@82.156.202.245:/root/
echo.
echo 2. SSH连接云主机
echo    ssh root@82.156.202.245
echo.
echo 3. 在云主机上解压并部署
echo    cd /root
echo    mkdir -p wordbook
echo    tar -xzf wordbook-deploy.tar.gz -C wordbook
echo    cd wordbook
echo    npm install --production
echo    npm install -g pm2
echo    pm2 start backend/server.js --name wordbook
echo.
echo 4. 访问 http://82.156.202.245:5000
echo ============================================
echo.
pause

@echo off
chcp 65001 >nul
echo ============================================
echo  单词本系统 - 远程自动部署
echo ============================================
echo.

set SERVER=root@82.156.202.245
set REMOTE_DIR=/root/wordbook

echo [1/6] 正在上传文件到云主机...
scp wordbook-deploy.tar.gz %SERVER%:/root/
if %errorlevel% neq 0 (
    echo 上传失败！请检查：
    echo 1. 云主机IP是否正确
    echo 2. SSH服务是否运行
    echo 3. 网络连接是否正常
    pause
    exit /b 1
)
echo 文件上传成功！
echo.

echo [2/6] 正在远程创建目录...
ssh %SERVER% "mkdir -p %REMOTE_DIR%"
echo 目录创建成功！
echo.

echo [3/6] 正在远程解压文件...
ssh %SERVER% "cd %REMOTE_DIR% && tar -xzf /root/wordbook-deploy.tar.gz && rm -f /root/wordbook-deploy.tar.gz"
echo 文件解压成功！
echo.

echo [4/6] 正在安装Node.js依赖...
ssh %SERVER% "cd %REMOTE_DIR% && npm install --production"
echo 依赖安装成功！
echo.

echo [5/6] 正在安装PM2进程管理器...
ssh %SERVER% "npm install -g pm2"
echo PM2安装成功！
echo.

echo [6/6] 正在启动服务...
ssh %SERVER% "cd %REMOTE_DIR% && pm2 delete wordbook 2>nul ; pm2 start backend/server.js --name wordbook && pm2 save && pm2 startup"
echo.
echo ============================================
echo  部署完成！
echo ============================================
echo.
echo 服务地址：http://82.156.202.245:5000
echo.
echo 常用命令：
echo - 查看状态：ssh %SERVER% "pm2 status"
echo - 查看日志：ssh %SERVER% "pm2 logs wordbook"
echo - 重启服务：ssh %SERVER% "pm2 restart wordbook"
echo - 停止服务：ssh %SERVER% "pm2 stop wordbook"
echo.
echo 注意：请确保云主机5000端口已开放！
echo ============================================
echo.
pause

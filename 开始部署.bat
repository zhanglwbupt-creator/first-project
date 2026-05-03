@echo off
chcp 65001 >nul
cls
echo.
echo ============================================================
echo           单词本系统 - 云主机自动部署工具
echo ============================================================
echo.
echo 服务器: 82.156.202.245
echo 用户名: newuser
echo.
echo 正在连接到云主机...
echo.
echo ============================================================
echo.
echo 请按照以下步骤操作：
echo.
echo 1. 在弹出的SSH窗口中输入密码: YourPassword123!
echo.
echo 2. 登录成功后，复制以下命令并粘贴到SSH窗口中执行：
echo.
echo ============================================================
echo.
echo 【复制下面的所有命令（从curl开始到echo结束）】
echo.
echo.
curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo bash -
echo.
sudo apt-get install -y nodejs
echo.
mkdir -p ~/wordbook
cd ~/wordbook
tar -xzf ~/wordbook-deploy.tar.gz
echo.
npm install --production
echo.
npm install -g pm2
echo.
sudo ufw allow 5000/tcp
echo.
pm2 start backend/server.js --name wordbook
pm2 save
echo.
echo "========================================"
echo "  ✅ 部署完成！"
echo "========================================"
echo "  访问: http://82.156.202.245:5000"
echo "========================================"
echo.
echo.
echo ============================================================
echo.
echo 按任意键开始SSH连接...
pause >nul
echo.
echo 正在启动SSH连接...
echo.
echo ============================================================
ssh newuser@82.156.202.245
echo.
echo ============================================================
echo 部署完成后，按任意键退出...
pause >nul

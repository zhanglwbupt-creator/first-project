#!/bin/bash

# 自动部署脚本 - 在云主机上执行
echo "========================================="
echo "  单词本系统 - 自动部署"
echo "========================================="
echo ""

# 设置sudo密码
export SUDO_PASSWORD="YourPassword123!"

# 步骤1：安装Node.js
echo "[1/7] 安装Node.js 18..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✓ Node.js已安装: $NODE_VERSION"
else
    echo "正在安装Node.js..."
    echo "$SUDO_PASSWORD" | curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -S bash -
    echo "$SUDO_PASSWORD" | sudo -S apt-get install -y nodejs
    echo "✓ Node.js安装完成: $(node -v)"
fi
echo ""

# 步骤2：创建目录
echo "[2/7] 创建部署目录..."
mkdir -p ~/wordbook
echo "✓ 目录创建完成"
echo ""

# 步骤3：解压文件
echo "[3/7] 解压部署包..."
cd ~/wordbook
if [ -f ~/wordbook-deploy.tar.gz ]; then
    tar -xzf ~/wordbook-deploy.tar.gz
    echo "✓ 文件解压完成"
    ls -la
else
    echo "✗ 错误：找不到 wordbook-deploy.tar.gz"
    exit 1
fi
echo ""

# 步骤4：安装依赖
echo "[4/7] 安装项目依赖..."
npm install --production
echo "✓ 依赖安装完成"
echo ""

# 步骤5：安装PM2
echo "[5/7] 安装PM2进程管理器..."
if command -v pm2 &> /dev/null; then
    echo "✓ PM2已安装"
else
    npm install -g pm2
    echo "✓ PM2安装完成"
fi
echo ""

# 步骤6：配置防火墙
echo "[6/7] 配置防火墙..."
if command -v ufw &> /dev/null; then
    echo "$SUDO_PASSWORD" | sudo -S ufw allow 5000/tcp 2>/dev/null
    echo "✓ 防火墙规则已添加（5000端口）"
else
    echo "⚠ 未检测到ufw防火墙"
fi
echo ""

# 步骤7：启动服务
echo "[7/7] 启动服务..."
pm2 delete wordbook 2>/dev/null
pm2 start backend/server.js --name wordbook
pm2 save
pm2 startup 2>/dev/null
echo "✓ 服务已启动"
echo ""

# 显示状态
echo "========================================="
echo "  部署完成！"
echo "========================================="
echo ""
pm2 status
echo ""
echo "服务地址: http://82.156.202.245:5000"
echo ""
echo "常用命令："
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs wordbook"
echo "  重启服务: pm2 restart wordbook"
echo "  停止服务: pm2 stop wordbook"
echo ""
echo "注意：请在云主机控制台安全组中开放5000端口！"
echo "========================================="

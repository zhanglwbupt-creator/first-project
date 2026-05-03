#!/bin/bash
echo "========================================="
echo "  单词本系统 - 云主机部署脚本"
echo "========================================="
echo ""

# 检查是否为newuser
echo "当前用户: $(whoami)"
echo "当前目录: $(pwd)"
echo ""

# 步骤1：检查Node.js
echo "[1/7] 检查Node.js环境..."
if command -v node &> /dev/null; then
    echo "✓ Node.js已安装: $(node -v)"
    echo "✓ npm已安装: $(npm -v)"
else
    echo "✗ Node.js未安装，正在安装..."
    echo "请输入sudo密码："
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
    sudo apt-get install -y nodejs
    echo "✓ Node.js安装完成: $(node -v)"
fi
echo ""

# 步骤2：创建部署目录
echo "[2/7] 创建部署目录..."
mkdir -p ~/wordbook
echo "✓ 目录创建完成: ~/wordbook"
echo ""

# 步骤3：解压文件
echo "[3/7] 解压部署包..."
cd ~/wordbook
if [ -f ~/wordbook-deploy.tar.gz ]; then
    tar -xzf ~/wordbook-deploy.tar.gz
    echo "✓ 文件解压完成"
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
    echo "✓ PM2已安装: $(pm2 -v)"
else
    npm install -g pm2
    echo "✓ PM2安装完成"
fi
echo ""

# 步骤6：配置防火墙
echo "[6/7] 配置防火墙..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 5000/tcp 2>/dev/null
    echo "✓ 防火墙规则已添加（5000端口）"
else
    echo "⚠ 未检测到ufw防火墙，请手动开放5000端口"
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
echo "服务地址: http://$(curl -s ifconfig.me):5000"
echo ""
echo "常用命令："
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs wordbook"
echo "  重启服务: pm2 restart wordbook"
echo "  停止服务: pm2 stop wordbook"
echo ""
echo "注意：请在云主机控制台安全组中开放5000端口！"
echo "========================================="

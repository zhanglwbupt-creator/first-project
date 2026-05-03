#!/bin/bash
# 单词本系统 - 完整部署检查和服务启动脚本

echo "========================================="
echo "  单词本系统 - 部署检查与启动"
echo "========================================="
echo ""

# 切换到部署目录
cd ~/wordbook || { echo "错误：wordbook目录不存在"; exit 1; }

echo "✓ 进入部署目录: $(pwd)"
echo ""

# 检查Node.js
echo "[检查] Node.js环境..."
if command -v node &> /dev/null; then
    echo "✓ Node.js: $(node -v)"
else
    echo "✗ Node.js未安装"
    exit 1
fi

# 检查npm
echo "[检查] npm环境..."
if command -v npm &> /dev/null; then
    echo "✓ npm: $(npm -v)"
else
    echo "✗ npm未找到，尝试修复PATH..."
    export PATH=/usr/local/bin:/usr/bin:$PATH
    if command -v npm &> /dev/null; then
        echo "✓ npm: $(npm -v) (PATH修复后)"
    else
        echo "✗ 仍然找不到npm，请检查安装"
        exit 1
    fi
fi
echo ""

# 检查依赖
echo "[检查] 项目依赖..."
if [ -d "node_modules" ]; then
    echo "✓ node_modules目录存在"
    echo "  大小: $(du -sh node_modules | cut -f1)"
else
    echo "✗ node_modules不存在，正在安装..."
    npm install --production
fi
echo ""

# 检查PM2
echo "[检查] PM2进程管理器..."
if command -v pm2 &> /dev/null; then
    echo "✓ PM2已安装: $(pm2 -v)"
else
    echo "  PM2未安装，正在安装..."
    npm install -g pm2
    echo "✓ PM2安装完成"
fi
echo ""

# 检查端口
echo "[检查] 端口占用..."
if netstat -tlnp 2>/dev/null | grep -q ":5000 "; then
    echo "⚠ 端口5000已被占用"
    echo "  正在停止旧服务..."
    pm2 stop wordbook 2>/dev/null
    pm2 delete wordbook 2>/dev/null
    sleep 2
else
    echo "✓ 端口5000可用"
fi
echo ""

# 启动服务
echo "[启动] 启动单词本服务..."
pm2 start backend/server.js --name wordbook
echo ""

# 保存PM2配置
echo "[配置] 保存PM2配置..."
pm2 save
echo ""

# 等待服务启动
echo "[等待] 等待服务启动..."
sleep 3
echo ""

# 检查服务状态
echo "========================================="
echo "  服务状态"
echo "========================================="
pm2 status
echo ""

# 检查进程
echo "[检查] 进程详情..."
pm2 show wordbook | grep -E "status|port|pid"
echo ""

# 测试API
echo "[测试] API健康检查..."
sleep 2
curl -s http://localhost:5000/api/health && echo "" || echo "✗ API未响应"
echo ""

# 检查防火墙
echo "[检查] 防火墙状态..."
if command -v ufw &> /dev/null; then
    sudo ufw status | grep 5000 || echo "⚠ 5000端口未在防火墙中开放"
    echo "  如需开放，执行: sudo ufw allow 5000/tcp"
else
    echo "  未检测到ufw防火墙"
fi
echo ""

# 显示访问地址
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "本地访问: http://localhost:5000"

# 获取公网IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "82.156.202.245")
echo "公网访问: http://${PUBLIC_IP}:5000"
echo ""
echo "常用命令："
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs wordbook"
echo "  重启服务: pm2 restart wordbook"
echo "  停止服务: pm2 stop wordbook"
echo ""
echo "⚠️  重要：确保云主机安全组已开放5000端口！"
echo "========================================="

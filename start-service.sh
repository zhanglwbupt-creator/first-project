#!/bin/bash
# 一键启动脚本 - 在SSH中执行

cd ~/wordbook

echo "========================================="
echo "  正在安装PM2并启动服务..."
echo "========================================="
echo ""

# 使用完整路径执行npm
echo "[1/3] 安装PM2..."
/usr/bin/node /usr/lib/node_modules/npm/bin/npm-cli.js install -g pm2
export PATH=$HOME/.local/bin:$PATH
echo "✓ PM2安装完成"
echo ""

# 启动服务
echo "[2/3] 启动单词本服务..."
pm2 start backend/server.js --name wordbook
echo "✓ 服务已启动"
echo ""

# 保存配置
echo "[3/3] 保存PM2配置..."
pm2 save
echo "✓ 配置已保存"
echo ""

# 等待服务启动
sleep 3

# 显示状态
echo "========================================="
echo "  服务状态"
echo "========================================="
pm2 status
echo ""

# 测试API
echo "========================================="
echo "  API测试"
echo "========================================="
curl -s http://localhost:5000/api/health
echo ""
echo ""

# 显示访问地址
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "访问地址: http://82.156.202.245:5000"
echo ""
echo "常用命令："
echo "  pm2 status          - 查看状态"
echo "  pm2 logs wordbook   - 查看日志"
echo "  pm2 restart wordbook - 重启服务"
echo "========================================="

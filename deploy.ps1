# 自动部署到云主机脚本
$server = "newuser@82.156.202.245"
$password = "YourPassword123!"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  单词本系统 - 自动部署" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤1：检查SSH连接
Write-Host "[1/7] 测试SSH连接..." -ForegroundColor Yellow
$env:SSHPASS = $password
$result = sshpass -p $password ssh -o StrictHostKeyChecking=no $server "echo OK" 2>&1
if ($result -eq "OK") {
    Write-Host "✓ SSH连接成功" -ForegroundColor Green
} else {
    Write-Host "⚠ sshpass未安装，使用交互式SSH" -ForegroundColor Yellow
}

# 步骤2：安装Node.js
Write-Host "`n[2/7] 安装Node.js 18..." -ForegroundColor Yellow
Write-Host "请在弹出的SSH窗口中执行以下命令：" -ForegroundColor Cyan
Write-Host ""
Write-Host "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -" -ForegroundColor Green
Write-Host "sudo apt-get install -y nodejs" -ForegroundColor Green
Write-Host "node -v" -ForegroundColor Green
Write-Host ""

# 步骤3：创建目录并解压
Write-Host "[3/7] 创建目录并解压..." -ForegroundColor Yellow
Write-Host "mkdir -p ~/wordbook && cd ~/wordbook && tar -xzf ~/wordbook-deploy.tar.gz" -ForegroundColor Green
Write-Host ""

# 步骤4：安装依赖
Write-Host "[4/7] 安装项目依赖..." -ForegroundColor Yellow
Write-Host "cd ~/wordbook && npm install --production" -ForegroundColor Green
Write-Host ""

# 步骤5：安装PM2
Write-Host "[5/7] 安装PM2..." -ForegroundColor Yellow
Write-Host "npm install -g pm2" -ForegroundColor Green
Write-Host ""

# 步骤6：配置防火墙
Write-Host "[6/7] 配置防火墙..." -ForegroundColor Yellow
Write-Host "sudo ufw allow 5000/tcp" -ForegroundColor Green
Write-Host ""

# 步骤7：启动服务
Write-Host "[7/7] 启动服务..." -ForegroundColor Yellow
Write-Host "pm2 start backend/server.js --name wordbook" -ForegroundColor Green
Write-Host "pm2 save" -ForegroundColor Green
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务地址: http://82.156.202.245:5000" -ForegroundColor Yellow
Write-Host ""

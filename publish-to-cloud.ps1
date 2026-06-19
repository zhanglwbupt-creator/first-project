# 一键发布到云主机脚本
# 用法: .\publish-to-cloud.ps1 [版本号]
# 示例: .\publish-to-cloud.ps1 1.2.3

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  背单词应用 - 发布 V$Version" -ForegroundColor Cyan
Write-Host "  云端服务器: 82.156.202.245:5000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ==================== 配置信息 ====================
$server = "newuser@82.156.202.245"
$sshPort = "2222"
$projectDir = "d:\WORK\AI CODING TEST\wordbook\wordbook_20260405"
$packageName = "wordbook-v$Version.zip"
$tempDir = Join-Path $env:TEMP "wordbook-publish-temp"

Write-Host " 开始打包..." -ForegroundColor Magenta

# ==================== 第1步：清理旧文件 ====================
Write-Host "`n[1/7] 清理旧文件..." -ForegroundColor Yellow
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
if (Test-Path "$projectDir\$packageName") { Remove-Item "$projectDir\$packageName" -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null
Write-Host "✓ 清理完成" -ForegroundColor Green

# ==================== 第2步：构建前端 ====================
Write-Host "`n[2/7] 构建前端..." -ForegroundColor Yellow
Set-Location $projectDir
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 前端构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 前端构建完成" -ForegroundColor Green

# ==================== 第3步：复制文件 ====================
Write-Host "`n[3/7] 复制文件到临时目录..." -ForegroundColor Yellow

# 创建目录结构
New-Item -ItemType Directory -Path "$tempDir\src" | Out-Null
New-Item -ItemType Directory -Path "$tempDir\backend" | Out-Null
New-Item -ItemType Directory -Path "$tempDir\data" | Out-Null

# 复制前端源文件（用于后续开发）
Copy-Item -Path "$projectDir\src\*" -Destination "$tempDir\src\" -Recurse -Force
Copy-Item "$projectDir\package.json" -Destination $tempDir
Copy-Item "$projectDir\vite.config.js" -Destination $tempDir
Copy-Item "$projectDir\index.html" -Destination $tempDir
Copy-Item "$projectDir\.env.example" -Destination $tempDir

# 复制后端文件
Copy-Item -Path "$projectDir\backend\*" -Destination "$tempDir\backend\" -Recurse -Force

# 复制已构建的前端文件
Copy-Item -Path "$projectDir\dist\*" -Destination "$tempDir\dist\" -Recurse -Force

# 复制数据库（如果存在）
if (Test-Path "$projectDir\data\wordbook.db") {
    Copy-Item "$projectDir\data\wordbook.db" -Destination "$tempDir\data\" -Force
    Write-Host "✓ 数据库已复制" -ForegroundColor Green
} else {
    Write-Host "⚠ 数据库不存在，将使用空数据库" -ForegroundColor Yellow
}

Write-Host "✓ 文件复制完成" -ForegroundColor Green

# ==================== 第4步：创建压缩包 ====================
Write-Host "`n[4/7] 创建压缩包..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath "$projectDir\$packageName" -Force
$zipSize = (Get-Item "$projectDir\$packageName").Length / 1MB
Write-Host "✓ 压缩包创建完成: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

# 清理临时目录
Remove-Item $tempDir -Recurse -Force

# ==================== 第5步：上传到服务器 ====================
Write-Host "`n[5/7] 上传到云主机..." -ForegroundColor Yellow
Write-Host "服务器: $server:$sshPort" -ForegroundColor Gray
Write-Host "文件: $packageName" -ForegroundColor Gray

try {
    # 使用scp上传
    scp -P $sshPort "$projectDir\$packageName" "${server}:/home/newuser/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 上传成功" -ForegroundColor Green
    } else {
        throw "SCP上传失败"
    }
} catch {
    Write-Host "❌ 上传失败: $_" -ForegroundColor Red
    Write-Host "提示: 请手动使用以下命令上传:" -ForegroundColor Yellow
    Write-Host "scp -P 2222 `"$projectDir\$packageName`" newuser@82.156.202.245:/home/newuser/" -ForegroundColor Cyan
    exit 1
}

# ==================== 第6步：在服务器上部署 ====================
Write-Host "`n[6/7] 在服务器上部署..." -ForegroundColor Yellow
Write-Host "正在SSH连接到服务器并执行部署命令..." -ForegroundColor Gray

$deployCommands = @"
cd ~
mkdir -p wordbook-v$Version
unzip -o wordbook-v$Version.zip -d wordbook-v$Version

# 安装依赖
cd ~/wordbook-v$Version/backend
npm install --production

cd ~/wordbook-v$Version
npm install --production

# 停止旧版本服务
pm2 stop wordbook-backend || true
pm2 delete wordbook-backend || true

# 启动新版本服务
cd ~/wordbook-v$Version/backend
pm2 start server.js --name wordbook-backend

# 保存PM2配置
pm2 save

# 查看服务状态
pm2 list

# 查看最新日志
echo "========== 最新日志 =========="
pm2 logs wordbook-backend --lines 10 --nostream
"@

try {
    ssh -p $sshPort $server $deployCommands
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 部署成功" -ForegroundColor Green
    } else {
        throw "部署命令执行失败"
    }
} catch {
    Write-Host "❌ 部署失败: $_" -ForegroundColor Red
    Write-Host "提示: 请手动SSH到服务器执行部署命令" -ForegroundColor Yellow
    exit 1
}

# ==================== 第7步：验证部署 ====================
Write-Host "`n[7/7] 验证部署..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://82.156.202.245:5000/api/auth/login" -Method POST -Body '{"username":"test","password":"test"}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 400 -or $response.StatusCode -eq 401) {
        Write-Host "✓ 服务正常运行 (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠ 服务响应异常 (HTTP $($response.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ 无法访问服务，请稍后检查" -ForegroundColor Yellow
    Write-Host "错误: $_" -ForegroundColor Gray
}

# ==================== 完成 ====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🎉 V$Version 发布成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 访问地址: http://82.156.202.245:5000" -ForegroundColor Yellow
Write-Host " 压缩包: $projectDir\$packageName" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 PM2管理命令:" -ForegroundColor Cyan
Write-Host "  ssh -p 2222 newuser@82.156.202.245" -ForegroundColor Gray
Write-Host "  pm2 list                    # 查看所有进程" -ForegroundColor Gray
Write-Host "  pm2 logs wordbook-backend   # 查看日志" -ForegroundColor Gray
Write-Host "  pm2 restart wordbook-backend # 重启服务" -ForegroundColor Gray
Write-Host ""

# 创建 V1.3.0 版本压缩包
# 用于手动上传到云服务器

$ErrorActionPreference = 'Stop'
$projectDir = "d:\WORK\AI CODING TEST\wordbook\wordbook_20260405"
$version = "1.3.0"
$packageName = "wordbook-v$version.zip"
$tempDir = Join-Path $env:TEMP "wordbook-v$version"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  背单词应用 - 打包 V$version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤1：清理旧文件
Write-Host "[1/5] 清理旧文件..." -ForegroundColor Yellow
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
if (Test-Path "$projectDir\$packageName") { Remove-Item "$projectDir\$packageName" -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null
Write-Host "✓ 清理完成" -ForegroundColor Green

# 步骤2：复制前端源文件
Write-Host "`n[2/5] 复制前端源文件..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$tempDir\src" | Out-Null
Copy-Item -Path "$projectDir\src\*" -Destination "$tempDir\src\" -Recurse -Force
Copy-Item "$projectDir\package.json" -Destination $tempDir
Copy-Item "$projectDir\vite.config.js" -Destination $tempDir
Copy-Item "$projectDir\index.html" -Destination $tempDir
Copy-Item "$projectDir\.env.example" -Destination $tempDir
Write-Host "✓ 前端源文件复制完成" -ForegroundColor Green

# 步骤3：复制后端文件
Write-Host "`n[3/5] 复制后端文件..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$tempDir\backend" | Out-Null
Copy-Item -Path "$projectDir\backend\*" -Destination "$tempDir\backend\" -Recurse -Force
Write-Host "✓ 后端文件复制完成" -ForegroundColor Green

# 步骤4：复制已构建的前端文件
Write-Host "`n[4/5] 复制构建产物..." -ForegroundColor Yellow
if (Test-Path "$projectDir\dist") {
    New-Item -ItemType Directory -Path "$tempDir\dist" | Out-Null
    Copy-Item -Path "$projectDir\dist\*" -Destination "$tempDir\dist\" -Recurse -Force
    Write-Host "✓ 构建产物复制完成" -ForegroundColor Green
} else {
    Write-Host "⚠ dist 目录不存在，请先执行 npm run build" -ForegroundColor Yellow
}

# 步骤5：复制数据库（如果存在）
Write-Host "`n[5/5] 复制数据库..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$tempDir\data" -ErrorAction SilentlyContinue | Out-Null
if (Test-Path "$projectDir\data\wordbook.db") {
    Copy-Item "$projectDir\data\wordbook.db" -Destination "$tempDir\data\" -Force
    Write-Host "✓ 数据库复制完成" -ForegroundColor Green
} else {
    Write-Host " 数据库不存在，将使用空数据库" -ForegroundColor Yellow
}

# 创建压缩包
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  创建压缩包..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Compress-Archive -Path "$tempDir\*" -DestinationPath "$projectDir\$packageName" -Force
$zipSize = (Get-Item "$projectDir\$packageName").Length / 1MB
Write-Host "✓ 压缩包创建完成: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

# 清理临时目录
Remove-Item $tempDir -Recurse -Force

# 显示文件列表
Write-Host "`n📦 压缩包内容:" -ForegroundColor Cyan
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("$projectDir\$packageName")
$fileCount = 0
$totalSize = 0
foreach ($entry in $zip.Entries) {
    if (-not $entry.FullName.EndsWith('/')) {
        $fileCount++
        $totalSize += $entry.Length
        Write-Host "  $($entry.FullName)" -ForegroundColor Gray
    }
}
$zip.Dispose()

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ V$version 打包成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " 文件位置: $projectDir\$packageName" -ForegroundColor Yellow
Write-Host " 文件大小: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Yellow
Write-Host "📁 文件数量: $fileCount 个" -ForegroundColor Yellow
Write-Host ""
Write-Host " 下一步操作:" -ForegroundColor Cyan
Write-Host "  1. 使用 WinSCP/FileZilla 上传到服务器" -ForegroundColor Gray
Write-Host "     主机: 82.156.202.245" -ForegroundColor Gray
Write-Host "     端口: 2222" -ForegroundColor Gray
Write-Host "     用户: newuser" -ForegroundColor Gray
Write-Host "     目标: /home/newuser/" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. SSH 连接到服务器并执行:" -ForegroundColor Gray
Write-Host "     ssh -p 2222 newuser@82.156.202.245" -ForegroundColor Gray
Write-Host "     cd ~" -ForegroundColor Gray
Write-Host "     mkdir -p wordbook-v$version" -ForegroundColor Gray
Write-Host "     unzip -o wordbook-v$version.zip -d wordbook-v$version" -ForegroundColor Gray
Write-Host "     cd ~/wordbook-v$version/backend && npm install --production" -ForegroundColor Gray
Write-Host "     cd ~/wordbook-v$version && npm install --production" -ForegroundColor Gray
Write-Host "     pm2 stop wordbook-backend || true" -ForegroundColor Gray
Write-Host "     pm2 delete wordbook-backend || true" -ForegroundColor Gray
Write-Host "     cd ~/wordbook-v$version/backend && pm2 start server.js --name wordbook-backend" -ForegroundColor Gray
Write-Host "     pm2 save" -ForegroundColor Gray
Write-Host "     pm2 list" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. 访问应用: http://82.156.202.245:5000" -ForegroundColor Yellow
Write-Host ""

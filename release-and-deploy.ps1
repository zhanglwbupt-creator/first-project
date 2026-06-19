# 一键打包并发布到云主机
# 用法: .\release-and-deploy.ps1 [版本号]
# 示例: .\release-and-deploy.ps1 1.2.2

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  一键发布 V$Version" -ForegroundColor Cyan
Write-Host "  打包 + 部署到云主机" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 第1步：打包
Write-Host "`n>>> 第1步：打包版本 V$Version" -ForegroundColor Magenta
.\release.ps1 $Version

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 打包失败，中止部署" -ForegroundColor Red
    exit 1
}

# 第2步：部署
Write-Host "`n>>> 第2步：部署到云主机" -ForegroundColor Magenta
.\deploy-to-cloud.ps1 $Version

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 部署失败" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🎉 V$Version 发布成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

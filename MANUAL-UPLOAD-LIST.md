# 手动上传文件清单 - V1.2.4

##  本次更新内容

- ✅ 新增填空练习功能（StudyMode.vue, StudyLearn.vue）
- ✅ 优化登录注册错误提示（backend/routes/auth.js）
- ✅ 前端生产版本构建完成

---

## 📁 需要上传的文件列表

### 方式一：使用 WinSCP/FileZilla 上传单个文件

#### 1️ 后端文件（1个）

**路径**: `backend/routes/auth.js`
- **本地路径**: `d:\WORK\AI CODING TEST\wordbook\wordbook_20260405\backend\routes\auth.js`
- **服务器路径**: `/home/newuser/wordbook-v1.2.3/backend/routes/auth.js`
- **说明**: 包含优化的登录注册错误提示逻辑

#### 2️⃣ 前端源文件（2个）

**文件1**: `src/views/StudyMode.vue`
- **本地路径**: `d:\WORK\AI CODING TEST\wordbook\wordbook_20260405\src\views\StudyMode.vue`
- **服务器路径**: `/home/newuser/wordbook-v1.2.3/src/views/StudyMode.vue`
- **说明**: 添加填空练习入口卡片

**文件2**: `src/views/StudyLearn.vue`
- **本地路径**: `d:\WORK\AI CODING TEST\wordbook\wordbook_20260405\src\views\StudyLearn.vue`
- **服务器路径**: `/home/newuser/wordbook-v1.2.3/src/views/StudyLearn.vue`
- **说明**: 实现填空练习完整功能

#### 3️ 前端构建产物（整个 dist 目录）

**目录**: `dist/`
- **本地路径**: `d:\WORK\AI CODING TEST\wordbook\wordbook_20260405\dist\*`
- **服务器路径**: `/home/newuser/wordbook-v1.2.3/dist/`
- **说明**: 替换整个 dist 目录（已重新构建）

---

### 方式二：打包上传后解压（推荐）

#### 步骤1：创建压缩包

在 Windows PowerShell 中执行：

```powershell
cd "d:\WORK\AI CODING TEST\wordbook\wordbook_20260405"

# 创建临时目录
$tempDir = Join-Path $env:TEMP "wordbook-upload-temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 复制修改的文件
Copy-Item "backend\routes\auth.js" -Destination "$tempDir\backend\routes\" -Force -ErrorAction SilentlyContinue
if (-not (Test-Path "$tempDir\backend\routes")) { New-Item -ItemType Directory -Path "$tempDir\backend\routes" -Force | Out-Null }
Copy-Item "backend\routes\auth.js" -Destination "$tempDir\backend\routes\auth.js" -Force

Copy-Item "src\views\StudyMode.vue" -Destination "$tempDir\src\views\" -Force -ErrorAction SilentlyContinue
if (-not (Test-Path "$tempDir\src\views")) { New-Item -ItemType Directory -Path "$tempDir\src\views" -Force | Out-Null }
Copy-Item "src\views\StudyMode.vue" -Destination "$tempDir\src\views\StudyMode.vue" -Force

Copy-Item "src\views\StudyLearn.vue" -Destination "$tempDir\src\views\StudyLearn.vue" -Force

Copy-Item "dist\*" -Destination "$tempDir\dist\" -Recurse -Force

# 打包
Compress-Archive -Path "$tempDir\*" -DestinationPath "wordbook-v1.2.4-patch.zip" -Force

# 清理
Remove-Item $tempDir -Recurse -Force

Write-Host "✅ 压缩包创建完成: wordbook-v1.2.4-patch.zip"
Get-Item "wordbook-v1.2.4-patch.zip" | Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB, 2)}}
```

#### 步骤2：上传到服务器

使用 WinSCP/FileZilla 上传 `wordbook-v1.2.4-patch.zip` 到 `/home/newuser/`

连接信息：
- **主机**: 82.156.202.245
- **端口**: 2222
- **用户名**: newuser
- **密码**: （你的密码）

#### 步骤3：SSH 部署

```bash
ssh -p 2222 newuser@82.156.202.245

# 进入主目录
cd ~

# 备份当前版本（可选）
cp -r wordbook-v1.2.3 wordbook-v1.2.3.bak

# 解压补丁包
unzip -o wordbook-v1.2.4-patch.zip -d wordbook-v1.2.3

# 重启服务
pm2 restart wordbook-backend

# 查看日志确认启动成功
pm2 logs wordbook-backend --lines 20

# 退出
exit
```

---

## 🔍 验证部署

部署完成后，访问以下地址测试：

1. **首页**: http://82.156.202.245:5000
2. **登录页面**: 测试新的错误提示
   - 输入不存在的用户名 → 应显示"用户不存在，请先注册"
   - 输入错误密码 → 应显示"密码错误，请重新输入"
3. **学习模式页面**: 检查是否有"填空练习"选项（带📝图标）
4. **填空练习**: 点击进入，测试例句挖空功能

---

## ⚠️ 注意事项

1. **数据库保留**: 不要覆盖 `data/wordbook.db` 文件，保留现有数据
2. **PM2 服务**: 修改后端文件后必须重启 PM2 服务才能生效
3. **浏览器缓存**: 前端更新后，用户需要清除浏览器缓存（Ctrl+F5）才能看到最新效果
4. **备份建议**: 部署前建议备份当前版本目录

---

## 🛠️ 故障排查

### 问题1：后端修改未生效
**解决**: 
```bash
ssh -p 2222 newuser@82.156.202.245
pm2 restart wordbook-backend
pm2 logs wordbook-backend --lines 30
```

### 问题2：前端页面没有更新
**解决**: 
- 用户端：按 Ctrl+F5 强制刷新浏览器
- 或清除浏览器缓存后重新访问

### 问题3：文件权限问题
**解决**:
```bash
ssh -p 2222 newuser@82.156.202.245
cd ~/wordbook-v1.2.3
chmod -R 755 backend/
chmod -R 755 dist/
pm2 restart wordbook-backend
```

---

## 📊 文件对比

| 文件 | 大小 | 修改内容 |
|------|------|----------|
| backend/routes/auth.js | ~6KB | 登录注册错误提示优化 |
| src/views/StudyMode.vue | ~10KB | 添加填空练习入口 |
| src/views/StudyLearn.vue | ~50KB | 实现填空练习功能 |
| dist/* | ~1MB | 前端生产构建产物 |

---

**预计上传时间**: 2-5分钟（取决于网络速度）
**预计部署时间**: 1-2分钟

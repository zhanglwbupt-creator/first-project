# 背单词应用云主机部署文档

## 📋 项目信息

- **项目名称**：AI背单词H5应用
- **技术栈**：Vue3 + Vite + Express + SQLite(sql.js)
- **服务器**：82.156.202.245
- **SSH端口**：2222
- **登录用户**：newuser
- **应用端口**：5000

---

## 🚀 本地打包步骤

### 1. 准备工作

```powershell
# 进入项目目录
cd "d:\WORK\AI CODING TEST\wordbook_20260405"

# 提交最新代码
git add .
git commit -m "vX.X.X: 更新说明"
```

### 2. 创建压缩包

```powershell
# 删除旧压缩包（如有）
if (Test-Path "wordbook-vX.X.X.zip") { Remove-Item "wordbook-vX.X.X.zip" -Force }

# 创建临时目录
$tempDir = Join-Path $env:TEMP "wordbook-temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 创建子目录结构
New-Item -ItemType Directory -Path "$tempDir\src" | Out-Null
New-Item -ItemType Directory -Path "$tempDir\backend" | Out-Null

# 复制前端源文件
Copy-Item -Path "src\*" -Destination "$tempDir\src\" -Recurse -Force
Copy-Item "package.json" -Destination $tempDir
Copy-Item "vite.config.js" -Destination $tempDir
Copy-Item "index.html" -Destination $tempDir

# 复制后端文件
Copy-Item -Path "backend\*" -Destination "$tempDir\backend\" -Recurse -Force

# 打包
Compress-Archive -Path "$tempDir\*" -DestinationPath "wordbook-vX.X.X.zip" -Force

# 清理临时目录
Remove-Item $tempDir -Recurse -Force

# 查看文件大小
Get-Item "wordbook-vX.X.X.zip" | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB, 2)}}
```

---

## 📤 上传到云主机

### 方式一：使用scp命令

```powershell
scp -P 2222 "d:\WORK\AI CODING TEST\wordbook_20260405\wordbook-vX.X.X.zip" newuser@82.156.202.245:/home/newuser/
```

### 方式二：使用FileZilla/WinSCP

- **主机**：82.156.202.245
- **端口**：2222
- **用户名**：newuser
- **密码**：（您的密码）
- **目标目录**：/home/newuser/

---

## 🖥️ 服务器部署步骤

### 1. SSH连接服务器

```bash
ssh -p 2222 newuser@82.156.202.245
```

### 2. 解压文件

```bash
# 进入主目录
cd ~

# 创建版本目录
mkdir -p wordbook-vX.X.X

# 解压
unzip -o wordbook-vX.X.X.zip -d wordbook-vX.X.X
```

### 3. 复制数据库（保留历史数据）

```bash
# 创建data目录
mkdir -p ~/wordbook-vX.X.X/data

# 复制旧版本数据库（从v1.1复制）
cp ~/wordbook-v1.1/data/wordbook.db ~/wordbook-vX.X.X/data/wordbook.db

# 验证复制成功
ls -lh ~/wordbook-vX.X.X/data/wordbook.db
```

### 4. 安装依赖并构建

```bash
# 安装后端依赖
cd ~/wordbook-vX.X.X/backend
npm install

# 安装前端依赖
cd ~/wordbook-vX.X.X
npm install

# 构建前端
npm run build
```

### 5. 启动服务

```bash
# 停止旧版本服务（如有）
pm2 stop wordbook-backend-vX.X
pm2 delete wordbook-backend-vX.X

# 启动新版本服务
cd ~/wordbook-vX.X.X/backend
pm2 start server.js --name wordbook-backend-vX.X.X

# 保存PM2配置
pm2 save

# 查看服务状态
pm2 list
```

### 6. 验证部署

```bash
# 查看日志
pm2 logs wordbook-backend-vX.X.X --lines 30

# 检查数据库加载
# 日志中应显示："✅ 数据库初始化成功"
```

---

##  访问应用

```
http://82.156.202.245:5000
```

---

## 🧪 功能测试清单

部署完成后，请测试以下功能：

- [ ] 用户登录/注册
- [ ] 词库列表显示
- [ ] 单词导入功能
- [ ] 看词识意模式（检查英文释义显示）
- [ ] 拼写练习模式（检查英文释义显示）
- [ ] 复习功能
- [ ] 学习统计
- [ ] 退出登录功能
- [ ] 历史学习数据完整性

---

## 🧹 清理旧版本（可选）

确认新版本运行稳定后，清理旧文件：

```bash
# 删除旧版本目录
rm -rf ~/wordbook-v1.X

# 删除旧压缩包
rm -f ~/wordbook-v*.zip

# 仅保留最新版本
ls -lh ~/wordbook-v*
```

---

## 📝 数据库路径说明

### 重要配置

后端代码 `backend/database.js` 中数据库路径配置：

```javascript
const DB_PATH = path.join(__dirname, '../data/wordbook.db')
```

- `__dirname` = `~/wordbook-vX.X.X/backend`
- `../data` = `~/wordbook-vX.X.X/data`
- 完整路径 = `~/wordbook-vX.X.X/data/wordbook.db`

**注意**：数据库必须放在 `data/` 目录下，而不是 `backend/data/`！

---

## 🔧 PM2常用命令

```bash
# 查看所有进程
pm2 list

# 查看日志
pm2 logs <app-name> --lines 50

# 重启服务
pm2 restart <app-name>

# 停止服务
pm2 stop <app-name>

# 删除进程
pm2 delete <app-name>

# 查看详细信息
pm2 info <app-name>

# 保存当前进程列表
pm2 save

# 重新加载保存的进程
pm2 resurrect
```

---

## ⚠️ 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep 5000

# 停止占用端口的进程
pm2 stop <old-app-name>
pm2 delete <old-app-name>
```

### 2. 数据库加载失败

- 检查数据库文件是否存在：`ls -lh ~/wordbook-vX.X.X/data/wordbook.db`
- 检查路径是否正确：应该是 `data/wordbook.db` 而不是 `backend/data/wordbook.db`
- 查看日志：`pm2 logs wordbook-backend-vX.X.X --lines 50`

### 3. 前端构建失败

```bash
# 清理node_modules重新安装
cd ~/wordbook-vX.X.X
rm -rf node_modules
npm install
npm run build
```

### 4. 退出登录按钮无反应

- 确保使用 `showConfirmDialog` 而不是 `Dialog.confirm`
- 检查Vant是否正确引入：`import { showConfirmDialog } from 'vant'`
- 刷新浏览器（Ctrl+F5）清除缓存

---

## 📊 版本记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-04-05 | 初始版本，基础功能 |
| v1.1 | 2026-04-11 | 优化UI布局，添加英文释义 |
| v1.2.1 | 2026-04-11 | 修复退出登录功能（Dialog.confirm → showConfirmDialog） |

---

## 📞 技术支持

如遇问题，请查看：
1. PM2日志：`pm2 logs wordbook-backend-vX.X.X`
2. 浏览器Console（F12）
3. 数据库完整性：检查 `wordbook.db` 文件大小是否正常

# 云端发布指南

## 📦 一键发布到云主机

### 使用方法

在项目根目录执行以下命令（需要指定版本号）：

```powershell
.\publish-to-cloud.ps1 1.2.3
```

例如：
```powershell
.\publish-to-cloud.ps1 1.2.4
```

### 自动完成的操作

脚本会自动执行以下步骤：

1. ✅ **清理旧文件** - 清理临时目录和旧压缩包
2. ✅ **构建前端** - 执行 `npm run build` 构建生产版本
3. ✅ **复制文件** - 复制所有必要文件到临时目录
   - 前端源文件 (src/)
   - 后端代码 (backend/)
   - 已构建的前端 (dist/)
   - 数据库文件 (data/wordbook.db)
4. ✅ **创建压缩包** - 生成 `wordbook-v[版本号].zip`
5. ✅ **上传到服务器** - 使用 SCP 上传到云主机 (82.156.202.245:2222)
6. ✅ **部署服务** - SSH 连接到服务器并执行：
   - 解压文件
   - 安装依赖 (npm install --production)
   - 停止旧版本服务
   - 启动新版本服务 (PM2)
   - 保存 PM2 配置
7. ✅ **验证部署** - 测试服务是否正常响应

### 前置要求

- ✅ PowerShell 环境
- ✅ Node.js 和 npm 已安装
- ✅ Git Bash 或 Windows Terminal（包含 scp 和 ssh 命令）
- ✅ 能够 SSH 连接到服务器（端口 2222）
- ✅ 服务器上已安装 Node.js、npm 和 PM2

### 如果 SCP/SSH 不可用

如果 Windows 上没有安装 scp/ssh 命令，脚本会提示你手动操作：

#### 方式一：使用 WinSCP/FileZilla

1. 下载 WinSCP 或 FileZilla
2. 连接信息：
   - **主机**: 82.156.202.245
   - **端口**: 2222
   - **用户名**: newuser
   - **密码**: （你的密码）
3. 上传 `wordbook-v[版本号].zip` 到 `/home/newuser/`
4. SSH 连接到服务器执行部署命令

#### 方式二：手动 SSH 部署

上传完成后，SSH 连接到服务器：

```bash
ssh -p 2222 newuser@82.156.202.245
```

然后执行以下命令：

```bash
cd ~
mkdir -p wordbook-v1.2.3
unzip -o wordbook-v1.2.3.zip -d wordbook-v1.2.3

# 安装依赖
cd ~/wordbook-v1.2.3/backend
npm install --production

cd ~/wordbook-v1.2.3
npm install --production

# 停止旧版本服务
pm2 stop wordbook-backend || true
pm2 delete wordbook-backend || true

# 启动新版本服务
cd ~/wordbook-v1.2.3/backend
pm2 start server.js --name wordbook-backend

# 保存配置
pm2 save

# 查看状态
pm2 list
pm2 logs wordbook-backend --lines 20
```

### 访问应用

部署成功后，访问：
```
http://82.156.202.245:5000
```

### PM2 管理命令

SSH 连接到服务器后，可以使用以下 PM2 命令管理服务：

```bash
# 查看所有进程
pm2 list

# 查看日志
pm2 logs wordbook-backend --lines 50

# 重启服务
pm2 restart wordbook-backend

# 停止服务
pm2 stop wordbook-backend

# 删除进程
pm2 delete wordbook-backend

# 查看详细信息
pm2 info wordbook-backend
```

### 故障排查

#### 1. 前端构建失败
- 检查是否有语法错误
- 清除 node_modules 重新安装：`rm -rf node_modules && npm install`

#### 2. SCP 上传失败
- 检查网络连接
- 确认 SSH 端口是否正确（2222）
- 尝试手动使用 WinSCP 上传

#### 3. 服务启动失败
- 查看 PM2 日志：`pm2 logs wordbook-backend`
- 检查端口是否被占用：`netstat -tlnp | grep 5000`
- 检查数据库文件是否存在

#### 4. 无法访问服务
- 检查防火墙是否开放 5000 端口
- 检查 PM2 服务是否正在运行：`pm2 list`
- 查看服务器日志：`pm2 logs wordbook-backend --lines 100`

### 版本记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.2.3 | 2026-04-XX | 新增填空练习功能，优化登录注册错误提示 |
| v1.2.2 | 2026-04-11 | 修复退出登录功能 |
| v1.2.1 | 2026-04-11 | 添加英文释义显示 |
| v1.1 | 2026-04-05 | 初始版本 |

---

**注意**：每次发布前，请确保：
1. 本地代码已提交到 Git
2. 所有修改都已测试通过
3. 数据库中有重要数据时先备份

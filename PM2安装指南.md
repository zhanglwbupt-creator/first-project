# 🔧 PM2安装指南

## 问题说明

由于SSH非交互式会话限制，无法远程自动安装PM2。
需要您在SSH窗口中手动执行命令。

---

## 📋 安装步骤

### 第1步：SSH登录

```bash
ssh newuser@82.156.202.245
```

输入密码：`YourPassword123!`

---

### 第2步：安装PM2

**方式1：使用npm完整路径（推荐）**

```bash
cd ~/wordbook
/usr/bin/node /usr/lib/node_modules/npm/bin/npm-cli.js install -g pm2
```

**方式2：如果方式1失败，尝试设置PATH后安装**

```bash
cd ~/wordbook
export PATH=/usr/local/bin:/usr/bin:$PATH
npm install -g pm2
```

**方式3：使用npx（如果npm有问题）**

```bash
cd ~/wordbook
npx pm2 --version
```

---

### 第3步：验证安装

```bash
# 设置PATH（如果还没设置）
export PATH=$HOME/.local/bin:$PATH

# 检查PM2版本
pm2 -v
```

应该显示版本号，如：`5.3.0`

---

### 第4步：启动服务

```bash
cd ~/wordbook

# 启动服务
pm2 start backend/server.js --name wordbook

# 保存配置
pm2 save

# 查看状态
pm2 status
```

---

### 第5步：测试访问

```bash
# 测试API
curl http://localhost:5000/api/health

# 应该返回: {"status":"ok"}
```

---

## 🎯 一键命令（复制粘贴）

登录SSH后，复制以下**整段**命令执行：

```bash
cd ~/wordbook && /usr/bin/node /usr/lib/node_modules/npm/bin/npm-cli.js install -g pm2 && export PATH=$HOME/.local/bin:$PATH && pm2 start backend/server.js --name wordbook && pm2 save && pm2 status && curl http://localhost:5000/api/health
```

---

## 🐛 常见问题

### Q1: npm命令找不到

**解决：** 使用完整路径
```bash
/usr/bin/node /usr/lib/node_modules/npm/bin/npm-cli.js install -g pm2
```

### Q2: pm2命令找不到

**解决：** 设置PATH
```bash
export PATH=$HOME/.local/bin:$PATH
```

或者找到pm2的实际路径：
```bash
find ~ -name pm2 -type f 2>/dev/null
```

然后使用完整路径，例如：
```bash
/home/newuser/.local/bin/pm2 start backend/server.js --name wordbook
```

### Q3: 权限错误

**解决：** 使用--unsafe-perm参数
```bash
/usr/bin/node /usr/lib/node_modules/npm/bin/npm-cli.js install -g pm2 --unsafe-perm
```

### Q4: 安装很慢

**解决：** 使用淘宝镜像
```bash
/usr/bin/node /usr/lib/node_modules/npm/bin/npm-cli.js config set registry https://registry.npmmirror.com
/usr/bin/node /usr/lib/node_modules/npm/bin/npm-cli.js install -g pm2
```

---

## ✅ 安装成功标志

当您看到以下内容时，说明安装成功：

```bash
$ pm2 -v
5.3.0

$ pm2 status
┌────┬──────────┬──────────┬──────┬───────────┬──────────┐
│ id │ name     │ mode     │ ↺    │ status    │ cpu      │
├────┼──────────┼──────────┼──────┼──────────┼──────────┤
│ 0  │ wordbook │ cluster  │ 0    │ online    │ 0%       │
└────┴──────────┴──────────┴──────┴──────────┴──────────┘
```

---

## 📞 需要帮助？

如果安装过程中遇到问题，请告诉我：
1. 执行的命令
2. 看到的错误信息
3. `ls -la /usr/bin/npm` 的输出

我会立即帮您解决！

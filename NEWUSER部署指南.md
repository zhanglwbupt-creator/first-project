# 🚀 云主机部署 - 最简单方案

## ✅ 已完成（自动完成）

- [x] 前端项目构建
- [x] 部署包打包 (wordbook-deploy.tar.gz)
- [x] 文件上传到云主机 (/home/newuser/wordbook-deploy.tar.gz)
- [x] 部署脚本上传 (/home/newuser/remote-deploy.sh)

## 📋 您只需要做3步

### 第1步：SSH登录云主机

```bash
ssh newuser@82.156.202.245
# 输入密码
```

### 第2步：执行一键部署脚本

```bash
# 添加执行权限
chmod +x remote-deploy.sh

# 执行部署（会自动安装Node.js等）
./remote-deploy.sh
```

脚本会提示您输入sudo密码（安装Node.js时需要）

### 第3步：访问网站

部署完成后，浏览器打开：
```
http://82.156.202.245:5000
```

## 🔧 如果脚本执行失败，手动执行

```bash
# 1. 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs

# 2. 创建目录并解压
mkdir -p ~/wordbook
cd ~/wordbook
tar -xzf ~/wordbook-deploy.tar.gz

# 3. 安装依赖
npm install --production

# 4. 安装PM2
npm install -g pm2

# 5. 开放防火墙
sudo ufw allow 5000/tcp

# 6. 启动服务
pm2 start backend/server.js --name wordbook
pm2 save

# 7. 查看状态
pm2 status
```

## ⚠️ 重要：开放云主机安全组端口

登录云主机控制台（阿里云/腾讯云/华为云等）：
1. 找到"安全组"或"防火墙"
2. 添加入站规则：
   - 端口范围：5000
   - 协议：TCP
   - 授权对象：0.0.0.0/0
   - 描述：单词本系统

## 🎯 验证部署成功

```bash
# 检查服务状态
pm2 status
# 应该显示 wordbook  online

# 检查端口
netstat -tlnp | grep 5000
# 应该看到 0.0.0.0:5000

# 测试API
curl http://localhost:5000/api/health
# 应该返回 {"status":"ok"}
```

## 📊 常用命令

```bash
# 查看日志
pm2 logs wordbook

# 重启服务
pm2 restart wordbook

# 停止服务
pm2 stop wordbook

# 查看资源使用
pm2 monit
```

## 🐛 遇到问题？

### 问题1：npm install 很慢
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install --production
```

### 问题2：端口无法访问
1. 检查PM2状态：`pm2 status`
2. 检查防火墙：`sudo ufw status`
3. **检查云主机安全组**（最容易忘记！）

### 问题3：Node.js版本不对
```bash
# 卸载旧版本
sudo apt-get remove -y nodejs

# 重新安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs
```

## 📞 需要帮助

如果部署过程中遇到任何问题，请告诉我：
1. 执行的命令
2. 看到的错误信息
3. 云主机操作系统版本

我会帮您解决！

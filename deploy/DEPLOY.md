# 部署到云主机指南

## 1. 上传文件到云主机

### 方法1：使用SCP（推荐）
```bash
# 在本地电脑上执行（Windows PowerShell）
scp -r deploy/* root@82.156.202.245:/root/wordbook/
```

### 方法2：使用WinSCP
- 下载安装 WinSCP
- 连接到 82.156.202.245
- 用户名: root
- 将整个 deploy 文件夹上传到 /root/wordbook/

## 2. 连接云主机

```bash
ssh root@82.156.202.245
# 输入密码
```

## 3. 安装Node.js环境

```bash
# 更新系统
yum update -y  # CentOS/RHEL
# 或 apt update -y  # Ubuntu/Debian

# 安装Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs  # CentOS/RHEL
# 或 apt install -y nodejs  # Ubuntu/Debian

# 验证安装
node -v
npm -v
```

## 4. 安装项目依赖

```bash
cd /root/wordbook

# 安装依赖
npm install --production

# 安装PM2（进程管理器）
npm install -g pm2
```

## 5. 配置防火墙

```bash
# CentOS/RHEL
firewall-cmd --permanent --add-port=5000/tcp
firewall-cmd --reload

# Ubuntu/Debian
ufw allow 5000/tcp
ufw reload

# 或在云主机控制面板开放5000端口
```

## 6. 启动服务

```bash
# 使用PM2启动（推荐）
pm2 start backend/server.js --name wordbook

# 查看状态
pm2 status

# 查看日志
pm2 logs wordbook

# 设置开机自启
pm2 startup
pm2 save
```

## 7. 访问测试

打开浏览器访问：http://82.156.202.245:5000

## 8. 常用命令

```bash
# 重启服务
pm2 restart wordbook

# 停止服务
pm2 stop wordbook

# 查看日志
pm2 logs wordbook

# 监控
pm2 monit
```

## 注意事项

1. **修改.env文件中的JWT_SECRET**，使用强密码
2. **确保5000端口在云主机防火墙和安全组中已开放**
3. **建议配置Nginx反向代理和HTTPS**（可选）
4. **定期备份data文件夹**

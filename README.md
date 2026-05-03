# 背单词网页版 - 开发指南

## 📦 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（可选）

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加百度翻译API密钥（可选）：
```
BAIDU_APP_ID=your_app_id
BAIDU_APP_KEY=your_app_key
```

**注意：** 如果不配置百度API，系统会使用模拟数据进行测试。

### 3. 启动开发服务器

**方式一：同时启动前后端（推荐）**

```bash
# 启动后端服务器（端口5000）
npm run server

# 新开一个终端，启动前端开发服务器（端口3000）
npm run dev
```

**方式二：只启动前端**

```bash
npm run dev
```

前端会自动代理API请求到后端。

### 4. 访问应用

- 前端开发服务器：http://localhost:3000
- 后端API服务器：http://localhost:5000
- API健康检查：http://localhost:5000/api/health

---

## 📁 项目结构

```
wordbook_20260405/
├── backend/                # 后端代码
│   ├── server.js          # Express服务器入口
│   ├── database.js        # SQLite数据库操作
│   └── routes/            # API路由
│       ├── wordbank.js    # 词库管理API
│       └── translate.js   # 翻译API
│
├── src/                   # 前端代码
│   ├── main.js           # Vue应用入口
│   ├── App.vue           # 根组件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia状态管理
│   │   └── wordbank.js   # 词库状态
│   └── views/            # 页面组件
│       ├── Home.vue      # 首页
│       ├── WordBank.vue  # 词库管理
│       └── Import.vue    # 导入单词
│
├── data/                  # 数据库文件（自动创建）
│   └── wordbook.db       # SQLite数据库
│
├── public/               # 静态资源
├── index.html            # HTML入口
├── vite.config.js        # Vite配置
├── package.json          # 项目配置
└── README.md            # 说明文档
```

---

## 🎯 核心功能

### 1. 词库管理
- ✅ 创建词库
- ✅ 查看词库列表
- ✅ 删除词库
- ✅ 查看词库进度

### 2. 单词导入
- ✅ Excel文件导入（.xlsx, .xls）
- ✅ CSV文件导入（.csv）
- ✅ 智能列名识别
- ✅ 批量导入
- ✅ 导入预览
- ✅ 自动查询缺失释义

### 3. 词典查询
- ✅ 百度翻译API集成
- ✅ 自动补充中文释义
- ✅ 自动补充英文释义
- ✅ 自动补充例句
- ✅ 模拟数据支持（测试用）

---

## 📊 API接口

### 词库管理

#### 获取所有词库
```
GET /api/wordbanks
```

#### 创建词库
```
POST /api/wordbanks
Body: { "name": "词库名称", "description": "描述" }
```

#### 删除词库
```
DELETE /api/wordbanks/:id
```

#### 获取词库的单词
```
GET /api/wordbanks/:id/words
```

#### 添加单词
```
POST /api/wordbanks/:id/words
Body: {
  "word": "apple",
  "phonetic": "/ˈæpl/",
  "definition_cn": "苹果",
  "definition_en": "A round fruit...",
  "example": "I eat an apple every day."
}
```

#### 批量添加单词
```
POST /api/wordbanks/:id/words/batch
Body: { "words": [...] }
```

### 翻译查询

#### 查询单词释义
```
POST /api/translate
Body: { "word": "apple" }
Response: {
  "word": "apple",
  "phonetic": "/ˈæpl/",
  "definition_cn": "苹果",
  "definition_en": "...",
  "example": "..."
}
```

---

## 📝 Excel/CSV导入格式

### 标准格式

| 单词 | 中文释义 | 英文释义 | 例句 | 音标 |
|------|---------|---------|------|------|
| apple | 苹果 | A round fruit... | I eat an apple... | /ˈæpl/ |
| book | 书 | A written work... | I am reading... | /bʊk/ |

### CSV格式示例

```csv
单词,中文释义,英文释义,例句,音标
apple,苹果,A round fruit...,I eat an apple...,/ˈæpl/
book,书,A written work...,I am reading...,/bʊk/
```

### 智能识别

系统会自动识别以下列名：
- **单词列：** 单词, Word, word
- **中文释义：** 中文释义, Definition, definition_cn
- **英文释义：** 英文释义, English Definition, definition_en
- **例句：** 例句, Example, example_sentence
- **音标：** 音标, Phonetic, phonetic

### 必填字段
- ✅ 单词（必须）

### 选填字段
- ⭕ 中文释义（如为空，自动查询）
- ⭕ 英文释义（如为空，自动查询）
- ⭕ 例句（如为空，自动查询）
- ⭕ 音标（如为空，自动查询）

### 支持格式
- ✅ Excel文件：.xlsx, .xls
- ✅ CSV文件：.csv（UTF-8编码）

---

## 🔧 技术栈

### 前端
- Vue 3 - 渐进式JavaScript框架
- Vite - 现代前端构建工具
- Pinia - Vue状态管理
- Vue Router - 路由管理
- Vant 4 - 移动端UI组件库
- Axios - HTTP客户端
- XLSX - Excel解析

### 后端
- Express - Node.js Web框架
- Better-SQLite3 - SQLite数据库
- Axios - HTTP客户端
- CORS - 跨域支持
- Multer - 文件上传

### 数据库
- SQLite - 轻量级嵌入式数据库

---

## 🚀 构建生产版本

```bash
# 构建前端
npm run build

# 启动生产服务器
npm run server
```

生产服务器会同时提供前端静态文件和后端API。

---

## 🐛 常见问题

### 1. 启动时提示缺少依赖
```bash
npm install
```

### 2. 端口被占用
修改 `vite.config.js` 或 `.env` 中的端口号

### 3. 数据库文件不存在
系统会自动创建 `data/wordbook.db` 文件

### 4. 翻译API不工作
- 检查 `.env` 配置是否正确
- 未配置时使用模拟数据，不影响功能测试

---

## 📋 开发计划

### 第零阶段（当前）✅
- [x] 项目初始化
- [x] 词库管理
- [x] Excel导入
- [x] 词典查询
- [ ] 学习功能
- [ ] 复习功能

### 第一阶段
- [ ] 看词识意学习模式
- [ ] 拼写练习模式
- [ ] 学习进度追踪
- [ ] 艾宾浩斯复习算法

### 第二阶段
- [ ] 图片OCR导入
- [ ] 浏览器通知提醒
- [ ] PWA支持
- [ ] 数据导出

---

## 📞 获取帮助

如有问题，请：
1. 查看本文档
2. 检查控制台错误信息
3. 查看API响应

---

**祝开发顺利！** 🎉

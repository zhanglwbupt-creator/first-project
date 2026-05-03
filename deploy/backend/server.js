require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./database')
const { router: authRoutes, authenticate } = require('./routes/auth')
const wordbankRoutes = require('./routes/wordbank')
const translateRoutes = require('./routes/translate')
const studyRoutes = require('./routes/study')

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件
app.use(express.static(path.join(__dirname, '../dist')))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/wordbanks', authenticate, wordbankRoutes)
app.use('/api/translate', translateRoutes)
app.use('/api/study', authenticate, studyRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '背单词服务器运行中' })
})

// SPA回退
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: '服务器内部错误' })
})

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await db.initDatabase()
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器已启动: http://localhost:${PORT}`)
      console.log(`📊 API文档: http://localhost:${PORT}/api/health`)
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const db = require('../database')

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'wordbook-secret-key-2026'

// 用户注册
router.post('/register', (req, res) => {
  try {
    const { username, password, nickname, email } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    // 验证用户名格式
    if (username.length < 3) {
      return res.status(400).json({ error: '用户名长度至少3个字符' })
    }

    if (username.length > 20) {
      return res.status(400).json({ error: '用户名长度不能超过20个字符' })
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' })
    }

    if (password.length > 50) {
      return res.status(400).json({ error: '密码长度不能超过50位' })
    }

    // 检查用户名是否已存在
    if (db.users.exists(username)) {
      console.log('❌ 注册失败: 用户名已存在 -', username)
      return res.status(400).json({ error: '用户名已存在，请选择其他用户名' })
    }

    // 创建用户
    const user = db.users.create(username, password, nickname, email)
    
    console.log('👤 创建用户成功:', user)
    console.log(' user.id:', user?.id, 'user.username:', user?.username)

    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    console.log('🔑 JWT payload:', { id: user.id, username: user.username })
    console.log('🔑 Token前20字符:', token.substring(0, 20))

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email
      }
    })
  } catch (error) {
    console.error('❌ 注册异常:', error.message)
    res.status(500).json({ 
      error: '注册失败: ' + (error.message || '系统内部错误'),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// 用户登录
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    // 先检查用户是否存在
    const userExists = db.users.exists(username)
    if (!userExists) {
      console.log('❌ 登录失败: 用户不存在 -', username)
      return res.status(401).json({ error: '用户不存在，请先注册' })
    }

    // 验证用户密码
    const user = db.users.verify(username, password)

    if (!user) {
      console.log('❌ 登录失败: 密码错误 -', username)
      return res.status(401).json({ error: '密码错误，请重新输入' })
    }

    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log('✅ 登录成功:', user.username)

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email
      }
    })
  } catch (error) {
    console.error('❌ 登录异常:', error.message)
    res.status(500).json({ 
      error: '登录失败: ' + (error.message || '系统内部错误'),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// 获取当前用户信息
router.get('/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: '未登录' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = db.users.getById(decoded.id)

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json({ user })
  } catch (error) {
    res.status(401).json({ error: 'token无效或已过期' })
  }
})

// 认证中间件
function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    console.log('🔐 认证中间件 - token:', token ? token.substring(0, 20) + '...' : '无token')
    console.log('🔐 认证中间件 - headers:', JSON.stringify(req.headers.authorization))

    if (!token) {
      console.error('❌ 认证失败: 未提供token')
      return res.status(401).json({ error: '未登录' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('✅ token解析成功 - userId:', decoded.id, 'username:', decoded.username)
    
    req.userId = decoded.id
    req.username = decoded.username
    next()
  } catch (error) {
    console.error('❌ token验证失败:', error.message)
    res.status(401).json({ error: 'token无效或已过期' })
  }
}

module.exports = {
  router,
  authenticate
}

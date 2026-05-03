const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

// 数据库路径
const DB_PATH = path.join(__dirname, '../data/wordbook.db')

// 确保data目录存在
const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db = null

// 初始化数据库
async function initDatabase() {
  const SQL = await initSqlJs()
  
  // 如果数据库文件存在，加载它
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      nickname TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`)

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS word_banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      word_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bank_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      phonetic TEXT,
      definition_cn TEXT,
      definition_en TEXT,
      example_sentence TEXT,
      audio_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bank_id) REFERENCES word_banks(id) ON DELETE CASCADE
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_words_bank_id ON words(bank_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_words_word ON words(word)`)

  // 学习记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS study_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      bank_id INTEGER NOT NULL,
      study_date DATE NOT NULL,
      study_type TEXT NOT NULL DEFAULT 'learn', -- learn/review
      status INTEGER NOT NULL DEFAULT 0, -- 0-未学习 1-学习中 2-已掌握
      correct INTEGER DEFAULT 0, -- 是否正确 0-错误 1-正确
      review_stage INTEGER DEFAULT 0, -- 艾宾浩斯复习阶段 0-5
      next_review_date DATE, -- 下次复习日期
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
      FOREIGN KEY (bank_id) REFERENCES word_banks(id) ON DELETE CASCADE
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_study_records_word_id ON study_records(word_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_study_records_study_date ON study_records(study_date)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_study_records_next_review ON study_records(next_review_date)`)

  // 保存数据库
  saveDatabase()
  
  console.log('✅ 数据库初始化成功')
  return db
}

// 保存数据库到文件
function saveDatabase() {
  if (db) {
    try {
      const data = db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(DB_PATH, buffer)
      console.log(' 数据库已保存')
    } catch (error) {
      console.error(' 保存数据库失败:', error)
    }
  }
}

// 用户操作
const userOps = {
  // 创建用户
  create(username, password, nickname = '', email = '') {
    const bcrypt = require('bcryptjs')
    const hashedPassword = bcrypt.hashSync(password, 10)
    
    db.run(
      'INSERT INTO users (username, password, nickname, email) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, nickname || username, email]
    )
    saveDatabase()
    
    const stmt = db.prepare('SELECT id, username, nickname, email, created_at FROM users WHERE id = (SELECT last_insert_rowid())')
    stmt.step()
    const user = stmt.getAsObject()
    stmt.free()
    
    return user
  },

  // 验证用户登录
  verify(username, password) {
    const bcrypt = require('bcryptjs')
    
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?')
    stmt.bind([username])
    if (stmt.step()) {
      const user = stmt.getAsObject()
      stmt.free()
      
      const isValid = bcrypt.compareSync(password, user.password)
      if (isValid) {
        return {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email
        }
      }
    } else {
      stmt.free()
    }
    
    return null
  },

  // 获取用户信息
  getById(id) {
    const stmt = db.prepare('SELECT id, username, nickname, email, created_at FROM users WHERE id = ?')
    stmt.bind([id])
    if (stmt.step()) {
      const user = stmt.getAsObject()
      stmt.free()
      return user
    }
    stmt.free()
    return null
  },

  // 检查用户名是否存在
  exists(username) {
    const stmt = db.prepare('SELECT id FROM users WHERE username = ?')
    stmt.bind([username])
    const exists = stmt.step()
    stmt.free()
    return exists
  }
}

// 词库操作
const wordBankOps = {
  // 获取用户的所有词库
  getAll(userId) {
    const stmt = db.prepare('SELECT * FROM word_banks WHERE user_id = ? ORDER BY created_at DESC')
    stmt.bind([userId])
    const banks = []
    while (stmt.step()) {
      banks.push(stmt.getAsObject())
    }
    stmt.free()
    
    return banks.map(bank => ({
      id: bank.id,
      user_id: bank.user_id,
      name: bank.name,
      description: bank.description,
      wordCount: bank.word_count || 0,
      progress: 0,
      learnedCount: 0,
      created_at: bank.created_at,
      updated_at: bank.updated_at
    }))
  },

  // 创建词库
  create(userId, name, description = '') {
    db.run('INSERT INTO word_banks (user_id, name, description) VALUES (?, ?, ?)', [userId, name, description])
    saveDatabase()
    
    const stmt = db.prepare('SELECT * FROM word_banks ORDER BY id DESC LIMIT 1')
    stmt.step()
    const bank = stmt.getAsObject()
    stmt.free()
    
    return bank
  },

  // 获取单个词库
  getById(id) {
    const stmt = db.prepare('SELECT * FROM word_banks WHERE id = ?')
    stmt.bind([id])
    if (stmt.step()) {
      const bank = stmt.getAsObject()
      stmt.free()
      return bank
    }
    stmt.free()
    return null
  },

  // 删除词库
  delete(id) {
    db.run('DELETE FROM word_banks WHERE id = ?', [id])
    saveDatabase()
  },

  // 更新词库单词数量
  updateWordCount(id) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM words WHERE bank_id = ?')
    stmt.bind([id])
    stmt.step()
    const result = stmt.getAsObject()
    stmt.free()
    
    db.run('UPDATE word_banks SET word_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [result.count, id])
    saveDatabase()
  }
}

// 单词操作
const wordOps = {
  // 添加单词
  add(userId, bankId, wordData) {
    db.run(`
      INSERT INTO words (user_id, bank_id, word, phonetic, definition_cn, definition_en, example_sentence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      bankId,
      wordData.word,
      wordData.phonetic || null,
      wordData.definition_cn || null,
      wordData.definition_en || null,
      wordData.example_sentence || wordData.example || null
    ])
    saveDatabase()
    
    wordBankOps.updateWordCount(bankId)
    
    const stmt = db.prepare('SELECT * FROM words ORDER BY id DESC LIMIT 1')
    stmt.step()
    const word = stmt.getAsObject()
    stmt.free()
    
    return word
  },

  // 批量添加单词（带去重）
  addBatch(userId, bankId, words) {
    db.run('BEGIN TRANSACTION')
    
    const stmt = db.prepare(`
      INSERT INTO words (user_id, bank_id, word, phonetic, definition_cn, definition_en, example_sentence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    let addedCount = 0
    let skippedCount = 0
    
    for (const word of words) {
      // 检查是否已存在
      const existsStmt = db.prepare('SELECT id FROM words WHERE user_id = ? AND bank_id = ? AND word = ?')
      existsStmt.bind([userId, bankId, word.word])
      const exists = existsStmt.step()
      existsStmt.free()
      
      if (exists) {
        skippedCount++
        continue // 跳过已存在的单词
      }
      
      stmt.run([
        userId,
        bankId,
        word.word,
        word.phonetic || null,
        word.definition_cn || null,
        word.definition_en || null,
        word.example_sentence || word.example || null
      ])
      addedCount++
    }
    
    stmt.free()
    db.run('COMMIT')
    saveDatabase()
    
    wordBankOps.updateWordCount(bankId)
    
    return { addedCount, skippedCount }
  },

  // 获取单词
  getById(id) {
    const stmt = db.prepare('SELECT * FROM words WHERE id = ?')
    stmt.bind([id])
    if (stmt.step()) {
      const word = stmt.getAsObject()
      stmt.free()
      return word
    }
    stmt.free()
    return null
  },

  // 获取词库的所有单词
  getByBankId(userId, bankId) {
    const stmt = db.prepare('SELECT * FROM words WHERE user_id = ? AND bank_id = ? ORDER BY id')
    stmt.bind([userId, bankId])
    const words = []
    while (stmt.step()) {
      words.push(stmt.getAsObject())
    }
    stmt.free()
    return words
  }
}

// 学习记录操作
const studyRecords = {
  // 记录学习状态
  record(userId, bankId, wordId, studyType, correct) {
    const today = new Date().toISOString().split('T')[0]
    
    // 查询是否已有记录
    const checkStmt = db.prepare('SELECT * FROM study_records WHERE word_id = ? AND study_date = ?')
    checkStmt.bind([wordId, today])
    const hasRecord = checkStmt.step()
    const oldRecord = hasRecord ? checkStmt.getAsObject() : null
    checkStmt.free()
    
    if (oldRecord) {
      // 更新现有记录
      const newStatus = correct ? 2 : 1
      const newReviewStage = correct ? (oldRecord.review_stage || 0) + 1 : 0
      const nextReviewDate = this.calculateNextReviewDate(newReviewStage)
      
      const updateStmt = db.prepare(`
        UPDATE study_records 
        SET status = ?, correct = ?, review_stage = ?, next_review_date = ?
        WHERE word_id = ? AND study_date = ?
      `)
      updateStmt.run([newStatus, correct ? 1 : 0, newReviewStage, nextReviewDate, wordId, today])
      updateStmt.free()
    } else {
      // 创建新记录
      const reviewStage = correct ? 1 : 0
      const nextReviewDate = this.calculateNextReviewDate(reviewStage)
      const status = correct ? 2 : 1
      
      const insertStmt = db.prepare(`
        INSERT INTO study_records (user_id, word_id, bank_id, study_date, study_type, status, correct, review_stage, next_review_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      insertStmt.run([userId, wordId, bankId, today, studyType, status, correct ? 1 : 0, reviewStage, nextReviewDate])
      insertStmt.free()
    }
    
    saveDatabase()
  },

  // 计算下次复习日期（艾宾浩斯遗忘曲线）
  calculateNextReviewDate(stage) {
    const intervals = [1, 2, 4, 7, 15, 30] // 复习间隔（天）
    const interval = intervals[stage] || 30
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + interval)
    return nextDate.toISOString().split('T')[0]
  },

  // 获取今日待学习单词（未学习过的）
  getTodayWordsToLearn(userId, bankId, limit = 10) {
    const today = new Date().toISOString().split('T')[0]
    
    const stmt = db.prepare(`
      SELECT w.* FROM words w
      WHERE w.user_id = ? AND w.bank_id = ?
      AND w.id NOT IN (
        SELECT word_id FROM study_records 
        WHERE user_id = ? AND study_date = ? AND study_type = 'learn'
      )
      ORDER BY w.id
      LIMIT ?
    `)
    stmt.bind([userId, bankId, userId, today, limit])
    const words = []
    while (stmt.step()) {
      words.push(stmt.getAsObject())
    }
    stmt.free()
    return words
  },

  // 获取待复习单词（到达复习日期的）
  getWordsToReview(userId, bankId, limit = 20) {
    const today = new Date().toISOString().split('T')[0]
    
    const stmt = db.prepare(`
      SELECT w.*, sr.review_stage, sr.next_review_date
      FROM words w
      INNER JOIN study_records sr ON w.id = sr.word_id
      WHERE w.user_id = ? AND w.bank_id = ?
      AND sr.user_id = ?
      AND sr.next_review_date <= ?
      AND sr.status >= 1
      ORDER BY sr.next_review_date ASC
      LIMIT ?
    `)
    stmt.bind([userId, bankId, userId, today, limit])
    const words = []
    while (stmt.step()) {
      words.push(stmt.getAsObject())
    }
    stmt.free()
    return words
  },

  // 获取学习统计
  getStats(userId, bankId) {
    const today = new Date().toISOString().split('T')[0]
    
    // 今日学习数
    const todayStmt = db.prepare(`
      SELECT COUNT(*) as count FROM study_records 
      WHERE user_id = ? AND bank_id = ? AND study_date = ? AND study_type = 'learn'
    `)
    todayStmt.bind([userId, bankId, today])
    const todayData = todayStmt.step() ? todayStmt.getAsObject() : { count: 0 }
    todayStmt.free()
    
    // 总学习数
    const totalStmt = db.prepare(`
      SELECT COUNT(DISTINCT word_id) as count FROM study_records 
      WHERE user_id = ? AND bank_id = ? AND study_type = 'learn'
    `)
    totalStmt.bind([userId, bankId])
    const totalData = totalStmt.step() ? totalStmt.getAsObject() : { count: 0 }
    totalStmt.free()
    
    // 已掌握数
    const masteredStmt = db.prepare(`
      SELECT COUNT(DISTINCT word_id) as count FROM study_records 
      WHERE user_id = ? AND bank_id = ? AND status = 2
    `)
    masteredStmt.bind([userId, bankId])
    const masteredData = masteredStmt.step() ? masteredStmt.getAsObject() : { count: 0 }
    masteredStmt.free()
    
    // 正确率
    const accuracyStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(correct) as correct_count
      FROM study_records 
      WHERE user_id = ? AND bank_id = ?
    `)
    accuracyStmt.bind([userId, bankId])
    const accuracyData = accuracyStmt.step() ? accuracyStmt.getAsObject() : { total: 0, correct_count: 0 }
    accuracyStmt.free()
    
    const accuracy = accuracyData.total > 0 
      ? Math.round((accuracyData.correct_count / accuracyData.total) * 100) 
      : 0
    
    return {
      todayLearned: todayData.count,
      totalLearned: totalData.count,
      mastered: masteredData.count,
      accuracy: accuracy
    }
  }
}

module.exports = {
  initDatabase,
  getDb: () => db,
  users: userOps,
  wordBanks: wordBankOps,
  words: wordOps,
  studyRecords
}

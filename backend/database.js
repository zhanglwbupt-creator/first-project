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
      study_mode TEXT DEFAULT 'choice', -- choice/spell（看词识意/拼写练习）
      status INTEGER NOT NULL DEFAULT 0, -- 0-未学习 1-学习中 2-已掌握
      correct INTEGER DEFAULT 0, -- 是否正确 0-错误 1-正确
      review_stage INTEGER DEFAULT 0, -- 艾宾浩斯复习阶段 0-5
      next_review_date DATE, -- 下次复习日期
      mastery_level INTEGER DEFAULT 0, -- 掌握度 0-陌生 1-模糊 2-认识
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
      FOREIGN KEY (bank_id) REFERENCES word_banks(id) ON DELETE CASCADE
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_study_records_word_id ON study_records(word_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_study_records_study_date ON study_records(study_date)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_study_records_next_review ON study_records(next_review_date)`)

  // 数据迁移：如果mastery_level字段不存在，则添加
  try {
    db.run(`ALTER TABLE study_records ADD COLUMN mastery_level INTEGER DEFAULT 0`)
    console.log('✅ 添加mastery_level字段成功')
  } catch (error) {
    // 字段已存在，忽略错误
    if (!error.message.includes('duplicate column')) {
      console.log('mastery_level字段已存在')
    }
  }

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
    
    console.log('📝 准备插入用户:', { username, nickname: nickname || username, email })
    
    db.run(
      'INSERT INTO users (username, password, nickname, email) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, nickname || username, email]
    )
    saveDatabase()
    
    // 使用username查询刚插入的用户（更可靠）
    const stmt = db.prepare('SELECT id, username, nickname, email, created_at FROM users WHERE username = ?')
    stmt.bind([username])
    const hasRow = stmt.step()
    
    console.log(' step()返回值:', hasRow)
    
    if (!hasRow) {
      console.error(' 查询用户失败')
      stmt.free()
      throw new Error('创建用户后查询失败')
    }
    
    const user = stmt.getAsObject()
    console.log('📊 getAsObject()返回:', user)
    console.log('📊 user.id类型:', typeof user?.id, 'user.id值:', user?.id)
    
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
  record(userId, bankId, wordId, studyType, correct, masteryLevel, studyMode = 'choice') {
    const today = new Date().toISOString().split('T')[0]
    
    // 查询是否已有记录（同一模式）
    const checkStmt = db.prepare('SELECT * FROM study_records WHERE word_id = ? AND study_date = ? AND study_mode = ?')
    checkStmt.bind([wordId, today, studyMode])
    const hasRecord = checkStmt.step()
    const oldRecord = hasRecord ? checkStmt.getAsObject() : null
    checkStmt.free()
    
    if (oldRecord) {
      // 更新现有记录
      let newReviewStage = oldRecord.review_stage || 0
      let newStatus = oldRecord.status || 1
      
      // 根据掌握度调整复习阶段
      if (masteryLevel === 2) {
        // 完全掌握：stage + 1
        newReviewStage = Math.min(newReviewStage + 1, 6)
        newStatus = 2
      } else if (masteryLevel === 1) {
        // 模糊：保持stage不变
        newReviewStage = newReviewStage
        newStatus = 1
      } else {
        // 陌生/答错：重置为0
        newReviewStage = 0
        newStatus = 0
      }
      
      const nextReviewDate = this.calculateNextReviewDate(newReviewStage)
      
      const updateStmt = db.prepare(`
        UPDATE study_records 
        SET status = ?, correct = ?, review_stage = ?, next_review_date = ?, mastery_level = ?
        WHERE word_id = ? AND study_date = ? AND study_mode = ?
      `)
      updateStmt.run([newStatus, correct ? 1 : 0, newReviewStage, nextReviewDate, masteryLevel || 0, wordId, today, studyMode])
      updateStmt.free()
    } else {
      // 创建新记录
      let reviewStage = 0
      let status = 0
      
      // 根据掌握度设置初始阶段
      if (masteryLevel === 2) {
        reviewStage = 1
        status = 2
      } else if (masteryLevel === 1) {
        reviewStage = 0
        status = 1
      } else {
        reviewStage = 0
        status = 0
      }
      
      const nextReviewDate = this.calculateNextReviewDate(reviewStage)
      
      const insertStmt = db.prepare(`
        INSERT INTO study_records (user_id, word_id, bank_id, study_date, study_type, study_mode, status, correct, review_stage, next_review_date, mastery_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      insertStmt.run([userId, wordId, bankId, today, studyType, studyMode, status, correct ? 1 : 0, reviewStage, nextReviewDate, masteryLevel || 0])
      insertStmt.free()
    }
    
    saveDatabase()
  },

  // 计算下次复习日期（百词斩式艾宾浩斯遗忘曲线）
  calculateNextReviewDate(stage) {
    // 百词斩复习间隔：1天、2天、4天、7天、15天、30天、60天
    const intervals = [1, 2, 4, 7, 15, 30, 60]
    const interval = intervals[stage] || 60 // 超过6阶段默认60天
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + interval)
    return nextDate.toISOString().split('T')[0]
  },

  // 获取今日待学习单词（未学习过的）
  getTodayWordsToLearn(userId, bankId, limit = 20, studyMode = 'choice') {
    const today = new Date().toISOString().split('T')[0]
    
    const stmt = db.prepare(`
      SELECT w.* FROM words w
      WHERE w.user_id = ? AND w.bank_id = ?
      AND w.id NOT IN (
        SELECT word_id FROM study_records 
        WHERE user_id = ? AND study_date = ? AND study_type = 'learn'
        AND study_mode = ?
      )
      ORDER BY w.id
      LIMIT ?
    `)
    stmt.bind([userId, bankId, userId, today, studyMode, limit])
    const words = []
    while (stmt.step()) {
      words.push(stmt.getAsObject())
    }
    stmt.free()
    return words
  },

  // 获取追加学习单词（优先未学习，其次掌握度低的）
  getContinueLearnWords(userId, bankId, limit = 20, excludeWordIds = [], studyMode = 'choice') {
    const today = new Date().toISOString().split('T')[0]
    
    // 先查询今天未学习的单词
    const stmt1 = db.prepare(`
      SELECT w.* FROM words w
      WHERE w.user_id = ? AND w.bank_id = ?
      AND w.id NOT IN (
        SELECT word_id FROM study_records 
        WHERE user_id = ? AND study_date = ? AND study_type = 'learn'
        AND study_mode = ?
      )
      ${excludeWordIds.length > 0 ? `AND w.id NOT IN (${excludeWordIds.join(',')})` : ''}
      ORDER BY w.id
      LIMIT ?
    `)
    stmt1.bind([userId, bankId, userId, today, studyMode, limit])
    const words = []
    while (stmt1.step()) {
      words.push(stmt1.getAsObject())
    }
    stmt1.free()
    
    // 如果数量不够，补充掌握度低的单词（陌生或模糊）
    if (words.length < limit) {
      const remaining = limit - words.length
      const currentIds = words.map(w => w.id)
      const allExcludeIds = [...currentIds, ...excludeWordIds]
      
      const stmt2 = db.prepare(`
        SELECT w.* FROM words w
        WHERE w.user_id = ? AND w.bank_id = ?
        AND w.id IN (
          SELECT word_id FROM study_records 
          WHERE user_id = ? AND study_type = 'learn'
          AND study_mode = ?
          AND mastery_level IN (0, 1)
          ORDER BY study_date DESC
        )
        ${allExcludeIds.length > 0 ? `AND w.id NOT IN (${allExcludeIds.join(',')})` : ''}
        ORDER BY w.id
        LIMIT ?
      `)
      stmt2.bind([userId, bankId, userId, studyMode, remaining])
      while (stmt2.step()) {
        words.push(stmt2.getAsObject())
      }
      stmt2.free()
    }
    
    return words
  },

  // 获取待复习单词（到达复习日期的 + 今天答错/陌生的）
  getWordsToReview(userId, bankId, limit = 20) {
    const today = new Date().toISOString().split('T')[0]
    
    // 不去重，保留所有需要复习的记录（包括同一单词的不同模式）
    const stmt = db.prepare(`
      SELECT w.*, 
             sr.review_stage, 
             sr.next_review_date, 
             sr.mastery_level,
             sr.study_date,
             sr.study_mode,
             sr.id as record_id
      FROM words w
      INNER JOIN study_records sr ON w.id = sr.word_id
      WHERE w.user_id = ? AND w.bank_id = ?
      AND sr.user_id = ?
      AND (
        -- 条件1：到达复习日期的单词
        (sr.next_review_date <= ? AND sr.status >= 1)
        OR
        -- 条件2：今天答错或选择陌生的单词（直接进入复习列表）
        (sr.study_date = ? AND sr.mastery_level = 0)
      )
      ORDER BY 
        CASE 
          WHEN sr.study_date = ? AND sr.mastery_level = 0 THEN 0  -- 今天的错题优先
          ELSE 1
        END,
        sr.next_review_date ASC
      LIMIT ?
    `)
    stmt.bind([userId, bankId, userId, today, today, today, limit])
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
    
    console.log('📊 查询学习统计:', { userId, bankId, today })
    
    // 今日学习数
    const todayStmt = db.prepare(`
      SELECT COUNT(*) as count FROM study_records 
      WHERE user_id = ? AND bank_id = ? AND study_date = ? AND study_type = 'learn'
    `)
    todayStmt.bind([userId, bankId, today])
    const todayData = todayStmt.step() ? todayStmt.getAsObject() : { count: 0 }
    todayStmt.free()
    console.log('  今日学习:', todayData.count)
    
    // 总学习数
    const totalStmt = db.prepare(`
      SELECT COUNT(DISTINCT word_id) as count FROM study_records 
      WHERE user_id = ? AND bank_id = ? AND study_type = 'learn'
    `)
    totalStmt.bind([userId, bankId])
    const totalData = totalStmt.step() ? totalStmt.getAsObject() : { count: 0 }
    totalStmt.free()
    console.log('  总学习:', totalData.count)
    
    // 已掌握数
    const masteredStmt = db.prepare(`
      SELECT COUNT(DISTINCT word_id) as count FROM study_records 
      WHERE user_id = ? AND bank_id = ? AND status = 2
    `)
    masteredStmt.bind([userId, bankId])
    const masteredData = masteredStmt.step() ? masteredStmt.getAsObject() : { count: 0 }
    masteredStmt.free()
    console.log('  已掌握:', masteredData.count)
    
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
    console.log('  正确率数据:', accuracyData)
    
    const accuracy = accuracyData.total > 0 
      ? Math.round((accuracyData.correct_count / accuracyData.total) * 100) 
      : 0
    
    console.log('  最终统计:', { todayLearned: todayData.count, totalLearned: totalData.count, mastered: masteredData.count, accuracy })
    
    return {
      todayLearned: todayData.count,
      totalLearned: totalData.count,
      mastered: masteredData.count,
      accuracy: accuracy
    }
  },

  // 获取复习统计（百词斩式）
  getReviewStats(userId, bankId) {
    const today = new Date().toISOString().split('T')[0]
    
    // 待复习单词数量（包括到达复习日期的 + 今天答错/陌生的），去重统计
    const toReviewStmt = db.prepare(`
      SELECT COUNT(DISTINCT word_id) as count FROM study_records 
      WHERE user_id = ? AND bank_id = ? 
      AND (
        (next_review_date <= ? AND status >= 1)
        OR
        (study_date = ? AND mastery_level = 0)
      )
    `)
    toReviewStmt.bind([userId, bankId, today, today])
    const toReviewData = toReviewStmt.step() ? toReviewStmt.getAsObject() : { count: 0 }
    toReviewStmt.free()
    
    // 已复习单词数量
    const reviewedStmt = db.prepare(`
      SELECT COUNT(*) as count FROM study_records 
      WHERE user_id = ? AND bank_id = ? AND study_date = ? AND study_type = 'review'
    `)
    reviewedStmt.bind([userId, bankId, today])
    const reviewedData = reviewedStmt.step() ? reviewedStmt.getAsObject() : { count: 0 }
    reviewedStmt.free()
    
    // 复习正确率
    const accuracyStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(correct) as correct_count
      FROM study_records 
      WHERE user_id = ? AND bank_id = ? AND study_type = 'review'
    `)
    accuracyStmt.bind([userId, bankId])
    const accuracyData = accuracyStmt.step() ? accuracyStmt.getAsObject() : { total: 0, correct_count: 0 }
    accuracyStmt.free()
    
    const accuracy = accuracyData.total > 0 
      ? Math.round((accuracyData.correct_count / accuracyData.total) * 100) 
      : 0
    
    // 各阶段单词分布
    const stageStmt = db.prepare(`
      SELECT review_stage, COUNT(*) as count 
      FROM study_records 
      WHERE user_id = ? AND bank_id = ? 
      GROUP BY review_stage
      ORDER BY review_stage
    `)
    stageStmt.bind([userId, bankId])
    const stageDistribution = []
    while (stageStmt.step()) {
      stageDistribution.push(stageStmt.getAsObject())
    }
    stageStmt.free()
    
    return {
      toReview: toReviewData.count,
      reviewed: reviewedData.count,
      reviewAccuracy: accuracy,
      stageDistribution
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

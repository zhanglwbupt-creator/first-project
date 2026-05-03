const express = require('express')
const router = express.Router()
const db = require('../database')

// 获取今日待学习单词
router.get('/learn/:bankId', (req, res) => {
  try {
    const userId = req.userId
    const bankId = parseInt(req.params.bankId)
    const limit = parseInt(req.query.limit) || 10
    
    if (isNaN(bankId)) {
      return res.status(400).json({ error: '词库ID无效' })
    }
    
    const words = db.studyRecords.getTodayWordsToLearn(userId, bankId, limit)
    res.json(words)
  } catch (error) {
    console.error('获取待学习单词失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取待复习单词
router.get('/review/:bankId', (req, res) => {
  try {
    const userId = req.userId
    const bankId = parseInt(req.params.bankId)
    const limit = parseInt(req.query.limit) || 20
    
    if (isNaN(bankId)) {
      return res.status(400).json({ error: '词库ID无效' })
    }
    
    const words = db.studyRecords.getWordsToReview(userId, bankId, limit)
    res.json(words)
  } catch (error) {
    console.error('获取待复习单词失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 记录学习状态
router.post('/record', (req, res) => {
  try {
    const userId = req.userId
    const { bankId, wordId, studyType, correct } = req.body
    
    if (!bankId || !wordId) {
      return res.status(400).json({ error: '参数不完整' })
    }
    
    db.studyRecords.record(userId, bankId, wordId, studyType || 'learn', correct)
    
    res.json({ message: '记录成功' })
  } catch (error) {
    console.error('记录学习状态失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取学习统计
router.get('/stats/:bankId', (req, res) => {
  try {
    const userId = req.userId
    const bankId = parseInt(req.params.bankId)
    
    if (isNaN(bankId)) {
      return res.status(400).json({ error: '词库ID无效' })
    }
    
    const stats = db.studyRecords.getStats(userId, bankId)
    res.json(stats)
  } catch (error) {
    console.error('获取学习统计失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取词库学习进度
router.get('/progress/:bankId', (req, res) => {
  try {
    const userId = req.userId
    const bankId = parseInt(req.params.bankId)
    
    if (isNaN(bankId)) {
      return res.status(400).json({ error: '词库ID无效' })
    }
    
    // 获取词库总单词数
    const words = db.words.getByBankId(userId, bankId)
    const totalWords = words.length
    
    // 获取学习统计
    const stats = db.studyRecords.getStats(userId, bankId)
    
    // 计算进度百分比
    const progress = totalWords > 0 ? Math.round((stats.totalLearned / totalWords) * 100) : 0
    
    res.json({
      bankId,
      totalWords,
      learnedWords: stats.totalLearned,
      masteredWords: stats.mastered,
      progress,
      accuracy: stats.accuracy,
      todayLearned: stats.todayLearned
    })
  } catch (error) {
    console.error('获取学习进度失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取所有词库的学习进度
router.get('/progress', (req, res) => {
  try {
    const userId = req.userId
    const wordBanks = db.wordBanks.getAll(userId)
    
    const progressList = wordBanks.map(bank => {
      const stats = db.studyRecords.getStats(userId, bank.id)
      const totalWords = bank.wordCount || 0
      const progress = totalWords > 0 ? Math.round((stats.totalLearned / totalWords) * 100) : 0
      
      return {
        bankId: bank.id,
        bankName: bank.name,
        totalWords,
        learnedWords: stats.totalLearned,
        masteredWords: stats.mastered,
        progress,
        accuracy: stats.accuracy,
        todayLearned: stats.todayLearned
      }
    })
    
    res.json(progressList)
  } catch (error) {
    console.error('获取所有词库进度失败:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router

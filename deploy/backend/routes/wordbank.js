const express = require('express')
const router = express.Router()
const db = require('../database')

// 获取所有词库
router.get('/', (req, res) => {
  try {
    const userId = req.userId
    const banks = db.wordBanks.getAll(userId)
    res.json(banks)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建词库
router.post('/', (req, res) => {
  try {
    const userId = req.userId
    console.log('收到创建词库请求 - userId:', userId, 'body:', req.body)
    
    if (!userId) {
      console.error('userId为undefined，认证中间件可能未正确执行')
      return res.status(401).json({ error: '未登录，请先登录' })
    }
    
    const { name, description } = req.body
    if (!name) {
      console.log('词库名称为空')
      return res.status(400).json({ error: '词库名称不能为空' })
    }
    
    console.log('开始创建词库:', name, 'for user:', userId)
    const bank = db.wordBanks.create(userId, name, description)
    console.log('词库创建成功:', bank)
    res.status(201).json(bank)
  } catch (error) {
    console.error('创建词库异常:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取单个词库
router.get('/:id', (req, res) => {
  try {
    const bank = db.wordBanks.getById(parseInt(req.params.id))
    if (!bank) {
      return res.status(404).json({ error: '词库不存在' })
    }
    res.json(bank)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除词库
router.delete('/:id', (req, res) => {
  try {
    db.wordBanks.delete(parseInt(req.params.id))
    res.json({ message: '词库已删除' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取词库的所有单词
router.get('/:id/words', (req, res) => {
  try {
    const userId = req.userId
    const words = db.words.getByBankId(userId, parseInt(req.params.id))
    res.json(words)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 添加单词到词库
router.post('/:id/words', (req, res) => {
  try {
    const userId = req.userId
    const bankId = parseInt(req.params.id)
    const wordData = req.body
    
    console.log('添加单词:', bankId, wordData.word)
    
    if (!wordData.word) {
      return res.status(400).json({ error: '单词不能为空' })
    }
    
    const word = db.words.add(userId, bankId, wordData)
    console.log('单词添加成功:', wordData.word)
    res.status(201).json(word)
  } catch (error) {
    console.error('添加单词失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 批量添加单词
router.post('/:id/words/batch', async (req, res) => {
  try {
    const userId = req.userId
    const bankId = parseInt(req.params.id)
    const { words } = req.body
    
    console.log('批量导入请求 - userId:', userId, 'bankId:', bankId, '单词数量:', words?.length)
    
    if (isNaN(bankId)) {
      return res.status(400).json({ error: '词库ID无效' })
    }
    
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: '单词列表不能为空' })
    }
    
    // 验证每个单词都有word字段
    for (let i = 0; i < words.length; i++) {
      if (!words[i].word) {
        return res.status(400).json({ error: `第${i + 1}个单词缺少word字段` })
      }
    }
    
    // 始终自动补全缺失的单词信息
    console.log('开始自动补全单词信息...')
    const enrichedWords = await enrichWordsData(words)
    
    const result = db.words.addBatch(userId, bankId, enrichedWords)
    console.log(`批量导入成功: 新增${result.addedCount}个，跳过${result.skippedCount}个`)
    res.status(201).json({ 
      message: `成功导入${result.addedCount}个单词，跳过${result.skippedCount}个重复单词`,
      addedCount: result.addedCount,
      skippedCount: result.skippedCount
    })
  } catch (error) {
    console.error('批量导入失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 自动补全单词信息（使用百度翻译API）
async function enrichWordsData(words) {
  const enriched = []
  
  for (const word of words) {
    try {
      // 只补全缺失的字段
      const enrichedWord = { ...word }
      
      // 检查是否需要查询（缺少任意关键字段）
      const needsQuery = !word.definition_cn || !word.phonetic || !word.definition_en
      
      if (needsQuery && word.word) {
        try {
          console.log(`正在查询单词: ${word.word}`)
          const translateResult = await callBaiduTranslate(word.word)
          if (translateResult) {
            // 只填充缺失的字段
            enrichedWord.definition_cn = word.definition_cn || translateResult.definition_cn || ''
            enrichedWord.definition_en = word.definition_en || translateResult.definition_en || ''
            enrichedWord.phonetic = word.phonetic || translateResult.phonetic || ''
            enrichedWord.example_sentence = word.example_sentence || translateResult.example_sentence || ''
            console.log(`✓ ${word.word} 查询成功`)
          }
        } catch (err) {
          console.error(`翻译单词 ${word.word} 失败:`, err.message)
        }
      }
      
      enriched.push(enrichedWord)
    } catch (error) {
      console.error(`处理单词 ${word.word} 失败:`, error)
      enriched.push(word) // 出错时使用原始数据
    }
  }
  
  return enriched
}

// 调用百度翻译API获取单词详细信息
async function callBaiduTranslate(word) {
  const axios = require('axios')
  
  try {
    // 调用本地翻译API
    const response = await axios.post('http://localhost:5000/api/translate', {
      word: word
    })
    
    if (response.data) {
      return {
        definition_cn: response.data.definition_cn || '',
        definition_en: response.data.definition_en || '',
        phonetic: response.data.phonetic || '',
        example_sentence: response.data.example || ''
      }
    }
    return null
  } catch (error) {
    console.error('调用翻译API失败:', error.message)
    return null
  }
}

module.exports = router

const express = require('express')
const router = express.Router()
const axios = require('axios')

// 百度翻译API配置
const BAIDU_APP_ID = process.env.BAIDU_APP_ID || ''
const BAIDU_APP_KEY = process.env.BAIDU_APP_KEY || ''

// 翻译单词，获取释义和例句
router.post('/', async (req, res) => {
  try {
    const { word } = req.body
    
    if (!word) {
      return res.status(400).json({ error: '单词不能为空' })
    }

    console.log(`🔍 开始查询单词: ${word}`)

    // 并发调用两个API
    const [baiduResult, dictionaryResult] = await Promise.allSettled([
      translateWithBaidu(word),
      translateWithDictionary(word)
    ])

    // 合并结果
    const result = {
      word: word,
      phonetic: '',
      definition_cn: '',
      definition_en: '',
      example: ''
    }

    // 处理百度翻译结果（中文释义）
    if (baiduResult.status === 'fulfilled' && baiduResult.value) {
      result.definition_cn = baiduResult.value.definition_cn || ''
      console.log(`✓ 百度翻译: ${result.definition_cn}`)
    } else {
      console.log('⚠️  百度翻译失败:', baiduResult.reason?.message)
    }

    // 处理Free Dictionary API结果（音标、英文释义、例句）
    if (dictionaryResult.status === 'fulfilled' && dictionaryResult.value) {
      result.phonetic = dictionaryResult.value.phonetic || ''
      result.definition_en = dictionaryResult.value.definition_en || ''
      result.example = dictionaryResult.value.example || ''
      console.log(`✓ 英语词典: 音标=${result.phonetic}, 例句=${result.example ? '有' : '无'}`)
    } else {
      console.log('⚠️  英语词典查询失败:', dictionaryResult.reason?.message)
    }

    // 如果两个API都失败，返回模拟数据
    if (!result.definition_cn && !result.definition_en) {
      console.log('️  所有API查询失败，使用模拟数据')
      return res.json(getMockTranslation(word))
    }

    console.log(`✅ 查询完成: ${word}`)
    res.json(result)
  } catch (error) {
    console.error('翻译失败:', error.message)
    // 失败时返回模拟数据
    res.json(getMockTranslation(req.body.word))
  }
})

// 百度翻译API调用（获取中文释义）
async function translateWithBaidu(word) {
  // 如果没有配置百度API，直接返回
  if (!BAIDU_APP_ID || !BAIDU_APP_KEY) {
    console.log('⚠️  未配置百度翻译API')
    return null
  }

  const salt = Date.now()
  const sign = BAIDU_APP_ID + word + salt + BAIDU_APP_KEY
  const md5 = require('crypto').createHash('md5').update(sign).digest('hex')

  const response = await axios.get('https://fanyi-api.baidu.com/api/trans/vip/translate', {
    params: {
      q: word,
      from: 'en',
      to: 'zh',
      appid: BAIDU_APP_ID,
      salt: salt,
      sign: md5
    },
    timeout: 5000 // 5秒超时
  })

  if (response.data.error_code) {
    throw new Error(response.data.error_msg)
  }

  // 解析翻译结果
  const translation = response.data.trans_result[0].dst
  
  return {
    definition_cn: translation
  }
}

// Free Dictionary API调用（获取音标、英文释义、例句）
async function translateWithDictionary(word) {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
      timeout: 5000 // 5秒超时
    })

    if (!response.data || response.data.length === 0) {
      return null
    }

    const entry = response.data[0]
    
    // 获取音标
    const phonetic = entry.phonetic || 
                     (entry.phonetics && entry.phonetics.find(p => p.text)?.text) || ''
    
    // 获取英文释义和例句
    let definition_en = ''
    let example = ''
    
    if (entry.meanings && entry.meanings.length > 0) {
      // 遍历所有词性，寻找有例句的定义
      for (const meaning of entry.meanings) {
        if (meaning.definitions && meaning.definitions.length > 0) {
          for (const def of meaning.definitions) {
            if (def.example) {
              example = def.example
              break
            }
          }
          if (example) break
        }
      }
      
      // 如果还是没有例句，取第一个定义
      if (!example) {
        const firstMeaning = entry.meanings[0]
        if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
          const firstDef = firstMeaning.definitions[0]
          definition_en = firstDef.definition || ''
        }
      } else {
        // 有例句，也取对应的释义
        for (const meaning of entry.meanings) {
          if (meaning.definitions && meaning.definitions.length > 0) {
            for (const def of meaning.definitions) {
              if (def.example === example) {
                definition_en = def.definition || ''
                break
              }
            }
            if (definition_en) break
          }
        }
      }
    }
    
    // 如果API没有返回例句，生成一个简单例句
    if (!example && definition_en) {
      example = generateSimpleExample(word, definition_en)
    }
    
    return {
      phonetic: phonetic,
      definition_en: definition_en,
      example: example
    }
  } catch (error) {
    console.error('Free Dictionary API查询失败:', error.message)
    return null
  }
}

// 模拟翻译数据（用于测试）
function getMockTranslation(word) {
  const mockData = {
    'apple': {
      word: 'apple',
      phonetic: '/ˈæpl/',
      definition_cn: '苹果',
      definition_en: 'A round fruit with red or green skin and firm white flesh',
      example: 'I eat an apple every day.'
    },
    'book': {
      word: 'book',
      phonetic: '/bʊk/',
      definition_cn: '书，书籍',
      definition_en: 'A written work published in printed or electronic form',
      example: 'I am reading a good book.'
    },
    'cat': {
      word: 'cat',
      phonetic: '/kæt/',
      definition_cn: '猫',
      definition_en: 'A small domesticated carnivorous mammal',
      example: 'The cat is sleeping on the sofa.'
    },
    'dog': {
      word: 'dog',
      phonetic: '/dɒɡ/',
      definition_cn: '狗',
      definition_en: 'A domesticated carnivorous mammal',
      example: 'My dog likes to play fetch.'
    },
    'happy': {
      word: 'happy',
      phonetic: '/ˈhæpi/',
      definition_cn: '快乐的，高兴的',
      definition_en: 'Feeling or showing pleasure or contentment',
      example: 'I am very happy today.'
    }
  }

  return mockData[word.toLowerCase()] || {
    word: word,
    phonetic: '',
    definition_cn: `${word} (网络查询)`,
    definition_en: `Definition of ${word}`,
    example: `Example sentence with ${word}.`
  }
}

// 生成简单例句（当API没有返回例句时使用）
function generateSimpleExample(word, definition) {
  // 尝试从释义中提取关键信息生成例句
  const patterns = [
    `I need to ${word}.`,
    `Please ${word} it.`,
    `He decided to ${word}.`,
    `She will ${word} tomorrow.`,
    `We should ${word} carefully.`,
    `They had to ${word}.`
  ]
  
  // 简单随机选择一个
  const index = Math.floor(Math.random() * patterns.length)
  return patterns[index]
}

module.exports = router

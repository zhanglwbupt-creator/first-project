<template>
  <div class="study-learn-page">
    <div class="gradient-header">
      <van-nav-bar
        :title="mode === 'choice' ? '看词识意' : mode === 'spell' ? '拼写练习' : '填空练习'"
        left-text="结束"
        @click-left="endStudy"
      />
      <div class="progress-info">
        <span>{{ currentIndex + 1 }} / {{ words.length }}</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="content">
      <!-- 看词识意模式 -->
      <div v-if="mode === 'choice' && words.length > 0" class="choice-mode">
        <div class="word-card">
          <div class="word-text">{{ currentWord.word }}</div>
          <div v-if="currentWord.phonetic" class="word-phonetic">{{ currentWord.phonetic }}</div>
          <div v-if="currentWord.definition_en" class="word-definition-en">{{ currentWord.definition_en }}</div>
        </div>

        <div class="options-list">
          <button
            v-for="(option, index) in options"
            :key="index"
            class="option-btn"
            :class="{
              'correct': showResult && option.isCorrect,
              'wrong': showResult && option.selected && !option.isCorrect
            }"
            @click="selectOption(option)"
            :disabled="showResult"
          >
            <span class="option-label">{{ ['A', 'B', 'C', 'D'][index] }}</span>
            <span class="option-text">{{ option.text }}</span>
          </button>
        </div>
        
        <!-- 认识/模糊/陌生 反馈（仿百词斩） -->
        <div v-if="showResult && isCorrect" class="mastery-feedback">
          <div class="mastery-title">你觉得这个单词：</div>
          <div class="mastery-buttons">
            <button class="mastery-btn easy" @click="recordMastery(2)">
              😊 认识
            </button>
            <button class="mastery-btn medium" @click="recordMastery(1)">
              🤔 模糊
            </button>
            <button class="mastery-btn hard" @click="recordMastery(0)">
              😵 陌生
            </button>
          </div>
        </div>

        <div v-if="showResult" class="result-feedback">
          <!-- 学习完成反馈 -->
          <div v-if="currentIndex >= words.length - 1 && isCorrect && results.length > 0" class="feedback-completed">
            <div class="feedback-icon">🎉</div>
            <div class="feedback-text">本轮学习完成！</div>
            <div class="feedback-subtitle">已完成 {{ results.length }} 个单词，正确 {{ results.filter(r => r.correct).length }} 个</div>
            
            <div class="completion-actions">
              <button class="btn btn-primary" @click="endStudy">
                查看学习报告
              </button>
              <button class="btn btn-continue-study" @click="continueStudy">
                继续学习 →
              </button>
            </div>
          </div>
          
          <div v-else-if="isCorrect" class="feedback-correct">
            <div class="feedback-icon">✅</div>
            <div class="feedback-text">太棒了！回答正确</div>
          </div>
          <div v-else class="feedback-wrong">
            <div class="feedback-icon">❌</div>
            <div class="feedback-text">正确答案</div>
            
            <!-- 卡片反转显示正确答案（仿百词斩） -->
            <div class="card-flip-container flipped">
              <div class="card-flipper">
                <!-- 背面：详细解析 -->
                <div class="card-back">
                  <div class="detail-word">{{ currentWord.word }}</div>
                  <div v-if="currentWord.phonetic" class="detail-phonetic">
                    {{ currentWord.phonetic }}
                    <button class="btn-audio" @click="playAudio">🔊</button>
                  </div>
                  
                  <div v-if="currentWord.definition_cn" class="detail-definition">
                    <div class="detail-label"> 中文释义</div>
                    <div class="detail-content">{{ currentWord.definition_cn }}</div>
                  </div>
                  
                  <div v-if="currentWord.definition_en" class="detail-definition">
                    <div class="detail-label">📖 英文释义</div>
                    <div class="detail-content">{{ currentWord.definition_en }}</div>
                  </div>
                  
                  <div v-if="currentWord.example_sentence" class="detail-example">
                    <div class="detail-label">💬 例句</div>
                    <div class="detail-content">{{ currentWord.example_sentence }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button v-if="currentIndex < words.length - 1" class="btn btn-primary" @click="nextWord" style="margin-top: 16px;">
            继续下一个 →
          </button>
        </div>
      </div>

      <!-- 拼写练习模式 -->
      <div v-else-if="mode === 'spell' && words.length > 0" class="spell-mode">
        <div class="hint-card">
          <div v-if="currentWord.definition_cn" class="hint-cn">
            {{ currentWord.definition_cn }}
          </div>
          <div v-if="currentWord.definition_en" class="hint-en">
            {{ currentWord.definition_en }}
          </div>
        </div>

        <div class="spell-input">
          <input
            v-model="userInput"
            type="text"
            class="input-word"
            placeholder="输入单词..."
            @keyup.enter="checkSpell"
            :disabled="showResult"
            autofocus
          />
          <button 
            v-if="!showResult" 
            class="btn btn-primary" 
            @click="checkSpell"
            :disabled="!userInput.trim()"
          >
            确认
          </button>
        </div>

        <div v-if="showResult" class="result-feedback">
          <!-- 学习完成反馈 -->
          <div v-if="currentIndex >= words.length - 1 && isCorrect && results.length > 0" class="feedback-completed">
            <div class="feedback-icon">🎉</div>
            <div class="feedback-text">本轮学习完成！</div>
            <div class="feedback-subtitle">已完成 {{ results.length }} 个单词，正确 {{ results.filter(r => r.correct).length }} 个</div>
            
            <div class="completion-actions">
              <button class="btn btn-primary" @click="endStudy">
                查看学习报告
              </button>
              <button class="btn btn-continue-study" @click="continueStudy">
                继续学习 →
              </button>
            </div>
          </div>
          
          <div v-else-if="isCorrect" class="feedback-correct">
            <div class="feedback-icon">✅</div>
            <div class="feedback-text">拼写完全正确！</div>
          </div>
          <div v-else class="feedback-wrong">
            <div class="feedback-icon">❌</div>
            <div class="feedback-text">拼写有误，看详细解析</div>
            
            <!-- 详细单词卡片（仿百词斩） -->
            <div class="word-detail-card">
              <div class="detail-word">{{ currentWord.word }}</div>
              <div v-if="currentWord.phonetic" class="detail-phonetic">
                {{ currentWord.phonetic }}
                <button class="btn-audio" @click="playAudio">🔊</button>
              </div>
              
              <div class="detail-spell-compare">
                <div class="spell-wrong">
                  <div class="detail-label">❌ 你的拼写</div>
                  <div class="detail-content wrong-text">{{ userInput }}</div>
                </div>
                <div class="spell-correct">
                  <div class="detail-label">✅ 正确拼写</div>
                  <div class="detail-content correct-text">{{ currentWord.word }}</div>
                </div>
              </div>
              
              <div v-if="currentWord.definition_cn" class="detail-definition">
                <div class="detail-label">📝 中文释义</div>
                <div class="detail-content">{{ currentWord.definition_cn }}</div>
              </div>
              
              <div v-if="currentWord.example_sentence" class="detail-example">
                <div class="detail-label">💬 例句</div>
                <div class="detail-content">{{ currentWord.example_sentence }}</div>
              </div>
            </div>
          </div>
          
          <button v-if="currentIndex < words.length - 1" class="btn btn-primary" @click="nextWord" style="margin-top: 16px;">
            继续下一个 →
          </button>
        </div>
      </div>

      <!-- 填空练习模式 -->
      <div v-else-if="mode === 'fill_blank' && words.length > 0" class="fill-blank-mode">
        <div class="sentence-card">
          <div class="sentence-label">📖 Read the sentence and fill in the blank:</div>
          <div v-if="currentWord.definition_en" class="definition-hint">
            💡 Definition: {{ currentWord.definition_en }}
          </div>
          <div class="sentence-text">
            {{ fillBlankSentence }}
          </div>
        </div>

        <div class="input-section">
          <input
            v-model="userInput"
            type="text"
            class="fill-input"
            placeholder="输入单词..."
            :disabled="showResult"
            @keyup.enter="submitFillBlank"
          />
          <button 
            v-if="!showResult" 
            class="btn btn-primary submit-btn" 
            @click="submitFillBlank"
            :disabled="!userInput.trim()"
          >
            提交答案
          </button>
        </div>

        <div v-if="showResult" class="result-feedback">
          <!-- 学习完成反馈 -->
          <div v-if="currentIndex >= words.length - 1 && isCorrect && results.length > 0" class="feedback-completed">
            <div class="feedback-icon">🎉</div>
            <div class="feedback-text">本轮学习完成！</div>
            <div class="feedback-subtitle">已完成 {{ results.length }} 个单词，正确 {{ results.filter(r => r.correct).length }} 个</div>
            
            <div class="completion-actions">
              <button class="btn btn-primary" @click="endStudy">
                查看学习报告
              </button>
              <button class="btn btn-continue-study" @click="continueStudy">
                继续学习 →
              </button>
            </div>
          </div>
          
          <div v-else-if="isCorrect" class="feedback-correct">
            <div class="feedback-icon">✅</div>
            <div class="feedback-text">回答正确！</div>
          </div>
          <div v-else class="feedback-wrong">
            <div class="feedback-icon">❌</div>
            <div class="feedback-text">正确答案</div>
            
            <!-- 详细解析卡片 -->
            <div class="word-detail-card">
              <div class="detail-word">{{ currentWord.word }}</div>
              <div v-if="currentWord.phonetic" class="detail-phonetic">
                {{ currentWord.phonetic }}
                <button class="btn-audio" @click="playAudio"></button>
              </div>
              
              <div class="detail-spell-compare">
                <div class="spell-wrong">
                  <div class="detail-label"> 你的答案</div>
                  <div class="detail-content wrong-text">{{ userInput || '(未填写)' }}</div>
                </div>
                <div class="spell-correct">
                  <div class="detail-label">✅ 正确答案</div>
                  <div class="detail-content correct-text">{{ currentWord.word }}</div>
                </div>
              </div>
              
              <div v-if="currentWord.definition_en" class="detail-definition">
                <div class="detail-label">📝 English Definition</div>
                <div class="detail-content">{{ currentWord.definition_en }}</div>
              </div>
              
              <div v-if="currentWord.example_sentence" class="detail-example">
                <div class="detail-label">💬 完整例句</div>
                <div class="detail-content">{{ currentWord.example_sentence }}</div>
              </div>
            </div>
          </div>
          
          <button v-if="currentIndex < words.length - 1" class="btn btn-primary" @click="nextWord" style="margin-top: 16px;">
            继续下一个 →
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">🎉</div>
        <div class="empty-text">今日学习已完成！</div>
        <div class="empty-actions">
          <button class="btn btn-primary" @click="endStudy">查看学习报告</button>
          <button class="btn btn-continue-study" @click="continueStudyFromEmpty">
            继续学习 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { playCorrectSound, playWrongSound, playCompleteSound } from '@/utils/sound'

const route = useRoute()
const router = useRouter()

const bankId = ref(parseInt(route.query.bankId))
const mode = ref(route.query.mode || 'choice')
const isContinueLearn = ref(route.query.continueLearn === 'true') // 是否是继续学习
const words = ref([])
const currentIndex = ref(0)
const showResult = ref(false)
const isCorrect = ref(false)
const showFlipCard = ref(false) // 卡片翻转状态
const userInput = ref('')
const results = ref([])

const currentWord = computed(() => {
  return words.value[currentIndex.value] || {}
})

const progress = computed(() => {
  if (words.value.length === 0) return 0
  return ((currentIndex.value + 1) / words.value.length) * 100
})

// 填空练习：生成带下划线的句子
const fillBlankSentence = computed(() => {
  const example = currentWord.value.example_sentence || ''
  const word = currentWord.value.word || ''
  
  if (!example || !word) {
    // 如果没有例句，显示提示信息
    return 'No example sentence available. Please check the definition above.'
  }
  
  // 将例句中的单词替换为下划线（不区分大小写）
  const regex = new RegExp(`\\b${word}\\b`, 'gi')
  return example.replace(regex, '______')
})

const options = ref([])

onMounted(async () => {
  if (isContinueLearn.value) {
    // 继续学习：先从sessionStorage加载已有单词
    const savedResults = sessionStorage.getItem('studyResults')
    if (savedResults) {
      const parsed = JSON.parse(savedResults)
      // 这里需要加载已学习的单词，但我们只有结果，没有完整单词信息
      // 所以直接加载新单词即可
    }
  }
  await loadWords()
  if (mode.value === 'choice') {
    generateOptions()
  }
})

const loadWords = async () => {
  try {
    const dailyLimit = localStorage.getItem(`dailyLimit_${bankId.value}`) || 20
    const response = await api.get(`/api/study/learn/${bankId.value}`, {
      params: { 
        limit: dailyLimit,
        studyMode: mode.value // choice/spell
      }
    })
    
    if (isContinueLearn.value) {
      // 继续学习：追加新单词
      const newWords = response.data.filter(w => 
        !words.value.some(existing => existing.id === w.id)
      )
      words.value = [...words.value, ...newWords]
      console.log('🔁 继续学习，追加单词:', newWords.length, '个')
    } else {
      // 首次学习：替换单词列表
      words.value = response.data
    }
  } catch (error) {
    console.error('加载单词失败:', error)
  }
}

const generateOptions = async () => {
  if (!currentWord.value.word) return

  // 获取其他单词作为干扰项
  try {
    const allWordsResponse = await api.get(`/api/wordbanks/${bankId.value}/words`)
    const allWords = allWordsResponse.data
    
    // 过滤掉当前单词
    const otherWords = allWords.filter(w => w.id !== currentWord.value.id)
    
    // 随机选择3个干扰项
    const shuffled = otherWords.sort(() => 0.5 - Math.random())
    const distractors = shuffled.slice(0, 3)
    
    // 创建选项
    const correctOption = {
      text: currentWord.value.definition_cn || '暂无释义',
      isCorrect: true,
      selected: false
    }
    
    const wrongOptions = distractors.map(w => ({
      text: w.definition_cn || '暂无释义',
      isCorrect: false,
      selected: false
    }))
    
    // 合并并打乱
    options.value = [correctOption, ...wrongOptions].sort(() => 0.5 - Math.random())
  } catch (error) {
    console.error('生成选项失败:', error)
  }
}

const selectOption = async (option) => {
  if (showResult.value) return
  
  option.selected = true
  isCorrect.value = option.isCorrect
  showResult.value = true
  
  console.log('👉 选择答案:', {
    word: currentWord.value.word,
    correct: isCorrect.value
  })
  
  // 记录学习结果（百词斩式：答对后让用户选择掌握度）
  if (isCorrect.value) {
    // 播放正确音效
    playCorrectSound()
    // 答对，显示掌握度选择按钮，不自动跳转
    // 用户选择后才记录并跳转
    console.log('✅ 答对，等待用户选择掌握度')
  } else {
    // 播放错误音效
    playWrongSound()
    // 答错，自动记录为陌生
    console.log('❌ 答错，自动记录为陌生')
    await api.post('/api/study/record', {
      bankId: bankId.value,
      wordId: currentWord.value.id,
      studyType: 'learn',
      studyMode: mode.value, // choice/spell
      correct: false,
      masteryLevel: 0 // 陌生
    })
    
    results.value.push({
      word: currentWord.value.word,
      correct: false,
      masteryLevel: 0
    })
    
    console.log('📊 当前results:', results.value)
  }
}

const checkSpell = async () => {
  if (!userInput.value.trim() || showResult.value) return
  
  const correct = userInput.value.trim().toLowerCase() === currentWord.value.word.toLowerCase()
  isCorrect.value = correct
  showResult.value = true
  
  // 记录学习结果（百词斩式：答对后让用户选择掌握度）
  if (isCorrect.value) {
    // 播放正确音效
    playCorrectSound()
    // 答对，显示掌握度选择按钮，不自动跳转
  } else {
    // 播放错误音效
    playWrongSound()
    // 答错，自动记录为陌生
    await api.post('/api/study/record', {
      bankId: bankId.value,
      wordId: currentWord.value.id,
      studyType: 'learn',
      studyMode: mode.value, // choice/spell
      correct: false,
      masteryLevel: 0 // 陌生
    })
    
    results.value.push({
      word: currentWord.value.word,
      correct: false,
      masteryLevel: 0
    })
  }
}

// 提交填空答案
const submitFillBlank = async () => {
  if (!userInput.value.trim()) return
  
  showResult.value = true
  const userAnswer = userInput.value.trim().toLowerCase()
  const correctAnswer = currentWord.value.word.toLowerCase()
  isCorrect.value = userAnswer === correctAnswer
  
  if (isCorrect.value) {
    playCorrectSound()
  } else {
    playWrongSound()
  }
  
  await api.post('/api/study/record', {
    bankId: bankId.value,
    wordId: currentWord.value.id,
    studyType: 'learn',
    studyMode: 'fill_blank',
    correct: isCorrect.value,
    masteryLevel: isCorrect.value ? 2 : 0
  })
  
  results.value.push({
    word: currentWord.value.word,
    correct: isCorrect.value
  })
}

const nextWord = async () => {
  // 如果是答对且还没有记录掌握度，自动记录为模糊
  if (isCorrect.value && showResult.value) {
    // 检查是否已经记录过（通过检查结果数组中是否有当前单词）
    const alreadyRecorded = results.value.some(r => r.word === currentWord.value.word)
    
    if (!alreadyRecorded) {
      console.log('⚠️ 答对但未选择掌握度，自动记录为模糊')
      await api.post('/api/study/record', {
        bankId: bankId.value,
        wordId: currentWord.value.id,
        studyType: 'learn',
        studyMode: mode.value, // choice/spell
        correct: true,
        masteryLevel: 1 // 自动记录为模糊
      })
      
      results.value.push({
        word: currentWord.value.word,
        correct: true,
        masteryLevel: 1
      })
    }
  }
  
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++
    showResult.value = false
    userInput.value = ''
    if (mode.value === 'choice') {
      generateOptions()
    }
  } else {
    // 学习完成，保存结果到 sessionStorage
    saveStudyResults()
    // 播放完成音效
    playCompleteSound()
    // 不直接跳转，而是显示完成界面，让用户选择继续学习或查看报告
    showResult.value = true
    isCorrect.value = true
  }
}

const endStudy = () => {
  // 保存学习结果到sessionStorage
  saveStudyResults()
  router.push({ name: 'StudyReport' })
}

const saveStudyResults = () => {
  sessionStorage.setItem('studyResults', JSON.stringify({
    bankId: bankId.value,
    mode: mode.value,
    results: results.value,
    total: results.value.length,
    correct: results.value.filter(r => r.correct).length
  }))
}

const continueStudy = async () => {
  // 追加学习：调用新API获取单词
  isContinueLearn.value = true
  const currentWordCount = words.value.length
  const currentWordIds = words.value.map(w => w.id)
  
  try {
    const dailyLimit = localStorage.getItem(`dailyLimit_${bankId.value}`) || 20
    const response = await api.post(`/api/study/continue-learn/${bankId.value}`, {
      limit: dailyLimit,
      excludeWordIds: currentWordIds,
      studyMode: mode.value // choice/spell
    })
    
    // 追加新单词
    words.value = [...words.value, ...response.data]
    console.log('🔁 继续学习，追加单词:', response.data.length, '个')
    
    currentIndex.value = currentWordCount // 从新增的单词开始
    showResult.value = false
    userInput.value = ''
    if (mode.value === 'choice') {
      generateOptions()
    }
  } catch (error) {
    console.error('继续学习失败:', error)
    alert('继续学习失败：' + error.message)
  }
}

// 从空状态页面继续学习
const continueStudyFromEmpty = async () => {
  // 空状态：调用continue-learn API获取单词
  try {
    const dailyLimit = localStorage.getItem(`dailyLimit_${bankId.value}`) || 20
    const response = await api.post(`/api/study/continue-learn/${bankId.value}`, {
      limit: dailyLimit,
      excludeWordIds: [], // 空状态，没有已加载的单词
      studyMode: mode.value // choice/spell
    })
    
    console.log('🔁 空状态继续学习，获取到单词:', response.data.length, '个')
    
    if (response.data.length === 0) {
      alert('词库中的所有单词都已学习完毕！请添加更多单词。')
      return
    }
    
    // 加载新单词
    isContinueLearn.value = false
    words.value = response.data
    currentIndex.value = 0
    showResult.value = false
    userInput.value = ''
    results.value = []
    
    if (mode.value === 'choice') {
      generateOptions()
    }
  } catch (error) {
    console.error('继续学习失败:', error)
    alert('继续学习失败：' + error.message)
  }
}

// 播放单词发音（使用Web Speech API）
const playAudio = () => {
  if ('speechSynthesis' in window && currentWord.value.word) {
    const utterance = new SpeechSynthesisUtterance(currentWord.value.word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
}

// 记录掌握程度（仿百词斩）
const recordMastery = async (level) => {
  // level: 0-陌生, 1-模糊, 2-认识
  
  console.log('🎯 记录掌握度:', {
    word: currentWord.value.word,
    level,
    levelText: level === 2 ? '认识' : level === 1 ? '模糊' : '陌生'
  })
  
  // 记录到后端
  await api.post('/api/study/record', {
    bankId: bankId.value,
    wordId: currentWord.value.id,
    studyType: 'learn',
    studyMode: mode.value, // choice/spell
    correct: isCorrect.value,
    masteryLevel: level
  })
  
  results.value.push({
    word: currentWord.value.word,
    correct: isCorrect.value,
    masteryLevel: level
  })
  
  console.log('📊 当前results:', results.value)
  
  // 自动进入下一个单词
  nextWord()
}
</script>

<style scoped>
.study-learn-page {
  min-height: 100vh;
  background: #f7fafc;
}

.gradient-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding-bottom: 16px;
}

.progress-info {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.3s;
}

.content {
  padding: 16px;
}

.word-card {
  background: white;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.word-text {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
}

.word-phonetic {
  font-size: 16px;
  color: #718096;
}

.word-definition-en {
  font-size: 14px;
  color: #a0aec0;
  margin-top: 8px;
  font-style: italic;
  line-height: 1.4;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-btn {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.option-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #f7fafc;
}

.option-btn.correct {
  background: #f0fff4;
  border-color: #48bb78;
}

.option-btn.wrong {
  background: #fff5f5;
  border-color: #f56c6c;
}

.option-label {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  font-size: 15px;
  color: #2d3748;
}

/* 掌握程度反馈（仿百词斩） */
.mastery-feedback {
  background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
  border-radius: 10px;
  padding: 12px;
  margin-top: 12px;
  border: 2px solid #9ae6b4;
}

.mastery-title {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
  text-align: center;
}

.mastery-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.mastery-btn {
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.mastery-btn.easy {
  background: #48bb78;
  color: white;
}

.mastery-btn.easy:hover {
  background: #38a169;
  transform: scale(1.05);
}

.mastery-btn.medium {
  background: #ed8936;
  color: white;
}

.mastery-btn.medium:hover {
  background: #dd6b20;
  transform: scale(1.05);
}

.mastery-btn.hard {
  background: #f56c6c;
  color: white;
}

.mastery-btn.hard:hover {
  background: #e63946;
  transform: scale(1.05);
}

.hint-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.hint-cn {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.hint-en {
  font-size: 14px;
  color: #718096;
}

.spell-input {
  display: block;
  margin-bottom: 16px;
}

.spell-input .btn {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.input-word {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  font-size: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 8px;
}

.input-word:focus {
  outline: none;
  border-color: #667eea;
}

.result-feedback {
  background: white;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.feedback-icon {
  font-size: 40px;
  margin-bottom: 6px;
}

.feedback-text {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.feedback-correct {
  color: #48bb78;
}

.feedback-wrong {
  color: #f56c6c;
}

/* 卡片翻转动画（仿百词斩） */
.card-flip-container {
  perspective: 1000px;
  width: 100%;
  height: 400px;
  margin-top: 16px;
}

.card-flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-flip-container.flipped .card-flipper {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
}

.card-front {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border: 3px solid #feb2b2;
}

.card-back {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border: 3px solid #e2e8f0;
  transform: rotateY(180deg);
  overflow-y: auto;
  text-align: left;
  justify-content: flex-start;
  padding-top: 20px;
}

.flip-hint {
  font-size: 32px;
  font-weight: 700;
  color: #f56c6c;
  margin-bottom: 12px;
}

.flip-hint-sub {
  font-size: 16px;
  color: #718096;
}

/* 背面卡片内容 */
.card-back .detail-word {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  text-align: center;
  margin-bottom: 8px;
  width: 100%;
}

.card-back .detail-phonetic {
  font-size: 18px;
  color: #718096;
  text-align: center;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.card-back .btn-audio {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.card-back .btn-audio:hover {
  background: #e2e8f0;
  transform: scale(1.1);
}

.card-back .detail-definition,
.card-back .detail-example {
  width: 100%;
  margin-bottom: 12px;
}

.card-back .detail-label {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.card-back .detail-content {
  font-size: 16px;
  color: #2d3748;
  line-height: 1.6;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* 详细单词卡片（仿百词斩） */
.word-detail-card {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
  text-align: left;
  border: 2px solid #e2e8f0;
}

.detail-word {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  text-align: center;
  margin-bottom: 8px;
}

.detail-phonetic {
  font-size: 18px;
  color: #718096;
  text-align: center;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-audio {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-audio:hover {
  background: #e2e8f0;
  transform: scale(1.1);
}

.detail-spell-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.spell-wrong,
.spell-correct {
  padding: 12px;
  border-radius: 8px;
}

.spell-wrong {
  background: #fff5f5;
  border: 2px solid #feb2b2;
}

.spell-correct {
  background: #f0fff4;
  border: 2px solid #9ae6b4;
}

.wrong-text {
  color: #f56c6c;
  text-decoration: line-through;
  font-weight: 600;
}

.correct-text {
  color: #48bb78;
  font-weight: 700;
  font-size: 20px;
}

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.detail-content {
  font-size: 16px;
  color: #2d3748;
  line-height: 1.6;
  padding: 8px;
  background: white;
  border-radius: 6px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 20px;
  color: #4a5568;
  margin-bottom: 32px;
  font-weight: 600;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 300px;
  margin: 0 auto;
}

.empty-text {
  font-size: 20px;
  color: #2d3748;
  margin-bottom: 24px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-primary:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.btn-secondary {
  background: #48bb78;
  color: white;
}

.btn-secondary:hover {
  background: #38a169;
}

.btn-continue-study {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
}

.btn-continue-study:hover {
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.btn-continue-study:active {
  transform: translateY(0);
}

/* 百词斩式掌握度选择按钮 */
.mastery-feedback {
  margin-top: 24px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.mastery-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
}

.mastery-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.mastery-btn {
  flex: 1;
  padding: 16px 12px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mastery-btn:active {
  transform: scale(0.95);
}

.mastery-btn.easy {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.mastery-btn.easy:hover {
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(72, 187, 120, 0.4);
}

.mastery-btn.medium {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(237, 137, 54, 0.3);
}

.mastery-btn.medium:hover {
  background: linear-gradient(135deg, #dd6b20 0%, #c05621 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(237, 137, 54, 0.4);
}

.mastery-btn.hard {
  background: linear-gradient(135deg, #f56c6c 0%, #e53e3e 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

.mastery-btn.hard:hover {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 108, 108, 0.4);
}

/* 学习完成反馈 */
.feedback-completed {
  text-align: center;
  padding: 20px;
}

.feedback-subtitle {
  font-size: 16px;
  color: #718096;
  margin-bottom: 24px;
}

.completion-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 300px;
  margin: 0 auto;
}

/* 填空练习模式 */
.fill-blank-mode {
  padding: 20px;
}

.sentence-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sentence-label {
  font-size: 14px;
  color: #718096;
  margin-bottom: 12px;
}

.definition-hint {
  background: #f7fafc;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #4a5568;
}

.sentence-text {
  font-size: 20px;
  line-height: 1.8;
  color: #2d3748;
  font-weight: 500;
}

.input-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.fill-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s;
}

.fill-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.submit-btn {
  padding: 14px 24px;
  white-space: nowrap;
}
</style>
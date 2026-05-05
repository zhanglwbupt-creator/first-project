<template>
  <div class="study-review-page">
    <div class="gradient-header">
      <van-nav-bar
        title="复习单词"
        left-text="结束"
        @click-left="endReview"
      />
      <div class="progress-info">
        <span>{{ currentIndex + 1 }} / {{ words.length }}</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="content">
      <div v-if="words.length > 0" class="review-mode">
        <div class="word-card">
          <!-- 看词识意模式：显示单词 -->
          <template v-if="currentWord.study_mode === 'choice'">
            <div class="word-text">{{ currentWord.word }}</div>
            <div v-if="currentWord.phonetic" class="word-phonetic">{{ currentWord.phonetic }}</div>
            <div v-if="currentWord.definition_en" class="word-definition-en">{{ currentWord.definition_en }}</div>
          </template>
          <!-- 拼写复习模式：不显示单词 -->
          <template v-else>
            <div class="review-mode-tag spell">✍️ 拼写复习</div>
          </template>
          <div class="review-stage">第 {{ currentWord.review_stage || 0 }} 次复习</div>
        </div>

        <!-- 看词识意模式 -->
        <div v-if="currentWord.study_mode === 'choice'" class="options-list">
          <div class="review-mode-tag choice"> 识意复习</div>
          <button
            v-for="(option, index) in options"
            :key="index"
            class="option-btn"
            :class="{
              'correct': showResult && option.isCorrect,
              'wrong': showResult && option.selected && !option.isCorrect
            }"
            @click="selectOption(option)"
            :disabled="showResult && isCorrect"
          >
            <span class="option-label">{{ ['A', 'B', 'C', 'D'][index] }}</span>
            <span class="option-text">{{ option.text }}</span>
          </button>
        </div>

        <!-- 拼写练习模式 -->
        <div v-if="currentWord.study_mode === 'spell'" class="spell-section">
          <div class="spell-hint">
            <div v-if="currentWord.definition_cn">{{ currentWord.definition_cn }}</div>
            <div v-if="currentWord.definition_en" class="spell-hint-en">{{ currentWord.definition_en }}</div>
          </div>
          <div class="spell-input-wrapper">
            <input
              v-model="userInput"
              type="text"
              class="spell-input"
              placeholder="输入单词拼写..."
              @keyup.enter="checkSpell"
              :disabled="showResult"
            />
            <button class="spell-btn" @click="checkSpell" :disabled="showResult || !userInput.trim()">
              确认
            </button>
          </div>
          <div v-if="showResult && !isCorrect" class="spell-answer">
            正确答案：<strong>{{ currentWord.word }}</strong>
          </div>
        </div>

        <!-- 百词斩式掌握度选择（答对后显示） -->
        <div v-if="showResult && isCorrect" class="mastery-feedback">
          <div class="mastery-title"> 你掌握这个单词了吗？</div>
          <div class="mastery-buttons">
            <button class="mastery-btn mastery-unknown" @click="recordMastery(0)">
              😵 陌生
            </button>
            <button class="mastery-btn mastery-fuzzy" @click="recordMastery(1)">
              🤔 模糊
            </button>
            <button class="mastery-btn mastery-known" @click="recordMastery(2)">
              😊 认识
            </button>
          </div>
        </div>

        <div v-if="showResult" class="result-feedback">
          <div v-if="isCorrect" class="feedback-correct">
            <div class="feedback-icon">✅</div>
            <div class="feedback-text">记住了！继续加油</div>
          </div>
          <div v-else class="feedback-wrong">
            <div class="feedback-icon">❌</div>
            <div class="feedback-text">忘记了，看详细解析加强记忆</div>
            
            <!-- 详细单词卡片（仿百词斩） -->
            <div class="word-detail-card">
              <div class="detail-word">{{ currentWord.word }}</div>
              <div v-if="currentWord.phonetic" class="detail-phonetic">
                {{ currentWord.phonetic }}
                <button class="btn-audio" @click="playAudio">🔊</button>
              </div>
              
              <div v-if="currentWord.definition_cn" class="detail-definition">
                <div class="detail-label">📝 中文释义</div>
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
              
              <div class="review-tip">
                💡 这个单词你已经在复习第 {{ currentWord.review_stage || 0 }} 阶段了，加油！
              </div>
            </div>
          </div>
          
          <button class="btn btn-primary" @click="nextWord" style="margin-top: 16px;">
            {{ currentIndex < words.length - 1 ? '继续下一个 →' : '查看报告' }}
          </button>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🎉</div>
        <div class="empty-text">没有需要复习的单词！</div>
        <button class="btn btn-primary" @click="endReview">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()

const bankId = ref(parseInt(new URLSearchParams(window.location.search).get('bankId')))
const words = ref([])
const currentIndex = ref(0)
const showResult = ref(false)
const isCorrect = ref(false)
const results = ref([])
const options = ref([])
const userInput = ref('') // 拼写输入

const currentWord = computed(() => {
  return words.value[currentIndex.value] || {}
})

const progress = computed(() => {
  if (words.value.length === 0) return 0
  return ((currentIndex.value + 1) / words.value.length) * 100
})

onMounted(async () => {
  await loadWords()
  generateOptions()
})

const loadWords = async () => {
  try {
    const response = await api.get(`/api/study/review/${bankId.value}`, {
      params: { limit: 20 }
    })
    words.value = response.data
  } catch (error) {
    console.error('加载复习单词失败:', error)
  }
}

const generateOptions = async () => {
  if (!currentWord.value.word) return

  try {
    const allWordsResponse = await api.get(`/api/wordbanks/${bankId.value}/words`)
    const allWords = allWordsResponse.data
    
    const otherWords = allWords.filter(w => w.id !== currentWord.value.id)
    const shuffled = otherWords.sort(() => 0.5 - Math.random())
    const distractors = shuffled.slice(0, 3)
    
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
  
  // 百词斩式：答对后让用户选择掌握度
  if (isCorrect.value) {
    // 答对，显示掌握度选择按钮，不自动跳转
  } else {
    // 答错，自动记录为陌生
    await api.post('/api/study/record', {
      bankId: bankId.value,
      wordId: currentWord.value.id,
      studyType: 'review',
      studyMode: currentWord.value.study_mode || 'choice',
      correct: false,
      masteryLevel: 0 // 陌生
    })
    
    results.value.push({
      word: currentWord.value.word,
      correct: false
    })
  }
}

// 拼写检查
const checkSpell = async () => {
  if (!userInput.value.trim() || showResult.value) return
  
  const correct = userInput.value.trim().toLowerCase() === currentWord.value.word.toLowerCase()
  isCorrect.value = correct
  showResult.value = true
  
  if (isCorrect.value) {
    // 答对，显示掌握度选择按钮
  } else {
    // 答错，自动记录为陌生
    await api.post('/api/study/record', {
      bankId: bankId.value,
      wordId: currentWord.value.id,
      studyType: 'review',
      studyMode: currentWord.value.study_mode || 'spell',
      correct: false,
      masteryLevel: 0 // 陌生
    })
    
    results.value.push({
      word: currentWord.value.word,
      correct: false
    })
  }
}

// 记录掌握程度（仿百词斩）
const recordMastery = async (level) => {
  // level: 0-陌生, 1-模糊, 2-认识
  
  await api.post('/api/study/record', {
    bankId: bankId.value,
    wordId: currentWord.value.id,
    studyType: 'review',
    studyMode: currentWord.value.study_mode || 'choice',
    correct: isCorrect.value,
    masteryLevel: level
  })
  
  results.value.push({
    word: currentWord.value.word,
    correct: isCorrect.value,
    masteryLevel: level
  })
  
  // 自动进入下一个单词
  nextWord()
}

const nextWord = async () => {
  // 如果是答对且还没有记录掌握度，自动记录为模糊
  if (isCorrect.value && showResult.value) {
    // 检查是否已经记录过（通过检查结果数组中是否有当前单词）
    const alreadyRecorded = results.value.some(r => r.word === currentWord.value.word)
    
    if (!alreadyRecorded) {
      console.log('⚠️ 复习答对但未选择掌握度，自动记录为模糊')
      await api.post('/api/study/record', {
        bankId: bankId.value,
        wordId: currentWord.value.id,
        studyType: 'review',
        studyMode: currentWord.value.study_mode || 'choice',
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
    isCorrect.value = false
    userInput.value = '' // 清空拼写输入
    generateOptions()
  } else {
    endReview()
  }
}

const endReview = () => {
  sessionStorage.setItem('studyResults', JSON.stringify({
    bankId: bankId.value,
    mode: 'review',
    results: results.value,
    total: results.value.length,
    correct: results.value.filter(r => r.correct).length
  }))
  
  router.push({ name: 'StudyReport' })
}

// 播放单词发音
const playAudio = () => {
  if ('speechSynthesis' in window && currentWord.value.word) {
    const utterance = new SpeechSynthesisUtterance(currentWord.value.word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
}
</script>

<style scoped>
.study-review-page {
  min-height: 100vh;
  background: #f7fafc;
}

.gradient-header {
  background: linear-gradient(135deg, #f56c6c 0%, #e63946 100%);
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
  margin-bottom: 6px;
}

.word-definition-en {
  font-size: 14px;
  color: #a0aec0;
  margin-bottom: 6px;
  font-style: italic;
  line-height: 1.4;
}

.review-stage {
  font-size: 13px;
  color: #f56c6c;
  font-weight: 600;
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
  border-color: #f56c6c;
  background: #fff5f5;
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
  background: #f56c6c;
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

/* 详细单词卡片（仿百词斩） */
.word-detail-card {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
  text-align: left;
  border: 2px solid #feb2b2;
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
  background: #ffe5e5;
  transform: scale(1.1);
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
  margin-bottom: 12px;
}

.review-tip {
  background: #fffaf0;
  border: 2px solid #fbd38d;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  font-size: 14px;
  color: #d69e2e;
  font-weight: 600;
  margin-top: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
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
  background: #f56c6c;
  color: white;
}

.btn-primary:hover {
  background: #e63946;
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

.mastery-btn.mastery-known {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.mastery-btn.mastery-known:hover {
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(72, 187, 120, 0.4);
}

.mastery-btn.mastery-fuzzy {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(237, 137, 54, 0.3);
}

.mastery-btn.mastery-fuzzy:hover {
  background: linear-gradient(135deg, #dd6b20 0%, #c05621 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(237, 137, 54, 0.4);
}

.mastery-btn.mastery-unknown {
  background: linear-gradient(135deg, #f56c6c 0%, #e53e3e 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

.mastery-btn.mastery-unknown:hover {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 108, 108, 0.4);
}

/* 复习模式标签 */
.review-mode-tag {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.review-mode-tag.choice {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-top: 16px;
}

.review-mode-tag.spell {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-size: 18px;
  padding: 8px 20px;
}

/* 拼写练习区域 */
.spell-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-top: 16px;
}

.spell-hint {
  font-size: 16px;
  color: #4a5568;
  margin-bottom: 12px;
  text-align: center;
  font-weight: 500;
  line-height: 1.5;
}

.spell-hint-en {
  font-size: 14px;
  color: #718096;
  margin-top: 6px;
  font-weight: 400;
  font-style: italic;
}

.spell-input-wrapper {
  display: block;
  width: 100%;
}

.spell-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 14px;
  font-size: 18px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s;
  margin-bottom: 12px;
}

.spell-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.spell-input:disabled {
  background: #f7fafc;
  cursor: not-allowed;
}

.spell-btn {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.spell-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.spell-btn:active:not(:disabled) {
  transform: translateY(0);
}

.spell-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.spell-answer {
  margin-top: 16px;
  padding: 12px;
  background: #fff5f5;
  border-left: 4px solid #f56c6c;
  border-radius: 8px;
  color: #c53030;
  font-size: 16px;
}
</style>

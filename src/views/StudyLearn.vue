<template>
  <div class="study-learn-page">
    <div class="gradient-header">
      <van-nav-bar
        :title="mode === 'choice' ? '看词识意' : '拼写练习'"
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
          <div v-if="isCorrect" class="feedback-correct">
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
          
          <button class="btn btn-primary" @click="nextWord" style="margin-top: 16px;">
            {{ currentIndex < words.length - 1 ? '继续下一个 →' : '查看学习报告' }}
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
          <div v-if="isCorrect" class="feedback-correct">
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
          
          <button class="btn btn-primary" @click="nextWord" style="margin-top: 16px;">
            {{ currentIndex < words.length - 1 ? '继续下一个 →' : '查看学习报告' }}
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">🎉</div>
        <div class="empty-text">今日学习已完成！</div>
        <button class="btn btn-primary" @click="endStudy">查看学习报告</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const bankId = ref(parseInt(route.query.bankId))
const mode = ref(route.query.mode || 'choice')
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

const options = ref([])

onMounted(async () => {
  await loadWords()
  if (mode.value === 'choice') {
    generateOptions()
  }
})

const loadWords = async () => {
  try {
    const dailyLimit = localStorage.getItem(`dailyLimit_${bankId.value}`) || 10
    const response = await api.get(`/api/study/learn/${bankId.value}`, {
      params: { limit: dailyLimit }
    })
    words.value = response.data
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
  
  // 记录学习结果
  await api.post('/api/study/record', {
    bankId: bankId.value,
    wordId: currentWord.value.id,
    studyType: 'learn',
    correct: isCorrect.value
  })
  
  results.value.push({
    word: currentWord.value.word,
    correct: isCorrect.value
  })
}

const checkSpell = async () => {
  if (!userInput.value.trim() || showResult.value) return
  
  const correct = userInput.value.trim().toLowerCase() === currentWord.value.word.toLowerCase()
  isCorrect.value = correct
  showResult.value = true
  
  // 记录学习结果
  await api.post('/api/study/record', {
    bankId: bankId.value,
    wordId: currentWord.value.id,
    studyType: 'learn',
    correct: isCorrect.value
  })
  
  results.value.push({
    word: currentWord.value.word,
    correct: isCorrect.value
  })
}

const nextWord = () => {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++
    showResult.value = false
    userInput.value = ''
    if (mode.value === 'choice') {
      generateOptions()
    }
  } else {
    endStudy()
  }
}

const endStudy = () => {
  // 保存学习结果到sessionStorage
  sessionStorage.setItem('studyResults', JSON.stringify({
    bankId: bankId.value,
    mode: mode.value,
    results: results.value,
    total: results.value.length,
    correct: results.value.filter(r => r.correct).length
  }))
  
  router.push({ name: 'StudyReport' })
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
const recordMastery = (level) => {
  // level: 0-陌生, 1-模糊, 2-认识
  // 根据掌握程度调整复习计划
  let reviewStage = 0
  
  if (level === 2) {
    // 认识：进入下一阶段
    reviewStage = Math.min((currentWord.value.review_stage || 0) + 1, 5)
  } else if (level === 1) {
    // 模糊：保持当前阶段
    reviewStage = currentWord.value.review_stage || 0
  } else {
    // 陌生：重置到第一阶段
    reviewStage = 0
  }
  
  // 这里可以扩展：保存掌握程度到数据库
  console.log(`单词 ${currentWord.value.word} 掌握程度: ${level}, 复习阶段: ${reviewStage}`)
  
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
  padding: 20px;
}

.word-card {
  background: white;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.word-text {
  font-size: 36px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 12px;
}

.word-phonetic {
  font-size: 18px;
  color: #718096;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  font-size: 16px;
  color: #2d3748;
}

/* 掌握程度反馈（仿百词斩） */
.mastery-feedback {
  background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  border: 2px solid #9ae6b4;
}

.mastery-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 12px;
  text-align: center;
}

.mastery-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.mastery-btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
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
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 12px;
}

.hint-en {
  font-size: 16px;
  color: #718096;
}

.spell-input {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.input-word {
  flex: 1;
  padding: 16px;
  font-size: 24px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
}

.input-word:focus {
  outline: none;
  border-color: #667eea;
}

.result-feedback {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.feedback-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.feedback-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
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
</style>
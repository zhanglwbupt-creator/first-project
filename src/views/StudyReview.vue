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
          <div class="word-text">{{ currentWord.word }}</div>
          <div v-if="currentWord.phonetic" class="word-phonetic">{{ currentWord.phonetic }}</div>
          <div class="review-stage">第 {{ currentWord.review_stage || 0 }} 次复习</div>
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
  
  await api.post('/api/study/record', {
    bankId: bankId.value,
    wordId: currentWord.value.id,
    studyType: 'review',
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
  margin-bottom: 8px;
}

.review-stage {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 600;
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f56c6c;
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
</style>

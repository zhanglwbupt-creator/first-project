<template>
  <div class="wordbank-detail-page">
    <div class="gradient-header">
      <van-nav-bar
        title="词库详情"
        left-text="返回"
        left-arrow
        @click-left="goBack"
      />
      <h1 class="page-title">{{ bankName }}</h1>
      <div class="page-subtitle">共 {{ words.length }} 个单词</div>
      
      <!-- 学习进度条 -->
      <div class="progress-section">
        <div class="progress-stats">
          <span>已学习 {{ learnedCount }}/{{ words.length }} 词</span>
          <span class="progress-percent">{{ progress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-details">
          <span>✅ 已掌握 {{ masteredCount }} 词</span>
          <span>🎯 正确率 {{ accuracy }}%</span>
        </div>
      </div>
    </div>

    <div class="content">
      <!-- 搜索框 -->
      <div class="search-box">
        <van-search
          v-model="searchText"
          placeholder="搜索单词..."
          shape="round"
          background="#f7fafc"
        />
      </div>

      <!-- 单词列表 -->
      <div v-if="filteredWords.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">{{ searchText ? '没有找到匹配的单词' : '还没有单词' }}</div>
        <button v-if="!searchText" class="btn btn-primary" @click="goToImport">
          导入单词
        </button>
      </div>

      <div v-else class="word-list">
        <div
          v-for="word in filteredWords"
          :key="word.id"
          class="word-item"
        >
          <div class="word-header">
            <div class="word-text">{{ word.word }}</div>
            <div v-if="word.phonetic" class="word-phonetic">{{ word.phonetic }}</div>
          </div>
          
          <div v-if="word.definition_cn" class="word-definition-cn">
            {{ word.definition_cn }}
          </div>
          
          <div v-if="word.definition_en" class="word-definition-en">
            {{ word.definition_en }}
          </div>
          
          <div v-if="word.example_sentence" class="word-example">
            <span class="example-label">例句：</span>
            {{ word.example_sentence }}
          </div>
        </div>
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

const bankId = computed(() => {
  const id = parseInt(route.query.bankId)
  console.log('🔍 WordBankDetail bankId:', { raw: route.query.bankId, parsed: id })
  return id
})
const bankName = ref('加载中...')
const words = ref([])
const searchText = ref('')
const learnedCount = ref(0)
const masteredCount = ref(0)
const progress = ref(0)
const accuracy = ref(0)

const filteredWords = computed(() => {
  if (!searchText.value) return words.value
  
  const search = searchText.value.toLowerCase()
  return words.value.filter(word => 
    word.word.toLowerCase().includes(search) ||
    (word.definition_cn && word.definition_cn.includes(search)) ||
    (word.definition_en && word.definition_en.toLowerCase().includes(search))
  )
})

onMounted(async () => {
  await loadWordBank()
  await loadWords()
  await loadProgress()
  
  // 监听学习完成事件
  window.addEventListener('studyCompleted', loadProgress)
})

const loadWordBank = async () => {
  try {
    const response = await api.get(`/api/wordbanks/${bankId.value}`)
    bankName.value = response.data.name
  } catch (error) {
    console.error('加载词库失败:', error)
    bankName.value = '词库不存在'
  }
}

const loadWords = async () => {
  try {
    const response = await api.get(`/api/wordbanks/${bankId.value}/words`)
    words.value = response.data
  } catch (error) {
    console.error('加载单词失败:', error)
  }
}

const loadProgress = async () => {
  if (isNaN(bankId.value)) {
    console.error('❌ bankId无效:', bankId.value)
    return
  }
  
  try {
    const response = await api.get(`/api/study/progress/${bankId.value}`)
    const data = response.data
    learnedCount.value = data.learnedWords
    masteredCount.value = data.masteredWords
    progress.value = data.progress
    accuracy.value = data.accuracy
  } catch (error) {
    console.error('加载学习进度失败:', error)
  }
}

const goBack = () => {
  router.back()
}

const goToImport = () => {
  router.push({ name: 'Import', query: { bankId: bankId.value } })
}
</script>

<style scoped>
.wordbank-detail-page {
  min-height: 100vh;
  background: #f7fafc;
  padding-bottom: 20px;
}

.gradient-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 16px 20px 8px;
}

.page-subtitle {
  font-size: 14px;
  opacity: 0.9;
  padding: 0 20px;
}

/* 学习进度条 */
.progress-section {
  margin: 16px 20px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.progress-percent {
  font-size: 18px;
  color: #ffd700;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  transition: width 0.5s;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.9;
}

.content {
  padding: 16px;
}

.search-box {
  margin-bottom: 16px;
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.word-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.word-text {
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
}

.word-phonetic {
  font-size: 14px;
  color: #718096;
  font-style: italic;
}

.word-definition-cn {
  font-size: 15px;
  color: #4a5568;
  margin-bottom: 6px;
  line-height: 1.6;
}

.word-definition-en {
  font-size: 13px;
  color: #718096;
  margin-bottom: 8px;
  line-height: 1.5;
  font-style: italic;
}

.word-example {
  font-size: 13px;
  color: #4a5568;
  background: #f7fafc;
  padding: 8px 12px;
  border-radius: 8px;
  line-height: 1.6;
  border-left: 3px solid #667eea;
}

.example-label {
  color: #667eea;
  font-weight: 600;
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
  font-size: 16px;
  color: #a0aec0;
  margin-bottom: 24px;
}

.btn {
  padding: 12px 32px;
  border-radius: 24px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #06D6A0 0%, #00B4D8 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 214, 160, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}
</style>

<template>
  <div class="study-mode-page">
    <div class="gradient-header">
      <van-nav-bar
        title="选择学习模式"
        left-text="返回"
        left-arrow
        @click-left="goBack"
      />
      <h1 class="page-title">{{ bankName }}</h1>
      <div class="page-subtitle">选择学习方式</div>
    </div>

    <div class="content">
      <!-- 学习统计 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-number">{{ stats.todayLearned }}</div>
          <div class="stat-label">今日已学</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.totalLearned }}</div>
          <div class="stat-label">累计学习</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.mastered }}</div>
          <div class="stat-label">已掌握</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </div>
      </div>

      <!-- 学习模式选择 -->
      <div class="mode-list">
        <div class="mode-card" @click="startLearn('choice')">
          <div class="mode-icon">📖</div>
          <div class="mode-info">
            <div class="mode-title">看词识意</div>
            <div class="mode-desc">显示单词，选择正确释义</div>
          </div>
          <div class="mode-arrow">→</div>
        </div>

        <div class="mode-card" @click="startLearn('spell')">
          <div class="mode-icon">✍️</div>
          <div class="mode-info">
            <div class="mode-title">拼写练习</div>
            <div class="mode-desc">显示释义，输入单词拼写</div>
          </div>
          <div class="mode-arrow">→</div>
        </div>

        <div class="mode-card review-card" @click="startReview">
          <div class="mode-icon">🔄</div>
          <div class="mode-info">
            <div class="mode-title">复习单词</div>
            <div class="mode-desc">
              <span v-if="reviewCount > 0">
                有 <strong style="color: #f56c6c;">{{ reviewCount }}</strong> 个单词待复习
              </span>
              <span v-else>暂无待复习单词</span>
            </div>
          </div>
          <div class="mode-arrow">→</div>
        </div>
      </div>

      <!-- 每日学习目标设置 -->
      <div class="settings-card">
        <div class="settings-title">⚙️ 学习设置</div>
        <div class="setting-item">
          <span>每日学习单词数</span>
          <van-stepper 
            v-model="dailyLimit" 
            min="5" 
            max="50" 
            @change="saveSettings"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const bankId = ref(parseInt(route.query.bankId))
const bankName = ref('加载中...')
const stats = ref({
  todayLearned: 0,
  totalLearned: 0,
  mastered: 0,
  accuracy: 0
})
const reviewCount = ref(0)
const dailyLimit = ref(10)

onMounted(async () => {
  await loadBankInfo()
  await loadStats()
  await loadReviewCount()
  loadSettings()
  
  // 监听学习完成事件
  window.addEventListener('studyCompleted', loadStats)
})

const loadBankInfo = async () => {
  try {
    const response = await axios.get(`/api/wordbanks/${bankId.value}`)
    bankName.value = response.data.name
  } catch (error) {
    console.error('加载词库信息失败:', error)
  }
}

const loadStats = async () => {
  try {
    const response = await axios.get(`/api/study/stats/${bankId.value}`)
    stats.value = response.data
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const loadReviewCount = async () => {
  try {
    const response = await axios.get(`/api/study/review/${bankId.value}`, {
      params: { limit: 1 }
    })
    reviewCount.value = response.data.length
  } catch (error) {
    console.error('加载复习数量失败:', error)
  }
}

const loadSettings = () => {
  const saved = localStorage.getItem(`dailyLimit_${bankId.value}`)
  if (saved) {
    dailyLimit.value = parseInt(saved)
  }
}

const saveSettings = () => {
  localStorage.setItem(`dailyLimit_${bankId.value}`, dailyLimit.value)
}

const startLearn = (mode) => {
  router.push({ 
    name: 'StudyLearn', 
    query: { 
      bankId: bankId.value,
      mode 
    } 
  })
}

const startReview = () => {
  if (reviewCount.value === 0) {
    alert('暂无待复习单词，先去学习新单词吧！')
    return
  }
  router.push({ 
    name: 'StudyReview', 
    query: { bankId: bankId.value } 
  })
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.study-mode-page {
  min-height: 100vh;
  background: #f7fafc;
}

.gradient-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 16px 0 8px;
  padding: 0 20px;
}

.page-subtitle {
  font-size: 14px;
  opacity: 0.9;
  padding: 0 20px;
}

.content {
  padding: 20px;
  margin-top: -20px;
}

.stats-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #718096;
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.mode-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s;
}

.mode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.mode-card:active {
  transform: scale(0.98);
}

.review-card {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border: 2px solid #feb2b2;
}

.mode-icon {
  font-size: 36px;
}

.mode-info {
  flex: 1;
}

.mode-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 13px;
  color: #718096;
}

.mode-arrow {
  font-size: 20px;
  color: #a0aec0;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.settings-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}
</style>

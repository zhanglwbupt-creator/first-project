<template>
  <div class="home">
    <!-- 渐变头部 -->
    <div class="gradient-header">
      <div class="header-top">
        <div class="header-greeting"> 你好，{{ userName }}</div>
        <button class="logout-btn" @click="handleLogout">
          退出登录
        </button>
      </div>
      <div class="header-subtitle">今天也要加油背单词哦！</div>
      <div v-if="reviewCount > 0" class="review-badge">
        🔔 有 <strong>{{ reviewCount }}</strong> 个单词待复习
      </div>
      <div class="header-stats">
        <div class="stat-badge"> 连续{{ stats.continuousDays }}天</div>
        <div class="stat-badge">⭐ 已学{{ stats.learnedWords }}词</div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content">
      <!-- 我的词库 -->
      <div class="card">
        <div class="card-title">📖 我的词库</div>
        <div v-if="wordBanks.length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <div class="empty-text">还没有词库，创建一个吧！</div>
        </div>
        <div v-else class="wordbank-grid">
          <div 
            v-for="bank in wordBanks.slice(0, 4)" 
            :key="bank.id" 
            class="wordbank-card"
            @click="viewWordBank(bank.id)"
          >
            <div class="wordbank-icon">📘</div>
            <div class="wordbank-name">{{ bank.name }}</div>
            <div class="wordbank-meta">{{ bank.wordCount }}词</div>
            <button class="study-btn" @click.stop="startStudy(bank.id)">
              开始学习
            </button>
          </div>
          <div class="wordbank-card add-card" @click="$router.push('/wordbank')">
            <div class="add-icon">➕</div>
            <div class="wordbank-name">创建词库</div>
            <div class="wordbank-meta">自定义单词</div>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="card">
        <div class="card-title">⚡ 快捷操作</div>
        <div class="quick-actions">
          <button class="action-button primary" @click="goToImport">
            <span class="action-icon">📥</span>
            <span>批量导入单词</span>
          </button>
          <button class="action-button secondary" @click="$router.push('/wordbank')">
            <span class="action-icon">📚</span>
            <span>管理词库</span>
          </button>
        </div>
      </div>

      <!-- 学习统计 -->
      <div class="card">
        <div class="card-title">📊 学习统计</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ stats.totalWords }}</div>
            <div class="stat-label">总单词数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.learnedWords }}</div>
            <div class="stat-label">已学习</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.masteredWords }}</div>
            <div class="stat-label">已掌握</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.accuracy }}%</div>
            <div class="stat-label">正确率</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWordBankStore } from '@/stores/wordbank'
import { initNotifications, sendReviewReminder } from '@/utils/notification'
import api from '@/api'

const router = useRouter()
const wordBankStore = useWordBankStore()

const userName = ref('同学')
const wordBanks = ref([])
const reviewCount = ref(0)
const stats = ref({
  continuousDays: 0,
  learnedWords: 0,
  totalWords: 0,
  masteredWords: 0,
  accuracy: 0
})

onMounted(async () => {
  // 获取用户信息
  const user = localStorage.getItem('user')
  if (user) {
    const userInfo = JSON.parse(user)
    userName.value = userInfo.nickname || userInfo.username || '同学'
  }
  
  await wordBankStore.fetchWordBanks()
  wordBanks.value = wordBankStore.wordBanks
  await loadStats()
  await loadReviewCount()
  
  // 初始化复习提醒
  initNotifications().then(result => {
    if (result.success) {
      console.log('复习提醒已设置:', result.scheduledTime)
      // 如果有待复习单词，立即发送提醒
      if (reviewCount.value > 0) {
        sendReviewReminder(reviewCount.value)
      }
    }
  })
  
  // 监听学习完成事件
  window.addEventListener('studyCompleted', loadStats)
})

const loadReviewCount = async () => {
  try {
    // 获取所有词库的待复习单词数量
    const response = await api.get('/api/study/review-stats/progress')
    let total = 0
    response.data.forEach(stats => {
      total += stats.toReview || 0
    })
    reviewCount.value = total
  } catch (error) {
    console.error('加载复习数量失败:', error)
  }
}

const loadStats = async () => {
  try {
    // 获取所有词库的学习进度
    const response = await api.get('/api/study/progress')
    const progressList = response.data
    
    // 计算总体统计
    let totalWords = 0
    let totalLearned = 0
    let totalMastered = 0
    let totalAccuracy = 0
    
    progressList.forEach(p => {
      totalWords += p.totalWords
      totalLearned += p.learnedWords
      totalMastered += p.masteredWords
      if (p.accuracy > 0) {
        totalAccuracy += p.accuracy
      }
    })
    
    const avgAccuracy = progressList.length > 0 ? Math.round(totalAccuracy / progressList.length) : 0
    
    stats.value = {
      continuousDays: 1, // TODO: 计算连续学习天数
      learnedWords: totalLearned,
      totalWords: totalWords,
      masteredWords: totalMastered,
      accuracy: avgAccuracy
    }
    
    // 更新词库列表的进度信息
    wordBanks.value = wordBanks.value.map(bank => {
      const progress = progressList.find(p => p.bankId === bank.id)
      return {
        ...bank,
        progress: progress ? progress.progress : 0,
        learnedCount: progress ? progress.learnedWords : 0
      }
    })
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const selectWordBank = (bank) => {
  wordBankStore.setCurrentBank(bank)
  // TODO: 跳转到学习页面
  alert(`选择词库：${bank.name}`)
}

const viewWordBank = (bankId) => {
  router.push({ name: 'WordBankDetail', query: { bankId } })
}

const startStudy = (bankId) => {
  router.push({ name: 'StudyMode', query: { bankId } })
}

const goToImport = () => {
  if (wordBanks.value.length === 0) {
    alert('请先创建词库！\n\n1. 点击“管理词库”\n2. 创建第一个词库\n3. 然后再导入单词')
    router.push('/wordbank')
  } else {
    router.push('/wordbank')
  }
}

// 退出登录
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    // 清除token和用户信息
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 跳转到登录页
    router.push('/auth')
  }
}
</script>

<style scoped>
.gradient-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 20px 24px;
  border-radius: 0 0 24px 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.logout-btn {
  padding: 6px 16px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.logout-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.05);
}

.header-greeting {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.review-badge {
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
  margin-top: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #f56c6c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.header-stats {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.stat-badge {
  background: rgba(255,255,255,0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.content {
  padding: 20px 16px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #2d3748;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: #a0aec0;
}

.wordbank-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.wordbank-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.wordbank-card:active {
  transform: scale(0.95);
}

.wordbank-card.add-card {
  border: 2px dashed #cbd5e0;
}

.wordbank-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.add-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.wordbank-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #2d3748;
}

.wordbank-meta {
  font-size: 12px;
  color: #a0aec0;
  margin-bottom: 8px;
}

.study-btn {
  width: 100%;
  padding: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.study-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.progress-bar-mini {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, #06D6A0 0%, #00B4D8 100%);
  border-radius: 2px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.action-button.primary {
  background: linear-gradient(135deg, #00B4D8 0%, #0077B6 100%);
  color: white;
}

.action-button.secondary {
  background: #f7fafc;
  color: #2d3748;
  border: 1px solid #e2e8f0;
}

.action-icon {
  font-size: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f7fafc;
  border-radius: 12px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #00B4D8;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #a0aec0;
}
</style>

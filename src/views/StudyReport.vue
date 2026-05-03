<template>
  <div class="study-report-page">
    <div class="gradient-header">
      <van-nav-bar
        title="学习报告"
        left-text="返回"
        left-arrow
        @click-left="goHome"
      />
      <h1 class="page-title">📊 今日学习报告</h1>
    </div>

    <div class="content">
      <!-- 总览卡片 -->
      <div class="summary-card">
        <div class="summary-icon">🎉</div>
        <div class="summary-text">学习完成！</div>
      </div>

      <!-- 统计数据 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ report.total }}</div>
          <div class="stat-label">学习单词</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: #48bb78;">{{ report.correct }}</div>
          <div class="stat-label">正确</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: #f56c6c;">{{ report.wrong }}</div>
          <div class="stat-label">错误</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: #667eea;">{{ report.accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </div>
      </div>

      <!-- 正确率进度条 -->
      <div class="accuracy-bar">
        <div class="accuracy-label">正确率</div>
        <div class="accuracy-progress">
          <div class="accuracy-fill" :style="{ width: report.accuracy + '%' }"></div>
        </div>
        <div class="accuracy-text">{{ report.accuracy }}%</div>
      </div>

      <!-- 错题列表 -->
      <div v-if="wrongWords.length > 0" class="wrong-words-section">
        <div class="section-title">❌ 需要加强的单词</div>
        <div class="wrong-words-list">
          <div v-for="word in wrongWords" :key="word.word" class="wrong-word-item">
            <div class="wrong-word-text">{{ word.word }}</div>
          </div>
        </div>
      </div>

      <!-- 鼓励语 -->
      <div class="encourage-card">
        <div class="encourage-text">{{ encourageText }}</div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn btn-primary" @click="continueStudy">
          继续学习
        </button>
        <button class="btn btn-secondary" @click="goHome">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const report = ref({
  total: 0,
  correct: 0,
  wrong: 0,
  accuracy: 0
})

const wrongWords = ref([])

const encourageText = computed(() => {
  const accuracy = report.value.accuracy
  if (accuracy >= 90) return '🌟 太棒了！你是记忆大师！'
  if (accuracy >= 70) return '👍 不错！继续保持！'
  if (accuracy >= 50) return '💪 加油！还有进步空间！'
  return '📚 多多练习，一定会进步的！'
})

onMounted(() => {
  loadReport()
})

const loadReport = () => {
  const data = sessionStorage.getItem('studyResults')
  if (data) {
    const parsed = JSON.parse(data)
    report.value = {
      total: parsed.total || 0,
      correct: parsed.correct || 0,
      wrong: (parsed.total || 0) - (parsed.correct || 0),
      accuracy: parsed.total > 0 ? Math.round((parsed.correct / parsed.total) * 100) : 0
    }
    
    // 提取错题
    wrongWords.value = parsed.results?.filter(r => !r.correct) || []
  }
}

const continueStudy = () => {
  const data = sessionStorage.getItem('studyResults')
  if (data) {
    const parsed = JSON.parse(data)
    // 触发学习完成事件，通知其他页面更新
    window.dispatchEvent(new CustomEvent('studyCompleted', { 
      detail: { bankId: parsed.bankId } 
    }))
    router.push({ 
      name: 'StudyMode', 
      query: { bankId: parsed.bankId } 
    })
  }
}

const goHome = () => {
  const data = sessionStorage.getItem('studyResults')
  if (data) {
    const parsed = JSON.parse(data)
    // 触发学习完成事件，通知其他页面更新
    window.dispatchEvent(new CustomEvent('studyCompleted', { 
      detail: { bankId: parsed.bankId } 
    }))
  }
  sessionStorage.removeItem('studyResults')
  router.push('/')
}
</script>

<style scoped>
.study-report-page {
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
  margin: 16px 0 0;
  padding: 0 20px;
}

.content {
  padding: 20px;
  margin-top: -20px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.summary-icon {
  font-size: 64px;
  margin-bottom: 12px;
}

.summary-text {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #718096;
}

.accuracy-bar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.accuracy-label {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 12px;
}

.accuracy-progress {
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.accuracy-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.5s;
}

.accuracy-text {
  text-align: right;
  font-size: 14px;
  color: #718096;
}

.wrong-words-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
}

.wrong-words-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wrong-word-item {
  padding: 12px;
  background: #fff5f5;
  border-left: 4px solid #f56c6c;
  border-radius: 4px;
}

.wrong-word-text {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.encourage-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 20px;
  color: white;
}

.encourage-text {
  font-size: 20px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
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

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #f7fafc;
}
</style>

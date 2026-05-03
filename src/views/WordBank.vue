<template>
  <div class="wordbank-page">
    <div class="gradient-header">
      <h1 class="page-title">我的词库</h1>
      <div class="page-subtitle">已创建 {{ wordBanks.length }} 个词库</div>
    </div>

    <div class="content">
      <!-- 快速操作 -->
      <div class="quick-actions">
        <button class="btn btn-gradient" @click="showCreateDialog = true">
          ➕ 创建词库
        </button>
        <button class="btn btn-success" @click="$router.push('/import')">
          📥 批量导入
        </button>
      </div>

      <!-- 词库列表 -->
      <div v-if="wordBanks.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <div class="empty-text">还没有词库</div>
        <button class="btn btn-primary" @click="showCreateDialog = true" style="margin-top: 16px;">
          创建第一个词库
        </button>
      </div>

      <div v-else class="wordbank-list">
        <div v-for="bank in wordBanks" :key="bank.id" class="wordbank-list-item">
          <div class="wordbank-list-header" @click="viewWordBank(bank.id)">
            <div class="wordbank-list-name">📘 {{ bank.name }}</div>
            <div class="wordbank-list-count">{{ bank.wordCount }}词</div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: bank.progress + '%' }"></div>
          </div>
          <div class="wordbank-list-meta">
            <span>已学 {{ bank.learnedCount }}词</span>
            <span class="progress-percent">{{ bank.progress }}%</span>
          </div>
          <div class="wordbank-actions">
            <button class="action-btn primary" @click="startStudy(bank.id)">开始学习</button>
            <button class="action-btn" @click="$router.push({ name: 'Import', query: { bankId: bank.id } })">
              导入单词
            </button>
            <button class="action-btn danger" @click="deleteBank(bank.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建词库对话框 -->
    <van-dialog
      v-model:show="showCreateDialog"
      title="创建新词库"
      show-cancel-button
      @confirm="createWordBank"
      @close="onDialogClose"
    >
      <div style="padding: 16px;">
        <van-field
          v-model="newBankName"
          label="词库名称"
          placeholder="例如：三年级英语"
          required
        />
        <van-field
          v-model="newBankDesc"
          label="词库描述"
          type="textarea"
          placeholder="可选，描述词库内容"
          rows="3"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, Field } from 'vant'
import { useWordBankStore } from '@/stores/wordbank'
import api from '@/api'

const router = useRouter()
const wordBankStore = useWordBankStore()
const wordBanks = ref([])
const showCreateDialog = ref(false)
const newBankName = ref('')
const newBankDesc = ref('')

onMounted(async () => {
  await wordBankStore.fetchWordBanks()
  wordBanks.value = wordBankStore.wordBanks
  await loadProgress()
  
  // 监听学习完成事件
  window.addEventListener('studyCompleted', loadProgress)
})

const loadProgress = async () => {
  try {
    const response = await api.get('/api/study/progress')
    const progressList = response.data
    
    // 更新词库列表的进度信息
    wordBanks.value = wordBanks.value.map(bank => {
      const progress = progressList.find(p => p.bankId === bank.id)
      return {
        ...bank,
        progress: progress ? progress.progress : 0,
        learnedCount: progress ? progress.learnedWords : 0,
        accuracy: progress ? progress.accuracy : 0
      }
    })
  } catch (error) {
    console.error('加载学习进度失败:', error)
  }
}

const createWordBank = async () => {
  if (!newBankName.value.trim()) {
    alert('请输入词库名称')
    return
  }
  
  try {
    console.log('开始创建词库...')
    await wordBankStore.createWordBank(newBankName.value, newBankDesc.value)
    console.log('词库创建成功，刷新列表...')
    await wordBankStore.fetchWordBanks()
    wordBanks.value = wordBankStore.wordBanks
    newBankName.value = ''
    newBankDesc.value = ''
    showCreateDialog.value = false
    console.log('对话框已关闭')
    setTimeout(() => {
      alert('词库创建成功！')
    }, 100)
  } catch (error) {
    console.error('创建词库异常:', error)
    alert('创建词库失败：' + error.message)
  }
}

const onDialogClose = (action) => {
  console.log('对话框关闭:', action)
}

const deleteBank = async (id) => {
  if (confirm('确定要删除这个词库吗？')) {
    try {
      await wordBankStore.deleteWordBank(id)
      await wordBankStore.fetchWordBanks()
      wordBanks.value = wordBankStore.wordBanks
      alert('词库已删除')
    } catch (error) {
      alert('删除词库失败：' + error.message)
    }
  }
}

const viewWordBank = (id) => {
  router.push({ name: 'WordBankDetail', query: { bankId: id } })
}

const startStudy = (bankId) => {
  router.push({ name: 'StudyMode', query: { bankId } })
}
</script>

<style scoped>
.gradient-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 20px 24px;
  border-radius: 0 0 24px 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.content {
  padding: 20px 16px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.btn {
  padding: 14px 28px;
  border-radius: 24px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-gradient {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #06D6A0 0%, #05B88A 100%);
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #00B4D8 0%, #0077B6 100%);
  color: white;
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #a0aec0;
}

.wordbank-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wordbank-list-item {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.wordbank-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.wordbank-list-header:hover {
  transform: translateX(4px);
}

.wordbank-list-name {
  font-size: 16px;
  font-weight: 600;
}

.wordbank-list-count {
  font-size: 13px;
  color: #a0aec0;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06D6A0 0%, #00B4D8 100%);
  border-radius: 4px;
}

.wordbank-list-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #a0aec0;
  margin-bottom: 12px;
}

.progress-percent {
  color: #06D6A0;
  font-weight: 600;
}

.wordbank-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #00B4D8 0%, #0077B6 100%);
  color: white;
  border: none;
}

.action-btn.danger {
  color: #EF476F;
  border-color: #EF476F;
}
</style>

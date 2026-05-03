<template>
  <div class="import-page">
    <div class="gradient-header">
      <h1 class="page-title">批量导入单词</h1>
      <div class="page-subtitle">{{ currentBankName }}</div>
    </div>

    <!-- 没有选择词库的提示 -->
    <div v-if="!currentBankId" class="no-bank-notice">
      <div class="notice-icon">💡</div>
      <div class="notice-title">请先选择词库</div>
      <div class="notice-text">
        <p>1. 返回词库页面</p>
        <p>2. 创建或选择一个词库</p>
        <p>3. 点击“导入单词”按钮</p>
      </div>
      <button class="btn btn-primary" @click="goToWordBank" style="margin-top: 16px;">
        前往词库页面
      </button>
      
      <!-- 如果有词库，直接显示选择列表 -->
      <div v-if="wordBankStore.wordBanks.length > 0" class="quick-select">
        <div class="quick-select-title">或直接选择词库：</div>
        <div 
          v-for="bank in wordBankStore.wordBanks" 
          :key="bank.id" 
          class="quick-select-item"
          @click="selectBank(bank.id)"
        >
           {{ bank.name }} ({{ bank.wordCount }}词)
        </div>
      </div>
    </div>

    <div class="content" v-else>
      <!-- 步骤指示器 -->
      <div class="steps">
        <div class="step active">
          <div class="step-number">1</div>
          <div class="step-label">选择文件</div>
        </div>
        <div class="step-line" :class="{ completed: step >= 2 }"></div>
        <div class="step" :class="{ active: step >= 2 }">
          <div class="step-number">2</div>
          <div class="step-label">解析预览</div>
        </div>
        <div class="step-line" :class="{ completed: step >= 3 }"></div>
        <div class="step" :class="{ active: step >= 3 }">
          <div class="step-number">3</div>
          <div class="step-label">确认导入</div>
        </div>
      </div>

      <!-- 步骤1：选择文件 -->
      <div v-if="step === 1" class="step-content">
        <div class="import-options">
          <div class="import-card" @click="triggerFileInput">
            <div class="import-icon"></div>
            <div class="import-title">Excel/CSV导入</div>
            <div class="import-desc">批量导入更高效<br>支持 .xlsx, .xls, .csv 格式</div>
          </div>
          <div class="import-card" @click="step = 4">
            <div class="import-icon">✍️</div>
            <div class="import-title">手工录入</div>
            <div class="import-desc">逐个添加单词<br>适合少量单词</div>
          </div>
          <div class="import-card" @click="downloadTemplate">
            <div class="import-icon">📝</div>
            <div class="import-title">下载模板</div>
            <div class="import-desc">Excel或CSV模板<br>确保格式正确</div>
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          style="display: none"
          @change="handleFileUpload"
        />

        <div class="help-card">
          <div class="help-title">📋 Excel格式说明</div>
          <div class="help-content">
            <p><strong>必填列：</strong>单词（或 Word）</p>
            <p><strong>选填列：</strong>中文释义、英文释义、例句、音标</p>
            <p><strong>✨ 智能补全：</strong>缺失的释义、音标、例句将自动从网络查询补充</p>
            <p><strong>支持格式：</strong>Excel (.xlsx, .xls) 和 CSV (.csv)</p>
          </div>
        </div>
      </div>

      <!-- 步骤2：解析预览 -->
      <div v-if="step === 2" class="step-content">
        <div class="preview-card">
          <div class="preview-header">
            <div class="preview-title">解析结果</div>
            <div class="preview-count">共 {{ parsedWords.length }} 个单词</div>
          </div>
          <div class="preview-list">
            <div v-for="(word, index) in parsedWords.slice(0, 10)" :key="index" class="preview-item">
              <div class="preview-word">{{ word.word }}</div>
              <div class="preview-def">{{ word.definition_cn || '待查询' }}</div>
            </div>
            <div v-if="parsedWords.length > 10" class="preview-more">
              还有 {{ parsedWords.length - 10 }} 个单词...
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-secondary" @click="step = 1">返回</button>
          <button class="btn btn-primary" @click="importWords">
            确认导入 ({{ parsedWords.length }}个)
          </button>
        </div>
      </div>

      <!-- 步骤3：导入中/完成 -->
      <div v-if="step === 3" class="step-content">
        <div v-if="importing" class="loading-card">
          <div class="loading-icon"></div>
          <div class="loading-text">正在导入...</div>
          <div class="loading-progress">{{ importedCount }} / {{ parsedWords.length }}</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (importedCount / parsedWords.length * 100) + '%' }"></div>
          </div>
        </div>

        <div v-else class="success-card">
          <div class="success-icon"></div>
          <div class="success-text">导入成功！</div>
          <div class="success-detail">
            <p>成功导入：{{ importedCount }} 个单词</p>
            <p v-if="skippedCount > 0">跳过重复：{{ skippedCount }} 个单词</p>
            <p>自动查询：{{ queriedCount }} 个单词释义</p>
          </div>
          <button class="btn btn-primary" @click="goBack" style="margin-top: 24px;">
            返回词库
          </button>
        </div>
      </div>
      
      <!-- 步骤4：手工录入 -->
      <div v-if="step === 4" class="step-content">
        <div class="manual-input-card">
          <div class="manual-input-title">✍️ 手工录入单词</div>
          <div class="manual-input-hint">只需输入单词，系统将自动查询释义、音标、例句等信息</div>
          
          <div class="manual-form">
            <div class="form-group">
              <label>单词 *</label>
              <div class="word-input-group">
                <input 
                  v-model="manualWord.word" 
                  class="form-input word-input" 
                  placeholder="例如：abandon"
                  @keyup.enter="queryWordInfo"
                />
                <button 
                  class="btn-query" 
                  @click="queryWordInfo" 
                  :disabled="!manualWord.word.trim() || querying"
                >
                  {{ querying ? '查询中...' : '🔍 查询' }}
                </button>
              </div>
            </div>
            
            <!-- 查询结果展示 -->
            <div v-if="queriedWordInfo" class="queried-info">
              <div class="queried-title">✅ 查询结果</div>
              
              <div class="form-group">
                <label>音标</label>
                <input v-model="queriedWordInfo.phonetic" class="form-input" placeholder="自动查询" />
              </div>
              
              <div class="form-group">
                <label>中文释义</label>
                <input v-model="queriedWordInfo.definition_cn" class="form-input" placeholder="自动查询" />
              </div>
              
              <div class="form-group">
                <label>英文释义</label>
                <textarea v-model="queriedWordInfo.definition_en" class="form-textarea" placeholder="自动查询"></textarea>
              </div>
              
              <div class="form-group">
                <label>例句</label>
                <textarea v-model="queriedWordInfo.example_sentence" class="form-textarea" placeholder="自动查询"></textarea>
              </div>
            </div>
            
            <div class="form-actions">
              <button class="btn btn-secondary" @click="step = 1">返回</button>
              <button class="btn btn-primary" @click="addManualWord" :disabled="!manualWord.word.trim() || querying">
                添加到列表
              </button>
            </div>
          </div>
          
          <!-- 已添加的单词列表 -->
          <div v-if="manualWords.length > 0" class="added-words-list">
            <div class="added-words-title">已添加的单词 ({{ manualWords.length }}个)</div>
            <div v-for="(word, index) in manualWords" :key="index" class="added-word-item">
              <div class="added-word-info">
                <div class="added-word-text">{{ word.word }}</div>
                <div class="added-word-def">{{ word.definition_cn || '暂无释义' }}</div>
              </div>
              <button class="btn-remove" @click="removeManualWord(index)">×</button>
            </div>
            
            <div class="batch-actions">
              <button class="btn btn-warning" @click="importManualWords" :disabled="manualWords.length === 0">
                批量导入 ({{ manualWords.length }}个)
              </button>
            </div>
          </div>
          
          <!-- 批量文本输入 -->
          <div class="batch-input-section">
            <div class="batch-input-title">💡 批量文本输入</div>
            <div class="batch-input-hint">每行一个单词，或格式：单词 | 释义 | 音标 | 例句</div>
            <textarea v-model="batchText" class="batch-textarea" placeholder="abandon | 放弃 | /əˈbændən/ | He abandoned his wife.\nabandonment | 抛弃\nability | 能力"></textarea>
            <div class="batch-actions">
              <button class="btn btn-primary" @click="parseBatchText">解析文本</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWordBankStore } from '@/stores/wordbank'
import * as XLSX from 'xlsx'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const wordBankStore = useWordBankStore()

const step = ref(1)
const fileInput = ref(null)
const parsedWords = ref([])
const importing = ref(false)
const importedCount = ref(0)
const queriedCount = ref(0)
const skippedCount = ref(0)

// 手工录入相关
const manualWord = ref({
  word: '',
  definition_cn: '',
  definition_en: '',
  phonetic: '',
  example_sentence: ''
})
const queriedWordInfo = ref(null) // 查询到的单词信息
const querying = ref(false) // 查询中状态
const manualWords = ref([])
const batchText = ref('')

const currentBankId = computed(() => {
  const bankId = route.query.bankId
  return bankId ? parseInt(bankId) : null
})

const currentBankName = computed(() => {
  const bankId = route.query.bankId
  if (!bankId) return '未选择词库'
  const bank = wordBankStore.getWordBankById(parseInt(bankId))
  return bank ? bank.name : '未选择词库'
})

const goToWordBank = () => {
  router.push('/wordbank')
}

const selectBank = (bankId) => {
  router.replace({ name: 'Import', query: { bankId } })
}

onMounted(async () => {
  // 确保词库列表已加载
  if (wordBankStore.wordBanks.length === 0) {
    await wordBankStore.fetchWordBanks()
  }
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const fileName = file.name.toLowerCase()
  const isCSV = fileName.endsWith('.csv')

  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      let jsonData
      
      if (isCSV) {
        // 解析CSV文件
        const text = e.target.result
        jsonData = parseCSV(text)
      } else {
        // 解析Excel文件
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        jsonData = XLSX.utils.sheet_to_json(firstSheet)
      }

      // 解析数据
      parsedWords.value = jsonData.map(row => ({
        word: (row['单词'] || row['Word'] || row['word'] || '').trim().replace(/^"|"$/g, ''),
        definition_cn: (row['中文释义'] || row['Definition'] || row['definition_cn'] || '').trim().replace(/^"|"$/g, ''),
        definition_en: (row['英文释义'] || row['English Definition'] || row['definition_en'] || '').trim().replace(/^"|"$/g, ''),
        example: (row['例句'] || row['Example'] || row['example_sentence'] || '').trim().replace(/^"|"$/g, ''),
        phonetic: (row['音标'] || row['Phonetic'] || row['phonetic'] || '').trim().replace(/^"|"$/g, '')
      })).filter(item => item.word)

      if (parsedWords.value.length === 0) {
        alert('未找到有效的单词数据，请检查文件格式')
        return
      }

      step.value = 2
    } catch (error) {
      alert('解析文件失败：' + error.message)
    }
  }
  
  if (isCSV) {
    reader.readAsText(file, 'UTF-8')
  } else {
    reader.readAsArrayBuffer(file)
  }
}

// 解析CSV文件
const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  // 解析表头
  const headers = parseCSVLine(lines[0])
  
  // 解析数据行
  const data = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const row = {}
      headers.forEach((header, index) => {
        row[header.trim()] = values[index].trim()
      })
      data.push(row)
    }
  }
  
  return data
}

// 解析CSV行（处理引号和逗号）
const parseCSVLine = (line) => {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

const importWords = async () => {
  step.value = 3
  importing.value = true
  importedCount.value = 0
  queriedCount.value = 0
  skippedCount.value = 0

  const bankId = route.query.bankId
  
  // 验证bankId
  if (!bankId) {
    alert('错误：未选择词库，请返回重新选择')
    importing.value = false
    step.value = 1
    return
  }
  
  const parsedBankId = parseInt(bankId)
  if (isNaN(parsedBankId)) {
    alert('错误：词库ID无效')
    importing.value = false
    step.value = 1
    return
  }

  console.log('开始导入，词库ID:', parsedBankId, '单词数量:', parsedWords.value.length)

  try {
    // 后端会自动补全缺失信息，直接调用批量导入API
    const response = await api.post(`/api/wordbanks/${parsedBankId}/words/batch`, {
      words: parsedWords.value
    })
    
    // 显示详细结果
    importedCount.value = response.data.addedCount || parsedWords.value.length
    skippedCount.value = response.data.skippedCount || 0
    // 计算有多少单词需要查询
    queriedCount.value = parsedWords.value.filter(w => !w.definition_cn || !w.definition_en).length
    importing.value = false
  } catch (error) {
    console.error('导入失败:', error)
    const errorMsg = error.response?.data?.error || error.message
    alert('导入失败：' + errorMsg)
    importing.value = false
    step.value = 2
  }
}

const downloadTemplate = () => {
  // 提供两种格式选择
  const format = confirm('选择下载格式：\n\n点击“确定”下载 Excel 格式 (.xlsx)\n点击“取消”下载 CSV 格式 (.csv)')
  
  const template = [
    {
      '单词': 'apple',
      '中文释义': '苹果',
      '英文释义': 'A round fruit with red or green skin',
      '例句': 'I eat an apple every day.',
      '音标': '/ˈæpl/'
    },
    {
      '单词': 'book',
      '中文释义': '书',
      '英文释义': 'A written work published in printed form',
      '例句': 'I am reading a book.',
      '音标': '/bʊk/'
    }
  ]
  
  if (format) {
    // 下载Excel格式
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '词库模板')
    XLSX.writeFile(wb, '词库导入模板.xlsx')
  } else {
    // 下载CSV格式
    const headers = ['单词', '中文释义', '英文释义', '例句', '音标']
    const csvContent = [
      headers.join(','),
      ...template.map(row => 
        headers.map(h => `"${row[h] || ''}"`).join(',')
      )
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '词库导入模板.csv'
    link.click()
  }
}

const goBack = () => {
  router.push('/wordbank')
}

// 查询单词信息
const queryWordInfo = async () => {
  if (!manualWord.value.word.trim()) {
    alert('请输入单词')
    return
  }
  
  querying.value = true
  
  try {
    const response = await api.post('/api/translate', {
      word: manualWord.value.word.trim() 
    })
    
    if (response.data) {
      queriedWordInfo.value = {
        phonetic: response.data.phonetic || '',
        definition_cn: response.data.definition_cn || '',
        definition_en: response.data.definition_en || '',
        example_sentence: response.data.example || ''
      }
    }
  } catch (error) {
    console.error('查询失败:', error)
    alert('查询失败，请手动填写释义')
  } finally {
    querying.value = false
  }
}

// 手工录入功能
const addManualWord = () => {
  if (!manualWord.value.word.trim()) {
    alert('请输入单词')
    return
  }
  
  // 使用查询到的信息或用户手动修改的信息
  const wordData = {
    word: manualWord.value.word.trim(),
    definition_cn: queriedWordInfo.value?.definition_cn || '',
    definition_en: queriedWordInfo.value?.definition_en || '',
    phonetic: queriedWordInfo.value?.phonetic || '',
    example_sentence: queriedWordInfo.value?.example_sentence || ''
  }
  
  // 添加到列表
  manualWords.value.push(wordData)
  
  // 清空表单和查询结果
  manualWord.value = {
    word: '',
    definition_cn: '',
    definition_en: '',
    phonetic: '',
    example_sentence: ''
  }
  queriedWordInfo.value = null
  
  alert('单词已添加')
}

const removeManualWord = (index) => {
  manualWords.value.splice(index, 1)
}

const importManualWords = async () => {
  if (manualWords.value.length === 0) {
    alert('没有可导入的单词')
    return
  }
  
  if (!confirm(`确定要导入${manualWords.value.length}个单词吗？`)) {
    return
  }
  
  try {
    const bankId = route.query.bankId
    if (!bankId) {
      alert('错误：未选择词库')
      return
    }
    
    // 后端会自动补全缺失信息
    const response = await api.post(`/api/wordbanks/${bankId}/words/batch`, {
      words: manualWords.value
    })
    
    alert(response.data.message)
    manualWords.value = []
    queriedWordInfo.value = null
    router.push('/wordbank')
  } catch (error) {
    console.error('导入失败:', error)
    alert('导入失败：' + (error.response?.data?.error || error.message))
  }
}

// 解析批量文本
const parseBatchText = () => {
  if (!batchText.value.trim()) {
    alert('请输入文本')
    return
  }
  
  const lines = batchText.value.trim().split('\n')
  const parsed = []
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    const parts = line.split('|').map(p => p.trim())
    
    if (parts.length >= 1 && parts[0]) {
      parsed.push({
        word: parts[0],
        definition_cn: parts[1] || '',
        definition_en: parts[2] || '',
        phonetic: parts[3] || '',
        example_sentence: parts[4] || ''
      })
    }
  }
  
  if (parsed.length === 0) {
    alert('未能解析出任何单词，请检查格式')
    return
  }
  
  manualWords.value = [...manualWords.value, ...parsed]
  batchText.value = ''
  alert(`成功解析${parsed.length}个单词`)
}
</script>

<style scoped>
.gradient-header {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 20px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #a0aec0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 8px;
}

.step.active .step-number {
  background: linear-gradient(135deg, #00B4D8 0%, #0077B6 100%);
  color: white;
}

.step.completed .step-number {
  background: #06D6A0;
  color: white;
}

.step-label {
  font-size: 12px;
  color: #a0aec0;
}

.step.active .step-label {
  color: #00B4D8;
  font-weight: 600;
}

.step-line {
  height: 2px;
  background: #e2e8f0;
  flex: 1;
  margin: 0 8px;
}

.step-line.completed {
  background: #06D6A0;
}

.import-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.import-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.import-card:active {
  border-color: #00B4D8;
  background: #f0f9ff;
}

.import-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.import-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.import-desc {
  font-size: 12px;
  color: #a0aec0;
  line-height: 1.6;
}

.help-card {
  background: #f0f9ff;
  border-left: 4px solid #00B4D8;
  border-radius: 8px;
  padding: 16px;
}

.help-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.help-content {
  font-size: 13px;
  color: #4a5568;
  line-height: 1.8;
}

.preview-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
}

.preview-count {
  font-size: 14px;
  color: #00B4D8;
  font-weight: 600;
}

.preview-list {
  max-height: 300px;
  overflow-y: auto;
}

.preview-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-word {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.preview-def {
  font-size: 13px;
  color: #a0aec0;
}

.preview-more {
  text-align: center;
  padding: 12px;
  color: #a0aec0;
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 14px;
  border-radius: 24px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #00B4D8 0%, #0077B6 100%);
  color: white;
}

.btn-secondary {
  background: #f7fafc;
  color: #2d3748;
  border: 1px solid #e2e8f0;
}

.loading-card, .success-card {
  text-align: center;
  padding: 48px 16px;
}

.loading-icon, .success-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.loading-text, .success-text {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.loading-progress {
  font-size: 14px;
  color: #a0aec0;
  margin-bottom: 16px;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  max-width: 300px;
  margin: 0 auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06D6A0 0%, #00B4D8 100%);
  border-radius: 4px;
  transition: width 0.3s;
}

.success-detail {
  font-size: 14px;
  color: #4a5568;
  line-height: 2;
}

.no-bank-notice {
  background: white;
  margin: 16px;
  padding: 32px 24px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.notice-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.notice-title {
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 16px;
}

.notice-text {
  font-size: 14px;
  color: #718096;
  line-height: 2;
}

.notice-text p {
  margin: 8px 0;
}

.quick-select {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.quick-select-title {
  font-size: 14px;
  color: #718096;
  margin-bottom: 12px;
}

.quick-select-item {
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #4a5568;
}

.quick-select-item:hover {
  background: #ebf8ff;
  border-color: #00B4D8;
  color: #00B4D8;
}

.quick-select-item:active {
  transform: scale(0.98);
}

/* 手工录入样式 */
.manual-input-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.manual-input-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
}

.manual-input-hint {
  font-size: 13px;
  color: #718096;
  text-align: center;
  margin-bottom: 20px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 8px;
}

.manual-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #00B4D8;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #00B4D8;
}

.word-input-group {
  display: flex;
  gap: 8px;
}

.word-input {
  flex: 1;
}

.btn-query {
  padding: 12px 20px;
  background: linear-gradient(135deg, #00B4D8 0%, #0077B6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-query:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 180, 216, 0.3);
}

.btn-query:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 查询结果展示 */
.queried-info {
  margin-top: 20px;
  padding: 16px;
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 12px;
}

.queried-title {
  font-size: 16px;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 16px;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.added-words-list {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
}

.added-words-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #2d3748;
}

.added-word-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
  margin-bottom: 8px;
}

.added-word-info {
  flex: 1;
}

.added-word-text {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.added-word-def {
  font-size: 13px;
  color: #718096;
  margin-top: 4px;
}

.btn-remove {
  width: 32px;
  height: 32px;
  border: none;
  background: #f56c6c;
  color: white;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #e63946;
  transform: scale(1.1);
}

.batch-actions {
  margin-top: 16px;
}

.batch-input-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
}

.batch-input-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2d3748;
}

.batch-input-hint {
  font-size: 13px;
  color: #718096;
  margin-bottom: 12px;
}

.batch-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
  font-family: monospace;
  transition: border-color 0.2s;
}

.batch-textarea:focus {
  outline: none;
  border-color: #00B4D8;
}

.btn-warning {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
  width: 100%;
  padding: 14px;
  border-radius: 24px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
</style>

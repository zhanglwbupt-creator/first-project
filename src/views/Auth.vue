<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1 class="auth-title">📚 智能单词本</h1>
        <p class="auth-subtitle">高效记忆，轻松学习</p>
      </div>

      <!-- 登录/注册切换 -->
      <div class="auth-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: isLogin }" 
          @click="isLogin = true"
        >
          登录
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: !isLogin }" 
          @click="isLogin = false"
        >
          注册
        </button>
      </div>

      <!-- 登录表单 -->
      <form v-if="isLogin" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            v-model="form.username" 
            type="text" 
            class="form-input" 
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="form.password" 
            type="password" 
            class="form-input" 
            placeholder="请输入密码"
            required
          />
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- 注册表单 -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            v-model="form.username" 
            type="text" 
            class="form-input" 
            placeholder="请输入用户名（至少3个字符）"
            required
            minlength="3"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="form.password" 
            type="password" 
            class="form-input" 
            placeholder="请输入密码（至少6个字符）"
            required
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label class="form-label">昵称（可选）</label>
          <input 
            v-model="form.nickname" 
            type="text" 
            class="form-input" 
            placeholder="请输入昵称"
          />
        </div>

        <div class="form-group">
          <label class="form-label">邮箱（可选）</label>
          <input 
            v-model="form.email" 
            type="email" 
            class="form-input" 
            placeholder="请输入邮箱"
          />
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="auth-footer">
        <p v-if="isLogin" class="hint-text">
          还没有账号？<a href="#" @click.prevent="isLogin = false">立即注册</a>
        </p>
        <p v-else class="hint-text">
          已有账号？<a href="#" @click.prevent="isLogin = true">立即登录</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  email: ''
})

// 登录
const handleLogin = async () => {
  loading.value = true
  
  try {
    const response = await api.post('/api/auth/login', {
      username: form.username,
      password: form.password
    })

    // 保存token和用户信息
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    
    // 设置全局默认headers，所有axios实例都会使用
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
    
    console.log('登录成功，token已保存')
    console.log('用户信息:', response.data.user)
    
    alert('登录成功！')
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
    alert(error.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}

// 注册
const handleRegister = async () => {
  loading.value = true
  
  try {
    const response = await api.post('/api/auth/register', {
      username: form.username,
      password: form.password,
      nickname: form.nickname,
      email: form.email
    })

    // 保存token和用户信息
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    
    // 设置全局默认headers，所有axios实例都会使用
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
    
    console.log('注册成功，token已保存')
    console.log('用户信息:', response.data.user)
    
    alert('注册成功！')
    router.push('/')
  } catch (error) {
    console.error('注册失败:', error)
    alert(error.response?.data?.error || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  width: 100%;
  max-width: 420px;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-title {
  font-size: 32px;
  font-weight: bold;
  color: #2d3748;
  margin: 0 0 10px 0;
}

.auth-subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.auth-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: #f7fafc;
  padding: 5px;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  color: #718096;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.tab-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-submit {
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 30px;
  text-align: center;
}

.hint-text {
  font-size: 14px;
  color: #718096;
}

.hint-text a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.hint-text a:hover {
  text-decoration: underline;
}
</style>

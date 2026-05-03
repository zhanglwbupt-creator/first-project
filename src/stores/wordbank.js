import { defineStore } from 'pinia'
import api from '@/api'

export const useWordBankStore = defineStore('wordbank', {
  state: () => ({
    wordBanks: [],
    currentBank: null,
    loading: false
  }),

  getters: {
    getWordBankById: (state) => (id) => {
      return state.wordBanks.find(bank => bank.id === id)
    }
  },

  actions: {
    // 获取所有词库
    async fetchWordBanks() {
      this.loading = true
      try {
        const response = await api.get('/api/wordbanks')
        this.wordBanks = response.data
      } catch (error) {
        console.error('获取词库失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 创建词库
    async createWordBank(name, description = '') {
      console.log('开始创建词库:', name, description)
      try {
        const response = await api.post('/api/wordbanks', {
          name,
          description
        })
        console.log('创建词库成功:', response.data)
        this.wordBanks.push(response.data)
        return response.data
      } catch (error) {
        console.error('创建词库失败:', error)
        throw error
      }
    },

    // 删除词库
    async deleteWordBank(id) {
      try {
        await api.delete(`/api/wordbanks/${id}`)
        this.wordBanks = this.wordBanks.filter(bank => bank.id !== id)
      } catch (error) {
        console.error('删除词库失败:', error)
        throw error
      }
    },

    // 设置当前词库
    setCurrentBank(bank) {
      this.currentBank = bank
    }
  }
})

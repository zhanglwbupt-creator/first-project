import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Auth from '@/views/Auth.vue'
import WordBank from '@/views/WordBank.vue'
import WordBankDetail from '@/views/WordBankDetail.vue'
import Import from '@/views/Import.vue'
import StudyMode from '@/views/StudyMode.vue'
import StudyLearn from '@/views/StudyLearn.vue'
import StudyReview from '@/views/StudyReview.vue'
import StudyReport from '@/views/StudyReport.vue'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: Auth,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/wordbank',
    name: 'WordBank',
    component: WordBank
  },
  {
    path: '/wordbank/detail',
    name: 'WordBankDetail',
    component: WordBankDetail
  },
  {
    path: '/import',
    name: 'Import',
    component: Import
  },
  {
    path: '/study/mode',
    name: 'StudyMode',
    component: StudyMode
  },
  {
    path: '/study/learn',
    name: 'StudyLearn',
    component: StudyLearn
  },
  {
    path: '/study/review',
    name: 'StudyReview',
    component: StudyReview
  },
  {
    path: '/study/report',
    name: 'StudyReport',
    component: StudyReport,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 如果路由需要认证
  if (to.meta.requiresAuth !== false) {
    if (!token) {
      // 未登录，跳转到登录页
      next('/auth')
    } else {
      next()
    }
  } else {
    // 如果已登录且访问登录页，跳转到首页
    if (to.path === '/auth' && token) {
      next('/')
    } else {
      next()
    }
  }
})

export default router

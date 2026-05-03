// 浏览器通知工具

// 请求通知权限
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('此浏览器不支持通知')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// 发送复习提醒
export function sendReviewReminder(wordCount = 0) {
  if (Notification.permission === 'granted') {
    const title = wordCount > 0 
      ? `有 ${wordCount} 个单词待复习` 
      : '该复习单词啦！'
    
    const notification = new Notification('📚 背单词提醒', {
      body: title + '，打开应用开始复习吧！',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'review-reminder',
      requireInteraction: true
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return true
  }
  return false
}

// 设置定时复习提醒
export function scheduleReviewReminder(hour = 20, minute = 0) {
  // 检查是否已经设置过
  const lastSchedule = localStorage.getItem('lastReviewSchedule')
  const today = new Date().toDateString()
  
  if (lastSchedule === today) {
    return // 今天已经设置过
  }

  // 计算下次提醒时间
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(hour, minute, 0, 0)

  // 如果今天的时间已过，设置为明天
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const delay = scheduledTime.getTime() - now.getTime()

  // 设置定时器
  setTimeout(() => {
    sendReviewReminder()
    localStorage.setItem('lastReviewSchedule', new Date().toDateString())
  }, delay)

  console.log(`复习提醒已设置：${scheduledTime.toLocaleString()}`)
  return scheduledTime
}

// 初始化通知
export async function initNotifications() {
  const hasPermission = await requestNotificationPermission()
  
  if (hasPermission) {
    // 默认晚上8点提醒
    const scheduledTime = scheduleReviewReminder(20, 0)
    return {
      success: true,
      scheduledTime
    }
  }
  
  return {
    success: false,
    message: '用户拒绝了通知权限'
  }
}

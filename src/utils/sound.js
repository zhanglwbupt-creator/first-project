/**
 * 音效工具函数
 * 使用 Web Audio API 生成简单的提示音
 */

let audioContext = null

/**
 * 获取 AudioContext（延迟初始化）
 */
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

/**
 * 播放正确提示音（清脆的“叮”声）
 */
export function playCorrectSound() {
  try {
    const ctx = getAudioContext()
    
    // 创建振荡器
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    // 设置音调（高音，表示正确）
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
    
    // 设置音量包络
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    // 连接节点
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // 播放
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  } catch (error) {
    console.warn('播放音效失败:', error)
  }
}

/**
 * 播放错误提示音（经典的"错误"声）
 */
export function playWrongSound() {
  try {
    const ctx = getAudioContext()
    
    // 创建振荡器
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    // 使用方波，声音更刺耳
    oscillator.type = 'square'
    
    // 设置音调（快速下降的低音）
    oscillator.frequency.setValueAtTime(300, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3)
    
    // 设置音量包络（快速衰减）
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    // 连接节点
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // 播放
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  } catch (error) {
    console.warn('播放音效失败:', error)
  }
}

/**
 * 播放完成提示音（胜利的旋律）
 */
export function playCompleteSound() {
  try {
    const ctx = getAudioContext()
    
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      const startTime = ctx.currentTime + index * 0.15
      
      oscillator.frequency.setValueAtTime(freq, startTime)
      
      gainNode.gain.setValueAtTime(0.2, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.2)
    })
  } catch (error) {
    console.warn('播放音效失败:', error)
  }
}

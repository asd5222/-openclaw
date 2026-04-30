/**
 * AI视频工厂 v4.0 - 前端主逻辑
 */

// 全局状态
const state = {
  currentTab: 'factory',
  tasks: [],
  trending: null,
  settings: {
    autoTrending: true,
    autoCreate: false,
    autoPublish: false,
    dailyLimit: 10
  }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  // 加载初始数据
  await Promise.all([
    loadTasks(),
    loadTrending(),
    loadStats()
  ]);
  
  // 启动定时刷新
  setInterval(refreshData, 5000);
  
  console.log('✅ AI视频工厂 v4.0 初始化完成');
}

// ==================== 页面切换 ====================

function switchTab(tab) {
  state.currentTab = tab;
  
  // 更新导航
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
  
  // 更新页面
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${tab}`).classList.add('active');
  
  // 加载对应数据
  if (tab === 'queue') renderQueue();
  if (tab === 'data') loadStats();
}

// ==================== 视频创建 ====================

async function createVideo() {
  const topic = document.getElementById('quickTopic').value.trim();
  const platform = document.getElementById('quickPlatform').value;
  const duration = document.getElementById('quickDuration').value;
  
  if (!topic) {
    showNotification('请输入视频主题', 'warning');
    return;
  }
  
  try {
    showNotification('正在创建视频任务...', 'info');
    
    const response = await fetch('/api/queue/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, platform, duration, style: 'mixed' })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('视频任务已创建，开始AI生产！', 'success');
      document.getElementById('quickTopic').value = '';
      await loadTasks();
      renderProducing();
    } else {
      showNotification(result.error || '创建失败', 'error');
    }
  } catch (error) {
    console.error('创建视频失败:', error);
    showNotification('创建失败，请重试', 'error');
  }
}

function useTopic(topic) {
  document.getElementById('quickTopic').value = topic;
  showNotification(`已选择主题：${topic}`, 'info');
  
  // 滚动到创建区
  document.querySelector('.quick-create').scrollIntoView({ behavior: 'smooth' });
}

// ==================== 数据加载 ====================

async function loadTasks() {
  try {
    const response = await fetch('/api/queue/list');
    const result = await response.json();
    
    if (result.success) {
      state.tasks = result.tasks;
      updateQueueBadge();
      renderProducing();
      renderCompleted();
      renderQueue();
    }
  } catch (error) {
    console.error('加载任务失败:', error);
  }
}

async function loadTrending() {
  try {
    const response = await fetch('/api/trending/tech');
    const result = await response.json();
    
    if (result.success) {
      state.trending = result.data;
      renderTrending();
      renderAIRecommend();
    }
  } catch (error) {
    console.error('加载热点失败:', error);
  }
}

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const result = await response.json();
    
    if (result.success) {
      const stats = result.stats;
      document.getElementById('dataTotalVideos').textContent = stats.total;
      document.getElementById('dataWeekVideos').textContent = stats.completed;
      document.getElementById('dataSavedTime').textContent = stats.savedTime;
      document.getElementById('dataPublished').textContent = stats.completed;
      document.getElementById('dataPlatforms').textContent = '4';
      document.getElementById('dataEfficiency').textContent = 
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) + '%' : '0%';
      
      // 更新队列统计
      document.getElementById('statPending').textContent = stats.pending;
      document.getElementById('statProcessing').textContent = stats.generating;
      document.getElementById('statCompleted').textContent = stats.completed;
    }
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

// ==================== 渲染函数 ====================

function renderProducing() {
  const container = document.getElementById('producingList');
  const producing = state.tasks.filter(t => t.status === 'generating');
  
  if (producing.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🎬</span>
        <p>暂无正在生产的视频</p>
        <p class="empty-tip">点击上方"开始AI生产"创建你的第一个视频</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = producing.map(task => `
    <div class="video-card">
      <div class="video-thumb">
        <div class="video-overlay">
          <div class="progress-ring"></div>
          <div class="progress-text">${task.progress}%</div>
        </div>
      </div>
      <div class="video-info">
        <div class="video-title">${task.topic}</div>
        <div class="video-meta">
          <span>${getPlatformName(task.platform)}</span>
          <span>${task.duration}</span>
        </div>
        <div class="progress-bar" style="margin-top: 12px;">
          <div class="progress-fill" style="width: ${task.progress}%"></div>
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">
          ${getCurrentStep(task)}
        </div>
      </div>
    </div>
  `).join('');
}

function renderCompleted() {
  const container = document.getElementById('completedList');
  const completed = state.tasks.filter(t => t.status === 'completed').slice(0, 6);
  
  if (completed.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">✅</span>
        <p>暂无已完成的视频</p>
        <p class="empty-tip">视频生产完成后会出现在这里</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = completed.map(task => `
    <div class="video-card">
      <div class="video-thumb">
        <span class="status-badge completed">已完成</span>
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 48px;">
          🎬
        </div>
      </div>
      <div class="video-info">
        <div class="video-title">${task.title || task.topic}</div>
        <div class="video-meta">
          <span>${getPlatformName(task.platform)}</span>
          <span>${formatTime(task.createdAt)}</span>
        </div>
        <div class="video-actions">
          <button class="btn-preview" onclick="previewVideo('${task.id}')">预览</button>
          <button class="btn-publish" onclick="publishVideo('${task.id}')">发布</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderQueue() {
  const container = document.getElementById('queueList');
  
  if (state.tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <p>队列为空</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = state.tasks.map(task => `
    <div class="queue-item">
      <div class="queue-status ${task.status}">
        ${getStatusIcon(task.status)}
      </div>
      <div class="queue-info">
        <div class="queue-title">${task.topic}</div>
        <div class="queue-meta">
          ${getPlatformName(task.platform)} · ${task.duration} · ${formatTime(task.createdAt)}
        </div>
      </div>
      <div class="queue-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${task.progress}%"></div>
        </div>
        <div style="text-align: center; margin-top: 4px; font-size: 12px; color: var(--text-muted);">
          ${task.progress}%
        </div>
      </div>
      <div class="queue-actions">
        ${task.status === 'completed' ? `
          <button class="btn-primary" onclick="publishVideo('${task.id}')">发布</button>
        ` : ''}
        <button class="btn-secondary" onclick="deleteTask('${task.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

function renderTrending() {
  if (!state.trending) return;
  
  const platforms = ['douyin', 'bilibili', 'xiaohongshu', 'weibo'];
  
  platforms.forEach(platform => {
    const container = document.getElementById(`trending-${platform}`);
    if (!container) return;
    
    const data = state.trending.platforms[platform] || [];
    
    container.innerHTML = data.map((item, index) => `
      <div class="trending-item ${item.hot ? 'hot' : ''}">
        <span class="rank">${item.rank}</span>
        <span class="topic">${item.topic}</span>
        <span class="heat">🔥 ${formatHeat(item.heat)}</span>
        <button class="btn-use" onclick="useTopic('${item.topic.replace(/'/g, "\\'")}')">使用</button>
      </div>
    `).join('');
  });
}

function renderAIRecommend() {
  const container = document.getElementById('aiRecommendList');
  
  // 模拟AI推荐
  const recommends = [
    { topic: 'AI工具实测：3个提升效率的神器', score: 95, reason: '热度高 + 竞争度低 + 符合账号定位' },
    { topic: 'ChatGPT新功能深度解析', score: 88, reason: '时效性强 + 搜索量大' },
    { topic: '效率工具推荐：打工人必备', score: 82, reason: '实用性强 + 易传播' },
  ];
  
  container.innerHTML = recommends.map(item => `
    <div class="recommend-item">
      <div class="recommend-score">${item.score}</div>
      <div class="recommend-info">
        <div class="recommend-title">${item.topic}</div>
        <div class="recommend-reason">${item.reason}</div>
      </div>
      <button class="btn-primary" onclick="useTopic('${item.topic.replace(/'/g, "\\'")}')">选用</button>
    </div>
  `).join('');
}

// ==================== 辅助函数 ====================

function getPlatformName(platform) {
  const names = {
    douyin: '🎵 抖音',
    bilibili: '📺 B站',
    xiaohongshu: '📕 小红书',
    shipinhao: '💬 视频号',
    kuaishou: '⚡ 快手',
    youtube: '▶️ YouTube'
  };
  return names[platform] || platform;
}

function getStatusIcon(status) {
  const icons = {
    pending: '⏳',
    generating: '⚙️',
    completed: '✅',
    failed: '❌'
  };
  return icons[status] || '⏳';
}

function getCurrentStep(task) {
  if (!task.steps) return '准备中...';
  const current = task.steps.find(s => s.status === 'processing');
  return current ? `正在${current.name}...` : '等待中...';
}

function formatHeat(heat) {
  if (heat >= 10000) {
    return (heat / 10000).toFixed(1) + '万';
  }
  return heat;
}

function formatTime(timeStr) {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = (now - date) / 1000;
  
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  return date.toLocaleDateString();
}

function updateQueueBadge() {
  const pending = state.tasks.filter(t => t.status === 'pending' || t.status === 'generating').length;
  const badge = document.getElementById('queueBadge');
  badge.textContent = pending;
  badge.style.display = pending > 0 ? 'block' : 'none';
}

// ==================== 操作函数 ====================

async function deleteTask(taskId) {
  if (!confirm('确定要删除这个任务吗？')) return;
  
  try {
    const response = await fetch(`/api/queue/${taskId}`, { method: 'DELETE' });
    const result = await response.json();
    
    if (result.success) {
      showNotification('任务已删除', 'success');
      await loadTasks();
    }
  } catch (error) {
    console.error('删除失败:', error);
    showNotification('删除失败', 'error');
  }
}

function previewVideo(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  document.getElementById('modalTitle').value = task.title || task.topic;
  document.getElementById('modalDesc').value = task.description || '';
  document.getElementById('modalTags').value = task.tags ? task.tags.join(' ') : '';
  
  openModal('videoModal');
}

function publishVideo(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  // 设置发布预览
  openModal('publishConfirmModal');
}

function addToPublishQueue() {
  closeModal('videoModal');
  showNotification('已加入发布队列', 'success');
}

function downloadVideo() {
  showNotification('开始下载视频...', 'info');
}

async function confirmPublish() {
  const timeType = document.getElementById('publishTimeType').value;
  const scheduleTime = timeType === 'schedule' ? document.getElementById('scheduleTime').value : null;
  
  // 获取选中的平台
  const platforms = Array.from(document.querySelectorAll('.platform-check input:checked'))
    .map(cb => cb.value);
  
  if (platforms.length === 0) {
    showNotification('请至少选择一个平台', 'warning');
    return;
  }
  
  showNotification(timeType === 'now' ? '正在发布...' : '已设置定时发布', 'success');
  closeModal('publishConfirmModal');
}

// ==================== 模态框 ====================

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function openAutoSettings() {
  document.getElementById('autoTrending').checked = state.settings.autoTrending;
  document.getElementById('autoCreate').checked = state.settings.autoCreate;
  document.getElementById('autoPublish').checked = state.settings.autoPublish;
  document.getElementById('dailyLimit').value = state.settings.dailyLimit;
  openModal('settingsModal');
}

function saveSettings() {
  state.settings = {
    autoTrending: document.getElementById('autoTrending').checked,
    autoCreate: document.getElementById('autoCreate').checked,
    autoPublish: document.getElementById('autoPublish').checked,
    dailyLimit: parseInt(document.getElementById('dailyLimit').value) || 10
  };
  
  showNotification('设置已保存', 'success');
  closeModal('settingsModal');
}

function openScheduleModal() {
  showNotification('定时发布功能开发中', 'info');
}

function batchPublish() {
  showNotification('批量发布功能开发中', 'info');
}

// ==================== 刷新函数 ====================

async function refreshData() {
  await loadTasks();
}

function refreshHotTopics() {
  showNotification('正在刷新热点...', 'info');
  loadTrending();
}

function refreshAllTrending() {
  refreshHotTopics();
}

function openMonitorSettings() {
  showNotification('监控设置功能开发中', 'info');
}

// ==================== 样式切换 ====================

// 风格按钮切换
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('style-btn')) {
    document.querySelectorAll('.style-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
  }
});

// 发布时间类型切换
document.getElementById('publishTimeType')?.addEventListener('change', (e) => {
  const group = document.getElementById('scheduleTimeGroup');
  if (e.target.value === 'schedule') {
    group.classList.remove('hidden');
  } else {
    group.classList.add('hidden');
  }
});

// ==================== 通知 ====================

function showNotification(message, type = 'info') {
  // 创建通知元素
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  notif.textContent = message;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// 导出函数供HTML调用
window.switchTab = switchTab;
window.createVideo = createVideo;
window.useTopic = useTopic;
window.deleteTask = deleteTask;
window.previewVideo = previewVideo;
window.publishVideo = publishVideo;
window.addToPublishQueue = addToPublishQueue;
window.downloadVideo = downloadVideo;
window.confirmPublish = confirmPublish;
window.openModal = openModal;
window.closeModal = closeModal;
window.openAutoSettings = openAutoSettings;
window.saveSettings = saveSettings;
window.refreshHotTopics = refreshHotTopics;
window.refreshAllTrending = refreshAllTrending;
window.openMonitorSettings = openMonitorSettings;
window.openScheduleModal = openScheduleModal;
window.batchPublish = batchPublish;

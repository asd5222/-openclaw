/**
 * AI视频工厂 v5.0 - 前端应用
 */

// API基础URL
const API_BASE = 'http://localhost:3005';

// 当前选中的风格
let currentStyle = 'tech';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  // 加载初始数据
  await Promise.all([
    loadQueueStats(),
    loadTrendingData(),
    loadCompletedVideos(),
    loadPublishQueue()
  ]);
  
  // 启动定时刷新
  setInterval(() => {
    loadQueueStats();
    loadProducingVideos();
  }, 3000);
}

// ===== 标签切换 =====
function switchTab(tabName) {
  // 更新标签状态
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.closest('.nav-tab').classList.add('active');
  
  // 更新页面显示
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(`page-${tabName}`).classList.add('active');
  
  // 加载对应数据
  if (tabName === 'queue') {
    loadQueueList();
  } else if (tabName === 'publish') {
    loadPublishQueue();
  } else if (tabName === 'data') {
    loadDataStats();
  } else if (tabName === 'trending') {
    loadTrendingData();
  } else if (tabName === 'strategy') {
    loadStrategyData();
  }
}

// ===== 风格选择 =====
function selectStyle(btn) {
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentStyle = btn.dataset.style;
  updateStrategyPreview();
}

// ===== 更新策略预览 =====
function updateStrategyPreview() {
  const platform = document.getElementById('quickPlatform').value;
  const style = currentStyle;
  
  // 模拟策略数据
  const strategies = {
    douyin: {
      duration: '15-60秒',
      time: '12:00-13:00, 18:00-20:00',
      tips: '前3秒必须有冲击力，每15秒一个信息点'
    },
    bilibili: {
      duration: '3-10分钟',
      time: '11:00-13:00, 17:00-19:00',
      tips: '开头介绍大纲，中间详细讲解，结尾总结预告'
    },
    xiaohongshu: {
      duration: '30-90秒',
      time: '07:00-09:00, 12:00-14:00',
      tips: '封面精美吸睛，内容实用可收藏，多用emoji'
    }
  };
  
  const strategy = strategies[platform] || strategies.douyin;
  
  const previewHTML = `
    <div class="preview-header">
      <span>🧠 AI策略分析</span>
      <span class="preview-score">热度分: <strong>${Math.floor(Math.random() * 20) + 75}</strong></span>
    </div>
    <div class="preview-content">
      <div class="preview-item">
        <span class="preview-label">推荐时长</span>
        <span class="preview-value">${strategy.duration}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">最佳发布时间</span>
        <span class="preview-value">${strategy.time}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">内容建议</span>
        <span class="preview-value">${strategy.tips}</span>
      </div>
    </div>
  `;
  
  document.getElementById('strategyPreview').innerHTML = previewHTML;
}

// ===== 创建视频 =====
async function createVideo() {
  const topic = document.getElementById('quickTopic').value.trim();
  const platform = document.getElementById('quickPlatform').value;
  const duration = document.getElementById('quickDuration').value;
  
  if (!topic) {
    alert('请输入视频主题');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/queue/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        platform,
        duration,
        style: currentStyle
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ 视频任务已创建，开始AI智能生产！');
      document.getElementById('quickTopic').value = '';
      loadQueueStats();
      loadProducingVideos();
    } else {
      alert('❌ 创建失败: ' + data.error);
    }
  } catch (error) {
    console.error('创建视频失败:', error);
    alert('❌ 网络错误，请稍后重试');
  }
}

// ===== 使用话题 =====
function useTopic(topic) {
  document.getElementById('quickTopic').value = topic;
  updateStrategyPreview();
  // 滚动到创建区域
  document.querySelector('.quick-create').scrollIntoView({ behavior: 'smooth' });
}

// ===== 加载队列统计 =====
async function loadQueueStats() {
  try {
    const response = await fetch(`${API_BASE}/api/queue/list`);
    const data = await response.json();
    
    if (data.success) {
      const tasks = data.tasks;
      const pending = tasks.filter(t => t.status === 'pending').length;
      const processing = tasks.filter(t => t.status === 'generating' || t.progress > 0 && t.progress < 100).length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      
      document.getElementById('queueBadge').textContent = pending + processing;
      document.getElementById('statPending').textContent = pending;
      document.getElementById('statProcessing').textContent = processing;
      document.getElementById('statCompleted').textContent = completed;
    }
  } catch (error) {
    console.error('加载队列统计失败:', error);
  }
}

// ===== 加载生产中视频 =====
async function loadProducingVideos() {
  try {
    const response = await fetch(`${API_BASE}/api/queue/list`);
    const data = await response.json();
    
    if (data.success) {
      const producing = data.tasks.filter(t => 
        t.status === 'pending' || t.status === 'generating' || (t.progress > 0 && t.progress < 100)
      ).slice(0, 5);
      
      const container = document.getElementById('producingList');
      
      if (producing.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">🎬</span>
            <p>暂无正在生产的视频</p>
            <p class="empty-tip">点击上方"开始AI智能生产"创建你的第一个视频</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = producing.map(task => `
        <div class="producing-item">
          <div class="producing-info">
            <div class="producing-title">${task.topic}</div>
            <div class="producing-meta">
              <span class="platform-badge">${getPlatformIcon(task.platform)} ${getPlatformName(task.platform)}</span>
              <span class="style-badge">${getStyleName(task.style || 'tech')}</span>
            </div>
          </div>
          <div class="producing-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${task.progress || 0}%"></div>
            </div>
            <div class="progress-info">
              <span class="progress-text">${task.progress || 0}%</span>
              <span class="progress-step">${task.currentStep || '等待中...'}</span>
            </div>
          </div>
          <div class="producing-steps">
            ${(task.steps || []).map(step => `
              <span class="step-dot ${step.status}"></span>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('加载生产中视频失败:', error);
  }
}

// ===== 加载已完成视频 =====
async function loadCompletedVideos() {
  try {
    const response = await fetch(`${API_BASE}/api/queue/list`);
    const data = await response.json();
    
    if (data.success) {
      const completed = data.tasks.filter(t => t.status === 'completed').slice(0, 6);
      
      const container = document.getElementById('completedList');
      
      if (completed.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>暂无已完成视频</p></div>';
        return;
      }
      
      container.innerHTML = completed.map(task => `
        <div class="video-card" onclick="showVideoDetail('${task.id}')">
          <div class="video-thumb">
            <div class="video-thumb-placeholder">
              <span>🎬</span>
              <p>${task.topic}</p>
            </div>
            ${task.thumbnail ? `<img src="${task.thumbnail}" alt="">` : ''}
          </div>
          <div class="video-info-card">
            <div class="video-title">${task.title || task.topic}</div>
            <div class="video-meta">
              <span>${getPlatformIcon(task.platform)} ${getPlatformName(task.platform)}</span>
              <span>${formatTime(task.createdAt)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('加载已完成视频失败:', error);
  }
}

// ===== 加载热点数据 =====
async function loadTrendingData() {
  try {
    const response = await fetch(`${API_BASE}/api/trending/tech`);
    const data = await response.json();
    
    if (data.success) {
      const platforms = ['douyin', 'bilibili', 'xiaohongshu', 'weibo'];
      
      platforms.forEach(platform => {
        const container = document.getElementById(`trending-${platform}`);
        const topics = data.data.platforms[platform] || [];
        
        if (container) {
          container.innerHTML = topics.map((topic, index) => `
            <div class="trending-item" onclick="useTopic('${topic.topic}')">
              <span class="trending-rank ${index < 3 ? 'top' : ''}">${topic.rank}</span>
              <span class="trending-topic">${topic.topic}</span>
              <span class="trending-heat">${topic.heat}万</span>
              ${topic.hot ? '<span class="trending-hot">HOT</span>' : ''}
            </div>
          `).join('');
        }
      });
    }
  } catch (error) {
    console.error('加载热点数据失败:', error);
  }
}

// ===== 加载队列列表 =====
async function loadQueueList() {
  try {
    const response = await fetch(`${API_BASE}/api/queue/list`);
    const data = await response.json();
    
    if (data.success) {
      const container = document.getElementById('queueList');
      
      if (data.tasks.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">📋</span>
            <p>暂无任务</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = data.tasks.map(task => `
        <div class="queue-item ${task.status}">
          <div class="queue-info">
            <div class="queue-title">${task.topic}</div>
            <div class="queue-meta">
              <span>${getPlatformIcon(task.platform)} ${getPlatformName(task.platform)}</span>
              <span>${formatTime(task.createdAt)}</span>
            </div>
          </div>
          <div class="queue-status">
            <span class="status-badge ${task.status}">${getStatusText(task.status)}</span>
            ${task.progress > 0 ? `<span class="progress-text">${task.progress}%</span>` : ''}
          </div>
          <div class="queue-actions">
            ${task.status === 'completed' ? `
              <button class="btn-small" onclick="addToPublish('${task.id}')">发布</button>
            ` : ''}
            <button class="btn-small btn-danger" onclick="deleteTask('${task.id}')">删除</button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('加载队列列表失败:', error);
  }
}

// ===== 加载发布队列 =====
async function loadPublishQueue() {
  try {
    const response = await fetch(`${API_BASE}/api/publish/queue`);
    const data = await response.json();
    
    if (data.success) {
      const container = document.getElementById('pendingPublishList');
      
      if (data.pending.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">📦</span>
            <p>暂无待发布视频</p>
            <p class="empty-tip">视频生产完成后会出现在这里</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = data.pending.map(item => `
        <div class="publish-card">
          <div class="publish-thumb">
            <span>🎬</span>
          </div>
          <div class="publish-info">
            <div class="publish-title">${item.video.title || '未命名视频'}</div>
            <div class="publish-platforms">
              ${item.platforms.map(p => `
                <span class="platform-tag">${getPlatformIcon(p.name)} ${getPlatformName(p.name)}</span>
              `).join('')}
            </div>
          </div>
          <div class="publish-actions">
            <button class="btn-small btn-primary" onclick="confirmPublishItem('${item.id}')">确认发布</button>
            <button class="btn-small" onclick="cancelPublish('${item.id}')">取消</button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('加载发布队列失败:', error);
  }
}

// ===== 加载数据统计 =====
async function loadDataStats() {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    const data = await response.json();
    
    if (data.success) {
      const videoStats = data.stats.videoGeneration;
      const publishStats = data.stats.publishing;
      
      document.getElementById('dataTotalVideos').textContent = videoStats.total;
      document.getElementById('dataWeekVideos').textContent = videoStats.completed;
      document.getElementById('dataSavedTime').textContent = videoStats.savedTime;
      document.getElementById('dataPublished').textContent = publishStats.published || 0;
      document.getElementById('dataPlatforms').textContent = Object.keys(publishStats.platformStats || {}).length;
      document.getElementById('dataSuccessRate').textContent = (publishStats.successRate || 0) + '%';
      document.getElementById('dataAvgTime').textContent = publishStats.avgPublishTime || 0;
    }
  } catch (error) {
    console.error('加载数据统计失败:', error);
  }
}

// ===== 模态框操作 =====
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function openAutoSettings() {
  openModal('settingsModal');
}

function openScheduleModal() {
  openModal('publishConfirmModal');
}

function toggleScheduleTime() {
  const type = document.getElementById('publishTimeType').value;
  const scheduleGroup = document.getElementById('scheduleTimeGroup');
  const aiRecommend = document.getElementById('aiRecommendTime');
  
  if (type === 'schedule') {
    scheduleGroup.classList.remove('hidden');
    aiRecommend.classList.add('hidden');
  } else if (type === 'ai') {
    scheduleGroup.classList.add('hidden');
    aiRecommend.classList.remove('hidden');
  } else {
    scheduleGroup.classList.add('hidden');
    aiRecommend.classList.add('hidden');
  }
}

// ===== 辅助函数 =====
function getPlatformIcon(platform) {
  const icons = {
    douyin: '🎵',
    bilibili: '📺',
    xiaohongshu: '📕',
    shipinhao: '💬',
    kuaishou: '⚡',
    weibo: '👁️'
  };
  return icons[platform] || '📱';
}

function getPlatformName(platform) {
  const names = {
    douyin: '抖音',
    bilibili: 'B站',
    xiaohongshu: '小红书',
    shipinhao: '视频号',
    kuaishou: '快手',
    weibo: '微博'
  };
  return names[platform] || platform;
}

function getStyleName(style) {
  const names = {
    tech: '科技风',
    lifestyle: '生活风',
    knowledge: '知识风',
    mixed: '混剪',
    slideshow: '图文',
    ai: 'AI动画'
  };
  return names[style] || style;
}

function getStatusText(status) {
  const texts = {
    pending: '等待中',
    generating: '生产中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return texts[status] || status;
}

function formatTime(timeStr) {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  return date.toLocaleDateString();
}

// ===== 其他功能 =====
function refreshHotTopics() {
  loadTrendingData();
  alert('🔄 热点已刷新');
}

function refreshAllTrending() {
  loadTrendingData();
  alert('🔄 全部热点已刷新');
}

function analyzeTopic() {
  alert('🔍 话题分析功能开发中...');
}

function refreshStrategy() {
  alert('🔄 策略已刷新');
}

function openMonitorSettings() {
  alert('⚙️ 监控设置功能开发中...');
}

function saveSettings() {
  closeModal('settingsModal');
  alert('💾 设置已保存');
}

function showVideoDetail(taskId) {
  openModal('videoModal');
  // 加载视频详情
}

function addToPublishQueue() {
  closeModal('videoModal');
  alert('🚀 已加入发布队列');
}

function downloadVideo() {
  alert('⬇️ 开始下载视频...');
}

function addToPublish(taskId) {
  alert('🚀 已添加到发布队列');
}

async function deleteTask(taskId) {
  if (!confirm('确定要删除这个任务吗？')) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/queue/${taskId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ 任务已删除');
      loadQueueList();
      loadQueueStats();
    }
  } catch (error) {
    console.error('删除任务失败:', error);
  }
}

function batchPublish() {
  alert('📤 批量发布功能开发中...');
}

function confirmPublishItem(publishId) {
  openModal('publishConfirmModal');
}

function confirmPublish() {
  closeModal('publishConfirmModal');
  alert('✅ 发布任务已确认');
}

function cancelPublish(publishId) {
  if (!confirm('确定要取消这个发布任务吗？')) return;
  alert('✅ 发布任务已取消');
}

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
  .producing-item {
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .producing-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .producing-title {
    font-weight: 600;
  }
  
  .producing-meta {
    display: flex;
    gap: 8px;
  }
  
  .platform-badge, .style-badge {
    font-size: 11px;
    padding: 2px 8px;
    background: var(--bg-primary);
    border-radius: 10px;
  }
  
  .progress-bar {
    height: 6px;
    background: var(--border-color);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--secondary));
    border-radius: 3px;
    transition: width 0.3s;
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .producing-steps {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }
  
  .step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border-color);
  }
  
  .step-dot.completed {
    background: var(--success);
  }
  
  .step-dot.processing {
    background: var(--info);
  }
  
  .video-thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
  }
  
  .video-thumb-placeholder span {
    font-size: 32px;
    margin-bottom: 4px;
  }
  
  .video-thumb-placeholder p {
    font-size: 12px;
    padding: 0 8px;
    text-align: center;
  }
  
  .trending-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .trending-item:hover {
    background: var(--bg-tertiary);
  }
  
  .trending-rank {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary);
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }
  
  .trending-rank.top {
    background: var(--warning);
    color: white;
  }
  
  .trending-topic {
    flex: 1;
    font-size: 13px;
  }
  
  .trending-heat {
    font-size: 11px;
    color: var(--text-tertiary);
  }
  
  .trending-hot {
    font-size: 10px;
    padding: 2px 6px;
    background: var(--danger);
    color: white;
    border-radius: 4px;
  }
  
  .queue-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    margin-bottom: 10px;
  }
  
  .queue-info {
    flex: 1;
  }
  
  .queue-title {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .queue-meta {
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    gap: 12px;
  }
  
  .queue-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .status-badge {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 20px;
  }
  
  .status-badge.pending {
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning);
  }
  
  .status-badge.completed {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
  }
  
  .status-badge.failed {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
  }
  
  .queue-actions {
    display: flex;
    gap: 8px;
  }
  
  .btn-small {
    padding: 6px 12px;
    font-size: 12px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    border-radius: var(--radius);
    cursor: pointer;
  }
  
  .btn-small.btn-primary {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
  
  .btn-small.btn-danger {
    color: var(--danger);
    border-color: var(--danger);
  }
  
  .publish-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
  }
  
  .publish-thumb {
    width: 80px;
    height: 60px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border-radius: var(--radius);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  
  .publish-info {
    flex: 1;
  }
  
  .publish-title {
    font-weight: 600;
    margin-bottom: 6px;
  }
  
  .publish-platforms {
    display: flex;
    gap: 6px;
  }
  
  .platform-tag {
    font-size: 11px;
    padding: 2px 8px;
    background: var(--bg-primary);
    border-radius: 10px;
  }
`;
document.head.appendChild(style);

/**
 * 发布管理器 - 半自动发布方案
 * 管理发布队列，支持人工确认后自动发布
 */

const fs = require('fs');
const path = require('path');

// 发布队列
let publishQueue = [];
let publishHistory = [];

// 平台配置
const PLATFORM_CONFIG = {
  douyin: {
    name: '抖音',
    icon: '🎵',
    enabled: true,
    loginRequired: true,
    maxDuration: 300, // 5分钟
    supportTopics: ['科技', '数码', '教程']
  },
  bilibili: {
    name: 'B站',
    icon: '📺',
    enabled: true,
    loginRequired: true,
    maxDuration: 600, // 10分钟
    supportTopics: ['科技', '数码', '知识']
  },
  xiaohongshu: {
    name: '小红书',
    icon: '📕',
    enabled: true,
    loginRequired: true,
    maxDuration: 300,
    supportTopics: ['数码', '好物', '教程']
  },
  shipinhao: {
    name: '视频号',
    icon: '💬',
    enabled: false,
    loginRequired: true,
    maxDuration: 300,
    supportTopics: ['科技', '生活']
  },
  kuaishou: {
    name: '快手',
    icon: '⚡',
    enabled: false,
    loginRequired: true,
    maxDuration: 600,
    supportTopics: ['科技', '数码']
  }
};

/**
 * 发布管理器
 */
class PublishManager {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.ensureDirectories();
    this.loadData();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 添加视频到发布队列
   */
  addToQueue(videoData, platforms = ['douyin', 'bilibili']) {
    const publishId = `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const publishTask = {
      id: publishId,
      status: 'pending', // pending, confirmed, publishing, published, failed
      createdAt: new Date().toISOString(),
      video: videoData,
      platforms: platforms.map(p => ({
        name: p,
        status: 'pending', // pending, ready, publishing, published, failed
        error: null
      })),
      schedule: null, // 定时发布时间
      confirmedAt: null,
      publishedAt: null,
      stats: null
    };

    publishQueue.push(publishTask);
    this.saveData();

    return publishId;
  }

  /**
   * 确认发布（人工确认后调用）
   */
  async confirmPublish(publishId, options = {}) {
    const task = publishQueue.find(t => t.id === publishId);
    if (!task) {
      throw new Error('发布任务不存在');
    }

    if (task.status !== 'pending') {
      throw new Error('任务状态不正确');
    }

    task.status = 'confirmed';
    task.confirmedAt = new Date().toISOString();
    
    // 更新选项
    if (options.schedule) {
      task.schedule = options.schedule;
    }
    
    if (options.platforms) {
      task.platforms = options.platforms.map(p => ({
        name: p,
        status: 'ready',
        error: null
      }));
    }

    this.saveData();

    // 如果是立即发布，开始执行
    if (!task.schedule) {
      this.executePublish(task);
    }

    return task;
  }

  /**
   * 执行发布
   */
  async executePublish(task) {
    task.status = 'publishing';
    this.saveData();

    // 模拟发布过程
    for (const platform of task.platforms) {
      try {
        platform.status = 'publishing';
        this.saveData();

        // 这里调用实际的发布API
        // 由于API需要申请，目前使用模拟
        await this.simulatePublish(task.video, platform.name);

        platform.status = 'published';
        platform.publishedAt = new Date().toISOString();
        platform.url = this.generateMockUrl(platform.name, task.id);
        
      } catch (error) {
        platform.status = 'failed';
        platform.error = error.message;
      }
      
      this.saveData();
    }

    // 检查是否全部完成
    const allPublished = task.platforms.every(p => p.status === 'published');
    const hasFailed = task.platforms.some(p => p.status === 'failed');

    if (allPublished) {
      task.status = 'published';
      task.publishedAt = new Date().toISOString();
    } else if (hasFailed) {
      task.status = 'partial'; // 部分发布成功
    }

    // 移到历史记录
    publishHistory.unshift(task);
    publishQueue = publishQueue.filter(t => t.id !== task.id);
    
    this.saveData();
    
    return task;
  }

  /**
   * 模拟发布（实际项目中替换为真实API调用）
   */
  async simulatePublish(video, platform) {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟随机失败（10%概率）
    if (Math.random() < 0.1) {
      throw new Error('模拟：平台接口调用失败');
    }

    console.log(`✅ 已发布到 ${platform}: ${video.title}`);
    return true;
  }

  /**
   * 生成模拟URL
   */
  generateMockUrl(platform, id) {
    const urls = {
      douyin: `https://www.douyin.com/video/${id}`,
      bilibili: `https://www.bilibili.com/video/${id}`,
      xiaohongshu: `https://www.xiaohongshu.com/explore/${id}`,
      shipinhao: `https://channels.weixin.qq.com/video/${id}`,
      kuaishou: `https://www.kuaishou.com/short-video/${id}`
    };
    return urls[platform] || '#';
  }

  /**
   * 批量确认发布
   */
  async batchConfirm(publishIds, options = {}) {
    const results = [];
    for (const id of publishIds) {
      try {
        const result = await this.confirmPublish(id, options);
        results.push({ id, success: true, data: result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * 取消发布
   */
  cancelPublish(publishId) {
    const index = publishQueue.findIndex(t => t.id === publishId);
    if (index === -1) {
      throw new Error('发布任务不存在');
    }

    const task = publishQueue[index];
    if (task.status !== 'pending') {
      throw new Error('只能取消待确认的任务');
    }

    publishQueue.splice(index, 1);
    this.saveData();
    
    return { success: true };
  }

  /**
   * 获取待确认列表
   */
  getPendingList() {
    return publishQueue.filter(t => t.status === 'pending');
  }

  /**
   * 获取发布队列（全部）
   */
  getQueue() {
    return publishQueue;
  }

  /**
   * 获取发布历史
   */
  getHistory(limit = 50) {
    return publishHistory.slice(0, limit);
  }

  /**
   * 获取统计数据
   */
  getStats() {
    const total = publishHistory.length;
    const published = publishHistory.filter(t => t.status === 'published').length;
    const partial = publishHistory.filter(t => t.status === 'partial').length;
    const failed = publishHistory.filter(t => t.status === 'failed').length;
    
    const platformStats = {};
    for (const task of publishHistory) {
      for (const platform of task.platforms) {
        if (!platformStats[platform.name]) {
          platformStats[platform.name] = { total: 0, success: 0, failed: 0 };
        }
        platformStats[platform.name].total++;
        if (platform.status === 'published') {
          platformStats[platform.name].success++;
        } else {
          platformStats[platform.name].failed++;
        }
      }
    }

    return {
      total,
      published,
      partial,
      failed,
      pending: publishQueue.filter(t => t.status === 'pending').length,
      platformStats
    };
  }

  /**
   * 检查平台登录状态
   */
  checkPlatformLogin(platform) {
    // 实际项目中检查Cookie/Token是否有效
    const loginFile = path.join(this.dataDir, `login_${platform}.json`);
    if (fs.existsSync(loginFile)) {
      const data = JSON.parse(fs.readFileSync(loginFile, 'utf8'));
      return {
        loggedIn: true,
        username: data.username,
        expiresAt: data.expiresAt
      };
    }
    return { loggedIn: false };
  }

  /**
   * 模拟登录（实际项目中实现扫码登录）
   */
  async loginPlatform(platform) {
    // 返回二维码URL或登录链接
    const loginUrls = {
      douyin: 'https://open.douyin.com/platform/oauth/connect',
      bilibili: 'https://passport.bilibili.com/login',
      xiaohongshu: 'https://www.xiaohongshu.com/login'
    };

    return {
      platform,
      loginUrl: loginUrls[platform],
      message: `请在浏览器中打开链接完成${PLATFORM_CONFIG[platform].name}登录`
    };
  }

  saveData() {
    const queueFile = path.join(this.dataDir, 'publish-queue.json');
    const historyFile = path.join(this.dataDir, 'publish-history.json');
    
    fs.writeFileSync(queueFile, JSON.stringify(publishQueue, null, 2));
    fs.writeFileSync(historyFile, JSON.stringify(publishHistory, null, 2));
  }

  loadData() {
    const queueFile = path.join(this.dataDir, 'publish-queue.json');
    const historyFile = path.join(this.dataDir, 'publish-history.json');
    
    if (fs.existsSync(queueFile)) {
      publishQueue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    }
    if (fs.existsSync(historyFile)) {
      publishHistory = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
  }
}

// 单例
let manager = null;

function getPublishManager() {
  if (!manager) {
    manager = new PublishManager();
  }
  return manager;
}

module.exports = {
  PublishManager,
  getPublishManager,
  PLATFORM_CONFIG
};

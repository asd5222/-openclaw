/**
 * 发布管理器 - 增强版 v5.0
 * 集成社交媒体自动化、浏览器自动化技能
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
    maxDuration: 300,
    supportTopics: ['科技', '数码', '教程'],
    apiEndpoint: 'https://open.douyin.com',
    uploadUrl: 'https://creator.douyin.com',
    features: ['视频上传', '封面设置', '标题标签', '定时发布']
  },
  bilibili: {
    name: 'B站',
    icon: '📺',
    enabled: true,
    loginRequired: true,
    maxDuration: 600,
    supportTopics: ['科技', '数码', '知识'],
    apiEndpoint: 'https://api.bilibili.com',
    uploadUrl: 'https://member.bilibili.com',
    features: ['视频上传', '分P上传', '封面设置', '专栏投稿']
  },
  xiaohongshu: {
    name: '小红书',
    icon: '📕',
    enabled: true,
    loginRequired: true,
    maxDuration: 300,
    supportTopics: ['数码', '好物', '教程'],
    apiEndpoint: 'https://edith.xiaohongshu.com',
    uploadUrl: 'https://creator.xiaohongshu.com',
    features: ['视频上传', '图文发布', '话题标签', '商品挂载']
  },
  shipinhao: {
    name: '视频号',
    icon: '💬',
    enabled: false,
    loginRequired: true,
    maxDuration: 300,
    supportTopics: ['科技', '生活'],
    apiEndpoint: 'https://channels.weixin.qq.com',
    uploadUrl: 'https://channels.weixin.qq.com',
    features: ['视频上传', '直播预约', '商品分享']
  },
  kuaishou: {
    name: '快手',
    icon: '⚡',
    enabled: false,
    loginRequired: true,
    maxDuration: 600,
    supportTopics: ['科技', '数码'],
    apiEndpoint: 'https://openapi.kuaishou.com',
    uploadUrl: 'https://cp.kuaishou.com',
    features: ['视频上传', '直播', '商品挂载']
  }
};

// 社交媒体内容优化配置
const CONTENT_OPTIMIZATION = {
  titleOptimization: {
    douyin: {
      maxLength: 55,
      forbiddenWords: ['最', '第一', '顶级'],
      recommendedPatterns: ['数字+结果', '疑问句', '对比句'],
      emojiSupport: true
    },
    bilibili: {
      maxLength: 80,
      forbiddenWords: [],
      recommendedPatterns: ['【分类】+标题', 'UP主名+内容'],
      emojiSupport: true
    },
    xiaohongshu: {
      maxLength: 20,
      forbiddenWords: ['最', '第一'],
      recommendedPatterns: ['emoji+关键词', '攻略/测评/分享'],
      emojiSupport: true
    }
  },
  
  hashtagOptimization: {
    douyin: {
      maxCount: 5,
      strategy: '2个热门+2个精准+1个品牌',
      popular: ['#干货分享', '#知识科普', '#科技', '#数码', '#教程']
    },
    bilibili: {
      maxCount: 10,
      strategy: '3个分区标签+4个内容标签+3个活动标签',
      popular: ['#科技', '#数码', '#教程', '#知识', '#分享']
    },
    xiaohongshu: {
      maxCount: 10,
      strategy: '3个大类标签+4个细分标签+3个场景标签',
      popular: ['#干货分享', '#数码好物', '#科技', '#测评', '#攻略']
    }
  },
  
  descriptionOptimization: {
    douyin: {
      maxLength: 500,
      structure: ['钩子', '内容概述', '互动引导', '标签'],
      cta: '点赞关注不迷路'
    },
    bilibili: {
      maxLength: 2000,
      structure: ['简介', '时间戳', '相关链接', '互动'],
      cta: '一键三连支持'
    },
    xiaohongshu: {
      maxLength: 1000,
      structure: ['场景引入', '干货内容', '使用感受', '互动'],
      cta: '有问题评论区见'
    }
  }
};

/**
 * 增强版发布管理器
 */
class PublishManagerEnhanced {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.browserAutomationEnabled = false;
    this.ensureDirectories();
    this.loadData();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadData() {
    const queueFile = path.join(this.dataDir, 'publish-queue.json');
    const historyFile = path.join(this.dataDir, 'publish-history.json');
    
    if (fs.existsSync(queueFile)) {
      try {
        publishQueue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
      } catch (e) {
        publishQueue = [];
      }
    }
    
    if (fs.existsSync(historyFile)) {
      try {
        publishHistory = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      } catch (e) {
        publishHistory = [];
      }
    }
  }

  saveData() {
    const queueFile = path.join(this.dataDir, 'publish-queue.json');
    const historyFile = path.join(this.dataDir, 'publish-history.json');
    
    fs.writeFileSync(queueFile, JSON.stringify(publishQueue, null, 2));
    fs.writeFileSync(historyFile, JSON.stringify(publishHistory, null, 2));
  }

  /**
   * 添加视频到发布队列（带内容优化）
   */
  addToQueue(videoData, platforms = ['douyin', 'bilibili'], options = {}) {
    const publishId = `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 优化内容
    const optimizedContent = this.optimizeContentForPlatforms(videoData, platforms);
    
    const publishTask = {
      id: publishId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      video: {
        ...videoData,
        ...optimizedContent
      },
      platforms: platforms.map(p => ({
        name: p,
        status: 'pending',
        error: null,
        optimized: optimizedContent[p] || null
      })),
      schedule: options.schedule || null,
      confirmedAt: null,
      publishedAt: null,
      stats: null,
      autoPublish: options.autoPublish || false
    };

    publishQueue.push(publishTask);
    this.saveData();

    return publishId;
  }

  /**
   * 内容优化
   */
  optimizeContentForPlatforms(videoData, platforms) {
    const optimized = {};
    
    for (const platform of platforms) {
      const config = CONTENT_OPTIMIZATION.titleOptimization[platform];
      const hashtagConfig = CONTENT_OPTIMIZATION.hashtagOptimization[platform];
      const descConfig = CONTENT_OPTIMIZATION.descriptionOptimization[platform];
      
      if (!config) continue;
      
      // 优化标题
      let title = videoData.title || '';
      if (title.length > config.maxLength) {
        title = title.substring(0, config.maxLength - 3) + '...';
      }
      
      // 优化标签
      let tags = videoData.tags || [];
      if (tags.length > hashtagConfig.maxCount) {
        tags = tags.slice(0, hashtagConfig.maxCount);
      }
      
      // 添加平台推荐标签
      const recommendedTags = hashtagConfig.popular.filter(p => 
        !tags.some(t => p.includes(t) || t.includes(p))
      ).slice(0, 2);
      
      tags = [...tags, ...recommendedTags];
      
      // 优化描述
      let description = videoData.description || '';
      if (description.length > descConfig.maxLength) {
        description = description.substring(0, descConfig.maxLength - 3) + '...';
      }
      
      optimized[platform] = {
        title: title,
        tags: tags,
        description: description,
        hashtags: tags.map(t => `#${t}`).join(' '),
        platformSpecific: this.generatePlatformSpecificContent(platform, videoData)
      };
    }
    
    return optimized;
  }

  /**
   * 生成平台专属内容
   */
  generatePlatformSpecificContent(platform, videoData) {
    const specifics = {
      douyin: {
        coverType: '动态封面',
        musicRecommendation: '热门BGM',
        challengeTag: videoData.topic || '热门话题'
      },
      bilibili: {
        section: this.detectBilibiliSection(videoData),
        copyright: 1, // 原创
        source: '',
        tid: 202 // 科技数码区
      },
      xiaohongshu: {
        noteType: '视频笔记',
        location: '可选位置',
        productTags: []
      }
    };
    
    return specifics[platform] || {};
  }

  detectBilibiliSection(videoData) {
    const topic = videoData.topic || '';
    if (topic.includes('教程') || topic.includes('教学')) return '教程';
    if (topic.includes('评测') || topic.includes('测评')) return '评测';
    if (topic.includes('科技') || topic.includes('数码')) return '科技';
    return '日常';
  }

  /**
   * 确认发布
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

    // 立即发布或定时发布
    if (!task.schedule) {
      await this.executePublish(task);
    }

    return task;
  }

  /**
   * 执行发布
   */
  async executePublish(task) {
    task.status = 'publishing';
    this.saveData();

    const results = [];
    
    for (const platform of task.platforms) {
      try {
        platform.status = 'publishing';
        this.saveData();

        // 检查平台登录状态
        const loginStatus = this.checkPlatformLogin(platform.name);
        if (!loginStatus.loggedIn) {
          throw new Error(`未登录${PLATFORM_CONFIG[platform.name].name}`);
        }

        // 执行发布
        const result = await this.publishToPlatform(task.video, platform.name);
        
        platform.status = 'published';
        platform.publishedAt = new Date().toISOString();
        platform.url = result.url;
        platform.platformId = result.platformId;
        
        results.push({ platform: platform.name, success: true });
        
      } catch (error) {
        platform.status = 'failed';
        platform.error = error.message;
        results.push({ platform: platform.name, success: false, error: error.message });
      }
      
      this.saveData();
    }

    // 更新任务状态
    const allPublished = task.platforms.every(p => p.status === 'published');
    const hasFailed = task.platforms.some(p => p.status === 'failed');

    if (allPublished) {
      task.status = 'published';
      task.publishedAt = new Date().toISOString();
    } else if (hasFailed) {
      task.status = 'partial';
    }

    // 移到历史记录
    publishHistory.unshift(task);
    publishQueue = publishQueue.filter(t => t.id !== task.id);
    
    this.saveData();
    
    return { task, results };
  }

  /**
   * 发布到指定平台
   */
  async publishToPlatform(video, platform) {
    // 模拟发布过程
    console.log(`📤 发布到 ${PLATFORM_CONFIG[platform].name}: ${video.title}`);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟随机失败（5%概率）
    if (Math.random() < 0.05) {
      throw new Error('平台接口调用失败，请重试');
    }

    // 生成模拟结果
    const platformId = Math.random().toString(36).substr(2, 10);
    
    return {
      success: true,
      platform: platform,
      platformId: platformId,
      url: this.generatePlatformUrl(platform, platformId),
      publishedAt: new Date().toISOString()
    };
  }

  /**
   * 生成平台URL
   */
  generatePlatformUrl(platform, id) {
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
   * 获取发布队列
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

    // 计算发布效率
    const avgPublishTime = this.calculateAvgPublishTime();
    
    return {
      total,
      published,
      partial,
      failed,
      pending: publishQueue.filter(t => t.status === 'pending').length,
      platformStats,
      avgPublishTime,
      successRate: total > 0 ? ((published / total) * 100).toFixed(1) : 0
    };
  }

  calculateAvgPublishTime() {
    const completed = publishHistory.filter(t => t.publishedAt && t.confirmedAt);
    if (completed.length === 0) return 0;
    
    const totalTime = completed.reduce((sum, t) => {
      const publish = new Date(t.publishedAt);
      const confirm = new Date(t.confirmedAt);
      return sum + (publish - confirm);
    }, 0);
    
    return Math.round(totalTime / completed.length / 1000); // 秒
  }

  /**
   * 检查平台登录状态
   */
  checkPlatformLogin(platform) {
    const loginFile = path.join(this.dataDir, `login_${platform}.json`);
    if (fs.existsSync(loginFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(loginFile, 'utf8'));
        const expiresAt = new Date(data.expiresAt);
        const now = new Date();
        
        return {
          loggedIn: expiresAt > now,
          username: data.username,
          expiresAt: data.expiresAt,
          avatar: data.avatar || null
        };
      } catch (e) {
        return { loggedIn: false };
      }
    }
    return { loggedIn: false };
  }

  /**
   * 模拟登录
   */
  async loginPlatform(platform) {
    const loginUrls = {
      douyin: 'https://open.douyin.com/platform/oauth/connect',
      bilibili: 'https://passport.bilibili.com/login',
      xiaohongshu: 'https://www.xiaohongshu.com/login',
      shipinhao: 'https://channels.weixin.qq.com',
      kuaishou: 'https://cp.kuaishou.com'
    };

    return {
      platform,
      loginUrl: loginUrls[platform],
      message: `请在浏览器中打开链接完成${PLATFORM_CONFIG[platform].name}登录`,
      qrCode: null // 实际项目中可生成二维码
    };
  }

  /**
   * 获取内容优化建议
   */
  getContentOptimizationTips(platform, content) {
    const config = CONTENT_OPTIMIZATION.titleOptimization[platform];
    const tips = [];
    
    if (content.title && content.title.length > config.maxLength) {
      tips.push(`标题过长，建议控制在${config.maxLength}字以内`);
    }
    
    if (content.tags && content.tags.length > CONTENT_OPTIMIZATION.hashtagOptimization[platform].maxCount) {
      tips.push(`标签过多，建议控制在${CONTENT_OPTIMIZATION.hashtagOptimization[platform].maxCount}个以内`);
    }
    
    // 检查禁用词
    for (const word of config.forbiddenWords) {
      if (content.title && content.title.includes(word)) {
        tips.push(`标题包含敏感词"${word}"，建议修改`);
      }
    }
    
    return tips;
  }

  /**
   * 启用浏览器自动化
   */
  enableBrowserAutomation() {
    this.browserAutomationEnabled = true;
    console.log('✅ 浏览器自动化已启用');
  }

  /**
   * 定时发布检查
   */
  async checkScheduledPublishes() {
    const now = new Date();
    const scheduled = publishQueue.filter(t => 
      t.status === 'confirmed' && t.schedule && new Date(t.schedule) <= now
    );
    
    for (const task of scheduled) {
      console.log(`⏰ 执行定时发布: ${task.id}`);
      await this.executePublish(task);
    }
  }
}

// 单例模式
let managerInstance = null;

function getPublishManager() {
  if (!managerInstance) {
    managerInstance = new PublishManagerEnhanced();
  }
  return managerInstance;
}

module.exports = {
  getPublishManager,
  PLATFORM_CONFIG,
  PublishManagerEnhanced,
  CONTENT_OPTIMIZATION
};

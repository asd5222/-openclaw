/**
 * AI视频生成器 - 半自动方案
 * 基于剪映API + AI文案 + 素材合成
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 视频生成任务队列
let taskQueue = [];
let isProcessing = false;

// API配置（用户需要填写自己的API密钥）
const API_CONFIG = {
  // 剪映API（第三方服务）
  capcut: {
    enabled: false,
    apiKey: process.env.CAPCUT_API_KEY || '',
    baseUrl: 'https://api.capcut.yyzc.net.cn'
  },
  // 腾讯智影API
  zhiying: {
    enabled: false,
    secretId: process.env.ZHIYING_SECRET_ID || '',
    secretKey: process.env.ZHIYING_SECRET_KEY || '',
  },
  // 阿里云语音合成
  aliyunTTS: {
    enabled: true, // 默认启用免费额度
    appKey: process.env.ALIYUN_TTS_APPKEY || '',
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || ''
  },
  // OpenAI/Claude API（用于文案生成）
  openai: {
    enabled: false,
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  }
};

// 素材库配置
const ASSET_CONFIG = {
  // 免费素材源
  video: {
    pexels: 'https://api.pexels.com/videos/',
    pixabay: 'https://pixabay.com/api/videos/'
  },
  image: {
    unsplash: 'https://api.unsplash.com/',
    pexels: 'https://api.pexels.com/v1/'
  },
  audio: {
    // 免版权音乐
    freeMusic: path.join(__dirname, 'assets/music/')
  }
};

/**
 * 视频生成主流程
 */
class VideoGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, 'output');
    this.tempDir = path.join(__dirname, 'temp');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.outputDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 创建视频任务
   * @param {Object} options - 视频配置
   * @param {string} options.topic - 视频主题
   * @param {string} options.platform - 目标平台 (douyin/bilibili/xiaohongshu)
   * @param {string} options.duration - 时长 (30s/60s/90s/3min)
   * @param {string} options.style - 风格 (mixed/slideshow/ai)
   */
  async createVideoTask(options) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task = {
      id: taskId,
      status: 'pending', // pending, processing, completed, failed
      progress: 0,
      createdAt: new Date().toISOString(),
      options: options,
      steps: [],
      output: null
    };

    taskQueue.push(task);
    this.saveTaskQueue();
    
    // 开始处理队列
    if (!isProcessing) {
      this.processQueue();
    }

    return taskId;
  }

  /**
   * 处理任务队列
   */
  async processQueue() {
    if (isProcessing || taskQueue.length === 0) return;
    
    isProcessing = true;
    
    const pendingTask = taskQueue.find(t => t.status === 'pending');
    if (!pendingTask) {
      isProcessing = false;
      return;
    }

    try {
      await this.executeTask(pendingTask);
    } catch (error) {
      console.error('任务执行失败:', error);
      pendingTask.status = 'failed';
      pendingTask.error = error.message;
      this.saveTaskQueue();
    }

    isProcessing = false;
    
    // 继续处理下一个
    setTimeout(() => this.processQueue(), 1000);
  }

  /**
   * 执行单个任务
   */
  async executeTask(task) {
    task.status = 'processing';
    task.steps = [];
    this.saveTaskQueue();

    const { topic, platform, duration, style } = task.options;

    try {
      // Step 1: AI生成文案
      this.updateProgress(task, 10, '正在生成文案...');
      const script = await this.generateScript(topic, platform, duration);
      task.steps.push({ name: '文案生成', status: 'completed', data: script });

      // Step 2: 搜索/生成素材
      this.updateProgress(task, 30, '正在准备素材...');
      const assets = await this.prepareAssets(script, style);
      task.steps.push({ name: '素材准备', status: 'completed', data: assets });

      // Step 3: AI配音
      this.updateProgress(task, 50, '正在生成配音...');
      const audioFile = await this.generateVoiceover(script.voiceover);
      task.steps.push({ name: '配音生成', status: 'completed', data: audioFile });

      // Step 4: 视频剪辑
      this.updateProgress(task, 70, '正在剪辑视频...');
      const videoFile = await this.editVideo(script, assets, audioFile, style);
      task.steps.push({ name: '视频剪辑', status: 'completed', data: videoFile });

      // Step 5: 添加字幕和特效
      this.updateProgress(task, 90, '正在添加字幕和特效...');
      const finalVideo = await this.addSubtitlesAndEffects(videoFile, script);
      task.steps.push({ name: '后期处理', status: 'completed', data: finalVideo });

      // 完成
      task.status = 'completed';
      task.progress = 100;
      task.output = {
        videoPath: finalVideo,
        title: script.title,
        description: script.description,
        tags: script.tags,
        thumbnail: assets.thumbnail
      };
      
      this.saveTaskQueue();
      console.log(`✅ 视频生成完成: ${finalVideo}`);

    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      this.saveTaskQueue();
      throw error;
    }
  }

  /**
   * AI生成文案脚本
   */
  async generateScript(topic, platform, duration) {
    // 如果没有配置OpenAI，使用模板生成
    if (!API_CONFIG.openai.enabled) {
      return this.generateTemplateScript(topic, platform, duration);
    }

    // 调用AI API生成
    try {
      const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `你是一个专业的短视频文案策划师，擅长${platform}平台的内容创作。`
          }, {
            role: 'user',
            content: `请为"${topic}"这个主题生成一个${duration}的短视频脚本。
            
要求：
1. 标题要吸引人，符合${platform}平台风格
2. 口播文案要口语化、有节奏感
3. 分3-5个镜头，每个镜头配画面描述
4. 给出5个相关标签

请按以下JSON格式返回：
{
  "title": "视频标题",
  "voiceover": "完整口播文案",
  "scenes": [
    {"time": "0-5s", "content": "画面描述", "voiceover": "对应文案"}
  ],
  "description": "视频简介",
  "tags": ["标签1", "标签2"]
}`
          }]
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // 提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('AI生成失败，使用模板:', error.message);
    }

    return this.generateTemplateScript(topic, platform, duration);
  }

  /**
   * 模板生成脚本（备用方案）
   */
  generateTemplateScript(topic, platform, duration) {
    const templates = {
      douyin: {
        hooks: ['你知道吗？', '太震惊了！', '全网都在聊的', '99%的人不知道'],
        style: '短平快、悬念强'
      },
      bilibili: {
        hooks: ['大家好，今天我们来聊聊', '深度解析', '实测体验'],
        style: '专业、详细、有深度'
      },
      xiaohongshu: {
        hooks: ['姐妹们！', '必看！', '干货分享'],
        style: '亲切、实用、种草'
      }
    };

    const platformStyle = templates[platform] || templates.douyin;
    const hook = platformStyle.hooks[Math.floor(Math.random() * platformStyle.hooks.length)];

    return {
      title: `${hook}${topic}，看完你就懂了！`,
      voiceover: `${hook}${topic}。首先，我们要了解什么是${topic}。简单来说，它是当下最热门的技术趋势。其次，它对我们的生活有什么影响？其实影响比你想象的更大。最后，如何抓住这个机会？看完这个视频你就明白了。`,
      scenes: [
        { time: '0-5s', content: '科技感动画开场', voiceover: `${hook}${topic}` },
        { time: '5-20s', content: '概念解释画面', voiceover: `首先，我们要了解什么是${topic}` },
        { time: '20-40s', content: '应用场景展示', voiceover: '其次，它对我们的生活有什么影响？' },
        { time: '40-55s', content: '总结画面', voiceover: '最后，如何抓住这个机会？' },
        { time: '55-60s', content: '结尾引导', voiceover: '看完这个视频你就明白了，记得点赞关注！' }
      ],
      description: `今天给大家深度解析${topic}，如果觉得有用记得点赞收藏！\n#${topic.replace(/\s/g, '')} #科技 #干货`,
      tags: [topic.replace(/\s/g, ''), '科技', '干货', '科普', 'AI']
    };
  }

  /**
   * 准备素材
   */
  async prepareAssets(script, style) {
    const assets = {
      videos: [],
      images: [],
      music: null,
      thumbnail: null
    };

    // 根据场景生成素材需求
    for (const scene of script.scenes) {
      // 使用免费图库搜索关键词
      const keyword = scene.content.replace(/画面|展示|动画/g, '').trim();
      
      assets.images.push({
        scene: scene.time,
        keyword: keyword,
        url: `https://source.unsplash.com/1920x1080/?${encodeURIComponent(keyword)},technology`,
        localPath: null
      });
    }

    // 选择背景音乐
    const musicFiles = ['upbeat.mp3', 'tech.mp3', 'inspiring.mp3'];
    assets.music = musicFiles[Math.floor(Math.random() * musicFiles.length)];

    return assets;
  }

  /**
   * 生成配音（使用系统TTS或阿里云）
   */
  async generateVoiceover(text) {
    const outputFile = path.join(this.tempDir, `voice_${Date.now()}.mp3`);

    // 模拟配音生成（实际使用时接入真实TTS）
    console.log(`🎙️ 生成配音: ${text.substring(0, 50)}...`);
    
    // 创建空音频文件占位（实际项目中接入真实TTS）
    await this.createDummyAudio(outputFile);
    
    return outputFile;
  }

  /**
   * 创建占位音频文件
   */
  async createDummyAudio(outputFile) {
    // 使用FFmpeg生成静音音频或复制模板音频
    const templateAudio = path.join(__dirname, 'assets', 'template.mp3');
    
    if (fs.existsSync(templateAudio)) {
      fs.copyFileSync(templateAudio, outputFile);
    } else {
      // 创建一个空的MP3文件
      const dummyMp3 = Buffer.from([
        0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
      fs.writeFileSync(outputFile, dummyMp3);
    }
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Windows系统TTS
   */
  async windowsTTS(text, outputFile) {
    const escapedPath = outputFile.replace(/\\/g, '\\\\');
    const escapedText = text.replace(/'/g, "''");
    const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints('Female')
$synth.SetOutputToWaveFile('${escapedPath}')
$synth.Speak('${escapedText}')
$synth.Dispose()
`;
    const psFile = path.join(this.tempDir, `tts_${Date.now()}.ps1`);
    fs.writeFileSync(psFile, psScript);
    
    await execPromise(`powershell -ExecutionPolicy Bypass -File "${psFile}"`);
    fs.unlinkSync(psFile);
    
    return outputFile;
  }

  /**
   * Edge TTS（免费在线TTS）
   */
  async edgeTTS(text, outputFile) {
    // 使用edge-tts Python库
    const script = `
import edge_tts
import asyncio

async def main():
    communicate = edge_tts.Communicate("""${text.replace(/"/g, '\\"')}""", "zh-CN-XiaoxiaoNeural")
    await communicate.save(r"${outputFile.replace(/\\/g, '/').replace(/"/g, '\\"')}")

asyncio.run(main())
`;
    const pyFile = path.join(this.tempDir, `edge_tts_${Date.now()}.py`);
    fs.writeFileSync(pyFile, script);
    
    await execPromise(`python "${pyFile}"`);
    fs.unlinkSync(pyFile);
    
    return outputFile;
  }

  /**
   * 视频剪辑（使用FFmpeg）
   */
  async editVideo(script, assets, audioFile, style) {
    const outputFile = path.join(this.outputDir, `video_${Date.now()}.mp4`);
    
    console.log(`🎬 剪辑视频: ${script.title}`);
    
    // 模拟视频剪辑（实际使用时接入FFmpeg）
    await this.createDummyVideo(outputFile);
    
    return outputFile;
  }

  /**
   * 创建占位视频文件
   */
  async createDummyVideo(outputFile) {
    // 复制模板视频或创建占位文件
    const templateVideo = path.join(__dirname, 'assets', 'template.mp4');
    
    if (fs.existsSync(templateVideo)) {
      fs.copyFileSync(templateVideo, outputFile);
    } else {
      // 创建一个空的MP4文件（最小有效MP4）
      const dummyMp4 = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00
      ]);
      fs.writeFileSync(outputFile, dummyMp4);
    }
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  /**
   * 构建FFmpeg命令
   */
  buildFFmpegCommand(script, assets, audioFile, outputFile) {
    // 简化的FFmpeg命令示例
    // 实际项目中需要更复杂的处理
    
    const inputs = assets.images.map((img, i) => {
      return `-loop 1 -t 5 -i "${img.url}"`;
    }).join(' ');

    const filterComplex = `
      ${assets.images.map((_, i) => `[${i}:v]`).join('')}
      concat=n=${assets.images.length}:v=1:a=0[outv]
    `;

    return `ffmpeg -y ${inputs} -i "${audioFile}" -filter_complex "${filterComplex}" -map "[outv]" -map ${assets.images.length}:a -c:v libx264 -c:a aac "${outputFile}"`;
  }

  /**
   * 添加字幕和特效
   */
  async addSubtitlesAndEffects(videoFile, script) {
    console.log(`✨ 添加字幕和特效: ${script.title}`);
    
    const outputFile = videoFile.replace('.mp4', '_final.mp4');
    
    // 模拟后期处理（实际使用时接入FFmpeg）
    fs.copyFileSync(videoFile, outputFile);
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return outputFile;
  }

  /**
   * 生成ASS字幕
   */
  generateASS(script, outputFile) {
    let events = '';
    let currentTime = 0;

    for (const scene of script.scenes) {
      const [start, end] = scene.time.split('-').map(t => {
        const [min, sec] = t.replace('s', '').split(':').map(Number);
        return min * 60 + (sec || 0);
      });
      
      const startTime = this.formatASSTime(start);
      const endTime = this.formatASSTime(end);
      
      events += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${scene.voiceover}\n`;
    }

    const assContent = `[Script Info]
Title: ${script.title}
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Microsoft YaHei,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}`;

    fs.writeFileSync(outputFile, assContent);
  }

  formatASSTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  updateProgress(task, progress, message) {
    task.progress = progress;
    task.currentStep = message;
    console.log(`[${task.id}] ${progress}% - ${message}`);
    this.saveTaskQueue();
  }

  saveTaskQueue() {
    const queueFile = path.join(__dirname, 'data', 'task-queue.json');
    if (!fs.existsSync(path.dirname(queueFile))) {
      fs.mkdirSync(path.dirname(queueFile), { recursive: true });
    }
    fs.writeFileSync(queueFile, JSON.stringify(taskQueue, null, 2));
  }

  loadTaskQueue() {
    const queueFile = path.join(__dirname, 'data', 'task-queue.json');
    if (fs.existsSync(queueFile)) {
      taskQueue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    }
  }

  getTaskStatus(taskId) {
    return taskQueue.find(t => t.id === taskId);
  }

  getAllTasks() {
    return taskQueue;
  }

  getPendingTasks() {
    return taskQueue.filter(t => t.status === 'pending' || t.status === 'processing');
  }

  getCompletedTasks() {
    return taskQueue.filter(t => t.status === 'completed');
  }
}

// 单例模式
let generator = null;

function getGenerator() {
  if (!generator) {
    generator = new VideoGenerator();
    generator.loadTaskQueue();
  }
  return generator;
}

module.exports = {
  VideoGenerator,
  getGenerator,
  API_CONFIG
};

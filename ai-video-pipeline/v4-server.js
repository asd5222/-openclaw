/**
 * AI视频工厂 v4.0 - 服务端
 * 功能：热点监控 → AI选题 → 视频生成 → 发布队列 → 数据回流
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');
const cors = require('cors');

// 引入视频生成器和发布管理器
const { getGenerator, API_CONFIG } = require('./video-generator');
const { getPublishManager, PLATFORM_CONFIG } = require('./publish-manager');

const app = express();
const PORT = 3004;

// 数据目录
const DATA_DIR = path.join(__dirname, 'data');
const QUEUE_DIR = path.join(DATA_DIR, 'queue');
const VIDEOS_DIR = path.join(DATA_DIR, 'videos');
const ACCOUNTS_DIR = path.join(DATA_DIR, 'accounts');

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 确保目录存在
async function ensureDirs() {
    const dirs = [DATA_DIR, QUEUE_DIR, VIDEOS_DIR, ACCOUNTS_DIR];
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (e) {}
    }
}

// ==================== 热点监控 API ====================

// 获取科技领域热点
app.get('/api/trending/tech', async (req, res) => {
    try {
        // 模拟科技热点数据（实际应从各平台API抓取）
        const trending = {
            updateTime: new Date().toISOString(),
            platforms: {
                douyin: [
                    { rank: 1, topic: 'AI工具实测', heat: 1250, hot: true },
                    { rank: 2, topic: 'ChatGPT新功能', heat: 980, hot: true },
                    { rank: 3, topic: '手机摄影技巧', heat: 756, hot: false },
                    { rank: 4, topic: '数码评测', heat: 623, hot: false },
                    { rank: 5, topic: '编程入门', heat: 541, hot: false },
                ],
                bilibili: [
                    { rank: 1, topic: 'AI绘画教程', heat: 890, hot: true },
                    { rank: 2, topic: '科技新闻周报', heat: 756, hot: true },
                    { rank: 3, topic: '硬件拆解', heat: 634, hot: false },
                    { rank: 4, topic: '程序员日常', heat: 523, hot: false },
                    { rank: 5, topic: '新品开箱', heat: 412, hot: false },
                ],
                xiaohongshu: [
                    { rank: 1, topic: '效率工具推荐', heat: 567, hot: true },
                    { rank: 2, topic: '桌面改造', heat: 445, hot: false },
                    { rank: 3, topic: '数码好物', heat: 398, hot: false },
                    { rank: 4, topic: 'APP测评', heat: 356, hot: false },
                    { rank: 5, topic: '智能家电', heat: 298, hot: false },
                ],
                weibo: [
                    { rank: 1, topic: '人工智能', heat: 2100, hot: true },
                    { rank: 2, topic: '科技新品发布', heat: 1856, hot: true },
                    { rank: 3, topic: '手机对比', heat: 1234, hot: false },
                    { rank: 4, topic: '游戏评测', heat: 987, hot: false },
                    { rank: 5, topic: '创业故事', heat: 876, hot: false },
                ]
            }
        };
        res.json({ success: true, data: trending });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 视频生成队列 API ====================

// 创建视频生成任务
app.post('/api/queue/create', async (req, res) => {
    try {
        const { topic, platform = 'douyin', style = 'tech', duration = '60s' } = req.body;
        
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const task = {
            id: taskId,
            topic,
            platform,
            style,
            duration,
            status: 'pending', // pending, generating, completed, failed
            progress: 0,
            createdAt: new Date().toISOString(),
            steps: [
                { name: '选题分析', status: 'pending', output: null },
                { name: '脚本生成', status: 'pending', output: null },
                { name: '素材搜集', status: 'pending', output: null },
                { name: '配音合成', status: 'pending', output: null },
                { name: '视频剪辑', status: 'pending', output: null },
                { name: '封面生成', status: 'pending', output: null },
            ],
            videoUrl: null,
            title: null,
            description: null,
            tags: [],
        };
        
        await fs.writeFile(
            path.join(QUEUE_DIR, `${taskId}.json`),
            JSON.stringify(task, null, 2)
        );
        
        // 启动异步生成流程
        startVideoGeneration(taskId);
        
        res.json({ success: true, taskId, message: '任务已创建' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取任务列表
app.get('/api/queue/list', async (req, res) => {
    try {
        const files = await fs.readdir(QUEUE_DIR);
        const tasks = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(QUEUE_DIR, file), 'utf8');
                tasks.push(JSON.parse(content));
            }
        }
        
        // 按创建时间倒序
        tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取单个任务
app.get('/api/queue/:taskId', async (req, res) => {
    try {
        const content = await fs.readFile(
            path.join(QUEUE_DIR, `${req.params.taskId}.json`),
            'utf8'
        );
        res.json({ success: true, task: JSON.parse(content) });
    } catch (error) {
        res.status(404).json({ success: false, error: '任务不存在' });
    }
});

// 删除任务
app.delete('/api/queue/:taskId', async (req, res) => {
    try {
        await fs.unlink(path.join(QUEUE_DIR, `${req.params.taskId}.json`));
        res.json({ success: true, message: '任务已删除' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 视频生成流程 ====================

async function startVideoGeneration(taskId) {
    const taskPath = path.join(QUEUE_DIR, `${taskId}.json`);
    const generator = getGenerator();
    
    async function updateTask(updater) {
        const content = await fs.readFile(taskPath, 'utf8');
        const task = JSON.parse(content);
        updater(task);
        await fs.writeFile(taskPath, JSON.stringify(task, null, 2));
    }
    
    try {
        // 获取任务信息
        const content = await fs.readFile(taskPath, 'utf8');
        const task = JSON.parse(content);
        
        // 使用新的视频生成器
        const videoTaskId = await generator.createVideoTask({
            topic: task.topic,
            platform: task.platform,
            duration: task.duration,
            style: task.style
        });
        
        // 轮询检查生成进度
        const checkInterval = setInterval(async () => {
            const videoTask = generator.getTaskStatus(videoTaskId);
            if (!videoTask) return;
            
            // 同步进度到文件
            await updateTask(t => {
                t.progress = videoTask.progress;
                t.currentStep = videoTask.currentStep;
                
                // 更新步骤状态
                if (videoTask.steps) {
                    videoTask.steps.forEach((step, idx) => {
                        if (t.steps[idx]) {
                            t.steps[idx].status = step.status;
                            t.steps[idx].output = step.data;
                        }
                    });
                }
                
                // 完成时更新
                if (videoTask.status === 'completed') {
                    t.status = 'completed';
                    t.videoUrl = videoTask.output?.videoPath;
                    t.title = videoTask.output?.title;
                    t.description = videoTask.output?.description;
                    t.tags = videoTask.output?.tags;
                    clearInterval(checkInterval);
                } else if (videoTask.status === 'failed') {
                    t.status = 'failed';
                    t.error = videoTask.error;
                    clearInterval(checkInterval);
                }
            });
        }, 1000);
        
    } catch (error) {
        console.error(`❌ 视频生成失败: ${taskId}`, error);
        await updateTask(t => {
            t.status = 'failed';
            t.error = error.message;
        });
    }
}

function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateScript(topic, platform, duration) {
    const scenes = duration === '60s' ? 4 : 6;
    const script = {
        hook: `${topic}，90%的人都做错了！`,
        scenes: []
    };
    
    for (let i = 1; i <= scenes; i++) {
        script.scenes.push({
            time: `${(i-1)*15}-${i*15}秒`,
            visual: `画面${i}：${topic}相关场景`,
            audio: `配音${i}：讲解第${i}个要点`,
            subtitle: `要点${i}：核心内容总结`
        });
    }
    
    script.cta = '觉得有用记得点赞收藏，下期更精彩！';
    return script;
}

function generateTitle(topic) {
    const templates = [
        `${topic}，看完这个你就懂了！`,
        `3分钟学会${topic}，建议收藏`,
        `${topic}的真相，90%的人都不知道`,
        `关于${topic}，我必须告诉你这些`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

function generateDescription(topic, platform) {
    const descs = {
        douyin: `今天分享${topic}的干货内容\n\n✅ 3个实用技巧\n✅ 看完就能用\n✅ 建议收藏\n\n#${topic} #干货分享 #知识科普`,
        bilibili: `本期视频详细讲解${topic}\n\n制作不易，喜欢的话请一键三连支持！\n\n时间戳：\n00:00 开场\n00:30 要点1\n01:00 要点2\n01:30 要点3\n02:00 总结`,
        xiaohongshu: `${topic}攻略来了！\n\n💡 实用技巧\n💡 避坑指南\n💡 亲测有效\n\n有问题评论区问我～`
    };
    return descs[platform] || descs.douyin;
}

function generateTags(topic) {
    return [topic, '干货分享', '知识科普', '实用技巧', '建议收藏'];
}

// ==================== 发布管理 API ====================

const publishManager = getPublishManager();

// 获取平台配置
app.get('/api/publish/platforms', async (req, res) => {
    res.json({ success: true, platforms: PLATFORM_CONFIG });
});

// 获取发布队列（待确认）
app.get('/api/publish/queue', async (req, res) => {
    try {
        const pending = publishManager.getPendingList();
        const all = publishManager.getQueue();
        res.json({ success: true, pending, all });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 添加到发布队列
app.post('/api/publish/queue', async (req, res) => {
    try {
        const { videoData, platforms } = req.body;
        
        const publishId = publishManager.addToQueue(videoData, platforms);
        
        res.json({ success: true, publishId, message: '已添加到发布队列，等待确认' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 确认发布
app.post('/api/publish/confirm', async (req, res) => {
    try {
        const { publishId, options } = req.body;
        
        const result = await publishManager.confirmPublish(publishId, options);
        
        res.json({ success: true, result, message: '发布任务已确认' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 批量确认发布
app.post('/api/publish/batch-confirm', async (req, res) => {
    try {
        const { publishIds, options } = req.body;
        
        const results = await publishManager.batchConfirm(publishIds, options);
        
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 取消发布
app.delete('/api/publish/queue/:publishId', async (req, res) => {
    try {
        await publishManager.cancelPublish(req.params.publishId);
        res.json({ success: true, message: '发布任务已取消' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取发布历史
app.get('/api/publish/history', async (req, res) => {
    try {
        const history = publishManager.getHistory();
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取发布统计
app.get('/api/publish/stats', async (req, res) => {
    try {
        const stats = publishManager.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 检查平台登录状态
app.get('/api/publish/login-status/:platform', async (req, res) => {
    try {
        const status = publishManager.checkPlatformLogin(req.params.platform);
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 平台登录
app.post('/api/publish/login/:platform', async (req, res) => {
    try {
        const result = await publishManager.loginPlatform(req.params.platform);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 账号管理 API ====================

// 获取账号列表
app.get('/api/accounts', async (req, res) => {
    try {
        const content = await fs.readFile(
            path.join(DATA_DIR, 'accounts.json'),
            'utf8'
        ).catch(() => '[]');
        res.json({ success: true, accounts: JSON.parse(content) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 添加账号
app.post('/api/accounts', async (req, res) => {
    try {
        const { name, platform, niche } = req.body;
        
        const accountsPath = path.join(DATA_DIR, 'accounts.json');
        const content = await fs.readFile(accountsPath, 'utf8').catch(() => '[]');
        const accounts = JSON.parse(content);
        
        const account = {
            id: `acc_${Date.now()}`,
            name,
            platform,
            niche,
            status: 'active',
            stats: { fans: 0, videos: 0, likes: 0 },
            createdAt: new Date().toISOString(),
        };
        
        accounts.push(account);
        await fs.writeFile(accountsPath, JSON.stringify(accounts, null, 2));
        
        res.json({ success: true, account });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 数据统计 API ====================

app.get('/api/stats', async (req, res) => {
    try {
        const files = await fs.readdir(QUEUE_DIR);
        const tasks = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(QUEUE_DIR, file), 'utf8');
                tasks.push(JSON.parse(content));
            }
        }
        
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const generating = tasks.filter(t => t.status === 'generating').length;
        
        res.json({
            success: true,
            stats: {
                total: tasks.length,
                completed,
                pending,
                generating,
                savedTime: completed * 4, // 假设每条节省4小时
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 定时任务 ====================

// 每小时刷新热点
cron.schedule('0 * * * *', () => {
    console.log('🔄 定时任务：刷新热点数据');
    // 实际应调用各平台API抓取热点
});

// 每分钟检查发布队列
cron.schedule('* * * * *', () => {
    console.log('📤 定时任务：检查发布队列');
    // 实际应处理定时发布逻辑
});

// 视频生成任务状态API
app.get('/api/video-tasks', async (req, res) => {
    try {
        const generator = getGenerator();
        const tasks = generator.getAllTasks();
        res.json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/video-tasks/:taskId', async (req, res) => {
    try {
        const generator = getGenerator();
        const task = generator.getTaskStatus(req.params.taskId);
        if (!task) {
            return res.status(404).json({ success: false, error: '任务不存在' });
        }
        res.json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API配置信息
app.get('/api/config', async (req, res) => {
    res.json({
        success: true,
        config: {
            apiStatus: {
                capcut: API_CONFIG.capcut.enabled,
                zhiying: API_CONFIG.zhiying.enabled,
                aliyunTTS: API_CONFIG.aliyunTTS.enabled,
                openai: API_CONFIG.openai.enabled
            },
            platforms: Object.keys(PLATFORM_CONFIG).filter(k => PLATFORM_CONFIG[k].enabled)
        }
    });
});

// 启动服务
async function start() {
    await ensureDirs();
    
    // 初始化视频生成器和发布管理器
    getGenerator();
    getPublishManager();
    
    app.listen(PORT, () => {
        console.log('');
        console.log('🎬 AI视频工厂 v4.0 已启动！');
        console.log(`👉 访问地址：http://localhost:${PORT}/v4.html`);
        console.log('');
        console.log('📋 功能清单：');
        console.log('   • 24小时热点监控');
        console.log('   • AI自动选题');
        console.log('   • 视频自动生成（混剪+动画）');
        console.log('   • 半自动发布（人工确认→自动发布）');
        console.log('   • 数据回流分析');
        console.log('');
        console.log('⚠️  注意：当前为半自动方案');
        console.log('   - 视频生成使用模板+本地TTS（无需API Key）');
        console.log('   - 发布需要人工确认后自动执行');
        console.log('   - 如需接入真实API，请配置环境变量');
        console.log('');
    });
}

start().catch(console.error);

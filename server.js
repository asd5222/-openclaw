// Express服务器
const express = require('express');
const path = require('path');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const newsAggregator = require('./lib/newsAggregator');
const videoSearcher = require('./lib/videoSearcher');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API路由

/**
 * 获取新闻数据
 */
app.get('/api/news', async (req, res) => {
    try {
        const data = await newsAggregator.loadNews();
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: '暂无新闻数据' });
        }
    } catch (error) {
        console.error('获取新闻数据失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

/**
 * 获取视频数据
 */
app.get('/api/videos', async (req, res) => {
    try {
        const data = await videoSearcher.loadVideos();
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: '暂无视频数据' });
        }
    } catch (error) {
        console.error('获取视频数据失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

/**
 * 刷新所有数据
 */
app.post('/api/refresh', async (req, res) => {
    try {
        console.log('开始刷新数据...');
        
        // 并行更新新闻和视频
        const [news, videos] = await Promise.all([
            newsAggregator.updateNews(),
            videoSearcher.updateVideos()
        ]);

        console.log('数据刷新完成');
        
        res.json({
            success: true,
            message: '数据刷新成功',
            newsCount: news.length,
            videoCount: videos.length
        });
    } catch (error) {
        console.error('刷新数据失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '刷新失败'
        });
    }
});

/**
 * 仅刷新新闻
 */
app.post('/api/refresh/news', async (req, res) => {
    try {
        const news = await newsAggregator.updateNews();
        res.json({
            success: true,
            message: '新闻刷新成功',
            newsCount: news.length
        });
    } catch (error) {
        console.error('刷新新闻失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '刷新失败'
        });
    }
});

/**
 * 仅刷新视频
 */
app.post('/api/refresh/videos', async (req, res) => {
    try {
        const videos = await videoSearcher.updateVideos();
        res.json({
            success: true,
            message: '视频刷新成功',
            videoCount: videos.length
        });
    } catch (error) {
        console.error('刷新视频失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '刷新失败'
        });
    }
});

/**
 * 获取指定日期的数据
 */
app.get('/api/news/:date', async (req, res) => {
    try {
        const data = await newsAggregator.loadNews(req.params.date);
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: '找不到指定日期的数据' });
        }
    } catch (error) {
        console.error('获取新闻数据失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

app.get('/api/videos/:date', async (req, res) => {
    try {
        const data = await videoSearcher.loadVideos(req.params.date);
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: '找不到指定日期的数据' });
        }
    } catch (error) {
        console.error('获取视频数据失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 启动服务器
app.listen(PORT, async () => {
    console.log(`\n🚀 AI新闻聚合服务器已启动`);
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log(`📰 API地址: http://localhost:${PORT}/api`);
    console.log(``);

    // 首次启动时更新数据
    console.log('📥 首次启动，正在获取初始数据...');
    try {
        await newsAggregator.updateNews();
        console.log('✅ 初始新闻数据已加载');
    } catch (err) {
        console.log('⚠️  初始新闻数据加载失败:', err.message);
    }

    try {
        await videoSearcher.updateVideos();
        console.log('✅ 初始视频数据已加载');
    } catch (err) {
        console.log('⚠️  初始视频数据加载失败:', err.message);
    }

    // 设置定时任务
    const schedule = process.env.UPDATE_SCHEDULE || '0 8 * * *';
    console.log(`⏰ 定时任务已设置: ${schedule} (每天自动更新)`);
    
    cron.schedule(schedule, async () => {
        console.log('\n🔄 执行定时更新任务...');
        try {
            await Promise.all([
                newsAggregator.updateNews(),
                videoSearcher.updateVideos()
            ]);
            console.log('✅ 定时更新完成');
        } catch (err) {
            console.error('❌ 定时更新失败:', err);
        }
    });

    console.log(`\n🎉 所有服务已就绪！\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n\n👋 正在关闭服务器...');
    process.exit(0);
});

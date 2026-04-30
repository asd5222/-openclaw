// 简化版服务器 - 快速启动
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 检查数据文件
async function loadData(filename) {
    try {
        const filePath = path.join(__dirname, 'data', filename);
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        return null;
    }
}

// API路由
app.get('/api/news', async (req, res) => {
    const data = await loadData('news-latest.json');
    res.json(data || { date: new Date().toISOString().split('T')[0], count: 0, news: [] });
});

app.get('/api/videos', async (req, res) => {
    const data = await loadData('videos-latest.json');
    res.json(data || { date: new Date().toISOString().split('T')[0], count: 0, videos: [] });
});

app.post('/api/refresh', async (req, res) => {
    res.json({
        success: true,
        message: '请使用 npm run update-news 手动更新数据'
    });
});

// 创建data目录
(async () => {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
        console.log('✅ 数据目录已创建');
    } catch (err) {
        // 目录已存在
    }
})();

// 启动服务器
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('  🚀 AI新闻聚合服务器启动成功！');
    console.log('========================================\n');
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log(`\n💡 提示:`);
    console.log(`   - 如果没有数据，运行: npm run update-news`);
    console.log(`   - 或直接刷新页面即可查看\n`);
});

console.log('正在启动服务器...');

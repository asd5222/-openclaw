// 手动更新数据的脚本
const newsAggregator = require('../lib/newsAggregator');
const videoSearcher = require('../lib/videoSearcher');

async function main() {
    console.log('📥 开始更新AI资讯...\n');

    try {
        // 更新新闻
        console.log('📰 更新新闻...');
        const news = await newsAggregator.updateNews();
        console.log(`✅ 新闻更新完成: ${news.length} 条\n`);

        // 更新视频
        console.log('🎬 更新视频...');
        const videos = await videoSearcher.updateVideos();
        console.log(`✅ 视频更新完成: ${videos.length} 个\n`);

        console.log('🎉 所有数据更新完成！');
    } catch (error) {
        console.error('❌ 更新失败:', error);
        process.exit(1);
    }
}

main();

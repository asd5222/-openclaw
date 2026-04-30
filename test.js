// 测试服务器是否正常运行
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const API_BASE = 'http://localhost:3000';

async function testServer() {
    console.log('🧪 测试服务器...\n');

    try {
        // 测试1: 检查服务器是否启动
        console.log('1️⃣ 测试服务器连接...');
        try {
            const response = await axios.get(API_BASE, { timeout: 5000 });
            console.log('   ✅ 服务器正在运行\n');
        } catch (error) {
            console.log('   ❌ 服务器未启动或无法连接');
            console.log('   请先运行: node server.js\n');
            return;
        }

        // 测试2: 检查新闻API
        console.log('2️⃣ 测试新闻API...');
        try {
            const newsResponse = await axios.get(`${API_BASE}/api/news`, { timeout: 10000 });
            if (newsResponse.data && newsResponse.data.news) {
                console.log(`   ✅ 新闻API正常 (${newsResponse.data.count} 条新闻)\n`);
            } else {
                console.log('   ⚠️  新闻API返回空数据\n');
            }
        } catch (error) {
            console.log('   ❌ 新闻API失败:', error.message, '\n');
        }

        // 测试3: 检查视频API
        console.log('3️⃣ 测试视频API...');
        try {
            const videoResponse = await axios.get(`${API_BASE}/api/videos`, { timeout: 10000 });
            if (videoResponse.data && videoResponse.data.videos) {
                console.log(`   ✅ 视频API正常 (${videoResponse.data.count} 个视频)\n`);
            } else {
                console.log('   ⚠️  视频API返回空数据\n');
            }
        } catch (error) {
            console.log('   ❌ 视频API失败:', error.message, '\n');
        }

        // 测试4: 检查数据文件
        console.log('4️⃣ 检查数据文件...');
        const dataDir = path.join(__dirname, 'data');
        const files = ['news-latest.json', 'videos-latest.json'];
        
        for (const file of files) {
            const filePath = path.join(dataDir, file);
            if (fs.existsSync(filePath)) {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const count = file.includes('news') ? content.news?.length : content.videos?.length;
                console.log(`   ✅ ${file} 存在 (${count} 条数据)`);
            } else {
                console.log(`   ❌ ${file} 不存在`);
            }
        }
        console.log();

        console.log('🎉 测试完成！');
        console.log(`\n📱 请在浏览器中打开: ${API_BASE}\n`);

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testServer();

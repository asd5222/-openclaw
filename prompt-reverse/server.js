// Express服务器
const express = require('express');
const path = require('path');
const cors = require('cors');
const promptReverse = require('./lib/promptReverseEngine');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API路由

/**
 * 获取支持的场景列表
 */
app.get('/api/scenes', (req, res) => {
  const scenes = promptReverse.getSupportedScenes();
  res.json({
    success: true,
    scenes
  });
});

/**
 * 反推提示词
 */
app.post('/api/reverse', async (req, res) => {
  try {
    const { content, scene, options } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: '内容不能为空'
      });
    }
    
    const result = await promptReverse.reversePrompt(content, scene || 'general', options);
    
    res.json(result);
  } catch (error) {
    console.error('提示词反推失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 优化提示词
 */
app.post('/api/optimize', (req, res) => {
  try {
    const { prompt, scene } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: '提示词不能为空'
      });
    }
    
    const result = promptReverse.optimizePrompt(prompt, scene || 'general');
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('提示词优化失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('  🎨 提示词反推工具启动成功！');
  console.log('========================================\n');
  console.log(`📡 访问地址: http://localhost:${PORT}`);
  console.log(`\n💡 功能：`);
  console.log(`   - 输入文本/代码/文案，反推提示词`);
  console.log(`   - 支持6种场景：文章、代码、社交、绘图等`);
  console.log(`   - 自动优化和评分提示词\n`);
  console.log(`🎉 所有服务已就绪！\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n👋 正在关闭服务器...');
  process.exit(0);
});

const express = require('express');
const path = require('path');
const fs = require('fs');

// 加载环境变量
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 内存存储（生产环境应使用数据库）
const taskHistory = [];
const workerConfigs = {};

// AI 服务映射
const AI_SERVICES = {
  'ChatGPT-4o': 'openai',
  'ChatGPT-4': 'openai',
  'ChatGPT-3.5': 'openai',
  'Claude 3.5': 'claude',
  'Claude 3': 'claude',
  'Claude 3 Opus': 'claude',
  'Kimi': 'kimi',
  'Kimi K1.5': 'kimi',
  'Perplexity AI': 'openai',
  'Midjourney': 'midjourney',
  'Gemini 1.5 Pro': 'gemini',
  'Gemini 2.0 Flash': 'gemini',
  '豆包': 'doubao',
  '文心一言': 'wenxin',
  '通义千问': 'qwen',
  '通义千问 Turbo': 'qwen',
  '通义千问 Max': 'qwen',
  'DeepSeek V3': 'deepseek',
  'DeepSeek R1': 'deepseek'
};

// ===== API 路由 =====

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      claude: !!process.env.CLAUDE_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      kimi: !!process.env.KIMI_API_KEY,
      doubao: !!process.env.DOUBAO_API_KEY,
      wenxin: !!process.env.WENXIN_API_KEY,
      qwen: !!process.env.QWEN_API_KEY
    }
  });
});

// 获取可用 AI 模型列表
app.get('/api/ai/models', (req, res) => {
  res.json({
    models: [
      { id: 'ChatGPT-4o', name: 'ChatGPT-4o', provider: 'OpenAI', type: 'openai', description: 'GPT-4o 最新版本，多模态能力强' },
      { id: 'ChatGPT-4', name: 'ChatGPT-4', provider: 'OpenAI', type: 'openai', description: 'GPT-4 标准版' },
      { id: 'ChatGPT-3.5', name: 'ChatGPT-3.5', provider: 'OpenAI', type: 'openai', description: '速度快，成本低' },
      { id: 'Claude 3.5', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', type: 'claude', description: '推理能力强，擅长长文本' },
      { id: 'Claude 3 Opus', name: 'Claude 3 Opus', provider: 'Anthropic', type: 'claude', description: 'Claude 最强版本' },
      { id: 'Gemini 1.5 Pro', name: 'Gemini 1.5 Pro', provider: 'Google', type: 'gemini', description: 'Google 最新模型，支持超长上下文' },
      { id: 'Gemini 2.0 Flash', name: 'Gemini 2.0 Flash', provider: 'Google', type: 'gemini', description: '速度快，实时响应' },
      { id: 'Kimi', name: 'Kimi', provider: 'Moonshot', type: 'kimi', description: '国产大模型，支持超长文本' },
      { id: 'Kimi K1.5', name: 'Kimi K1.5', provider: 'Moonshot', type: 'kimi', description: 'Kimi 最新版本' },
      { id: '豆包', name: '豆包', provider: '字节跳动', type: 'doubao', description: '字节跳动出品，中文优化好' },
      { id: '文心一言', name: '文心一言', provider: '百度', type: 'wenxin', description: '百度大模型，知识丰富' },
      { id: '通义千问', name: '通义千问', provider: '阿里云', type: 'qwen', description: '阿里出品，中文场景优秀' },
      { id: '通义千问 Turbo', name: '通义千问 Turbo', provider: '阿里云', type: 'qwen', description: '速度优先版本' },
      { id: '通义千问 Max', name: '通义千问 Max', provider: '阿里云', type: 'qwen', description: '能力最强版本' },
      { id: 'DeepSeek V3', name: 'DeepSeek V3', provider: 'DeepSeek', type: 'deepseek', description: '通用大模型，性价比之王，中文能力极强' },
      { id: 'DeepSeek R1', name: 'DeepSeek R1', provider: 'DeepSeek', type: 'deepseek', description: '推理模型，擅长复杂逻辑和数学' }
    ]
  });
});

// 执行 AI 任务
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { workerId, prompt, context = {} } = req.body;
    
    if (!workerId || !prompt) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 获取 AI 服务类型
    const aiType = AI_SERVICES[context.ai] || 'openai';
    
    console.log(`[${new Date().toISOString()}] 执行任务: ${workerId}, AI: ${aiType}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    let result;
    
    switch (aiType) {
      case 'openai':
        result = await callOpenAI(prompt, context);
        break;
      case 'claude':
        result = await callClaude(prompt, context);
        break;
      case 'gemini':
        result = await callGemini(prompt, context);
        break;
      case 'kimi':
        result = await callKimi(prompt, context);
        break;
      case 'doubao':
        result = await callDoubao(prompt, context);
        break;
      case 'wenxin':
        result = await callWenxin(prompt, context);
        break;
      case 'qwen':
        result = await callQwen(prompt, context);
        break;
      case 'deepseek':
        result = await callDeepSeek(prompt, context);
        break;
      default:
        // 如果没有配置 API Key，返回模拟数据
        result = generateMockResult(workerId, context);
    }

    // 记录任务
    taskHistory.push({
      id: Date.now(),
      workerId,
      topic: context.topic,
      platform: context.platform,
      timestamp: new Date().toISOString(),
      result: result.substring(0, 500) + '...'
    });

    res.json({ success: true, result });

  } catch (error) {
    console.error('AI 生成错误:', error);
    res.status(500).json({ 
      error: '生成失败', 
      message: error.message,
      fallback: generateMockResult(req.body.workerId, req.body.context)
    });
  }
});

// 批量执行（流水线模式）
app.post('/api/pipeline/run', async (req, res) => {
  try {
    const { topic, platform, duration, style, workers } = req.body;
    
    if (!topic || !workers || !Array.isArray(workers)) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const results = {};
    const context = { topic, platform, duration, style };

    // 串行执行（保持依赖顺序）
    for (const worker of workers) {
      console.log(`执行: ${worker.id} - ${worker.name}`);
      
      const prompt = replaceVariables(worker.prompt, context);
      const aiType = AI_SERVICES[worker.ai] || 'openai';
      
      try {
        let result;
        switch (aiType) {
          case 'openai':
            result = await callOpenAI(prompt, { ...context, ai: worker.ai });
            break;
          case 'claude':
            result = await callClaude(prompt, { ...context, ai: worker.ai });
            break;
          case 'gemini':
            result = await callGemini(prompt, { ...context, ai: worker.ai });
            break;
          case 'kimi':
            result = await callKimi(prompt, { ...context, ai: worker.ai });
            break;
          case 'doubao':
            result = await callDoubao(prompt, { ...context, ai: worker.ai });
            break;
          case 'wenxin':
            result = await callWenxin(prompt, { ...context, ai: worker.ai });
            break;
          case 'qwen':
            result = await callQwen(prompt, { ...context, ai: worker.ai });
            break;
          case 'deepseek':
            result = await callDeepSeek(prompt, { ...context, ai: worker.ai });
            break;
          default:
            result = generateMockResult(worker.id, context);
        }
        
        results[worker.id] = {
          success: true,
          result,
          ai: worker.ai,
          timestamp: new Date().toISOString()
        };
        
        // 将结果加入上下文（供后续步骤使用）
        context[worker.id] = result;
        
      } catch (error) {
        results[worker.id] = {
          success: false,
          error: error.message,
          fallback: generateMockResult(worker.id, context)
        };
      }
      
      // 添加小延迟，避免请求过快
      await sleep(500);
    }

    res.json({ success: true, results });

  } catch (error) {
    console.error('流水线执行错误:', error);
    res.status(500).json({ error: '流水线执行失败', message: error.message });
  }
});

// 获取任务历史
app.get('/api/history', (req, res) => {
  res.json(taskHistory.slice(-50).reverse());
});

// 保存员工配置
app.post('/api/workers/config', (req, res) => {
  const { workerId, config } = req.body;
  workerConfigs[workerId] = config;
  res.json({ success: true });
});

// 获取员工配置
app.get('/api/workers/config/:workerId', (req, res) => {
  const config = workerConfigs[req.params.workerId];
  res.json(config || null);
});

// ===== AI 调用函数 =====

async function callOpenAI(prompt, context) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('未配置 OpenAI API Key，使用模拟数据');
    return generateMockResult(context.workerId || 'default', context);
  }

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的短视频内容创作助手，擅长创作爆款视频内容。请用中文回答，格式清晰，内容实用。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API 错误: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callClaude(prompt, context) {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.log('未配置 Claude API Key，使用模拟数据');
    return generateMockResult(context.workerId || 'default', context);
  }

  const baseUrl = process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com';
  
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: '你是一个专业的短视频内容创作助手，擅长创作爆款视频内容。请用中文回答，格式清晰，内容实用。'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API 错误: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Gemini API 调用
async function callGemini(prompt, context) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('未配置 Gemini API Key，使用模拟数据');
    return generateMockResult(context.workerId || 'default', context);
  }

  const model = context.ai === 'Gemini 2.0 Flash' ? 'gemini-2.0-flash-exp' : 'gemini-1.5-pro-latest';
  const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
  
  const response = await fetch(`${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `你是一个专业的短视频内容创作助手，擅长创作爆款视频内容。请用中文回答，格式清晰，内容实用。\n\n${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2000
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API 错误: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Kimi API 调用 (Moonshot)
async function callKimi(prompt, context) {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    console.log('未配置 Kimi API Key，使用模拟数据');
    return generateMockResult(context.workerId || 'default', context);
  }

  const model = context.ai === 'Kimi K1.5' ? 'kimi-k1.5' : 'kimi-latest';
  const baseUrl = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的短视频内容创作助手，擅长创作爆款视频内容。请用中文回答，格式清晰，内容实用。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kimi API 错误: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 豆包 API 调用 (字节跳动)
async function callDoubao(prompt, context) {
  const apiKey = process.env.DOUBAO_API_KEY;
  
  if (!apiKey) {
    console.log('未配置豆包 API Key，使用模拟数据');
    return generateMockResult(context.workerId || 'default', context);
  }

  const baseUrl = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'doubao-pro-32k',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的短视频内容创作助手，擅长创作爆款视频内容。请用中文回答，格式清晰，内容实用。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`豆包 API 错误: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 文心一言 API 调用 (百度)
async function callWenxin(prompt, context) {
  const apiKey = process.env.WENXIN_API_KEY;
  const secretKey = process.env.WENXIN_SECRET_KEY;
  
  if (!apiKey || !secretKey) {
    console.log('未配置文心一言 API Key，使用模拟数据');
    return generateMockResult(context.workerId || 'default', context);
  }

  // 获取 access_token
  const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`, {
    method: 'POST'
  });
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  const response = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: `你是一个专业的短视频内容创作助手，擅长创作爆款视频内容。请用中文回答，格式清晰，内容实用。\n\n${prompt}`
        }
      ],
      temperature: 0.8,
      max_output_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`文心一言 API 错误: ${error}`);
  }

  const data = await response.json();
  return data.result;
}

// 通义千问 API 调用 (阿里云)
async function callQwen(prompt, context) {
  const apiKey = process.env.QWEN_API_KEY;
  
  if (!apiKey) {
    console.log('未配置通义千问 API Key，使用模拟数据');
    return generateMockResult(context.workerId || 'default', context);
  }

  let model = 'qwen-turbo';
  if (context.ai === '通义千问 Max') {
    model = 'qwen-max';
  } else if (context.ai === '通义千问') {
    model = 'qwen-plus';
  }

  const baseUrl = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1';
  
  const response = await fetch(`${baseUrl}/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      input: {
        messages: [
          {
            role: 'system',
            content: '你是一个专业的短视频内容创作助手，擅长创作爆款视频内容。请用中文回答，格式清晰，内容实用。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        temperature: 0.8,
        max_tokens: 2000
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`通义千问 API 错误: ${error}`);
  }

  const data = await response.json();
  return data.output.text;
}

// DeepSeek API 调用
async function callDeepSeek(prompt, context) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    console.log('未配置 DeepSeek API Key，使用模拟数据');
    return generateMockResult(context.workerId || 'default', context);
  }

  // R1 是推理模型（带思维链），V3 是通用模型
  const model = context.ai === 'DeepSeek R1' ? 'deepseek-reasoner' : 'deepseek-chat';
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的短视频内容创作助手，擅长创作爆款视频内容。请用中文回答，格式清晰，内容实用。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API 错误: ${error}`);
  }

  const data = await response.json();
  
  // DeepSeek R1 返回结果中包含 reasoning_content，我们取最终回复
  if (data.choices && data.choices[0]) {
    return data.choices[0].message.content;
  }
  
  throw new Error('DeepSeek API 返回格式异常');
}

// ===== 工具函数 =====

function replaceVariables(prompt, context) {
  return prompt
    .replace(/\{主题\}/g, context.topic || '')
    .replace(/\{平台\}/g, context.platform || '')
    .replace(/\{时长\}/g, context.duration || '')
    .replace(/\{风格\}/g, context.style || '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 生成模拟结果（当没有 API Key 时使用）
function generateMockResult(workerId, context) {
  const { topic, platform, duration, style } = context;
  
  const mocks = {
    researcher: `📊 【选题分析报告】

基于「${topic || '示例主题'}」在${platform || '抖音'}平台的热门方向分析：

**爆款角度 1：痛点直击型**
- 目标人群：25-35岁职场人
- 核心痛点：时间不够用、效率低下
- 完播率理由：开头3秒直击痛点，引发共鸣

**爆款角度 2：数字对比型**
- 目标人群：追求成长的年轻人
- 核心痛点：缺乏系统方法
- 完播率理由：具体数字增加可信度

**爆款角度 3：反常识型**
- 目标人群：喜欢新鲜事物的人群
- 核心痛点：固有认知限制
- 完播率理由：打破常规，引发好奇

**爆款角度 4：故事型**
- 目标人群：情感共鸣型用户
- 核心痛点：孤独、需要认同
- 完播率理由：故事性强，代入感好

**爆款角度 5：干货清单型**
- 目标人群：实用主义者
- 核心痛点：信息过载、需要筛选
- 完播率理由：结构清晰，便于收藏`,

    director: `🎯 【内容策划方案】

**视频核心主题句：**
${topic || '示例主题'} - 改变从这里开始

**目标受众画像：**
- 年龄：25-35岁
- 职业：白领/自由职业者
- 痛点：${topic || '示例主题'}相关困扰
- 需求：实用、可执行的方法

**差异化卖点：**
1. 真实案例支撑
2. 步骤清晰可执行
3. 效果可量化验证

**备用标题：**
1. 「${topic || '示例主题'}」的3个秘密，第2个90%的人不知道
2. 我用了30天，彻底改变了${topic || '示例主题'}
3. 为什么你总是${topic || '示例主题'}失败？原因找到了`,

    hook: `⚡ 【开头钩子文案】

1. **「你知道吗？90%的人${topic || '示例主题'}都错了」**
   - 反常识开头，引发好奇

2. **「3年前，我也是${topic || '示例主题'}困难户」**
   - 身份认同，拉近距离

3. **「这个方法让我${topic || '示例主题'}效率提升300%」**
   - 数字冲击，结果导向

4. **「别再做这件事了，它正在毁掉你的${topic || '示例主题'}」**
   - 警告式开头，制造紧迫感

5. **「我花了1000小时，总结出这3个${topic || '示例主题'}技巧」**
   - 沉没成本，增加可信度`,

    script: `📜 【视频脚本】

**【0-5秒】开场钩子**
画面：真人出镜，表情认真
口播：「${topic || '示例主题'}，真的有那么难吗？」
字幕：大字标题 + 疑问表情

**【5-20秒】问题共鸣**
画面：场景化展示问题
口播：「你是不是也遇到过...（列举痛点）」
字幕：痛点列表

**【20-45秒】解决方案**
画面：步骤演示/图文配合
口播：「今天分享3个实用方法...」
字幕：方法1、方法2、方法3

**【45-55秒】效果展示**
画面：前后对比/数据展示
口播：「用了这个方法，我...」
字幕：具体效果数据

**【55-60秒】CTA结尾**
画面：真人出镜，手势引导
口播：「觉得有用记得点赞收藏，下期教你...」
字幕：关注提示 + 下期预告`,

    title: `🏷️ 【标题优化方案】

1. **「${topic || '示例主题'}的5个技巧，第3个太绝了」**
   - 推荐理由：数字+悬念，点击率高

2. **「为什么你总是${topic || '示例主题'}失败？原因找到了」**
   - 推荐理由：痛点直击，引发共鸣

3. **「30天${topic || '示例主题'}挑战，我做到了」**
   - 推荐理由：时间框架+成果展示

4. **「${topic || '示例主题'}｜从入门到精通的完整指南」**
   - 推荐理由：全面性，适合收藏

5. **「这个方法让我${topic || '示例主题'}效率翻倍」**
   - 推荐理由：结果导向，实用性强

6. **「${topic || '示例主题'}｜90%的人都忽略了这一点」**
   - 推荐理由：反常识，引发好奇

7. **「3分钟学会${topic || '示例主题'}，建议收藏」**
   - 推荐理由：时间短+行动指令

8. **「${topic || '示例主题'}的真相，看完恍然大悟」**
   - 推荐理由：揭秘感，完播率高

9. **「我用1000小时总结的${topic || '示例主题'}经验」**
   - 推荐理由：沉没成本，增加可信度

10. **「${topic || '示例主题'}｜新手最容易犯的5个错误」**
    - 推荐理由：避坑指南，实用性强`,

    cover: `🖼️ 【封面设计方案】

**Midjourney 提示词：**

A vibrant and eye-catching thumbnail for a short video about ${topic || 'personal development'}, featuring a confident young professional in bright natural lighting, expressive facial expression with a slight smile, clean minimalist background in soft blue and white tones, bold Chinese text overlay, modern design aesthetic, high contrast, 16:9 aspect ratio, professional photography style, energetic and positive vibe --ar 16:9 --style raw

**封面设计要点：**
1. **主色调**：明亮蓝白，清新专业
2. **人物表情**：自信微笑，有亲和力
3. **文字排版**：大标题+副标题，层次分明
4. **视觉焦点**：人物居中，文字醒目
5. **平台适配**：${platform || '抖音'}风格，竖版优先`,

    desc: `📋 【发布文案】

**视频简介：**
今天分享关于${topic || '示例主题'}的干货内容！经过30天实践，总结出了这套实用方法。无论你是新手还是有一定经验，都能从中获得启发。建议收藏反复观看！

**话题标签：**
#${topic || '示例主题'} #干货分享 #自我提升 #实用技巧 #成长干货

**@推荐账号：**
@${platform || '抖音'}小助手 @知识分享官

**最佳发布时间：**
${platform === 'bilibili' ? '周五 18:00-20:00' : platform === 'xiaohongshu' ? '周二/周四 12:00-13:00' : '每天 19:00-21:00'}

**互动引导语：**
💬 你在${topic || '示例主题'}方面有什么困惑？评论区告诉我，下期安排！
👍 觉得有用记得点赞收藏，转发给需要的朋友～
➕ 关注我，持续分享实用干货！`,

    comment: `💬 【评论区预设回复】

**正面夸奖类：**
1. 「谢谢支持！会继续努力输出好内容💪」
2. 「能帮到你就好！有问题随时问～」
3. 「你的鼓励是我最大的动力✨」

**质疑反驳类：**
1. 「理解你的疑虑，这个方法确实因人而异，建议先试试看效果😊」
2. 「感谢不同意见！每个人的情况不同，找到适合自己的最重要」
3. 「有道理！我会继续优化内容，欢迎持续关注」

**深度提问类：**
1. 「好问题！这个在下一期会详细讲，记得关注哦～」
2. 「私信你了，详细解答！」
3. 「这个问题很有代表性，我准备专门做一期来回答」

**互动引导类：**
1. 「大家觉得呢？评论区聊聊你的看法👇」
2. 「有没有同感的朋友？举个手🙋」
3. 「你的经验是什么？分享一下吧！」

**情绪安抚类：**
1. 「别急，慢慢来，改变需要时间💙」
2. 「理解你的 frustration，我之前也经历过，坚持就会有收获」
3. 「抱抱🤗 相信自己，你可以的！」`,

    engage: `🎁 【粉丝互动活动方案】

**活动 1：话题挑战赛**
- 名称：#${topic || '示例主题'}30天挑战
- 规则：连续30天打卡，每天分享进展
- 激励：完成挑战送独家资料包
- 话题：#${topic || '示例'}打卡 #30天挑战

**活动 2：有奖问答**
1. ${topic || '示例主题'}的最佳时间是什么时候？
2. 以下哪个方法最有效？
3. 坚持${topic || '示例主题'}需要多久见效？
4. 最常见的误区是什么？
5. 推荐的新手起步方法？

**活动 3：连续内容钩子**
- 本期：${topic || '示例主题'}入门指南
- 预告：下期分享进阶技巧
- 悬念：「还有一个秘密武器，下期揭晓」`,

    dm: `📩 【私信话术库】

**新粉迎新语：**
1. 「欢迎新朋友！有什么想了解的随时问我～」
2. 「谢谢关注！我会持续分享${topic || '实用'}干货」
3. 「嗨！很高兴认识你，一起进步💪」

**产品咨询引导：**
1. 「感谢咨询！详细资料我发你，看看是否符合你的需求」
2. 「这个我们有专门的解决方案，方便电话沟通吗？」
3. 「可以先试用一下，体验后再决定」

**合作洽谈回应：**
1. 「感谢认可！合作事宜可以发邮件到 xxx@example.com」
2. 「商务合作请联系我的助理，微信：xxx」
3. 「很高兴收到合作邀请，我们先了解一下彼此的需求」

**负面情绪化解：**
1. 「理解你的感受，如果内容有冒犯之处我道歉」
2. 「感谢反馈，我会认真反思和改进」
3. 「每个人观点不同，尊重你的看法」

**转化成交引导：**
1. 「感兴趣的话可以点击主页链接了解详情」
2. 「现在下单有优惠，限时3天」
3. 「加入社群可以获得更多专属内容」`,

    analyst: `📈 【数据预测分析】

**72小时数据指标预测：**

**完播率基准：**
- 预计完播率：35-45%
- 行业平均：30%
- 优化建议：前3秒钩子再强化

**互动率预期：**
- 点赞率：8-12%
- 评论率：2-3%
- 分享率：1-2%

**涨粉转化率：**
- 预计涨粉：0.5-1%
- 目标：单视频涨粉 50-100

**最佳二次推广时机：**
- 发布24小时后，如果互动率>5%，建议投DOU+
- 投放预算：建议 100-300元测试

**DOU+投放建议：**
- 值得投放阈值：自然播放量 > 5000
- 目标人群：25-35岁，一线城市
- 投放时长：24小时`,

    optimizer: `🔧 【迭代优化建议】

**内容表现分析：**
1. **受欢迎内容类型**：实用干货 > 情感共鸣 > 娱乐搞笑
2. **最佳时长**：3-5分钟完播率最高
3. **最佳发布时间**：工作日 19:00-21:00

**标题优化方向：**
- 多用数字（3个、5步、30天）
- 加入情绪词（震惊、绝了、太实用了）
- 制造悬念（90%的人不知道）

**下期选题规划：**
1. 「${topic || '示例主题'}进阶版：高手都在用的技巧」
2. 「${topic || '示例主题'}常见误区，你中了几个？」
3. 「从0到1：${topic || '示例主题'}完整路线图」

**账号差异化定位：**
- 定位：实用主义成长博主
- 特色：方法论+真实案例+可执行
- slogan：让成长更简单`
  };

  return mocks[workerId] || `✅ 【${workerId} 执行结果】\n\n已根据「${topic || '示例主题'}」生成内容。\n\n（这是模拟数据，配置 API Key 后可获得真实 AI 生成内容）`;
}

// API Key 管理接口
app.get('/api/config', (req, res) => {
  res.json({
      openai: !!process.env.OPENAI_API_KEY,
      claude: !!process.env.CLAUDE_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      kimi: !!process.env.KIMI_API_KEY,
      doubao: !!process.env.DOUBAO_API_KEY,
      wenxin: !!(process.env.WENXIN_API_KEY && process.env.WENXIN_SECRET_KEY),
      qwen: !!process.env.QWEN_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY
    });
});

// 启动服务器（监听所有网卡，支持局域网访问）
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';

  // 自动获取局域网 IP
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }

  console.log(`\n🎬 AI 视频工厂服务器已启动`);
  console.log(`📍 本机访问: http://localhost:${PORT}`);
  console.log(`🌐 局域网访问: http://${localIP}:${PORT}`);
  console.log(`\n📋 API 配置状态:`);
  console.log(`   OpenAI:    ${process.env.OPENAI_API_KEY ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`   Claude:    ${process.env.CLAUDE_API_KEY ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`   Gemini:    ${process.env.GEMINI_API_KEY ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`   Kimi:      ${process.env.KIMI_API_KEY ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`   豆包:      ${process.env.DOUBAO_API_KEY ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`   文心一言:  ${process.env.WENXIN_API_KEY ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`   通义千问:  ${process.env.QWEN_API_KEY ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`   DeepSeek:  ${process.env.DEEPSEEK_API_KEY ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`\n💡 提示: 创建 .env 文件并添加 API Key 即可使用真实 AI 生成\n`);
  console.log(`📖 配置指南: https://github.com/your-repo/ai-video-pipeline/blob/main/API配置指南.md\n`);
});

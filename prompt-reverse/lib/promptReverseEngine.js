// 提示词反推核心模块
const axios = require('axios');

// 场景分析模板
const SCENE_TEMPLATES = {
  article: {
    name: '文章写作',
    analyzePrompt: `你是一位专业的提示词工程师。请仔细分析以下文章，并反推出生成它的提示词模板。

分析维度：
1. 文章结构（开头、正文、结尾的组织方式）
2. 语气和风格（正式、轻松、幽默等）
3. 写作技巧（修辞手法、段落安排）
4. 目标读者定位
5. 核心诉求（文章想传达什么）

输出格式：
{
  "detected_structure": "结构分析",
  "tone": "语气描述",
  "writing_techniques": ["技巧1", "技巧2"],
  "target_audience": "目标读者",
  "core_purpose": "核心目的",
  "prompt_template": "可复用的提示词模板，用{{变量}}代替具体内容"
}

待分析的文章：
{{content}}`
  },

  code: {
    name: '代码生成',
    analyzePrompt: `你是一位专业的提示词工程师和资深开发者。请分析以下代码，反推出生成它的提示词。

分析维度：
1. 代码风格（命名规范、注释风格、格式）
2. 编程语言和框架
3. 功能复杂度
4. 设计模式
5. 最佳实践应用

输出格式：
{
  "code_style": "代码风格描述",
  "language": "编程语言/框架",
  "complexity": "复杂度评级",
  "design_patterns": ["使用的模式"],
  "prompt_template": "可复用的提示词模板，用{{变量}}代替具体内容"
}

待分析的代码：
\`\`\`
{{content}}
\`\`\``
  },

  social: {
    name: '社交媒体文案',
    analyzePrompt: `你是一位专业的社交媒体运营专家。请分析以下文案，反推出生成它的提示词。

分析维度：
1. 平台特性（小红书、抖音、微博等）
2. 文案结构（标题、正文、结尾）
3. 情绪调动方式
4. 标签使用策略
5. 互动引导技巧

输出格式：
{
  "platform": "适合的平台",
  "structure": "文案结构分析",
  "emotion_type": "情绪类型",
  "tag_strategy": "标签策略",
  "prompt_template": "可复用的提示词模板，用{{变量}}代替具体内容"
}

待分析的文案：
{{content}}`
  },

  image: {
    name: 'AI绘图提示词',
    analyzePrompt: `你是一位专业的AI绘图提示词专家。请分析以下描述的图片特征，反推出生成它的提示词。

分析维度：
1. 主体和构图
2. 艺术风格（写实、插画、动漫等）
3. 色彩方案
4. 光影效果
5. 氛围和情绪
6. 技术参数（分辨率、渲染风格等）

输出格式：
{
  "subject": "主体描述",
  "composition": "构图方式",
  "art_style": "艺术风格",
  "color_scheme": "色彩方案",
  "lighting": "光影效果",
  "mood": "氛围情绪",
  "prompt_template": "可复用的提示词模板，用{{变量}}代替具体内容"
}

待分析的图片描述：
{{content}}`
  },

  general: {
    name: '通用文本',
    analyzePrompt: `你是一位专业的提示词工程师。请仔细分析以下内容，反推出生成它的提示词模板。

分析维度：
1. 内容结构
2. 语气和风格
3. 关键要素
4. 写作技巧
5. 预期效果

输出格式：
{
  "content_structure": "内容结构分析",
  "tone_style": "语气和风格",
  "key_elements": ["关键要素1", "关键要素2"],
  "writing_techniques": ["技巧1", "技巧2"],
  "expected_outcome": "预期效果",
  "prompt_template": "可复用的提示词模板，用{{变量}}代替具体内容"
}

待分析的内容：
{{content}}`
  }
};

// 提示词优化建议
const OPTIMIZATION_TIPS = {
  article: [
    "添加具体的字数限制",
    "指定引用数据源或权威",
    "增加输出格式要求（如分点、标题等）",
    "加入受众背景信息"
  ],
  code: [
    "指定编码规范（如PEP8、ESLint）",
    "要求添加详细注释",
    "包含错误处理和边界情况",
    "指定测试用例编写"
  ],
  social: [
    "添加字数限制（平台要求）",
    "指定热门标签使用",
    "增加互动引导语句",
    "包含emoji使用建议"
  ],
  image: [
    "添加分辨率参数",
    "指定渲染引擎或模型",
    "包含负面提示词（不想要的内容）",
    "添加风格权重参数"
  ]
};

/**
 * 根据场景和分析结果，反推提示词
 * @param {string} content - 待分析的内容
 * @param {string} scene - 场景类型
 * @param {object} options - 额外选项
 */
async function reversePrompt(content, scene = 'general', options = {}) {
  const template = SCENE_TEMPLATES[scene] || SCENE_TEMPLATES.general;
  const prompt = template.analyzePrompt.replace('{{content}}', content);

  try {
    // 这里应该调用AI模型进行分析
    // 目前返回示例结果
    const result = await analyzeWithAI(prompt, scene);
    
    return {
      success: true,
      scene: scene,
      sceneName: template.name,
      analysis: result,
      optimizationTips: OPTIMIZATION_TIPS[scene] || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('提示词反推失败:', error);
    throw new Error('提示词反推失败: ' + error.message);
  }
}

/**
 * 调用AI模型进行分析
 * @param {string} prompt - 分析提示词
 * @param {string} scene - 场景类型
 */
async function analyzeWithAI(prompt, scene) {
  // TODO: 这里应该集成实际的AI模型API
  // 目前返回模拟数据用于演示
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockResults = {
        article: {
          detected_structure: "引入-展开-结论的三段式结构，开篇用问句引发兴趣",
          tone: "专业且亲切，平衡权威感和可读性",
          writing_techniques: ["数据引用增强说服力", "案例说明提升实用性", "金句总结便于传播"],
          target_audience: "有一定基础知识的技术从业者或学生",
          core_purpose: "传递专业知识，解决实际问题",
          prompt_template: `你是一位{{专业领域}}专家，请写一篇关于{{主题}}的文章。

要求：
1. 文章结构：开篇用引人入胜的问题或数据引入，中间用3-5个要点展开论述，结尾用金句总结
2. 语气：专业且亲切，避免过于学术化
3. 写作技巧：至少引用2个真实数据或案例，使用生动的比喻
4. 字数：{{字数}}字左右
5. 目标读者：{{目标读者}}

请确保内容实用、逻辑清晰、易于理解。`
        },
        
        code: {
          code_style: "遵循PEP8规范，使用有意义的变量名，添加必要的注释",
          language: "Python",
          complexity: "中等",
          design_patterns: ["工厂模式", "单例模式"],
          prompt_template: `请用{{编程语言}}编写一个{{功能描述}}的功能。

要求：
1. 代码风格：遵循{{编码规范}}
2. 设计模式：使用{{设计模式}}进行架构
3. 功能特性：
   - 核心逻辑：{{核心逻辑描述}}
   - 错误处理：添加完整的异常处理
   - 日志记录：关键步骤输出日志
4. 输出格式：
   - 主函数入口
   - 包含文档字符串
   - 添加类型注解（如适用）
5. 测试：提供2-3个使用示例

代码需要清晰、高效、易于维护。`
        },
        
        social: {
          platform: "小红书",
          structure: "吸睛标题+3个要点+总结+标签",
          emotion_type: "热情、分享、引发共鸣",
          tag_strategy: "使用1-2个热门标签+2-3个长尾标签",
          prompt_template: `请为{{平台}}写一篇关于{{主题}}的文案。

要求：
1. 标题：使用emoji，包含数字或疑问句，15-25字
2. 正文结构：
   - 开篇：用痛点或疑问引入
   - 中间：3个核心要点，每个要点用emoji开头
   - 结尾：引导互动或行动
3. 语气：{{语气}}，拉近和读者距离
4. 表情符号：适度使用（5-8个）
5. 标签：{{标签数量}}个，包含热门标签和长尾标签
6. 字数：{{字数}}字左右

文案需要有趣、实用、容易传播。`
        },
        
        image: {
          subject: "主体清晰突出",
          composition: "三分法构图，主体位于交叉点",
          art_style: "数字插画，扁平化设计",
          color_scheme: "暖色调，渐变色，高饱和度",
          lighting: "柔和的自然光，正面光为主",
          mood: "温暖、积极、充满活力",
          prompt_template: `请生成一张{{主题}}的图片。

详细描述：
1. 主体：{{主体描述}}
2. 艺术风格：{{艺术风格}}
3. 构图：{{构图方式}}
4. 色彩：{{色彩方案}}
5. 光影：{{光影效果}}
6. 氛围：{{氛围情绪}}
7. 背景：{{背景描述}}
8. 技术参数：分辨率{{分辨率}}，{{渲染质量}}

确保画面清晰、色彩协调、细节丰富。`
        },
        
        general: {
          content_structure: "总分总结构，逻辑清晰",
          tone_style: "专业但不生硬",
          key_elements: ["明确主题", "支撑论据", "总结升华"],
          writing_techniques: ["设问引导", "案例支撑", "数据验证"],
          expected_outcome: "读者能够理解并应用所学内容",
          prompt_template: `请根据以下要求生成内容：

主题：{{主题}}
类型：{{内容类型}}
目标读者：{{目标读者}}
目的：{{写作目的}}

要求：
1. 结构：{{结构要求}}
2. 语气：{{语气要求}}
3. 长度：{{字数}}字左右
4. 特点：{{特殊要求}}
5. 输出格式：{{输出格式}}

请确保内容准确、有用、易懂。`
        }
      };
      
      resolve(mockResults[scene] || mockResults.general);
    }, 1000);
  });
}

/**
 * 优化提示词
 * @param {string} prompt - 原始提示词
 * @param {string} scene - 场景类型
 */
function optimizePrompt(prompt, scene = 'general') {
  const tips = OPTIMIZATION_TIPS[scene] || OPTIMIZATION_TIPS.general;
  
  let optimized = prompt;
  
  // 检查并添加常用优化
  const checks = [
    {
      condition: () => !optimized.includes('字数'),
      action: () => optimized += '\n6. 字数：请控制在500-800字之间'
    },
    {
      condition: () => !optimized.includes('格式'),
      action: () => optimized += '\n7. 输出格式：使用清晰的标题和分点'
    },
    {
      condition: () => !optimized.includes('语气'),
      action: () => optimized += '\n8. 语气：专业且友好'
    }
  ];
  
  checks.forEach(check => {
    if (check.condition()) {
      check.action();
    }
  });
  
  return {
    original: prompt,
    optimized: optimized,
    improvements: tips,
    score: Math.floor(Math.random() * 20) + 80 // 模拟评分
  };
}

/**
 * 获取所有支持的场景
 */
function getSupportedScenes() {
  return Object.entries(SCENE_TEMPLATES).map(([key, value]) => ({
    key,
    name: value.name
  }));
}

module.exports = {
  reversePrompt,
  analyzeWithAI,
  optimizePrompt,
  getSupportedScenes,
  SCENE_TEMPLATES
};

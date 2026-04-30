// AI新闻聚合模块
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');

const parser = new Parser();

// AI新闻源配置
const NEWS_SOURCES = {
  // AIbase.cn - 国内领先的AI资讯平台
  aibase: {
    name: 'AIbase',
    url: 'https://www.aibase.cn',
    rss: 'https://www.aibase.cn/feed',
    type: 'rss'
  },
  // O'Reilly AI Radar
  oreilly: {
    name: 'O\'Reilly AI Radar',
    url: 'https://www.oreilly.com',
    rss: 'https://feeds.feedburner.com/oreilly/radar',
    type: 'rss'
  },
  // AI News
  aiNews: {
    name: 'Artificial Intelligence News',
    url: 'https://www.artificialintelligence-news.com',
    rss: 'https://www.artificialintelligence-news.com/feed/',
    type: 'rss'
  }
};

// 关键词过滤，确保只获取AI相关内容
const AI_KEYWORDS = [
  'artificial intelligence', 'machine learning', 'deep learning',
  'neural network', 'GPT', 'Claude', 'AI model', 'LLM',
  'generative AI', 'AI assistant', 'AI tool', 'AI chatbot',
  '人工智能', '机器学习', '深度学习', 'AI模型', 'AI助手',
  'AI工具', '大模型', 'ChatGPT', 'Gemini', 'Copilot',
  'AI应用', 'AI技术', 'AI行业', 'AI产品'
];

/**
 * 从RSS源获取新闻
 */
async function fetchRSSNews(source) {
  try {
    const feed = await parser.parseURL(source.rss);
    const items = feed.items.slice(0, 10); // 获取最新10条

    return items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.contentSnippet || item.description || '',
      source: source.name,
      sourceUrl: source.url,
      category: 'AI News'
    }));
  } catch (error) {
    console.error(`抓取RSS源失败: ${source.name}`, error.message);
    return [];
  }
}

/**
 * 从网页抓取新闻（备用方案）
 */
async function scrapeWebNews(source) {
  try {
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    const news = [];
    // 通用的新闻选择器，根据网站结构可能需要调整
    $('article, .news-item, .post, .article').slice(0, 10).each((index, element) => {
      const title = $(element).find('h2, h3, .title').first().text().trim();
      const link = $(element).find('a').first().attr('href');
      const description = $(element).find('.excerpt, .summary, p').first().text().trim();

      if (title && link) {
        const fullLink = link.startsWith('http') ? link : new URL(link, source.url).href;

        // 检查是否包含AI关键词
        const text = (title + ' ' + description).toLowerCase();
        const hasAIKeyword = AI_KEYWORDS.some(keyword => 
          text.toLowerCase().includes(keyword.toLowerCase())
        );

        if (hasAIKeyword) {
          news.push({
            title,
            link: fullLink,
            pubDate: new Date().toISOString(),
            description,
            source: source.name,
            sourceUrl: source.url,
            category: 'AI News'
          });
        }
      }
    });

    return news;
  } catch (error) {
    console.error(`抓取网页新闻失败: ${source.name}`, error.message);
    return [];
  }
}

/**
 * 获取所有来源的新闻
 */
async function fetchAllNews() {
  console.log('开始抓取AI新闻...');
  const allNews = [];

  for (const [key, source] of Object.entries(NEWS_SOURCES)) {
    console.log(`正在从 ${source.name} 获取新闻...`);
    
    let news = [];
    if (source.type === 'rss') {
      news = await fetchRSSNews(source);
    } else {
      news = await scrapeWebNews(source);
    }

    allNews.push(...news);
    console.log(`从 ${source.name} 获取到 ${news.length} 条新闻`);
  }

  // 去重（基于标题）
  const uniqueNews = [];
  const seenTitles = new Set();

  for (const news of allNews) {
    const normalizedTitle = news.title.toLowerCase().trim();
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniqueNews.push(news);
    }
  }

  console.log(`总共获取到 ${uniqueNews.length} 条唯一新闻`);
  return uniqueNews;
}

/**
 * 保存新闻到JSON文件
 */
async function saveNews(news) {
  const dataDir = path.join(__dirname, '..', 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    // 目录已存在
  }

  const today = new Date().toISOString().split('T')[0];
  const filename = path.join(dataDir, `news-${today}.json`);
  const latestFilename = path.join(dataDir, 'news-latest.json');

  const newsData = {
    date: today,
    updatedAt: new Date().toISOString(),
    count: news.length,
    news: news
  };

  await Promise.all([
    fs.writeFile(filename, JSON.stringify(newsData, null, 2), 'utf-8'),
    fs.writeFile(latestFilename, JSON.stringify(newsData, null, 2), 'utf-8')
  ]);

  console.log(`新闻已保存到 ${filename}`);
}

/**
 * 从文件加载新闻
 */
async function loadNews(date = null) {
  const dataDir = path.join(__dirname, '..', 'data');
  const targetDate = date || new Date().toISOString().split('T')[0];
  const filename = path.join(dataDir, `news-${targetDate}.json`);

  try {
    const content = await fs.readFile(filename, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // 如果指定日期的文件不存在，尝试加载最新的
    if (!date) {
      const latestFilename = path.join(dataDir, 'news-latest.json');
      try {
        const content = await fs.readFile(latestFilename, 'utf-8');
        return JSON.parse(content);
      } catch (err) {
        return null;
      }
    }
    return null;
  }
}

/**
 * 主函数：更新新闻
 */
async function updateNews() {
  try {
    const news = await fetchAllNews();
    await saveNews(news);
    return news;
  } catch (error) {
    console.error('更新新闻失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行更新
if (require.main === module) {
  updateNews()
    .then(() => {
      console.log('新闻更新完成');
      process.exit(0);
    })
    .catch(err => {
      console.error('新闻更新失败:', err);
      process.exit(1);
    });
}

module.exports = {
  fetchAllNews,
  saveNews,
  loadNews,
  updateNews
};

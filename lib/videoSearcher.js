// YouTube视频搜索模块
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// AI相关YouTube频道
const AI_CHANNELS = [
  {
    name: 'Two Minute Papers',
    url: 'https://www.youtube.com/@TwoMinutePapers',
    keywords: ['AI', 'machine learning', 'deep learning']
  },
  {
    name: 'AI Explain',
    url: 'https://www.youtube.com/@ai-explained-',
    keywords: ['AI', 'LLM', 'GPT']
  },
  {
    name: 'Sam Altman',
    url: 'https://www.youtube.com/@sama',
    keywords: ['OpenAI', 'GPT', 'AI']
  },
  {
    name: 'NVIDIA AI',
    url: 'https://www.youtube.com/@nvidiaai',
    keywords: ['GPU', 'AI', 'deep learning']
  },
  {
    name: 'Andrej Karpathy',
    url: 'https://www.youtube.com/@karpathy',
    keywords: ['neural networks', 'AI', 'LLM']
  }
];

// AI视频搜索关键词
const VIDEO_SEARCH_KEYWORDS = [
  'AI news today',
  'artificial intelligence breakthrough',
  'GPT update',
  'Claude AI',
  'machine learning tutorial',
  'AI tools 2025',
  'deep learning news',
  'LLM latest',
  'AI research paper explained',
  'AI application'
];

/**
 * 从YouTube搜索页面抓取视频（不需要API密钥）
 */
async function searchYouTubeVideos(query, maxResults = 5) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const videos = [];
    // YouTube返回的是JavaScript数据，需要使用正则表达式提取
    const dataMatch = response.data.match(/var ytInitialData = ({.+?});/);
    
    if (dataMatch) {
      const data = JSON.parse(dataMatch[1]);
      const contents = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;

      for (const section of contents) {
        if (section.itemSectionRenderer) {
          for (const item of section.itemSectionRenderer.contents) {
            if (item.videoRenderer) {
              const video = item.videoRenderer;
              const videoId = video.videoId;
              
              videos.push({
                videoId,
                title: video.title.runs[0].text,
                description: video.descriptionSnippet?.runs?.map(r => r.text).join('') || '',
                channelName: video.ownerText.runs[0].text,
                channelId: video.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                thumbnail: video.thumbnail.thumbnails[video.thumbnail.thumbnails.length - 1].url,
                publishedTimeText: video.publishedTimeText?.simpleText || 'Unknown',
                viewCountText: video.viewCountText?.simpleText || '0 views',
                durationText: video.lengthText?.simpleText || 'Unknown',
                url: `https://www.youtube.com/watch?v=${videoId}`,
                source: 'YouTube Search'
              });

              if (videos.length >= maxResults) break;
            }
          }
        }
      }
    }

    return videos;
  } catch (error) {
    console.error(`搜索YouTube视频失败: ${query}`, error.message);
    return [];
  }
}

/**
 * 获取AI频道最新视频
 */
async function getChannelVideos(channel) {
  try {
    const response = await axios.get(channel.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const videos = [];
    const dataMatch = response.data.match(/var ytInitialData = ({.+?});/);

    if (dataMatch) {
      const data = JSON.parse(dataMatch[1]);
      const contents = data.contents.twoColumnBrowseResultsRenderer.tabs;

      for (const tab of contents) {
        if (tab.tabRenderer?.content?.sectionListRenderer) {
          const sections = tab.tabRenderer.content.sectionListRenderer.contents;

          for (const section of sections) {
            if (section.itemSectionRenderer) {
              for (const item of section.itemSectionRenderer.contents) {
                if (item.shelfRenderer) {
                  for (const shelfItem of item.shelfRenderer.contents) {
                    if (shelfItem.videoRenderer) {
                      const video = shelfItem.videoRenderer;
                      const videoId = video.videoId;

                      videos.push({
                        videoId,
                        title: video.title.runs[0].text,
                        channelName: channel.name,
                        channelId: video.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                        thumbnail: video.thumbnail.thumbnails[video.thumbnail.thumbnails.length - 1].url,
                        publishedTimeText: video.publishedTimeText?.simpleText || 'Unknown',
                        viewCountText: video.viewCountText?.simpleText || '0 views',
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        source: channel.name
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return videos.slice(0, 5);
  } catch (error) {
    console.error(`获取频道视频失败: ${channel.name}`, error.message);
    return [];
  }
}

/**
 * 获取所有AI相关视频
 */
async function fetchAllVideos() {
  console.log('开始搜索AI相关视频...');
  const allVideos = [];

  // 从AI频道获取最新视频
  for (const channel of AI_CHANNELS) {
    console.log(`正在从 ${channel.name} 获取视频...`);
    const videos = await getChannelVideos(channel);
    allVideos.push(...videos);
    console.log(`从 ${channel.name} 获取到 ${videos.length} 个视频`);
  }

  // 基于关键词搜索热门视频
  const searchQueries = VIDEO_SEARCH_KEYWORDS.slice(0, 3); // 限制搜索数量
  for (const query of searchQueries) {
    console.log(`正在搜索: ${query}`);
    const videos = await searchYouTubeVideos(query, 3);
    allVideos.push(...videos);
  }

  // 去重（基于videoId）
  const uniqueVideos = [];
  const seenIds = new Set();

  for (const video of allVideos) {
    if (!seenIds.has(video.videoId)) {
      seenIds.add(video.videoId);
      uniqueVideos.push(video);
    }
  }

  console.log(`总共获取到 ${uniqueVideos.length} 个唯一视频`);
  return uniqueVideos;
}

/**
 * 保存视频数据到文件
 */
async function saveVideos(videos) {
  const dataDir = path.join(__dirname, '..', 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    // 目录已存在
  }

  const today = new Date().toISOString().split('T')[0];
  const filename = path.join(dataDir, `videos-${today}.json`);
  const latestFilename = path.join(dataDir, 'videos-latest.json');

  const videosData = {
    date: today,
    updatedAt: new Date().toISOString(),
    count: videos.length,
    videos: videos
  };

  await Promise.all([
    fs.writeFile(filename, JSON.stringify(videosData, null, 2), 'utf-8'),
    fs.writeFile(latestFilename, JSON.stringify(videosData, null, 2), 'utf-8')
  ]);

  console.log(`视频数据已保存到 ${filename}`);
}

/**
 * 从文件加载视频数据
 */
async function loadVideos(date = null) {
  const dataDir = path.join(__dirname, '..', 'data');
  const targetDate = date || new Date().toISOString().split('T')[0];
  const filename = path.join(dataDir, `videos-${targetDate}.json`);

  try {
    const content = await fs.readFile(filename, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (!date) {
      const latestFilename = path.join(dataDir, 'videos-latest.json');
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
 * 主函数：更新视频
 */
async function updateVideos() {
  try {
    const videos = await fetchAllVideos();
    await saveVideos(videos);
    return videos;
  } catch (error) {
    console.error('更新视频失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行更新
if (require.main === module) {
  updateVideos()
    .then(() => {
      console.log('视频更新完成');
      process.exit(0);
    })
    .catch(err => {
      console.error('视频更新失败:', err);
      process.exit(1);
    });
}

module.exports = {
  searchYouTubeVideos,
  getChannelVideos,
  fetchAllVideos,
  saveVideos,
  loadVideos,
  updateVideos
};

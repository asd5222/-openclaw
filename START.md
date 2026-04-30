# AI每日资讯 - 使用指南

## 🎉 项目已完成！

你的AI新闻和视频聚合博客系统已经成功创建！

## 📦 项目包含以下功能：

### 1. 📰 新闻抓取模块 (`lib/newsAggregator.js`)
- 从多个RSS源获取AI新闻（AIbase.cn、O'Reilly AI Radar等）
- 关键词过滤，确保内容相关
- 自动去重和清洗数据
- 支持按日期加载历史数据

### 2. 🎬 视频搜索模块 (`lib/videoSearcher.js`)
- 搜索YouTube上的AI相关视频
- 从知名AI频道获取最新内容（Two Minute Papers、AI Explain等）
- 提供视频缩略图、时长、观看数等信息
- 支持关键词搜索热门视频

### 3. 🌐 现代化博客界面
- 响应式深色主题设计
- 新闻卡片展示（标题、来源、日期、摘要）
- 视频卡片展示（缩略图、标题、频道、元数据）
- 按来源筛选功能
- 实时刷新功能
- 平滑滚动和动画效果

### 4. 🔧 Express服务器 (`server.js`)
- RESTful API接口
- 静态文件服务
- CORS支持
- 定时任务自动更新

### 5. ⚙️ 自动更新机制
- 使用node-cron实现定时任务
- 默认每天早上8点自动更新
- 支持自定义更新频率
- 数据持久化存储

## 🚀 如何使用：

### 方式一：在本地运行

```bash
# 1. 安装依赖（已完成）
cd c:/Users/Lenovo/WorkBuddy/Claw
npm install

# 2. 启动服务器
npm start

# 3. 打开浏览器访问
# http://localhost:3000
```

### 方式二：手动更新数据

```bash
npm run update-news
```

### 方式三：在Web界面中刷新

访问 `http://localhost:3000`，点击右上角的"刷新"按钮

## 📊 项目结构：

```
Claw/
├── data/              # 数据存储（自动生成）
│   ├── news-latest.json
│   └── videos-latest.json
├── lib/               # 核心模块
│   ├── newsAggregator.js
│   └── videoSearcher.js
├── public/            # 前端文件
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── scripts/           # 脚本
│   └── updateNews.js
├── server.js          # 服务器
├── package.json       # 配置文件
└── README.md          # 详细文档
```

## ⚙️ 自定义配置：

### 修改更新时间

创建 `.env` 文件：
```env
PORT=3000
UPDATE_SCHEDULE="0 8 * * *"  # 每天早上8点
```

### 添加新闻源

编辑 `lib/newsAggregator.js`，在 `NEWS_SOURCES` 中添加：
```javascript
const NEWS_SOURCES = {
  mySource: {
    name: 'My AI News',
    url: 'https://example.com',
    rss: 'https://example.com/feed',
    type: 'rss'
  }
};
```

### 添加视频频道

编辑 `lib/videoSearcher.js`，在 `AI_CHANNELS` 中添加：
```javascript
const AI_CHANNELS = [
  {
    name: 'My AI Channel',
    url: 'https://www.youtube.com/@mychannel',
    keywords: ['AI', 'machine learning']
  }
];
```

## 🔌 API接口：

- `GET /api/news` - 获取新闻
- `GET /api/videos` - 获取视频
- `POST /api/refresh` - 刷新所有数据
- `POST /api/refresh/news` - 仅刷新新闻
- `POST /api/refresh/videos` - 仅刷新视频

## 💡 提示：

1. **首次启动**会自动获取初始数据（可能需要几分钟）
2. **定时任务**会在设定时间自动更新
3. **数据存储**在 `data/` 目录，可定期备份
4. **网络要求**：需要能够访问外网（用于抓取数据和搜索视频）

## 🎨 界面特性：

- ✅ 深色主题，护眼舒适
- ✅ 响应式设计，支持手机/平板/电脑
- ✅ 新闻卡片悬停效果
- ✅ 视频缩略图展示
- ✅ 按来源筛选
- ✅ 一键复制视频链接
- ✅ 实时更新时间显示
- ✅ 平滑滚动导航

## 📝 后续可扩展：

1. 添加更多新闻源和视频频道
2. 实现用户订阅功能
3. 添加评论和点赞系统
4. 集成邮件通知
5. 添加RSS输出功能
6. 支持多语言
7. 添加搜索功能
8. 实现数据可视化图表

祝使用愉快！🚀

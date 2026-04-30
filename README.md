# 🚀 OpenClaw - AI 新闻聚合系统

[中文](#openclaw-ai-新闻聚合系统) | [English](#openclaw-ai-news-aggregator)

OpenClaw 是一个基于 Node.js 构建的 AI 新闻与视频聚合博客系统，通过自动化脚本多源抓取 AI 领域最新动态，帮助开发者高效追踪 AI Coding、具身智能等前沿技术资讯。

---

## ✨ 功能特性

- 🤖 **AI 新闻聚合** — 自动抓取多源 AI 资讯，涵盖大模型发布、AI Coding、具身智能等热门方向
- 🎬 **视频内容集成** — 聚合优质 AI 相关内容视频源
- ⏰ **定时更新** — 内置 cron 任务，自动保持内容最新
- 📱 **响应式界面** — 支持 PC / 手机 / 平板多端访问
- 🚀 **一键启动** — Windows 一键脚本，开箱即用

## 🛠️ 技术栈

| 技术  | 用途       |
|------|-----------|
| Node.js | 后端运行环境 |
| Express | Web 服务器框架 |
| Cheerio | HTML 解析与数据抓取 |
| RSS Parser | RSS 订阅源解析 |
| node-cron | 定时任务调度 |
| EJS | 前端模板引擎 |

## 🚀 快速启动

```bash
# 克隆项目
git clone https://github.com/asd5222/-openclaw.git
cd -openclaw

# 安装依赖
npm install

# 启动服务器
npm start
```

启动后浏览器访问 `http://localhost:3000` 即可查看。

### Windows 用户

直接双击 **`OpenClaw.bat`** 即可一键启动。

## 📸 运行截图

![OpenClaw 启动日志](docs/terminal-log.png)
![OpenClaw 首页](docs/homepage.png)

## 🏗️ 项目结构

```
OpenClaw/
├── server-simple.js      # 简化版服务器（快速启动）
├── server.js             # 完整版服务器
├── OpenClaw.bat          # Windows 一键启动脚本
├── start.bat             # 备用启动脚本
├── scripts/              # 数据抓取与更新脚本
│   └── updateNews.js     # 新闻数据更新
├── public/               # 前端静态资源
├── data/                 # 数据存储目录
└── package.json          # 项目配置
```

## 📌 发展路线

- [x] 多源新闻聚合
- [x] 响应式 Web 界面
- [x] 定时自动更新
- [ ] DeepSeek R1 智能摘要
- [ ] AI 视频工厂集成
- [ ] 多 Agent 协作工作流

## 📄 开源协议

MIT License

---

# OpenClaw - AI News Aggregator

An AI-driven news and video aggregation blog system built with Node.js. Automatically collects the latest AI developments from multiple sources, helping developers stay on top of AI Coding, embodied intelligence, and cutting-edge technologies.

---

*Built with ❤️ for the AI community*

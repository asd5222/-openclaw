# 🦞 OpenClaw - AI 新闻聚合与视频工坊系统

> 小米 MiMo 创作者激励计划 · 参赛项目

---

## 📋 项目简介

OpenClaw 是一个基于 Node.js 构建的 **AI 内容聚合与管理平台**，集成了新闻抓取、视频生成、智能发布等模块，致力于为内容创作者提供一站式的 AI 驱动工作流。

### 核心功能

| 模块 | 说明 |
|------|------|
| 📰 **AI 新闻聚合** | 自动抓取多源 AI 科技资讯，定时更新 |
| 🎬 **AI 视频工坊** | 基于 DeepSeek 等模型生成视频脚本与素材 |
| 📤 **智能发布管理** | 多平台自动发布与内容排期 |
| 🔄 **自动更新** | 基于 node-cron 的定时任务系统 |

---

## 🚀 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动简化版服务器（推荐）
npm start

# 3. 在浏览器访问
http://localhost:3000
```

**Windows 用户**也可以直接双击 `OpenClaw.bat` 一键启动。

### 终端启动截图

```
========================================
  🚀 AI新闻聚合服务器启动成功！
========================================

📡 访问地址: http://localhost:3000

✅ 系统运行正常
```

---

## 🧠 Agent / AI 驱动设计

- **DeepSeek 模型集成**：基于 DeepSeek R1/V3 进行内容生成与推理
- **自动化工作流**：新闻抓取 → 内容聚合 → 前端展示的全自动流程
- **可扩展架构**：video-pipeline 模块支持扩展为多 Agent 视频生产系统
- **定时任务编排**：使用 node-cron 实现无人值守的内容更新

---

## 🛠 技术栈

- **运行时**：Node.js
- **框架**：Express
- **AI 模型**：DeepSeek R1 / V3
- **自动化**：node-cron
- **数据聚合**：axios + cheerio + rss-parser

---

## 📁 项目结构

```
OpenClaw/
├── server.js           # 主服务器
├── server-simple.js    # 简化版服务器
├── OpenClaw.bat        # Windows 一键启动
├── package.json
├── lib/
│   ├── newsAggregator.js   # 新闻聚合引擎
│   └── videoSearcher.js    # 视频搜索模块
├── public/             # 前端静态页面
├── scripts/            # 自动化脚本
├── ai-video-pipeline/  # AI 视频生成流水线
└── docs/               # 文档与日志
```

---

## 📊 开发状态

- ✅ AI 新闻聚合系统 — 运行中
- ✅ 本地服务器部署 — 已完成
- 🔄 AI 视频工坊 — 功能验证中
- 📝 云端部署 — 规划中

---

## 👤 关于作者

**asd5222** · GitHub: [@asd5222](https://github.com/asd5222)

> 专注于 AI Coding 与 AI 视频生成方向，深耕 DeepSeek 模型应用。

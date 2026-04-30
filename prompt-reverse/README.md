# AI提示词反推工具

一个智能的提示词工程工具，通过分析现有内容，反向推导出生成该内容的提示词模板。

## ✨ 功能特性

- 🔄 **智能反推** - 从文章、代码、文案等优质内容中提取提示词模板
- 🎯 **多场景支持** - 支持文章写作、代码生成、社交媒体、AI绘图等多种场景
- 💡 **自动优化** - 自动优化提示词并给出改进建议
- 📊 **详细分析** - 分析内容结构、风格、技巧等多个维度
- 🎨 **现代界面** - 响应式设计，支持深色主题

## 🚀 快速开始

### 安装依赖
```bash
cd c:/Users/Lenovo/WorkBuddy/Claw/prompt-reverse
npm install
```

### 启动服务器
```bash
npm start
```

### 访问应用
打开浏览器访问: `http://localhost:3001`

## 📋 使用场景

### 1. 文章写作
输入一篇你喜欢的文章，工具会分析：
- 文章结构
- 语气风格
- 写作技巧
- 目标读者
- 生成可复用的提示词模板

### 2. 代码生成
粘贴一段优秀的代码，工具会提取：
- 编程规范
- 设计模式
- 复杂度分析
- 生成代码提示词模板

### 3. 社交媒体文案
分析爆款文案，学习：
- 平台特性
- 情绪调动
- 标签策略
- 互动技巧

### 4. AI绘图提示词
从图片描述中反推：
- 主体构图
- 艺术风格
- 色彩方案
- 光影效果

## 🔧 API接口

### 反推提示词
```bash
POST /api/reverse
Content-Type: application/json

{
  "content": "要分析的内容",
  "scene": "article|code|social|image|general"
}
```

### 优化提示词
```bash
POST /api/optimize
Content-Type: application/json

{
  "prompt": "要优化的提示词",
  "scene": "场景类型"
}
```

### 获取场景列表
```bash
GET /api/scenes
```

## 💡 使用技巧

1. **选择合适的场景** - 不同场景分析维度不同
2. **输入优质内容** - 输入质量越好，反推的提示词越准确
3. **多次测试优化** - 结合优化建议不断改进提示词
4. **保存模板** - 将好用的提示词保存为模板库

## 📁 项目结构

```
prompt-reverse/
├── lib/
│   └── promptReverseEngine.js  # 核心反推引擎
├── public/
│   ├── index.html            # 主页面
│   ├── css/style.css         # 样式文件
│   └── js/app.js            # 前端逻辑
├── server.js                # Express服务器
├── package.json             # 项目配置
└── README.md               # 说明文档
```

## 🎯 未来计划

- [ ] 集成真实AI模型API
- [ ] 添加更多场景模板
- [ ] 支持批量分析
- [ ] 添加提示词库功能
- [ ] 支持导出为JSON/PDF

## 📄 许可证

MIT License

---

Made with ❤️ for AI prompt engineering

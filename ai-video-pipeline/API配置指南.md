# AI 视频工厂 - API 配置指南

## 🎉 已完成接入

你的 AI 视频工厂现在支持 **7 大 AI 平台、14+ 模型**！

### 支持的 AI 模型

| 平台 | 模型 | 类型 | 特点 |
|-----|------|-----|------|
| **OpenAI** | GPT-4o, GPT-4, GPT-3.5 | 国际 | 能力强，多模态 |
| **Claude** | Claude 3.5, Claude 3 Opus | 国际 | 推理强，长文本 |
| **Gemini** | Gemini 1.5 Pro, Gemini 2.0 Flash | 国际 | Google出品，超长上下文 |
| **Kimi** | Kimi, Kimi K1.5 | 国产 | 超长文本，中文好 |
| **豆包** | 豆包 Pro | 国产 | 字节出品，中文优化 |
| **文心一言** | 文心一言 | 国产 | 百度出品，知识丰富 |
| **通义千问** | 通义千问, Turbo, Max | 国产 | 阿里出品，场景优秀 |

---

## 📋 快速开始

### 1. 创建环境变量文件

```bash
# 在项目目录执行
cd c:\Users\Lenovo\WorkBuddy\Claw\ai-video-pipeline
copy .env.example .env
```

### 2. 选择需要的 API 配置

**不需要全部配置！** 根据你的需求选择 1-2 个即可：

| 场景 | 推荐配置 |
|-----|---------|
| 国际信用卡可用 | OpenAI + Claude |
| 只用国内模型 | Kimi + 通义千问 |
| 免费试用 | Gemini（有免费额度） |
| 中文内容为主 | 豆包 + 文心一言 |

### 3. 获取 API Key

#### OpenAI
1. 访问 https://platform.openai.com/api-keys
2. 登录 → Create new secret key
3. 复制 key 到 `.env` 的 `OPENAI_API_KEY`

#### Claude (Anthropic)
1. 访问 https://console.anthropic.com/settings/keys
2. 注册 → Create Key
3. 复制 key 到 `.env` 的 `CLAUDE_API_KEY`

#### Google Gemini
1. 访问 https://aistudio.google.com/app/apikey
2. 登录 Google 账号 → Create API Key
3. 复制 key 到 `.env` 的 `GEMINI_API_KEY`

#### Kimi (Moonshot)
1. 访问 https://platform.moonshot.cn/
2. 注册 → 创建 API Key
3. 复制 key 到 `.env` 的 `KIMI_API_KEY`

#### 豆包 (字节跳动)
1. 访问 https://console.volcengine.com/ark/
2. 注册火山引擎 → 创建推理接入点
3. 复制 key 到 `.env` 的 `DOUBAO_API_KEY`

#### 文心一言 (百度)
1. 访问 https://console.bce.baidu.com/qianfan/
2. 注册百度智能云 → 创建应用
3. 复制 API Key 和 Secret Key 到 `.env`

#### 通义千问 (阿里云)
1. 访问 https://dashscope.aliyun.com/
2. 登录阿里云 → 开通 DashScope
3. 创建 API Key → 复制到 `.env` 的 `QWEN_API_KEY`

### 4. 重启服务器

```bash
npm start
```

---

## ✅ 验证配置

启动后查看控制台：

```
🎬 AI 视频工厂服务器已启动
📍 访问地址: http://localhost:3000

📋 API 配置状态:
   OpenAI:    ✅ 已配置
   Claude:    ⚠️ 未配置
   Gemini:    ⚠️ 未配置
   Kimi:      ✅ 已配置
   豆包:      ⚠️ 未配置
   文心一言:  ⚠️ 未配置
   通义千问:  ⚠️ 未配置
```

或访问 API 检查：
```bash
curl http://localhost:3000/api/health
```

---

## 💰 费用参考

### 国际模型

| 模型 | 预估费用/次 | 备注 |
|-----|------------|------|
| GPT-4o | ~$0.01-0.03 | 速度快，能力强 |
| Claude 3.5 | ~$0.01-0.02 | 推理能力强 |
| Gemini 1.5 Pro | 免费额度 | 每月有免费额度 |

### 国产模型

| 模型 | 预估费用/次 | 备注 |
|-----|------------|------|
| Kimi | ~¥0.01-0.03 | 新用户有免费额度 |
| 豆包 | ~¥0.005-0.01 | 性价比高 |
| 文心一言 | ~¥0.01-0.02 | 按量付费 |
| 通义千问 | ~¥0.01-0.03 | 有免费额度 |

### 完整流水线费用估算

一条视频完整流水线（16个员工）：

| 方案 | 预估费用 | 说明 |
|-----|---------|------|
| 全 OpenAI | ~$0.20-0.50 | ~¥1.5-4 |
| 全 Claude | ~$0.15-0.30 | ~¥1-2 |
| 全国产模型 | ~¥0.15-0.50 | 最省钱 |
| 混合方案 | ~$0.10-0.30 | 平衡性价比 |

**省钱技巧**：
1. 测试时用模拟数据（不配置 API Key）
2. 关键岗位用 AI，其他用模板
3. 选择有免费额度的模型

---

## 🔧 故障排查

### API 调用失败

**现象**：员工显示 "工作中" 很久，然后变成 "完成"（实际是模拟数据）

**排查步骤**：
1. 检查 `.env` 文件是否正确创建
2. 确认 API Key 没有过期
3. 查看服务器控制台错误信息
4. 测试单个 API：
   ```bash
   curl http://localhost:3000/api/health
   ```

### 国内访问问题

**现象**：OpenAI/Claude 连接超时

**解决**：
1. 使用国内模型（Kimi、豆包、通义千问）
2. 或使用代理（需自行配置）

### API Key 无效

**现象**：返回 401 错误

**解决**：
- 重新生成 API Key
- 确认 Key 格式正确（不要有多余空格）
- 确认账户有余额

---

## 🚀 进阶配置

### 使用代理

```env
# OpenAI 代理
OPENAI_BASE_URL=https://your-proxy.com/v1

# Claude 代理
CLAUDE_BASE_URL=https://your-proxy.com
```

### 自定义模型参数

修改 `server.js` 中的调用参数：

```javascript
// 调整温度（创造性）
temperature: 0.8,  // 0-2，越高越创造性

// 调整最大 token
max_tokens: 2000,  // 根据内容长度调整
```

---

## 📚 相关链接

- [OpenAI 定价](https://openai.com/pricing)
- [Claude 定价](https://www.anthropic.com/pricing)
- [Gemini 文档](https://ai.google.dev/)
- [Kimi 平台](https://platform.moonshot.cn/)
- [豆包/火山引擎](https://console.volcengine.com/)
- [文心一言](https://console.bce.baidu.com/qianfan/)
- [通义千问](https://dashscope.aliyun.com/)

---

## ✅ 配置检查清单

- [ ] 复制 `.env.example` 为 `.env`
- [ ] 选择 1-2 个 AI 平台配置
- [ ] 获取并填写 API Key
- [ ] 重启服务器
- [ ] 访问 `/api/health` 验证配置
- [ ] 运行一次完整流水线测试

配置完成后，你的 AI 视频工厂就能生成真实的高质量内容了！🎉

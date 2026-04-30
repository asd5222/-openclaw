// ============================================================
// AI 视频生产流水线 v2.0
// 功能：头像上传/编辑、提示词持久化、多页面、账号管理、数据统计
// ============================================================

let selectedStyle = '搞笑幽默';
let isRunning = false;
let allResults = {};
let currentEditingWorker = null;
let modalAvatarData = null; // 'emoji:🔍' or 'url:data:...'

// ============================================================
// 完整员工配置（含新增岗位）
// ============================================================
const WORKERS_CONFIG = {
  researcher: {
    name: '选题研究员', ai: 'DeepSeek V3', dept: '策划部', defaultEmoji: '🔍',
    outputTemplate: (topic, platform, style) => `📊 「${topic}」在${platform}平台热门方向分析\n\n✅ 角度1：个人亲身经历 + 数据反差\n目标人群：18-30岁职场新人\n痛点：知道道理但做不到\n预估完播率：78% ｜理由：有代入感、结尾反转\n\n✅ 角度2：反常识揭秘\n目标人群：对此话题好奇的用户\n痛点：一直用错方法\n预估完播率：82% ｜理由：标题制造认知冲突\n\n✅ 角度3：7天实验挑战\n目标人群：想改变但缺乏动力\n痛点：坚持不下去\n预估完播率：71% ｜理由：时限感+悬念\n\n✅ 角度4：专家对比普通人差异\n目标人群：有进阶需求的用户\n预估完播率：69% ｜理由：干货密度高\n\n✅ 角度5：失败案例警示\n目标人群：正在踩坑的人\n预估完播率：75% ｜理由：负面情绪引发共鸣`.trim()
  },
  director: {
    name: '内容策划', ai: 'DeepSeek V3', dept: '策划部', defaultEmoji: '🎯',
    outputTemplate: (topic, platform, style) => `🎯 内容策划方案\n\n核心主题句：\n「${topic}」—— 用亲身实践打破你的错误认知\n\n目标受众画像：\n• 年龄：20-35岁\n• 特征：有改变意愿但行动力弱\n• 场景：通勤/睡前刷${platform}\n• 情绪：焦虑 + 渴望改变\n\n差异化卖点：\n① 不讲理论，只讲可复制的动作\n② 展示真实过程（包括失败的那次）\n③ 结尾给出"最小行动清单"\n\n备用标题：\nA.「我用30天证明，99%的人想错了」\nB.「不是你不努力，是方法错了」\nC.「做了${topic}的第7天，发现一个规律」`.trim()
  },
  competitor: {
    name: '竞品分析师', ai: 'DeepSeek V3', dept: '策划部', defaultEmoji: '🕵️',
    outputTemplate: (topic, platform, style) => `🕵️ 「${topic}」竞品分析报告\n\n📹 TOP爆款共同规律：\n① 标题必含数字（7天/30天/3步）\n② 封面人物表情夸张，高饱和度背景\n③ 前5秒必出"反常识"结论\n④ 时长集中在45s-90s区间\n\n🏆 头部账号内容套路：\n• @xxx：每期对比实验，强结果展示\n• @yyy：情绪化叙述，代入感极强\n• @zzz：干货列表流，信息密度最高\n\n💬 评论区高频问题（机会点）：\n• "能推荐具体的工具吗？"\n• "这个方法对初学者有用吗？"\n• "能出详细教程版吗？"\n\n🎯 差异化机会：\n→ 专注"初学者视角"，填补工具教程空缺\n→ 每期附赠资源包，提升收藏率`.trim()
  },
  hook: {
    name: '钩子文案师', ai: 'DeepSeek V3', dept: '文案部', defaultEmoji: '⚡',
    outputTemplate: (topic, platform, style) => `⚡ 5个开头钩子（前3秒）\n\n🥇 推荐No.1（反常识型）：\n「${topic}，你一直做错了」\n\n🥈 推荐No.2（数字冲击型）：\n「90%的人不知道这个方法」\n\n🥉 推荐No.3（悬念提问型）：\n「为什么聪明人更难做到这件事？」\n\nNo.4（场景代入型）：\n「你有没有这样的经历……」\n\nNo.5（结果前置型）：\n「坚持21天后，我整个人变了」\n\n💡 建议：画面先出结果再讲过程，完播率可提升约15%`.trim()
  },
  script: {
    name: '脚本编剧', ai: 'DeepSeek R1', dept: '文案部', defaultEmoji: '📜',
    outputTemplate: (topic, platform, style, duration) => `📜 ${duration} ${platform}视频脚本\n\n【00:00-00:03】开场钩子\n画面：人物直视镜头，表情震惊\n台词：「关于${topic}，你一直做错了」\n字幕：⚡关于${topic}，你一直做错了\n\n【00:03-00:10】痛点共鸣\n画面：展示"错误做法"的场景\n台词：「大多数人都会这么做，这恰恰是失败的根本原因」\n字幕：❌ 你是不是也这样？\n\n【00:10-00:25】核心内容\n画面：分步骤展示，文字图表辅助\n台词：「正确的做法只有三步——第一步……」\n字幕：✅ 正确做法 Step 1/2/3\n\n【00:25-00:35】结果展示\n画面：前后对比 / 实际效果演示\n台词：「用了这个方法之后……」\n字幕：📈 效果对比\n\n【00:35-00:42】CTA结尾\n画面：面对镜头，点赞手势\n台词：「觉得有用就收藏，我们下期继续」\n字幕：👍 收藏 | 💬 评论你的情况`.trim()
  },
  title: {
    name: '标题优化师', ai: 'DeepSeek V3', dept: '文案部', defaultEmoji: '🏷️',
    outputTemplate: (topic, platform, style) => `🏷️ 10个优化标题\n\n1.「${topic}：90%的人不知道的正确方法」→ 数字+反常识，点击率高\n2.「做了30天${topic}，我整个人变了」→ 时间线+结果前置\n3.「为什么你做${topic}总是失败？看这个」→ 提问式，直击痛点\n4.「${topic}真正有效的3个方法（亲测）」→ 数字+亲测背书\n5.「别再浪费时间了！${topic}最快的方法」→ 紧迫感+价值承诺\n6.「${topic}：聪明人都在用这个思路」→ 身份认同\n7.「我试了10种方法，只有这1种有效」→ 对比+筛选感\n8.「没人告诉你的${topic}秘诀」→ 秘密感\n9.「${topic}：从0到做到只需3步」→ 具体步骤\n10.「看完这条视频，你的${topic}会完全不同」→ 结果承诺`.trim()
  },
  cover: {
    name: '封面设计师', ai: 'DeepSeek V3', dept: '视觉部', defaultEmoji: '🖼️',
    outputTemplate: (topic, platform, style) => `🖼️ 封面设计方案\n\n构图建议：\n• 左侧：醒目大字（标题关键词）\n• 右侧：人物表情夸张（震惊/喜悦）\n• 背景：渐变色块，高饱和度\n\n推荐配色：\nA：橙红渐变（激进感）#FF4500 → #FF8C00\nB：蓝紫渐变（科技感）#6C63FF → #3B82F6\nC：绿黄渐变（活力感）#22C55E → #F59E0B\n\n📋 Midjourney Prompt：\nA ${platform} video thumbnail, person with shocked expression,\nbold Chinese text about "${topic}",\nvibrant gradient background orange to red,\nhigh contrast, eye-catching, 9:16 ratio,\n${style} style, 4K --v 6 --ar 9:16\n\n字体建议：\n主标题：思源黑体 Bold 60-80px\n副标题：阿里巴巴普惠体 30px`.trim()
  },
  storyboard: {
    name: '分镜设计师', ai: 'DeepSeek V3', dept: '视觉部', defaultEmoji: '🎞️',
    outputTemplate: (topic, platform, style) => `🎞️ 分镜设计方案\n\n段落     景别      运镜    画面主体   转场\n开场钩子  近景特写  推镜头  人物面部   快速切换\n痛点共鸣  中景      固定    对比画面   溶解过渡\n核心步骤  中近景    跟踪    操作演示   划屏切换\n结果展示  全景+特写 拉镜头  前后对比   闪白过渡\nCTA结尾   近景      固定    人物直视   渐隐\n\n参考素材：\n• 人物出镜：竖屏拍摄，背景简洁\n• B-roll：相关操作、实景记录\n• 动效字幕：CapCut自动字幕\n• BGM：抖音热榜 / Epidemic Sound\n\n后期建议：\n① 剪映专业版（PC）\n② 字幕：自动识别后手动校对\n③ 封面：单独拍摄，不用截图`.trim()
  },
  desc: {
    name: '简介文案', ai: 'DeepSeek V3', dept: '发布部', defaultEmoji: '📋',
    outputTemplate: (topic, platform, style) => `📋 ${platform}发布文案\n\n📝 视频简介：\n「${topic}」不是天生的能力，而是可以习得的系统方法。本视频分享亲身实践的3个核心技巧，真正有效、可复制。如果你也在为此困扰，这条视频值得收藏反复看。💬 评论区聊聊你的情况，我一一回复~\n\n#️⃣ 话题标签：\n#${topic} #干货分享 #自我提升 #${platform}热门 #亲测有效\n\n🕐 最佳发布时间：\n工作日：12:00-13:00 / 20:00-22:00\n周末：10:00-11:00 / 19:00-21:00\n\n💬 互动引导语：\n「你现在做到了哪一步？评论区见👇」\n「有问题的扣1，我出详细教程」`.trim()
  },
  seo: {
    name: 'SEO优化师', ai: 'DeepSeek V3', dept: '发布部', defaultEmoji: '🔑',
    outputTemplate: (topic, platform, style) => `🔑 ${platform} SEO关键词分析\n\n📊 高搜索量关键词：\n1. ${topic}方法 - 月搜 120万+\n2. 如何${topic} - 月搜 85万+\n3. ${topic}技巧 - 月搜 73万+\n4. ${topic}教程 - 月搜 61万+\n5. ${topic}入门 - 月搜 45万+\n\n🎯 低竞争长尾词（更容易上热门）：\n• 「${topic}初学者最容易犯的错误」\n• 「${topic}坚持30天的真实感受」\n• 「${topic}怎么才能不放弃」\n\n📌 标题必须嵌入：\n【${topic}】+【数字】+【方法/技巧/秘诀】\n\n⏰ 最佳发布时段：\n周二/四晚 20:00-21:30 ← 流量最高\n周末上午 10:00-11:00 ← 互动率最高`.trim()
  },
  comment: {
    name: '评论回复专员', ai: 'DeepSeek V3', dept: '互动运营部', defaultEmoji: '💬',
    outputTemplate: (topic, platform, style) => `💬 「${topic}」评论区预设回复库\n\n✅ 正面夸奖回复：\n「哈哈谢谢你！希望对你有帮助😊」\n「你说到我心坎了！继续加油✊」\n「感谢支持，下期还有更多干货」\n\n🤔 质疑反驳回复：\n「这个问题问得好！其实是这样的……」\n「不同情况确实有差异，我出期详细对比」\n「你说的这个点我会在下期专门讲」\n\n❓ 深度提问回复：\n「好问题！简单说就是……展开的话可以私信我」\n「这个值得单独出一期，先收藏这条吧」\n\n❤️ 情绪安抚回复：\n「你已经很棒了！每天进步一点点就够」\n「失败是正常的，我也经历过，慢慢来」\n\n📣 互动引导回复：\n「想看完整教程的扣1！」\n「收藏了吗？收藏了才是真爱😂」`.trim()
  },
  engage: {
    name: '粉丝互动策划', ai: 'DeepSeek V3', dept: '互动运营部', defaultEmoji: '🎁',
    outputTemplate: (topic, platform, style) => `🎁 「${topic}」粉丝互动活动方案\n\n🏆 活动1：话题挑战赛\n名称：#我的${topic}挑战\n规则：发布你的${topic}视频@我，最高赞获得专属礼包\n激励：①流量扶持 ②免费1对1点评 ③账号推广\n预期参与：200-500人\n\n🧩 活动2：有奖问答（5道题）\nQ1：做${topic}最重要的第一步是什么？\nQ2：以下哪个误区你也犯过？\nQ3：坚持的最大障碍是什么？\nQ4：你已经坚持了多少天？\nQ5：想要什么样的详细教程？\n\n🔗 活动3：连续内容钩子\n第1期：提出问题，给出30%答案\n第2期：揭秘核心方法\n第3期：展示真实结果+彩蛋\n→ 每期结尾："下期我要……敢来挑战吗？"`.trim()
  },
  dm: {
    name: '私信话术顾问', ai: 'DeepSeek V3', dept: '互动运营部', defaultEmoji: '📩',
    outputTemplate: (topic, platform, style) => `📩 「${topic}」私信话术库\n\n👋 新粉迎新语：\n「嗨！欢迎关注～我主要分享${topic}相关内容，有问题随时问我！」\n「谢谢关注！我整理了一份入门资料，想要的话回复"资料"📖」\n\n💰 产品咨询引导：\n「这个我在视频里有讲到，具体内容可以看置顶那期～」\n「如果需要更系统的指导，我这边有1对1服务，可以了解下」\n\n🤝 合作洽谈回应：\n「感谢您的关注！合作细节可以发邮件到xxx，我们团队会跟进」\n「可以的，请问是什么类型的合作呢？」\n\n😔 负面情绪化解：\n「看到你的消息我也很心疼，先深呼吸一下……」\n「你不是一个人，很多人都有这样的感受，慢慢来」\n\n💡 转化成交引导：\n「这个问题在我的课程里讲得很详细，感兴趣吗？」\n「限时优惠今天截止，需要我帮你留一个名额吗？」`.trim()
  },
  analyst: {
    name: '数据解读师', ai: 'DeepSeek R1', dept: '数据分析部', defaultEmoji: '📈',
    outputTemplate: (topic, platform, style) => `📈 「${topic}」发布后72小时数据预测\n\n📊 核心指标基准：\n• 完播率：预期 45-60%（平均水位 35%）\n• 点赞率：预期 3-5%\n• 评论率：预期 0.8-1.2%\n• 涨粉率：预期 0.3-0.8%\n\n⏰ 关键时间节点：\n发布后 1小时：判断是否进入推荐流\n发布后 24小时：初步数据定生死\n发布后 72小时：是否值得投DOU+\n\n💡 值得投DOU+的阈值：\n• 自然完播率 > 50% ✅\n• 点赞/播放比 > 3% ✅\n• 评论有明显情绪共鸣 ✅\n→ 满足2个以上建议投放 100-200元测试\n\n📅 二次推广最佳时机：\n• 发布72小时后数据下滑时\n• 同话题热点事件出现时`.trim()
  },
  optimizer: {
    name: '迭代优化师', ai: 'DeepSeek R1', dept: '数据分析部', defaultEmoji: '🔧',
    outputTemplate: (topic, platform, style) => `🔧 账号迭代优化建议\n\n📊 本期「${topic}」内容复盘：\n✅ 做对的：节奏快、钩子强、CTA明确\n⚠️ 待改进：中段信息密度偏低，可压缩\n\n🔥 受众最爱的内容类型（按数据）：\n① 对比实验类 — 互动率最高\n② 干货列表类 — 收藏率最高\n③ 故事叙述类 — 涨粉效果最好\n\n📅 下3期选题规划：\n第1期：「${topic}的3个常见错误」（流量预测↑）\n第2期：「${topic}工具推荐」（变现友好）\n第3期：「${topic}30天挑战」（系列内容，锁粉）\n\n🎯 账号定位强化方案：\n• 主打标签：专注「${topic}」垂直领域\n• 人设强化：真实经历+数据背书\n• 更新节奏：每周2-3条，保持稳定\n• 差异化：每期必含可操作的"最小行动"`.trim()
  }
};

// ============================================================
// 流水线步骤
// ============================================================
const PIPELINE = [
  { deptId: 'dept-plan',     deptName: '策划部',     workers: ['researcher', 'director', 'competitor'], parallel: false },
  { deptId: 'dept-copy',     deptName: '文案部',     workers: ['hook', 'script', 'title'],              parallel: true },
  { deptId: 'dept-visual',   deptName: '视觉部',     workers: ['cover', 'storyboard'],                  parallel: true },
  { deptId: 'dept-publish',  deptName: '发布部',     workers: ['desc', 'seo'],                          parallel: true },
  { deptId: 'dept-interact', deptName: '互动运营部', workers: ['comment', 'engage', 'dm'],              parallel: true },
  { deptId: 'dept-data',     deptName: '数据分析部', workers: ['analyst', 'optimizer'],                 parallel: true }
];

// ============================================================
// 本地存储：头像 & 提示词 & 统计
// ============================================================
function loadStorage() {
  try {
    return JSON.parse(localStorage.getItem('aivp_data') || '{}');
  } catch { return {}; }
}
function saveStorage(data) {
  localStorage.setItem('aivp_data', JSON.stringify(data));
}
function getWorkerData(workerId) {
  const data = loadStorage();
  return data[workerId] || {};
}
function setWorkerData(workerId, patch) {
  const data = loadStorage();
  data[workerId] = { ...(data[workerId] || {}), ...patch };
  saveStorage(data);
}

// ============================================================
// 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // 风格按钮
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedStyle = btn.dataset.style;
    });
  });

  // 从存储还原头像和提示词
  Object.keys(WORKERS_CONFIG).forEach(id => {
    restoreWorkerUI(id);
  });

  // 初始化进度步骤点
  const poSteps = document.getElementById('poSteps');
  PIPELINE.flatMap(d => d.workers).forEach(w => {
    const dot = document.createElement('div');
    dot.className = 'po-step';
    dot.id = `po-${w}`;
    dot.title = WORKERS_CONFIG[w]?.name || w;
    poSteps.appendChild(dot);
  });

  // 渲染员工管理页
  renderStaffPage();

  // 更新部门badge
  updateDeptBadges();

  // 统计数据动画
  animateStats();
});

function restoreWorkerUI(workerId) {
  const saved = getWorkerData(workerId);
  const config = WORKERS_CONFIG[workerId];
  if (!config) return;

  // 还原头像
  const avatarEl = document.getElementById(`avatar-${workerId}`);
  if (avatarEl) {
    if (saved.avatar) {
      applyAvatarToEl(avatarEl, saved.avatar);
    }
  }

  // 还原提示词
  const promptEl = document.getElementById(`prompt-${workerId}`);
  if (promptEl && saved.prompt) {
    promptEl.textContent = saved.prompt;
  }

  // 还原AI工具名
  if (saved.ai) {
    const aiEl = avatarEl?.closest('.worker-card')?.querySelector('.worker-ai');
    if (aiEl) aiEl.textContent = saved.ai;
    config.ai = saved.ai;
  }
  // 还原名称
  if (saved.name) {
    const titleEl = avatarEl?.closest('.worker-card')?.querySelector('.worker-title');
    if (titleEl) titleEl.textContent = saved.name;
    config.name = saved.name;
  }
}

function applyAvatarToEl(el, avatarData) {
  if (!el) return;
  if (avatarData.startsWith('emoji:')) {
    el.innerHTML = avatarData.replace('emoji:', '');
  } else if (avatarData.startsWith('url:')) {
    const img = document.createElement('img');
    img.src = avatarData.replace('url:', '');
    el.innerHTML = '';
    el.appendChild(img);
  }
}

function updateDeptBadges() {
  PIPELINE.forEach(dept => {
    const badge = document.getElementById(`badge-${dept.deptId.replace('dept-', '')}`);
    if (badge) badge.textContent = `${dept.workers.length} 个岗位`;
  });
}

// ============================================================
// 标签导航
// ============================================================
function switchTab(tabName) {
  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    const tabs = ['pipeline', 'trending', 'staff', 'account', 'stats'];
    t.classList.toggle('active', tabs[i] === tabName);
  });
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${tabName}`);
  if (page) page.classList.add('active');

  if (tabName === 'staff') renderStaffPage();
}

// ============================================================
// 员工管理页渲染
// ============================================================
function renderStaffPage() {
  const container = document.getElementById('staffList');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(WORKERS_CONFIG).forEach(([id, config]) => {
    const saved = getWorkerData(id);
    const name = saved.name || config.name;
    const ai = saved.ai || config.ai;
    const prompt = saved.prompt || getDefaultPrompt(id);
    const avatarData = saved.avatar || `emoji:${config.defaultEmoji}`;

    const card = document.createElement('div');
    card.className = 'staff-card';
    card.innerHTML = `
      <div class="staff-top">
        <div class="staff-avatar" id="staff-avatar-${id}" onclick="openStaffModal('${id}')"></div>
        <div>
          <div class="staff-name">${name}</div>
          <span class="staff-ai-tag">🤖 ${ai}</span>
          <span class="staff-dept-tag">${config.dept}</span>
        </div>
      </div>
      <div class="staff-prompt-preview">${prompt.substring(0, 80)}...</div>
      <div class="staff-actions">
        <button class="btn-edit-staff" onclick="openStaffModal('${id}')">✏️ 编辑头像/提示词</button>
      </div>
    `;
    container.appendChild(card);

    const staffAvatarEl = document.getElementById(`staff-avatar-${id}`);
    if (avatarData.startsWith('emoji:')) {
      staffAvatarEl.textContent = avatarData.replace('emoji:', '');
    } else if (avatarData.startsWith('url:')) {
      const img = document.createElement('img');
      img.src = avatarData.replace('url:', '');
      staffAvatarEl.appendChild(img);
    }
  });
}

function getDefaultPrompt(workerId) {
  const promptEl = document.getElementById(`prompt-${workerId}`);
  if (promptEl) return promptEl.textContent;
  return '';
}

// ============================================================
// 头像处理（流水线卡片上）
// ============================================================
function openAvatarModal(workerId) {
  openStaffModal(workerId);
}

function handleAvatarUpload(workerId, input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const avatarData = `url:${dataUrl}`;
    const avatarEl = document.getElementById(`avatar-${workerId}`);
    applyAvatarToEl(avatarEl, avatarData);
    setWorkerData(workerId, { avatar: avatarData });
  };
  reader.readAsDataURL(input.files[0]);
}

// ============================================================
// 提示词编辑（行内）
// ============================================================
function editPrompt(workerId) {
  const wrap = document.getElementById(`prompt-wrap-${workerId}`) ||
    document.getElementById(`avatar-${workerId}`)?.closest('.worker-card')?.querySelector('.worker-prompt');
  if (!wrap) return openStaffModal(workerId);

  const promptEl = document.getElementById(`prompt-${workerId}`);
  const currentText = promptEl?.textContent || '';

  const labelEl = wrap.querySelector('.prompt-label');
  const editBtn = labelEl?.querySelector('.prompt-edit-btn');
  if (!promptEl || !labelEl) return;

  // 替换为textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'prompt-textarea';
  textarea.value = currentText;
  promptEl.replaceWith(textarea);

  // 按钮变为保存/取消
  if (editBtn) editBtn.style.display = 'none';
  const actions = document.createElement('div');
  actions.className = 'prompt-actions';
  actions.innerHTML = `
    <button class="prompt-save-btn" onclick="saveInlinePrompt('${workerId}', this)">💾 保存</button>
    <button class="prompt-cancel-btn" onclick="cancelInlinePrompt('${workerId}', '${escapeForAttr(currentText)}', this)">取消</button>
  `;
  wrap.appendChild(actions);
  textarea.focus();
}

function saveInlinePrompt(workerId, btn) {
  const wrap = btn.closest('.worker-prompt');
  const textarea = wrap.querySelector('.prompt-textarea');
  if (!textarea) return;
  const newText = textarea.value.trim();

  // 恢复显示
  const displayEl = document.createElement('div');
  displayEl.className = 'prompt-text';
  displayEl.id = `prompt-${workerId}`;
  displayEl.textContent = newText;
  textarea.replaceWith(displayEl);

  // 恢复编辑按钮
  const editBtn = wrap.querySelector('.prompt-edit-btn');
  if (editBtn) editBtn.style.display = '';

  // 删掉按钮组
  wrap.querySelector('.prompt-actions')?.remove();

  // 保存
  setWorkerData(workerId, { prompt: newText });
}

function cancelInlinePrompt(workerId, originalText, btn) {
  const wrap = btn.closest('.worker-prompt');
  const textarea = wrap.querySelector('.prompt-textarea');

  const displayEl = document.createElement('div');
  displayEl.className = 'prompt-text';
  displayEl.id = `prompt-${workerId}`;
  displayEl.textContent = decodeURIComponent(originalText);
  textarea.replaceWith(displayEl);

  const editBtn = wrap.querySelector('.prompt-edit-btn');
  if (editBtn) editBtn.style.display = '';
  wrap.querySelector('.prompt-actions')?.remove();
}

function escapeForAttr(str) {
  return encodeURIComponent(str);
}

// ============================================================
// 员工模态框（详细编辑）
// ============================================================
function openStaffModal(workerId) {
  currentEditingWorker = workerId;
  modalAvatarData = null;

  const config = WORKERS_CONFIG[workerId];
  const saved = getWorkerData(workerId);

  const name = saved.name || config.name;
  const ai = saved.ai || config.ai;
  const prompt = saved.prompt || getDefaultPrompt(workerId) || '';
  const avatarData = saved.avatar || `emoji:${config.defaultEmoji}`;

  document.getElementById('modalWorkerName').value = name;
  document.getElementById('modalWorkerAI').value = ai;
  document.getElementById('modalPromptText').value = prompt;

  // 预览头像
  const preview = document.getElementById('modalAvatarPreview');
  applyAvatarToEl(preview, avatarData);
  modalAvatarData = avatarData;

  document.getElementById('staffModal').classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
  currentEditingWorker = null;
}

function handleModalAvatarUpload(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    modalAvatarData = `url:${e.target.result}`;
    const preview = document.getElementById('modalAvatarPreview');
    applyAvatarToEl(preview, modalAvatarData);
  };
  reader.readAsDataURL(input.files[0]);
}

function selectEmoji(emoji) {
  modalAvatarData = `emoji:${emoji}`;
  const preview = document.getElementById('modalAvatarPreview');
  applyAvatarToEl(preview, modalAvatarData);
  document.querySelectorAll('.emoji-option').forEach(e => {
    e.classList.toggle('selected', e.textContent === emoji);
  });
}

function saveStaffEdit() {
  if (!currentEditingWorker) return;
  const workerId = currentEditingWorker;

  const name = document.getElementById('modalWorkerName').value.trim();
  const ai = document.getElementById('modalWorkerAI').value;
  const prompt = document.getElementById('modalPromptText').value.trim();

  const patch = { name, ai, prompt };
  if (modalAvatarData) patch.avatar = modalAvatarData;

  setWorkerData(workerId, patch);

  // 更新流水线卡片
  const avatarEl = document.getElementById(`avatar-${workerId}`);
  if (avatarEl && modalAvatarData) applyAvatarToEl(avatarEl, modalAvatarData);

  const card = avatarEl?.closest('.worker-card');
  if (card) {
    const titleEl = card.querySelector('.worker-title');
    if (titleEl) titleEl.textContent = name;
    const aiEl = card.querySelector('.worker-ai');
    if (aiEl) aiEl.textContent = ai;
  }

  const promptEl = document.getElementById(`prompt-${workerId}`);
  if (promptEl) promptEl.textContent = prompt;

  // 更新内存配置
  if (WORKERS_CONFIG[workerId]) {
    WORKERS_CONFIG[workerId].name = name;
    WORKERS_CONFIG[workerId].ai = ai;
  }

  closeModal('staffModal');
  renderStaffPage();

  // 成功提示
  showToast('✅ 已保存！');
}

// ============================================================
// 账号管理
// ============================================================
function selectAccount(card) {
  document.querySelectorAll('.account-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
}

function openAddAccountModal() {
  document.getElementById('accountModal').classList.remove('hidden');
}

function saveAccount() {
  const name = document.getElementById('accName').value.trim();
  const platform = document.getElementById('accPlatform').value;
  const platformNames = { douyin: '抖音', bilibili: 'B站', xiaohongshu: '小红书', youtube: 'YouTube', shipinhao: '视频号', kuaishou: '快手' };
  if (!name) return;

  const list = document.getElementById('accountList');
  const card = document.createElement('div');
  card.className = 'account-card';
  card.setAttribute('data-platform', platform);
  card.onclick = function() { selectAccount(this); };
  card.innerHTML = `
    <div class="acc-header">
      <div class="acc-name">${name}</div>
      <span class="acc-platform">${platformNames[platform] || platform}</span>
    </div>
    <div class="acc-stats">
      <span>👥 粉丝 0</span>
      <span>🎬 作品 0</span>
      <span>❤️ 获赞 0</span>
    </div>
    <div class="acc-actions">
      <button class="btn-acc-action" onclick="event.stopPropagation();openPublishModal('${platform}')">📤 发布</button>
      <button class="btn-acc-action" onclick="event.stopPropagation();viewAnalytics('${platform}')">📊 数据</button>
      <button class="btn-acc-action" onclick="event.stopPropagation();manageComments('${platform}')">💬 评论</button>
    </div>
  `;
  list.appendChild(card);

  closeModal('accountModal');
  document.getElementById('accName').value = '';
  showToast('✅ 账号已添加！');
}

function generateWeekPlan() {
  showToast('🤖 AI正在生成下周内容计划...');
  setTimeout(() => {
    const calendar = document.getElementById('contentCalendar');
    calendar.innerHTML = `
      <div class="task-list-item"><span class="task-tag pending">待执行</span>周一 — AI生成选题研究</div>
      <div class="task-list-item"><span class="task-tag pending">待执行</span>周二 — 脚本 + 分镜撰写</div>
      <div class="task-list-item"><span class="task-tag pending">待执行</span>周四 20:00 · 正式发布</div>
      <div class="task-list-item"><span class="task-tag pending">待执行</span>周五 — 评论互动 + 数据监控</div>
      <div class="task-list-item"><span class="task-tag pending">待执行</span>周日 — 数据复盘 + 下期规划</div>
    `;
    showToast('✅ 下周内容计划已生成！');
  }, 1500);
}

// ============================================================
// 数据统计动画
// ============================================================
function animateStats() {
  const data = loadStorage();
  const videoCount = data._videoCount || 0;
  animateNumber('stat-videos', videoCount, 0);
  animateNumber('stat-time', videoCount * 4, 0);
}

function animateNumber(id, target, from) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 1000;
  const start = performance.now();
  const suffix = el.innerHTML.includes('<span') ? '<span style="font-size:16px">h</span>' : '';
  function step(ts) {
    const p = Math.min((ts - start) / duration, 1);
    const val = Math.round(from + (target - from) * p);
    el.innerHTML = val + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ============================================================
// 开始流水线
// ============================================================
async function startPipeline() {
  const topic = document.getElementById('topicInput').value.trim();
  if (!topic) {
    const input = document.getElementById('topicInput');
    input.focus();
    input.style.borderColor = '#ef4444';
    setTimeout(() => input.style.borderColor = '', 2000);
    return;
  }

  const platformMap = { douyin: '抖音', bilibili: 'B站', xiaohongshu: '小红书', youtube: 'YouTube' };
  const platform = platformMap[document.getElementById('platformSelect').value];
  const duration = document.getElementById('durationSelect').value;

  isRunning = true;
  allResults = {};

  document.getElementById('startBtn').disabled = true;
  document.getElementById('startBtn').textContent = '⚙️ 生产中...';
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('progressOverview').style.display = 'flex';
  setGlobalStatus('running', '🚀 流水线启动中...');

  PIPELINE.flatMap(d => d.workers).forEach(w => resetWorker(w));

  let completedCount = 0;
  const totalWorkers = PIPELINE.flatMap(d => d.workers).length;

  for (const dept of PIPELINE) {
    const deptEl = document.getElementById(dept.deptId);
    deptEl?.classList.add('active');
    setGlobalStatus('running', `🏢 ${dept.deptName} 工作中...`);

    if (dept.parallel) {
      await Promise.all(dept.workers.map(async (wId) => {
        await runWorker(wId, topic, platform, selectedStyle, duration);
        completedCount++;
        updateOverallProgress(completedCount, totalWorkers);
      }));
    } else {
      for (const wId of dept.workers) {
        await runWorker(wId, topic, platform, selectedStyle, duration);
        completedCount++;
        updateOverallProgress(completedCount, totalWorkers);
      }
    }

    deptEl?.classList.remove('active');
    deptEl?.classList.add('done');
  }

  setGlobalStatus('done', '✅ 全部完成！');
  document.getElementById('startBtn').disabled = false;
  document.getElementById('startBtn').textContent = '🔄 重新生产';
  isRunning = false;

  // 更新统计
  const data = loadStorage();
  data._videoCount = (data._videoCount || 0) + 1;
  saveStorage(data);

  // 更新任务记录
  updateTaskHistory(topic);

  showResults(topic, platform);
}

// ============================================================
// 执行单个岗位 - 调用后端 AI API
// ============================================================
async function runWorker(workerId, topic, platform, style, duration) {
  const config = WORKERS_CONFIG[workerId];
  if (!config) return;

  setWorkerStatus(workerId, 'working', '⚡ 工作中');
  document.getElementById(`worker-${workerId}`)?.classList.add('working');
  document.getElementById(`po-${workerId}`)?.classList.add('active');

  // 从存储获取自定义提示词
  const saved = getWorkerData(workerId);
  const promptText = saved.prompt || getDefaultPrompt(workerId) || config.outputTemplate(topic, platform, style, duration);
  
  // 替换变量
  const prompt = promptText
    .replace(/\{主题\}/g, topic)
    .replace(/\{平台\}/g, platform)
    .replace(/\{时长\}/g, duration)
    .replace(/\{风格\}/g, style);

  animateProgress(workerId, 30000); // 预估30秒最大时间

  let output = '';
  let useAI = false;

  try {
    // 调用后端 API
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId,
        prompt,
        context: {
          topic,
          platform,
          duration,
          style,
          ai: saved.ai || config.ai
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      output = data.result;
      useAI = true;
    } else {
      // API 失败，使用模板
      console.warn('API 调用失败，使用本地模板');
      output = config.outputTemplate(topic, platform, style, duration);
    }
  } catch (error) {
    console.error('API 调用错误:', error);
    output = config.outputTemplate(topic, platform, style, duration);
  }

  // 打字机效果显示结果
  await typewriterEffect(workerId, output, Math.min(output.length * 20, 5000));

  setWorkerStatus(workerId, 'done', useAI ? '✅ AI完成' : '✅ 完成');
  document.getElementById(`worker-${workerId}`)?.classList.remove('working');
  document.getElementById(`worker-${workerId}`)?.classList.add('done-card');
  setProgress(workerId, 100);
  document.getElementById(`po-${workerId}`)?.classList.remove('active');
  document.getElementById(`po-${workerId}`)?.classList.add('done');

  allResults[workerId] = { ...config, content: output, topic, platform, useAI };
}

// ============================================================
// 打字机效果
// ============================================================
async function typewriterEffect(workerId, text, totalTime) {
  const outputEl = document.getElementById(`output-${workerId}`);
  if (!outputEl) return;

  outputEl.innerHTML = '<div class="typewriter"></div>';
  const typeEl = outputEl.querySelector('.typewriter');
  const chars = text.split('');
  const delay = totalTime / chars.length;

  for (let i = 0; i < chars.length; i++) {
    typeEl.textContent += chars[i];
    outputEl.scrollTop = outputEl.scrollHeight;
    if (i % 3 === 0) await sleep(delay * 3);
  }
}

// ============================================================
// 进度条
// ============================================================
function animateProgress(workerId, duration) {
  const bar = document.querySelector(`#progress-${workerId} .progress-bar`);
  if (!bar) return;
  let p = 0;
  const iv = setInterval(() => {
    p += (100 - p) * 0.05;
    bar.style.width = Math.min(p, 95) + '%';
    if (p >= 95) clearInterval(iv);
  }, duration / 50);
}

function setProgress(workerId, v) {
  const bar = document.querySelector(`#progress-${workerId} .progress-bar`);
  if (bar) bar.style.width = v + '%';
}

// ============================================================
// 状态管理
// ============================================================
function setWorkerStatus(workerId, state, text) {
  const el = document.getElementById(`status-${workerId}`);
  if (!el) return;
  el.className = `worker-status ${state}`;
  el.innerHTML = `<span class="status-dot"></span>${text}`;
}

function setGlobalStatus(state, text) {
  document.getElementById('globalDot').className = `dot ${state}`;
  document.getElementById('globalStatus').textContent = text;
}

function resetWorker(workerId) {
  setWorkerStatus(workerId, 'idle', '待机');
  const card = document.getElementById(`worker-${workerId}`);
  if (card) card.classList.remove('working', 'done-card');
  const output = document.getElementById(`output-${workerId}`);
  if (output) output.innerHTML = '<div class="output-placeholder">等待执行...</div>';
  setProgress(workerId, 0);
  const poDot = document.getElementById(`po-${workerId}`);
  if (poDot) poDot.classList.remove('active', 'done');
}

function updateOverallProgress(done, total) {
  const pct = Math.round(done / total * 100);
  document.getElementById('poBar').style.width = pct + '%';
  document.getElementById('poPercent').textContent = pct + '%';
}

// ============================================================
// 成果展示
// ============================================================
function showResults(topic, platform) {
  const section = document.getElementById('resultSection');
  const grid = document.getElementById('resultGrid');
  grid.innerHTML = '';

  Object.entries(allResults).forEach(([id, data]) => {
    const saved = getWorkerData(id);
    const avatarData = saved.avatar || `emoji:${data.defaultEmoji || '📄'}`;
    const avatarHtml = avatarData.startsWith('url:')
      ? `<img src="${avatarData.replace('url:', '')}" style="width:20px;height:20px;border-radius:5px;object-fit:cover;vertical-align:middle">`
      : `<span>${avatarData.replace('emoji:', '')}</span>`;

    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <div class="result-item-title">
        ${avatarHtml} ${data.name}
        <span style="font-size:10px;color:#8b5cf6;margin-left:auto;background:#f3f0ff;padding:2px 7px;border-radius:8px">${data.ai}</span>
      </div>
      <div class="result-item-content">${escapeHtml(data.content)}</div>
    `;
    grid.appendChild(item);
  });

  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// 任务历史
// ============================================================
function updateTaskHistory(topic) {
  const history = document.getElementById('taskHistory');
  if (!history) return;
  const item = document.createElement('div');
  item.className = 'task-list-item';
  item.innerHTML = `<span class="task-tag done">完成</span>「${topic}」全流程生产 - 刚才`;
  history.insertBefore(item, history.firstChild);
}

// ============================================================
// 导出 & 复制
// ============================================================
function exportAll() {
  const topic = document.getElementById('topicInput').value;
  const platform = document.getElementById('platformSelect').value;
  let content = `AI视频生产流水线 - 完整成果\n主题：${topic} | 平台：${platform}\n生成：${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`;
  Object.entries(allResults).forEach(([id, data]) => {
    content += `【${data.dept} - ${data.name}（${data.ai}）】\n${'-'.repeat(40)}\n${data.content}\n\n`;
  });
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `视频生产成果_${topic}_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyAll() {
  const topic = document.getElementById('topicInput').value;
  let content = `AI视频生产成果 - ${topic}\n\n`;
  Object.entries(allResults).forEach(([id, data]) => {
    content += `【${data.name}】\n${data.content}\n\n`;
  });
  navigator.clipboard.writeText(content).then(() => {
    showToast('✅ 已复制到剪贴板！');
  });
}

// ============================================================
// 重置
// ============================================================
function resetAll() {
  if (isRunning) return;
  document.getElementById('topicInput').value = '';
  PIPELINE.flatMap(d => d.workers).forEach(w => resetWorker(w));
  PIPELINE.forEach(dept => {
    const el = document.getElementById(dept.deptId);
    if (el) el.classList.remove('active', 'done');
  });
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('progressOverview').style.display = 'none';
  document.getElementById('startBtn').textContent = '🚀 开始生产';
  document.getElementById('poBar').style.width = '0%';
  document.getElementById('poPercent').textContent = '0%';
  setGlobalStatus('idle', '待机中');
}

// ============================================================
// Toast 提示
// ============================================================
function showToast(msg) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    Object.assign(toast.style, {
      position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
      background: '#1e2640', color: '#fff', padding: '10px 22px',
      borderRadius: '20px', fontSize: '13px', fontWeight: '600',
      zIndex: '9999', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      transition: 'all 0.3s', opacity: '0'
    });
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ============================================================
// 工具函数
// ============================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ============================================================
// 新增：选题总监和标题专家配置
// ============================================================
WORKERS_CONFIG.chief = {
  name: '选题总监', ai: 'DeepSeek R1', dept: '策划部', defaultEmoji: '👔',
  outputTemplate: (topic, platform, style) => `👔 选题总监最终决策报告

📋 综合评估结论：
基于选题研究员和竞品分析师的报告，本期选定选题：

🎯 最终选题：「${topic}」
💡 选题理由：
① 该话题近7天搜索量增长 156%，处于上升期
② 竞品内容同质化严重，存在差异化空间
③ 目标受众痛点明确，转化路径清晰
④ 符合账号「职场效率」定位，可形成系列

📊 爆款概率预估：72%（高）
• 完播率预期：65%+
• 互动率预期：4.2%+
• 涨粉转化预期：0.5%+

⭐ 核心卖点：
"不讲大道理，只给可执行的动作清单"

📌 执行优先级：
P0：脚本编剧 + 钩子文案（今天完成）
P1：封面设计 + 分镜规划（明天完成）
P2：SEO优化 + 发布策略（发布前完成）`.trim()
};
WORKERS_CONFIG.titleexpert = {
  name: '标题专家', ai: 'DeepSeek V3', dept: '文案部', defaultEmoji: '👑',
  outputTemplate: (topic, platform, style) => `👑 标题专家最终方案

🏆 最佳标题 TOP 3：

🥇 推荐No.1（首选）：
「${topic}：90%的人不知道的正确方法」
→ 为什么能爆：数字冲击 + 反常识 + 方法承诺
→ 预期CTR：8.5%+

🥈 推荐No.2（备选A）：
「做了30天${topic}，我整个人变了」
→ 为什么能爆：时间线 + 结果前置 + 个人经历
→ 预期CTR：7.8%+

🥉 推荐No.3（备选B）：
「为什么你做${topic}总是失败？看这个」
→ 为什么能爆：直击痛点 + 提问式 + 解决方案暗示
→ 预期CTR：7.2%+

🧪 AB测试方案：
A组：使用No.1标题，封面配" shocked表情"
B组：使用No.2标题，封面配"对比图"
测试周期：发布后24小时
决策指标：点击率 > 完播率

🎨 封面文字配合建议：
主标题：大字突出数字"90%"或"30天"
副标题：用问句或感叹句增加好奇
配色：高对比度，文字占画面40%`.trim()
};

// ============================================================
// 更新流水线步骤（添加新岗位）
// ============================================================
PIPELINE[0].workers = ['researcher', 'director', 'competitor', 'chief'];
PIPELINE[1].workers = ['hook', 'script', 'title', 'titleexpert'];

// ============================================================
// 热点监控功能
// ============================================================
function refreshTrending() {
  showToast('🔄 正在刷新各平台热点...');
  setTimeout(() => {
    showToast('✅ 热点数据已更新！');
  }, 1500);
}

function useTopic(topic) {
  document.getElementById('topicInput').value = topic;
  switchTab('pipeline');
  showToast(`✅ 已将「${topic}」填入主题`);
}

function openAddTopicModal() {
  document.getElementById('topicModal').classList.remove('hidden');
}

function addMonitorTopic() {
  const topic = document.getElementById('monitorTopicInput').value.trim();
  if (!topic) return;
  
  const container = document.getElementById('monitorTags');
  const tag = document.createElement('span');
  tag.className = 'monitor-tag active';
  tag.innerHTML = `${topic} <button onclick="removeMonitorTag(this)">×</button>`;
  container.appendChild(tag);
  
  closeModal('topicModal');
  document.getElementById('monitorTopicInput').value = '';
  showToast(`✅ 已添加监控词：${topic}`);
}

function removeMonitorTag(btn) {
  btn.parentElement.remove();
}

// ============================================================
// 平台登录功能
// ============================================================
let currentLoginPlatform = null;
let currentPublishPlatform = null;

function loginPlatform(platform) {
  currentLoginPlatform = platform;
  const names = { douyin: '抖音', bilibili: 'B站', xiaohongshu: '小红书', shipinhao: '视频号', kuaishou: '快手', youtube: 'YouTube' };
  document.getElementById('loginPlatformName').textContent = names[platform];
  document.getElementById('qrPlatformName').textContent = names[platform];
  document.getElementById('loginModal').classList.remove('hidden');
}

function switchLoginMethod(method) {
  document.querySelectorAll('.login-method').forEach(m => m.classList.remove('active'));
  event.target.classList.add('active');
  
  document.getElementById('qrcodeLogin').classList.add('hidden');
  document.getElementById('phoneLogin').classList.add('hidden');
  document.getElementById('cookieLogin').classList.add('hidden');
  document.getElementById(method + 'Login').classList.remove('hidden');
}

function sendVerifyCode() {
  showToast('📱 验证码已发送！');
}

function confirmLogin() {
  if (!currentLoginPlatform) return;
  
  const statusEl = document.getElementById('loginStatus-' + currentLoginPlatform);
  const btnEl = document.getElementById('btnLogin-' + currentLoginPlatform);
  
  statusEl.textContent = '✅ 已登录';
  statusEl.classList.add('logged-in');
  btnEl.textContent = '🔄 切换账号';
  
  closeModal('loginModal');
  showToast('✅ 登录成功！');
  
  // 保存登录状态
  const data = loadStorage();
  data.logins = data.logins || {};
  data.logins[currentLoginPlatform] = { loggedIn: true, time: Date.now() };
  saveStorage(data);
}

// ============================================================
// 发布功能
// ============================================================
function openPublishModal(platform) {
  currentPublishPlatform = platform;
  const names = { douyin: '抖音', bilibili: 'B站', xiaohongshu: '小红书', shipinhao: '视频号', kuaishou: '快手', youtube: 'YouTube' };
  document.getElementById('publishPlatformName').textContent = names[platform];
  document.getElementById('publishModal').classList.remove('hidden');
}

function handleVideoSelect(input) {
  if (!input.files[0]) return;
  const file = input.files[0];
  const url = URL.createObjectURL(file);
  
  document.getElementById('uploadPlaceholder').classList.add('hidden');
  document.getElementById('uploadPreview').classList.remove('hidden');
  document.getElementById('previewVideo').src = url;
}

function removeVideo() {
  document.getElementById('uploadPlaceholder').classList.remove('hidden');
  document.getElementById('uploadPreview').classList.add('hidden');
  document.getElementById('previewVideo').src = '';
  document.getElementById('publishVideo').value = '';
}

function confirmPublish() {
  const title = document.getElementById('publishTitle').value.trim();
  if (!title) {
    showToast('⚠️ 请输入标题');
    return;
  }
  
  showToast('🚀 正在发布...');
  setTimeout(() => {
    closeModal('publishModal');
    showToast('✅ 发布成功！');
    
    // 清空表单
    document.getElementById('publishTitle').value = '';
    document.getElementById('publishDesc').value = '';
    document.getElementById('publishTags').value = '';
    removeVideo();
  }, 2000);
}

function viewAnalytics(platform) {
  showToast('📊 正在加载数据...');
  switchTab('stats');
}

function manageComments(platform) {
  showToast('💬 评论管理功能开发中...');
}

function syncToAllPlatforms() {
  showToast('🔄 正在同步到所有已登录平台...');
  setTimeout(() => {
    showToast('✅ 同步完成！');
  }, 2000);
}

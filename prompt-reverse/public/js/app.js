// 前端应用逻辑
class PromptReverseApp {
    constructor() {
        this.currentResult = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCharCount();
    }

    bindEvents() {
        // 场景选择
        document.getElementById('sceneSelect').addEventListener('change', () => {
            this.updatePlaceholder();
        });

        // 内容输入
        document.getElementById('contentInput').addEventListener('input', () => {
            this.updateCharCount();
        });

        // 反推按钮
        document.getElementById('reverseBtn').addEventListener('click', () => {
            this.reversePrompt();
        });

        // 复制按钮
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyTemplate();
        });

        // 优化按钮
        document.getElementById('optimizeBtn').addEventListener('click', () => {
            this.optimizePrompt();
        });
    }

    updateCharCount() {
        const input = document.getElementById('contentInput');
        const count = document.getElementById('charCount');
        count.textContent = input.value.length;
    }

    updatePlaceholder() {
        const scene = document.getElementById('sceneSelect').value;
        const input = document.getElementById('contentInput');
        
        const placeholders = {
            general: '粘贴你想要分析的文本内容...',
            article: '粘贴一篇你喜欢的文章，我将分析其结构和写作风格...',
            code: '粘贴一段优秀的代码，我将分析其编程规范和设计模式...',
            social: '粘贴一篇社交媒体爆款文案，我将分析其写作技巧...',
            image: '描述一张优质图片的特征，我将反推生成它的提示词...'
        };

        input.placeholder = placeholders[scene] || placeholders.general;
    }

    async reversePrompt() {
        const content = document.getElementById('contentInput').value.trim();
        const scene = document.getElementById('sceneSelect').value;
        const btn = document.getElementById('reverseBtn');

        if (!content) {
            this.showNotification('请输入要分析的内容', 'error');
            return;
        }

        // 显示加载状态
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span><span>分析中...</span>';

        try {
            const response = await fetch('/api/reverse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content, scene })
            });

            const result = await response.json();

            if (result.success) {
                this.currentResult = result;
                this.displayResult(result);
                this.showNotification('反推成功！');
            } else {
                this.showNotification(result.error || '反推失败', 'error');
            }
        } catch (error) {
            console.error('反推失败:', error);
            this.showNotification('反推失败，请稍后重试', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-icon">🔄</span><span>开始反推</span>';
        }
    }

    displayResult(result) {
        const resultSection = document.getElementById('resultSection');
        const analysisContent = document.getElementById('analysisContent');
        const promptTemplate = document.getElementById('promptTemplate');
        const optimizationTips = document.getElementById('optimizationTips');

        // 显示分析结果
        analysisContent.innerHTML = this.renderAnalysis(result.analysis);

        // 显示提示词模板
        promptTemplate.textContent = result.analysis.prompt_template;

        // 显示优化建议
        optimizationTips.innerHTML = result.optimizationTips.map(tip => 
            `<li>${tip}</li>`
        ).join('');

        // 显示结果区域
        resultSection.classList.remove('hidden');

        // 滚动到结果区域
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    renderAnalysis(analysis) {
        const items = [];

        for (const [key, value] of Object.entries(analysis)) {
            if (key === 'prompt_template') continue;

            const label = this.formatLabel(key);
            const displayValue = Array.isArray(value) ? value.join('、') : value;

            items.push(`
                <div class="analysis-item">
                    <div class="analysis-label">${label}</div>
                    <div class="analysis-value">${this.escapeHtml(displayValue)}</div>
                </div>
            `);
        }

        return items.join('');
    }

    formatLabel(key) {
        const labels = {
            detected_structure: '内容结构',
            tone: '语气风格',
            writing_techniques: '写作技巧',
            target_audience: '目标读者',
            core_purpose: '核心目的',
            code_style: '代码风格',
            language: '编程语言',
            complexity: '复杂度',
            design_patterns: '设计模式',
            platform: '平台特性',
            structure: '文案结构',
            emotion_type: '情绪类型',
            tag_strategy: '标签策略',
            subject: '主体描述',
            composition: '构图方式',
            art_style: '艺术风格',
            color_scheme: '色彩方案',
            lighting: '光影效果',
            mood: '氛围情绪',
            content_structure: '内容结构',
            tone_style: '语气风格',
            key_elements: '关键要素',
            writing_techniques: '写作技巧',
            expected_outcome: '预期效果'
        };

        return labels[key] || key;
    }

    copyTemplate() {
        if (!this.currentResult) return;

        const template = this.currentResult.analysis.prompt_template;

        navigator.clipboard.writeText(template).then(() => {
            this.showNotification('提示词模板已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
            this.showNotification('复制失败，请手动复制', 'error');
        });
    }

    async optimizePrompt() {
        if (!this.currentResult) return;

        const btn = document.getElementById('optimizeBtn');
        const template = this.currentResult.analysis.prompt_template;
        const scene = this.currentResult.scene;

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span><span>优化中...</span>';

        try {
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: template, scene })
            });

            const result = await response.json();

            if (result.success) {
                // 更新提示词模板显示
                const promptTemplate = document.getElementById('promptTemplate');
                promptTemplate.textContent = result.optimized;

                // 显示优化建议（如果有的话）
                const optimizationTips = document.getElementById('optimizationTips');
                optimizationTips.innerHTML = `
                    <li style="color: var(--success);">优化完成！评分: ${result.score}/100</li>
                    ${result.improvements.map(imp => `<li>${imp}</li>`).join('')}
                `;

                this.currentResult.analysis.prompt_template = result.optimized;
                this.showNotification(`优化完成！评分: ${result.score}/100`);
            } else {
                this.showNotification(result.error || '优化失败', 'error');
            }
        } catch (error) {
            console.error('优化失败:', error);
            this.showNotification('优化失败，请稍后重试', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-icon">🚀</span><span>优化提示词</span>';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : 'var(--success)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 初始化应用
const app = new PromptReverseApp();

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

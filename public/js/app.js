// 前端应用主逻辑
class AINewsApp {
    constructor() {
        this.newsData = null;
        this.videoData = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.render();
    }

    bindEvents() {
        // 刷新按钮
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });

        // 新闻筛选
        document.getElementById('newsFilter').addEventListener('change', (e) => {
            this.renderNews(e.target.value);
        });

        // 视频筛选
        document.getElementById('videoFilter').addEventListener('change', (e) => {
            this.renderVideos(e.target.value);
        });

        // 平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    async loadData() {
        try {
            const [newsRes, videoRes] = await Promise.all([
                fetch('/api/news'),
                fetch('/api/videos')
            ]);

            this.newsData = await newsRes.json();
            this.videoData = await videoRes.json();

            this.updateLastUpdateTime();
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showError('加载数据失败，请稍后重试');
        }
    }

    async refreshData() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="btn-icon">⏳</span><span>刷新中...</span>';

        try {
            const response = await fetch('/api/refresh', { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                await this.loadData();
                this.render();
                this.showNotification('数据刷新成功！');
            } else {
                this.showError('刷新失败: ' + data.message);
            }
        } catch (error) {
            console.error('刷新失败:', error);
            this.showError('刷新失败，请稍后重试');
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<span class="btn-icon">🔄</span><span>刷新</span>';
        }
    }

    render() {
        if (this.newsData) {
            this.renderStats();
            this.renderNews('all');
        }
        if (this.videoData) {
            this.renderVideos('all');
        }
    }

    renderStats() {
        document.getElementById('newsCount').textContent = this.newsData?.count || 0;
        document.getElementById('videoCount').textContent = this.videoData?.count || 0;
        
        // 计算不重复的来源数量
        const sources = new Set();
        if (this.newsData?.news) {
            this.newsData.news.forEach(item => sources.add(item.source));
        }
        if (this.videoData?.videos) {
            this.videoData.videos.forEach(item => sources.add(item.source));
        }
        document.getElementById('sourceCount').textContent = sources.size;
    }

    renderNews(filter = 'all') {
        const grid = document.getElementById('newsGrid');
        
        if (!this.newsData?.news || this.newsData.news.length === 0) {
            grid.innerHTML = '<div class="loading">暂无新闻数据</div>';
            return;
        }

        let news = this.newsData.news;
        if (filter !== 'all') {
            news = news.filter(item => item.source === filter);
        }

        grid.innerHTML = news.map(item => `
            <article class="news-card">
                <div class="news-card-header">
                    <span class="news-source">${item.source}</span>
                    <span class="news-date">${this.formatDate(item.pubDate)}</span>
                </div>
                <h3 class="news-title">${this.escapeHtml(item.title)}</h3>
                <p class="news-description">${this.escapeHtml(item.description)}</p>
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-link">
                    阅读更多 →
                </a>
            </article>
        `).join('');
    }

    renderVideos(filter = 'all') {
        const grid = document.getElementById('videoGrid');
        
        if (!this.videoData?.videos || this.videoData.videos.length === 0) {
            grid.innerHTML = '<div class="loading">暂无视频数据</div>';
            return;
        }

        let videos = this.videoData.videos;
        if (filter !== 'all') {
            videos = videos.filter(item => item.source === filter);
        }

        grid.innerHTML = videos.map(item => `
            <div class="video-card">
                <div class="video-thumbnail">
                    <img src="${item.thumbnail}" alt="${this.escapeHtml(item.title)}" loading="lazy">
                    <span class="video-duration">${item.durationText || '--:--'}</span>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${this.escapeHtml(item.title)}</h3>
                    <div class="video-meta">
                        <span class="video-source">${this.escapeHtml(item.source)}</span>
                        <span>${item.viewCountText || '0 views'}</span>
                        <span>${item.publishedTimeText || 'Unknown'}</span>
                    </div>
                    <div class="video-actions">
                        <button class="video-link" onclick="app.copyVideoLink('${item.url}')">
                            复制链接
                        </button>
                        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="video-watch">
                            观看视频
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateLastUpdateTime() {
        const updateTime = this.newsData?.updatedAt || this.videoData?.updatedAt;
        if (updateTime) {
            const date = new Date(updateTime);
            const formatted = this.formatDate(date.toISOString(), true);
            document.getElementById('lastUpdate').textContent = `更新于 ${formatted}`;
        }
    }

    copyVideoLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification('链接已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
            this.showNotification('复制失败，请手动复制');
        });
    }

    formatDate(dateStr, withTime = false) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        // 如果是一天内，显示相对时间
        if (diff < 86400000 && !withTime) {
            const hours = Math.floor(diff / 3600000);
            if (hours < 1) {
                const minutes = Math.floor(diff / 60000);
                return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
            }
            return `${hours}小时前`;
        }

        // 否则显示具体日期
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        if (withTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return date.toLocaleDateString('zh-CN', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--success);
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

    showError(message) {
        const error = document.createElement('div');
        error.className = 'notification error';
        error.textContent = message;
        error.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
        `;

        document.body.appendChild(error);

        setTimeout(() => error.remove(), 5000);
    }
}

// 初始化应用
const app = new AINewsApp();

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

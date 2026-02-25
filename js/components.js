/**
 * Components - 可复用 Web Components
 * 导航栏、价格卡片、加载状态等组件
 */

// ============================================
// 导航栏组件
// ============================================
class Navbar extends HTMLElement {
    constructor() {
        super();
        this._currentPage = '';
        this._unsubscribe = null;
    }

    static get observedAttributes() {
        return ['current-page'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-page' && oldValue !== newValue) {
            this._currentPage = newValue;
            if (this.isConnected) {
                this._updateActiveLink();
            }
        }
    }

    connectedCallback() {
        this._currentPage = this.getAttribute('current-page') || this._detectCurrentPage();
        this.render();
        this._bindEvents();
        
        // 订阅收藏变化以更新徽章
        if (window.Store) {
            this._unsubscribe = Store.subscribe('favorites', () => {
                this._updateFavoriteBadge();
            });
        }
    }

    disconnectedCallback() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
    }

    /**
     * 检测当前页面
     */
    _detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('markets')) return 'markets';
        if (path.includes('analysis')) return 'analysis';
        if (path.includes('news')) return 'news';
        if (path.includes('login')) return 'login';
        return 'home';
    }

    /**
     * 渲染导航栏
     */
    render() {
        const favoriteCount = Store?.get('favorites')?.length || 0;
        
        this.innerHTML = `
            <nav class="navbar">
                <div class="nav-container">
                    <a href="${this._getLink('index.html')}" class="logo">
                        <div class="logo-icon">🥇</div>
                        <span>GoldPulse</span>
                    </a>
                    
                    <button class="nav-toggle" aria-label="Toggle navigation">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    
                    <div class="nav-menu">
                        <a href="${this._getLink('index.html')}" class="nav-link ${this._isActive('home')}" data-page="home">
                            首页
                        </a>
                        <a href="${this._getLink('pages/markets.html')}" class="nav-link ${this._isActive('markets')}" data-page="markets">
                            行情
                            ${favoriteCount > 0 ? `<span class="nav-badge">${favoriteCount}</span>` : ''}
                        </a>
                        <a href="${this._getLink('pages/analysis.html')}" class="nav-link ${this._isActive('analysis')}" data-page="analysis">
                            分析
                        </a>
                        <a href="${this._getLink('pages/news.html')}" class="nav-link ${this._isActive('news')}" data-page="news">
                            资讯
                        </a>
                    </div>
                    
                    <div class="nav-actions">
                        <button class="btn btn-secondary btn-sm" onclick="location.href='${this._getLink('pages/login.html')}'">
                            登录
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="location.href='${this._getLink('pages/login.html')}?action=register'">
                            注册
                        </button>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * 获取相对链接
     */
    _getLink(path) {
        // 根据当前页面位置调整链接
        const isInPages = window.location.pathname.includes('/pages/');
        if (isInPages && !path.startsWith('../')) {
            return '../' + path.replace('pages/', '');
        }
        if (!isInPages && path.startsWith('../')) {
            return path.replace('../', '');
        }
        return path;
    }

    /**
     * 判断是否当前页面
     */
    _isActive(page) {
        return this._currentPage === page ? 'active' : '';
    }

    /**
     * 更新活动链接
     */
    _updateActiveLink() {
        this.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === this._currentPage) {
                link.classList.add('active');
            }
        });
    }

    /**
     * 更新收藏徽章
     */
    _updateFavoriteBadge() {
        const favoriteCount = Store?.get('favorites')?.length || 0;
        const marketsLink = this.querySelector('[data-page="markets"]');
        
        if (marketsLink) {
            let badge = marketsLink.querySelector('.nav-badge');
            
            if (favoriteCount > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'nav-badge';
                    marketsLink.appendChild(badge);
                }
                badge.textContent = favoriteCount;
            } else if (badge) {
                badge.remove();
            }
        }
    }

    /**
     * 绑定事件
     */
    _bindEvents() {
        // 移动端菜单切换
        const toggle = this.querySelector('.nav-toggle');
        const menu = this.querySelector('.nav-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                menu.classList.toggle('active');
            });
        }
    }
}

// ============================================
// 价格卡片组件
// ============================================
class PriceCard extends HTMLElement {
    constructor() {
        super();
        this._data = null;
    }

    static get observedAttributes() {
        return ['symbol', 'name', 'currency', 'price', 'change', 'change-percent', 'icon'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
        this._bindEvents();
    }

    /**
     * 设置数据
     * @param {Object} data - 价格数据
     */
    setData(data) {
        this._data = data;
        
        if (data.symbol) this.setAttribute('symbol', data.symbol);
        if (data.name) this.setAttribute('name', data.name);
        if (data.currency) this.setAttribute('currency', data.currency);
        if (data.price !== undefined) this.setAttribute('price', data.price);
        if (data.change !== undefined) this.setAttribute('change', data.change);
        if (data.changePercent !== undefined) this.setAttribute('change-percent', data.changePercent);
        
        this.render();
    }

    /**
     * 渲染卡片
     */
    render() {
        const symbol = this.getAttribute('symbol') || 'XAU';
        const name = this.getAttribute('name') || '黄金';
        const currency = this.getAttribute('currency') || 'USD';
        const price = parseFloat(this.getAttribute('price')) || 0;
        const change = parseFloat(this.getAttribute('change')) || 0;
        const changePercent = parseFloat(this.getAttribute('change-percent')) || 0;
        const icon = this.getAttribute('icon') || '🥇';
        
        const isUp = change >= 0;
        const changeClass = isUp ? 'up' : 'down';
        const arrow = isUp ? '▲' : '▼';
        const sign = isUp ? '+' : '';
        
        const priceFormatted = this._formatPrice(price, currency);
        const changeFormatted = `${arrow} ${Math.abs(change).toFixed(2)}`;
        const percentFormatted = `${sign}${changePercent.toFixed(2)}%`;

        this.innerHTML = `
            <div class="price-card-component">
                <div class="price-card-header">
                    <div class="price-card-icon">${icon}</div>
                    <div class="price-card-info">
                        <h3 class="price-card-name">${name}</h3>
                        <span class="price-card-symbol">${symbol}/${currency}</span>
                    </div>
                </div>
                <div class="price-card-body">
                    <div class="price-card-value">${priceFormatted}</div>
                    <div class="price-card-change ${changeClass}">
                        <span>${changeFormatted}</span>
                        <span>(${percentFormatted})</span>
                    </div>
                </div>
                <div class="price-card-actions">
                    <button class="price-card-btn ${Store?.isFavorite?.(symbol) ? 'active' : ''}" data-action="favorite">
                        ${Store?.isFavorite?.(symbol) ? '★' : '☆'}
                    </button>
                    <button class="price-card-btn" data-action="alert">🔔</button>
                    <button class="price-card-btn" data-action="share">↗</button>
                </div>
            </div>
        `;
    }

    /**
     * 格式化价格
     */
    _formatPrice(price, currency) {
        if (window.Utils?.formatPrice) {
            return Utils.formatPrice(price, currency);
        }
        
        const symbols = { USD: '$', CNY: '¥', HKD: 'HK$' };
        const symbol = symbols[currency] || '$';
        return symbol + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /**
     * 绑定事件
     */
    _bindEvents() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            
            const action = btn.dataset.action;
            const symbol = this.getAttribute('symbol');
            const name = this.getAttribute('name');
            
            switch (action) {
                case 'favorite':
                    this._toggleFavorite(symbol, name, btn);
                    break;
                case 'alert':
                    this._showAlertDialog(symbol, name);
                    break;
                case 'share':
                    this._share(symbol, name);
                    break;
            }
        });
    }

    /**
     * 切换收藏状态
     */
    _toggleFavorite(symbol, name, btn) {
        if (!window.Store) return;
        
        if (Store.isFavorite(symbol)) {
            Store.removeFavorite(symbol);
            btn.textContent = '☆';
            btn.classList.remove('active');
        } else {
            Store.addFavorite(symbol, name);
            btn.textContent = '★';
            btn.classList.add('active');
        }
        
        // 触发自定义事件
        this.dispatchEvent(new CustomEvent('favoriteChange', {
            detail: { symbol, isFavorite: Store.isFavorite(symbol) },
            bubbles: true
        }));
    }

    /**
     * 显示提醒对话框
     */
    _showAlertDialog(symbol, name) {
        const targetPrice = prompt(`设置 ${name} (${symbol}) 价格提醒：\n请输入目标价格：`);
        if (targetPrice && !isNaN(targetPrice)) {
            const condition = confirm('选择条件：\n确定 = 价格上涨到目标时提醒\n取消 = 价格下跌到目标时提醒');
            
            if (window.Store) {
                Store.addAlert({
                    symbol,
                    name,
                    targetPrice: parseFloat(targetPrice),
                    condition: condition ? 'above' : 'below'
                });
                alert('提醒设置成功！');
            }
        }
    }

    /**
     * 分享
     */
    async _share(symbol, name) {
        const shareData = {
            title: `${name} (${symbol}) - GoldPulse`,
            text: `查看 ${name} 实时价格`,
            url: window.location.href
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (e) {
                console.log('Share cancelled');
            }
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href);
            alert('链接已复制到剪贴板');
        }
    }
}

// ============================================
// 加载状态组件
// ============================================
class LoadingSpinner extends HTMLElement {
    constructor() {
        super();
        this._show = false;
    }

    static get observedAttributes() {
        return ['show', 'text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'show') {
                this._show = newValue !== null && newValue !== 'false';
            }
            if (this.isConnected) {
                this.render();
            }
        }
    }

    connectedCallback() {
        this._show = this.hasAttribute('show');
        this.render();
    }

    render() {
        const text = this.getAttribute('text') || '加载中...';
        const display = this._show ? 'flex' : 'none';
        
        this.innerHTML = `
            <div class="loading-overlay" style="display: ${display}">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">${text}</p>
                </div>
            </div>
        `;
    }

    /**
     * 显示加载状态
     * @param {string} text - 可选的自定义文本
     */
    show(text) {
        if (text) this.setAttribute('text', text);
        this.setAttribute('show', '');
    }

    /**
     * 隐藏加载状态
     */
    hide() {
        this.removeAttribute('show');
    }
}

// ============================================
// 错误提示组件
// ============================================
class ErrorMessage extends HTMLElement {
    constructor() {
        super();
        this._message = '';
    }

    static get observedAttributes() {
        return ['message', 'show'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
        this._bindEvents();
    }

    render() {
        const message = this.getAttribute('message') || '';
        const show = this.hasAttribute('show');
        
        this.innerHTML = `
            <div class="error-message ${show ? 'show' : ''}">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-close" aria-label="Close">&times;</button>
                <button class="error-retry">重试</button>
            </div>
        `;
    }

    _bindEvents() {
        this.addEventListener('click', (e) => {
            if (e.target.matches('.error-close')) {
                this.hide();
            }
            if (e.target.matches('.error-retry')) {
                this.dispatchEvent(new CustomEvent('retry', { bubbles: true }));
            }
        });
    }

    /**
     * 显示错误
     * @param {string} message - 错误消息
     */
    show(message) {
        this.setAttribute('message', message);
        this.setAttribute('show', '');
    }

    /**
     * 隐藏错误
     */
    hide() {
        this.removeAttribute('show');
    }
}

// ============================================
// 倒计时组件
// ============================================
class CountdownTimer extends HTMLElement {
    constructor() {
        super();
        this._seconds = 300;
        this._timer = null;
        this._running = false;
    }

    static get observedAttributes() {
        return ['seconds', 'running'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'seconds') {
                this._seconds = parseInt(newValue) || 300;
            }
            if (name === 'running') {
                this._running = newValue !== null;
                this._running ? this.start() : this.stop();
            }
            if (this.isConnected) {
                this.render();
            }
        }
    }

    connectedCallback() {
        this._seconds = parseInt(this.getAttribute('seconds')) || 300;
        this._running = this.hasAttribute('running');
        this.render();
        if (this._running) this.start();
    }

    disconnectedCallback() {
        this.stop();
    }

    render() {
        const formatted = this._formatTime(this._seconds);
        
        this.innerHTML = `
            <span class="countdown-timer ${this._seconds < 30 ? 'warning' : ''}">
                ${formatted}
            </span>
        `;
    }

    _formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    start() {
        this.stop();
        this._running = true;
        this._timer = setInterval(() => {
            this._seconds--;
            if (this._seconds <= 0) {
                this.dispatchEvent(new CustomEvent('countdownEnd', { bubbles: true }));
                this._seconds = parseInt(this.getAttribute('seconds')) || 300;
            }
            this.render();
        }, 1000);
    }

    stop() {
        this._running = false;
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    reset(seconds) {
        this.stop();
        this._seconds = seconds || parseInt(this.getAttribute('seconds')) || 300;
        this.render();
        if (this._running) this.start();
    }
}

// ============================================
// 迷你图表组件 (Sparkline)
// ============================================
class SparklineChart extends HTMLElement {
    constructor() {
        super();
        this._data = [];
        this._canvas = null;
        this._ctx = null;
    }

    static get observedAttributes() {
        return ['width', 'height', 'color'];
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const width = this.getAttribute('width') || '100%';
        const height = this.getAttribute('height') || '60';
        
        this.innerHTML = `
            <canvas class="sparkline-chart" 
                    style="width: ${width}; height: ${height}px;"
                    width="300" 
                    height="${parseInt(height)}">
            </canvas>
        `;
        
        this._canvas = this.querySelector('canvas');
        this._ctx = this._canvas.getContext('2d');
    }

    /**
     * 设置数据并绘制
     * @param {Array<number>} data - 数据数组
     */
    setData(data) {
        this._data = data;
        this._draw();
    }

    _draw() {
        if (!this._ctx || this._data.length < 2) return;
        
        const ctx = this._ctx;
        const canvas = this._canvas;
        const dpr = window.devicePixelRatio || 1;
        
        // 处理高 DPI 屏幕
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const color = this.getAttribute('color') || '#ffd700';
        
        // 计算数据范围
        const min = Math.min(...this._data);
        const max = Math.max(...this._data);
        const range = max - min || 1;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 创建渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, this._hexToRgba(color, 0.3));
        gradient.addColorStop(1, this._hexToRgba(color, 0));
        
        // 绘制填充区域
        ctx.beginPath();
        this._data.forEach((value, i) => {
            const x = width * i / (this._data.length - 1);
            const y = height - (value - min) / range * height * 0.8 - height * 0.1;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 绘制线条
        ctx.beginPath();
        this._data.forEach((value, i) => {
            const x = width * i / (this._data.length - 1);
            const y = height - (value - min) / range * height * 0.8 - height * 0.1;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    _hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// ============================================
// 注册自定义元素
// ============================================
function registerComponents() {
    const components = [
        { name: 'gp-navbar', class: Navbar },
        { name: 'gp-price-card', class: PriceCard },
        { name: 'gp-loading', class: LoadingSpinner },
        { name: 'gp-error', class: ErrorMessage },
        { name: 'gp-countdown', class: CountdownTimer },
        { name: 'gp-sparkline', class: SparklineChart }
    ];

    components.forEach(({ name, class: ComponentClass }) => {
        if (!customElements.get(name)) {
            customElements.define(name, ComponentClass);
            console.log(`[Components] Registered: ${name}`);
        }
    });
}

// 自动注册
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerComponents);
    } else {
        registerComponents();
    }
}

// 导出到全局
window.Components = {
    Navbar,
    PriceCard,
    LoadingSpinner,
    ErrorMessage,
    CountdownTimer,
    SparklineChart,
    registerComponents
};

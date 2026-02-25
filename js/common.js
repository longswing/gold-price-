/**
 * GoldPulse - 共享 JavaScript 功能
 */

// ============================================
// API 配置
// ============================================
const API_CONFIG = {
    // 黄金价格
    gold: {
        usd: 'https://data-asg.goldprice.org/dbXRates/USD',
        cny: 'https://data-asg.goldprice.org/dbXRates/CNY'
    },
    // CORS 代理
    corsProxy: 'https://api.allorigins.win/get?url=',
    // 股票指数 (Yahoo Finance)
    stocks: {
        hsi: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EHSI?interval=1d&range=1d',
        nasdaq: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=1d',
        sp500: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=1d'
    },
    // 黄金期货历史数据
    goldHistory: 'https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1h&range=5d'
};

// ============================================
// 数据获取函数
// ============================================

// 获取黄金价格
async function fetchGoldPrices() {
    try {
        const [usdRes, cnyRes] = await Promise.all([
            fetch(API_CONFIG.gold.usd),
            fetch(API_CONFIG.gold.cny)
        ]);

        const usdData = await usdRes.json();
        const cnyData = await cnyRes.json();

        return {
            usd: usdData.items[0],
            cny: cnyData.items[0]
        };
    } catch (error) {
        console.error('获取黄金价格失败:', error);
        return null;
    }
}

// 获取股票指数
async function fetchStockIndices() {
    const results = {};
    
    for (const [key, url] of Object.entries(API_CONFIG.stocks)) {
        try {
            const proxyUrl = API_CONFIG.corsProxy + encodeURIComponent(url);
            const response = await fetch(proxyUrl);
            if (!response.ok) continue;
            
            const result = await response.json();
            const data = JSON.parse(result.contents);
            
            if (data.chart?.result?.[0]) {
                const meta = data.chart.result[0].meta;
                results[key] = {
                    price: meta.regularMarketPrice,
                    prevClose: meta.chartPreviousClose,
                    high: meta.regularMarketDayHigh,
                    low: meta.regularMarketDayLow,
                    change: meta.regularMarketPrice - meta.chartPreviousClose,
                    changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100).toFixed(2)
                };
            }
        } catch (error) {
            console.warn(`获取 ${key} 失败:`, error);
        }
    }
    
    return results;
}

// 格式化价格
function formatPrice(price, currency = 'USD') {
    if (!price && price !== 0) return '--';
    
    const symbols = {
        USD: '$',
        CNY: '¥',
        HKD: 'HK$'
    };
    
    const symbol = symbols[currency] || '$';
    return symbol + price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

// 格式化变化
function formatChange(change, changePercent) {
    const isUp = change >= 0;
    const arrow = isUp ? '▲' : '▼';
    const sign = isUp ? '+' : '';
    
    return {
        text: `${arrow} ${Math.abs(change).toFixed(2)} (${sign}${changePercent}%)`,
        class: isUp ? 'up' : 'down'
    };
}

// ============================================
// LocalStorage 历史数据管理
// ============================================

const HistoryManager = {
    key: 'goldPriceHistory',
    maxItems: 200,
    
    load() {
        try {
            const data = localStorage.getItem(this.key);
            if (data) {
                const parsed = JSON.parse(data);
                // 只保留7天内的数据
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                return parsed.filter(h => new Date(h.time).getTime() > weekAgo);
            }
        } catch (e) {}
        return [];
    },
    
    save(price) {
        try {
            let history = this.load();
            const now = new Date().toISOString();
            
            // 避免5分钟内重复保存
            if (history.length > 0) {
                const last = history[history.length - 1];
                if (new Date() - new Date(last.time) < 5 * 60 * 1000) {
                    return;
                }
            }
            
            history.push({ time: now, price });
            
            // 限制数量
            if (history.length > this.maxItems) {
                history = history.slice(-this.maxItems);
            }
            
            localStorage.setItem(this.key, JSON.stringify(history));
        } catch (e) {}
    },
    
    // 生成模拟历史数据
    generateSimulated(currentPrice, hours = 24) {
        const data = [];
        const now = new Date();
        const points = hours * 2; // 每30分钟一个点
        
        for (let i = points; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 30 * 60 * 1000);
            // 添加随机波动
            const randomChange = (Math.random() - 0.5) * 0.008;
            const trend = Math.sin(i / 10) * 0.003; // 添加趋势
            const price = currentPrice * (1 + randomChange + trend * (i / points));
            
            data.push({ time, price });
        }
        
        return data;
    }
};

// ============================================
// 图表功能
// ============================================

class GoldChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            padding: { top: 20, right: 60, bottom: 40, left: 20 },
            lineColor: '#ffd700',
            fillColor: 'rgba(255, 215, 0, 0.1)',
            gridColor: 'rgba(48, 54, 61, 0.5)',
            textColor: '#8b949e',
            crosshairColor: 'rgba(255, 215, 0, 0.5)',
            ...options
        };
        
        this.data = [];
        this.hoverIndex = -1;
        this.chartRect = null;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.bindEvents();
        
        window.addEventListener('resize', () => {
            this.resize();
            this.draw();
        });
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }
    
    setData(data) {
        this.data = data;
        this.draw();
    }
    
    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const { left, right } = this.getChartRect();
        const chartWidth = right - left;
        
        if (x >= left && x <= right && this.data.length > 0) {
            const index = Math.round((x - left) / chartWidth * (this.data.length - 1));
            this.hoverIndex = Math.max(0, Math.min(index, this.data.length - 1));
            this.draw();
            this.showTooltip(e.clientX, e.clientY, this.data[this.hoverIndex]);
        }
    }
    
    handleMouseLeave() {
        this.hoverIndex = -1;
        this.draw();
        this.hideTooltip();
    }
    
    handleClick(e) {
        if (this.hoverIndex >= 0 && this.options.onClick) {
            this.options.onClick(this.data[this.hoverIndex]);
        }
    }
    
    getChartRect() {
        const { padding } = this.options;
        return {
            left: padding.left,
            top: padding.top,
            right: this.width - padding.right,
            bottom: this.height - padding.bottom
        };
    }
    
    draw() {
        const { ctx, width, height, data } = this;
        const { padding, lineColor, fillColor, gridColor, textColor } = this.options;
        
        ctx.clearRect(0, 0, width, height);
        
        if (data.length < 2) return;
        
        const chartRect = this.getChartRect();
        const chartWidth = chartRect.right - chartRect.left;
        const chartHeight = chartRect.bottom - chartRect.top;
        
        // 计算价格范围
        const prices = data.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;
        const paddingY = priceRange * 0.1;
        const yMin = minPrice - paddingY;
        const yMax = maxPrice + paddingY;
        
        // 绘制网格
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        
        // 横向网格线
        for (let i = 0; i <= 5; i++) {
            const y = chartRect.top + chartHeight * i / 5;
            ctx.beginPath();
            ctx.moveTo(chartRect.left, y);
            ctx.lineTo(chartRect.right, y);
            ctx.stroke();
            
            // Y轴标签
            const price = yMax - (yMax - yMin) * i / 5;
            ctx.fillStyle = textColor;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('$' + price.toFixed(0), chartRect.right + 8, y + 3);
        }
        
        ctx.setLineDash([]);
        
        // 绘制曲线
        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        
        data.forEach((point, i) => {
            const x = chartRect.left + chartWidth * i / (data.length - 1);
            const y = chartRect.bottom - chartHeight * (point.price - yMin) / (yMax - yMin);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 填充区域
        ctx.lineTo(chartRect.right, chartRect.bottom);
        ctx.lineTo(chartRect.left, chartRect.bottom);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        
        // 绘制X轴时间标签
        const timeStep = Math.ceil(data.length / 6);
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < data.length; i += timeStep) {
            const x = chartRect.left + chartWidth * i / (data.length - 1);
            const time = new Date(data[i].time);
            const label = time.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            ctx.fillText(label, x, chartRect.bottom + 20);
        }
        
        // 绘制悬停效果
        if (this.hoverIndex >= 0) {
            const point = data[this.hoverIndex];
            const x = chartRect.left + chartWidth * this.hoverIndex / (data.length - 1);
            const y = chartRect.bottom - chartHeight * (point.price - yMin) / (yMax - yMin);
            
            // 十字准星
            ctx.strokeStyle = this.options.crosshairColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            
            ctx.beginPath();
            ctx.moveTo(x, chartRect.top);
            ctx.lineTo(x, chartRect.bottom);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(chartRect.left, y);
            ctx.lineTo(chartRect.right, y);
            ctx.stroke();
            
            ctx.setLineDash([]);
            
            // 高亮点
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = lineColor;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    showTooltip(x, y, data) {
        let tooltip = document.getElementById('chart-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'chart-tooltip';
            tooltip.className = 'chart-tooltip';
            document.body.appendChild(tooltip);
        }
        
        const time = new Date(data.time);
        const timeStr = time.toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        tooltip.innerHTML = `
            <div class="tooltip-price">$${data.price.toFixed(2)}</div>
            <div class="tooltip-time">${timeStr}</div>
        `;
        
        tooltip.style.left = (x + 15) + 'px';
        tooltip.style.top = (y - 10) + 'px';
        tooltip.classList.add('show');
    }
    
    hideTooltip() {
        const tooltip = document.getElementById('chart-tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
        }
    }
}

// ============================================
// 工具函数
// ============================================

// 防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 数字动画
function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const current = start + (end - start) * easeProgress;
        element.textContent = formatPrice(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// 导出
window.GoldPulse = {
    API_CONFIG,
    fetchGoldPrices,
    fetchStockIndices,
    formatPrice,
    formatChange,
    HistoryManager,
    GoldChart,
    debounce,
    animateNumber
};

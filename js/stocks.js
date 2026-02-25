/**
 * GoldPulse - 股票数据模块
 * 支持多数据源：Yahoo Finance (主) + 静态数据 (Fallback)
 */

// ============================================
// 股票配置数据
// ============================================
const STOCK_CATEGORIES = {
    tech: {
        name: '美股科技股',
        icon: 'ph-cpu',
        stocks: [
            { symbol: 'QQQ', name: '纳指100ETF-Invesco', type: 'ETF' },
            { symbol: 'TEM', name: 'Tempus AI', type: 'Stock' },
            { symbol: 'CRDO', name: 'Credo Technology', type: 'Stock' },
            { symbol: 'COIN', name: 'Coinbase', type: 'Stock' },
            { symbol: 'PLTR', name: 'Palantir', type: 'Stock' },
            { symbol: 'CRWV', name: 'CoreWeave', type: 'Stock' },
            { symbol: 'TSM', name: '台积电', type: 'Stock' },
            { symbol: 'ORCL', name: '甲骨文', type: 'Stock' },
            { symbol: 'FIG', name: 'Figma Inc', type: 'Stock' },
            { symbol: 'MELI', name: 'MercadoLibre', type: 'Stock' },
            { symbol: 'RBLX', name: 'Roblox', type: 'Stock' },
            { symbol: 'COUR', name: 'Coursera', type: 'Stock' },
            { symbol: 'SPOT', name: 'Spotify Technology', type: 'Stock' },
            { symbol: 'NFLX', name: '奈飞', type: 'Stock' },
            { symbol: 'DUOL', name: '多邻国', type: 'Stock' },
            { symbol: 'NIO', name: '蔚来', type: 'Stock' },
            { symbol: 'LI', name: '理想汽车', type: 'Stock' },
            { symbol: 'NVDA', name: '英伟达', type: 'Stock' },
            { symbol: 'PYPL', name: 'PayPal', type: 'Stock' },
            { symbol: 'DIS', name: '迪士尼', type: 'Stock' },
            { symbol: 'AMD', name: '美国超微公司', type: 'Stock' },
            { symbol: 'INTC', name: '英特尔', type: 'Stock' },
            { symbol: 'FUTU', name: '富途控股', type: 'Stock' },
            { symbol: 'AAPL', name: '苹果', type: 'Stock' },
            { symbol: 'BABA', name: '阿里巴巴', type: 'Stock' },
            { symbol: 'PDD', name: '拼多多', type: 'Stock' }
        ]
    },
    etf: {
        name: 'ETF和指数',
        icon: 'ph-chart-bar',
        stocks: [
            { symbol: 'VOO', name: '标普500ETF-Vanguard', type: 'ETF' },
            { symbol: 'AVGO', name: '博通', type: 'Stock' },
            { symbol: '^VIX', name: '标普500波动率指数', type: 'Index' },
            { symbol: 'PSQ', name: '做空纳斯达克100', type: 'ETF' },
            { symbol: 'SH', name: 'Proshares做空标普', type: 'ETF' },
            { symbol: 'SPY', name: '标普500ETF-SPDR', type: 'ETF' },
            { symbol: 'IVV', name: '标普500ETF-iShares', type: 'ETF' },
            { symbol: '^GSPC', name: '标普500指数', type: 'Index' },
            { symbol: 'VXX', name: '标普500短期期货', type: 'ETF' },
            { symbol: 'QID', name: 'ProShares两倍做空', type: 'ETF' },
            { symbol: 'SQQQ', name: '三倍做空纳指ETF', type: 'ETF' },
            { symbol: '^IXIC', name: '纳斯达克综合指数', type: 'Index' }
        ]
    },
    other: {
        name: '其他',
        icon: 'ph-globe',
        stocks: [
            { symbol: 'CL=F', name: 'WTI原油期货主连', type: 'Future' },
            { symbol: 'NOC', name: '诺斯罗普格鲁曼', type: 'Stock' },
            { symbol: 'LMT', name: '洛克希德马丁', type: 'Stock' },
            { symbol: 'OXY', name: '西方石油', type: 'Stock' },
            { symbol: 'SLMT', name: 'Brera Holdings', type: 'Stock' },
            { symbol: 'NTDOY', name: '任天堂(ADR)', type: 'Stock' },
            { symbol: 'DJT', name: '特朗普媒体科技集团', type: 'Stock' },
            { symbol: 'SE', name: 'Sea', type: 'Stock' }
        ]
    }
};

// 静态备用数据（当API不可用时使用）
const STATIC_STOCK_DATA = {
    'QQQ': { price: 522.35, change: 1.24, prevClose: 515.95 },
    'TEM': { price: 58.42, change: -2.15, prevClose: 59.70 },
    'CRDO': { price: 78.25, change: 3.42, prevClose: 75.66 },
    'COIN': { price: 245.80, change: 5.67, prevClose: 232.60 },
    'PLTR': { price: 98.45, change: 2.34, prevClose: 96.20 },
    'CRWV': { price: 156.30, change: -1.25, prevClose: 158.28 },
    'TSM': { price: 198.50, change: 1.89, prevClose: 194.82 },
    'ORCL': { price: 187.25, change: 0.75, prevClose: 185.86 },
    'FIG': { price: 45.60, change: 0.00, prevClose: 45.60 },
    'MELI': { price: 2156.80, change: 12.45, prevClose: 2144.35 },
    'RBLX': { price: 78.95, change: -3.21, prevClose: 81.57 },
    'COUR': { price: 12.45, change: 0.85, prevClose: 12.35 },
    'SPOT': { price: 625.40, change: 8.92, prevClose: 573.20 },
    'NFLX': { price: 985.60, change: 15.30, prevClose: 854.88 },
    'DUOL': { price: 425.80, change: 6.75, prevClose: 398.88 },
    'NIO': { price: 4.85, change: -0.25, prevClose: 4.65 },
    'LI': { price: 28.45, change: 1.20, prevClose: 28.12 },
    'NVDA': { price: 148.25, change: 4.56, prevClose: 141.95 },
    'PYPL': { price: 78.60, change: -1.25, prevClose: 79.60 },
    'DIS': { price: 118.45, change: 2.10, prevClose: 116.01 },
    'AMD': { price: 128.90, change: 3.45, prevClose: 124.60 },
    'INTC': { price: 25.40, change: -0.85, prevClose: 25.62 },
    'FUTU': { price: 98.75, change: 2.85, prevClose: 96.02 },
    'AAPL': { price: 245.80, change: 3.25, prevClose: 238.03 },
    'BABA': { price: 138.50, change: 4.20, prevClose: 132.99 },
    'PDD': { price: 125.60, change: -2.15, prevClose: 128.36 },
    'VOO': { price: 565.80, change: 1.85, prevClose: 555.53 },
    'AVGO': { price: 245.60, change: 3.25, prevClose: 237.83 },
    '^VIX': { price: 18.45, change: -5.25, prevClose: 19.47 },
    'PSQ': { price: 52.35, change: -1.25, prevClose: 53.01 },
    'SH': { price: 12.85, change: -0.45, prevClose: 12.91 },
    'SPY': { price: 595.25, change: 1.95, prevClose: 583.83 },
    'IVV': { price: 598.40, change: 1.88, prevClose: 587.38 },
    '^GSPC': { price: 5958.25, change: 0.78, prevClose: 5912.20 },
    'VXX': { price: 58.25, change: -2.15, prevClose: 59.53 },
    'QID': { price: 28.45, change: -2.50, prevClose: 29.18 },
    'SQQQ': { price: 32.85, change: -3.75, prevClose: 34.13 },
    '^IXIC': { price: 19245.80, change: 1.04, prevClose: 19047.40 },
    'CL=F': { price: 72.85, change: 1.25, prevClose: 71.95 },
    'NOC': { price: 485.60, change: 2.85, prevClose: 472.15 },
    'LMT': { price: 625.40, change: 3.25, prevClose: 605.72 },
    'OXY': { price: 52.85, change: 1.45, prevClose: 52.10 },
    'SLMT': { price: 12.45, change: 0.00, prevClose: 12.45 },
    'NTDOY': { price: 18.25, change: 0.85, prevClose: 18.10 },
    'DJT': { price: 25.60, change: -1.25, prevClose: 25.92 },
    'SE': { price: 125.80, change: 4.25, prevClose: 120.67 }
};

// ============================================
// 股票数据服务
// ============================================
class StockDataService {
    constructor() {
        // P0修复: 实现多代理池+自动故障转移，解决单一代理不稳定问题
        this.corsProxies = [
            'https://api.allorigins.win/get?url=',
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url='
        ];
        this.currentProxyIndex = 0;
        this.proxyFailureCount = new Array(this.corsProxies.length).fill(0);
        this.maxProxyFailures = 3; // 单个代理最大失败次数
        
        this.cache = new Map();
        this.cacheExpiry = 60000; // 1分钟缓存
        this.lastRequestTime = 0;
        this.requestInterval = 100; // 请求间隔ms
    }
    
    // P0修复: 获取当前可用代理
    getCurrentProxy() {
        return this.corsProxies[this.currentProxyIndex];
    }
    
    // P0修复: 切换到下一个代理
    switchToNextProxy() {
        this.proxyFailureCount[this.currentProxyIndex]++;
        console.warn(`代理 ${this.currentProxyIndex} 失败次数: ${this.proxyFailureCount[this.currentProxyIndex]}`);
        
        // 找到失败次数最少的代理
        let minFailures = Infinity;
        let nextIndex = this.currentProxyIndex;
        
        for (let i = 0; i < this.corsProxies.length; i++) {
            if (this.proxyFailureCount[i] < minFailures) {
                minFailures = this.proxyFailureCount[i];
                nextIndex = i;
            }
        }
        
        this.currentProxyIndex = nextIndex;
        console.log(`切换到代理 ${this.currentProxyIndex}: ${this.getCurrentProxy()}`);
    }
    
    // P0修复: 重置代理失败计数（成功时调用）
    resetProxyFailureCount() {
        this.proxyFailureCount[this.currentProxyIndex] = 0;
    }

    // 延迟函数
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 获取Yahoo Finance URL
    getYahooUrl(symbol) {
        // 处理特殊符号
        const encodedSymbol = encodeURIComponent(symbol);
        return `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1d&range=1d`;
    }

    // 获取缓存数据
    getCached(symbol) {
        const cached = this.cache.get(symbol);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    // 设置缓存
    setCache(symbol, data) {
        this.cache.set(symbol, {
            data,
            timestamp: Date.now()
        });
    }

    // P0修复: 获取单个股票数据，支持多代理自动故障转移
    async fetchStock(symbol, retryCount = 0) {
        // 检查缓存
        const cached = this.getCached(symbol);
        if (cached) return cached;

        // 速率限制
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.requestInterval) {
            await this.delay(this.requestInterval - timeSinceLastRequest);
        }

        try {
            const url = this.getYahooUrl(symbol);
            const proxyUrl = this.getCurrentProxy() + encodeURIComponent(url);
            
            this.lastRequestTime = Date.now();
            const response = await fetch(proxyUrl, { timeout: 10000 });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            let data;
            const contentType = response.headers.get('content-type');
            
            // P0修复: 处理不同代理的返回格式
            if (proxyUrl.includes('allorigins.win/get')) {
                const result = await response.json();
                if (!result.contents) {
                    throw new Error('Invalid response');
                }
                data = JSON.parse(result.contents);
            } else if (proxyUrl.includes('allorigins.win/raw')) {
                // raw模式直接返回数据
                data = await response.json();
            } else {
                // 其他代理直接返回JSON
                data = await response.json();
            }
            
            if (data.chart?.error) {
                throw new Error(data.chart.error.description);
            }

            const result_data = data.chart?.result?.[0];
            if (!result_data) {
                throw new Error('No data available');
            }

            const meta = result_data.meta;
            const price = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose || meta.previousClose;
            const change = price - prevClose;
            const changePercent = (change / prevClose * 100);

            const stockData = {
                symbol,
                price,
                change,
                changePercent,
                prevClose,
                high: meta.regularMarketDayHigh || price,
                low: meta.regularMarketDayLow || price,
                volume: meta.regularMarketVolume || 0,
                timestamp: Date.now(),
                source: 'yahoo'
            };

            // P0修复: 成功时重置当前代理失败计数
            this.resetProxyFailureCount();
            this.setCache(symbol, stockData);
            return stockData;

        } catch (error) {
            console.warn(`获取 ${symbol} 失败 (代理${this.currentProxyIndex}):`, error.message);
            
            // P0修复: 自动切换到下一个代理重试
            if (retryCount < this.corsProxies.length - 1) {
                this.switchToNextProxy();
                return this.fetchStock(symbol, retryCount + 1);
            }
            
            return this.getFallbackData(symbol);
        }
    }

    // 获取备用数据
    getFallbackData(symbol) {
        const staticData = STATIC_STOCK_DATA[symbol];
        if (staticData) {
            return {
                symbol,
                price: staticData.price,
                change: staticData.change,
                changePercent: staticData.change,
                prevClose: staticData.prevClose,
                high: staticData.price * 1.02,
                low: staticData.price * 0.98,
                volume: 0,
                timestamp: Date.now(),
                source: 'static'
            };
        }
        
        // 生成随机数据作为最后 fallback
        const basePrice = 100 + Math.random() * 200;
        const change = (Math.random() - 0.5) * 10;
        return {
            symbol,
            price: basePrice,
            change,
            changePercent: (change / basePrice * 100),
            prevClose: basePrice - change,
            high: basePrice * 1.02,
            low: basePrice * 0.98,
            volume: Math.floor(Math.random() * 10000000),
            timestamp: Date.now(),
            source: 'simulated'
        };
    }

    // 批量获取股票数据
    async fetchBatch(symbols, onProgress = null) {
        const results = {};
        const total = symbols.length;
        
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            try {
                results[symbol] = await this.fetchStock(symbol);
                if (onProgress) {
                    onProgress(i + 1, total, symbol);
                }
            } catch (error) {
                results[symbol] = this.getFallbackData(symbol);
            }
        }
        
        return results;
    }

    // 获取所有分类的股票数据
    async fetchAllCategories(onProgress = null) {
        const allSymbols = [];
        const categoryMap = {};

        // 收集所有symbol
        Object.entries(STOCK_CATEGORIES).forEach(([categoryKey, category]) => {
            category.stocks.forEach(stock => {
                allSymbols.push(stock.symbol);
                categoryMap[stock.symbol] = categoryKey;
            });
        });

        // 批量获取数据
        const data = await this.fetchBatch(allSymbols, onProgress);

        // 按分类组织
        const result = {};
        Object.keys(STOCK_CATEGORIES).forEach(key => {
            result[key] = {
                ...STOCK_CATEGORIES[key],
                data: {}
            };
        });

        Object.entries(data).forEach(([symbol, stockData]) => {
            const categoryKey = categoryMap[symbol];
            if (categoryKey && result[categoryKey]) {
                result[categoryKey].data[symbol] = stockData;
            }
        });

        return result;
    }
}

// ============================================
// Sparkline 图表绘制
// ============================================
class SparklineChart {
    constructor(canvas, data, options = {}) {
        this.canvas = canvas;
        this.data = data || [];
        this.options = {
            lineWidth: 2,
            fillOpacity: 0.1,
            upColor: '#32d74b',
            downColor: '#ff453a',
            ...options
        };
        
        this.ctx = canvas.getContext('2d');
        this.init();
    }

    init() {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
        this.draw();
    }

    // 生成模拟走势图数据
    static generateData(basePrice, points = 20, volatility = 0.02) {
        const data = [basePrice];
        for (let i = 1; i < points; i++) {
            const change = (Math.random() - 0.5) * volatility;
            data.push(data[i - 1] * (1 + change));
        }
        return data;
    }

    draw() {
        const { ctx, canvas, data, options } = this;
        const width = canvas.width || 120;
        const height = canvas.height || 40;

        // 设置canvas尺寸
        canvas.width = width * 2;
        canvas.height = height * 2;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(2, 2);

        // 清空
        ctx.clearRect(0, 0, width, height);

        if (data.length < 2) return;

        // 计算范围
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        // 确定颜色（根据涨跌）
        const isUp = data[data.length - 1] >= data[0];
        const color = isUp ? options.upColor : options.downColor;

        // 绘制线条
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = options.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        data.forEach((value, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * (height - 8) - 4;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // 填充渐变
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, color + '33'); // 20% opacity
        gradient.addColorStop(1, color + '00'); // 0% opacity
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

// ============================================
// 股票列表渲染器
// ============================================
class StockListRenderer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            onStockClick: null,
            refreshInterval: 60000, // 1分钟自动刷新
            ...options
        };
        this.stockService = new StockDataService();
        this.refreshTimer = null;
    }

    // 格式化价格
    formatPrice(price, symbol = '') {
        if (!price && price !== 0) return '--';
        
        // 指数不显示$
        if (symbol.startsWith('^')) {
            return price.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }
        
        return '$' + price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }

    // 格式化涨跌
    formatChange(change, changePercent) {
        const isUp = change >= 0;
        const sign = isUp ? '+' : '';
        return {
            text: `${sign}${changePercent.toFixed(2)}%`,
            class: isUp ? 'up' : 'down',
            arrow: isUp ? 'ph-arrow-up-right' : 'ph-arrow-down-right'
        };
    }

    // 渲染股票项
    renderStockItem(stock, data) {
        const changeInfo = this.formatChange(data.change, data.changePercent);
        const sparklineData = SparklineChart.generateData(data.prevClose, 20, Math.abs(data.changePercent) / 100 + 0.01);
        
        return `
            <div class="stock-item" data-symbol="${stock.symbol}">
                <div class="stock-info">
                    <div class="stock-name">${stock.name}</div>
                    <div class="stock-symbol">${stock.symbol}</div>
                </div>
                <div class="stock-chart">
                    <canvas class="sparkline-canvas" width="120" height="40"></canvas>
                </div>
                <div class="stock-price-info">
                    <div class="stock-price">${this.formatPrice(data.price, stock.symbol)}</div>
                    <div class="stock-change ${changeInfo.class}">
                        <i class="ph ${changeInfo.arrow}"></i>
                        ${changeInfo.text}
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染分类
    renderCategory(key, category) {
        const stocksHtml = category.stocks.map(stock => {
            const data = category.data[stock.symbol] || this.stockService.getFallbackData(stock.symbol);
            return this.renderStockItem(stock, data);
        }).join('');

        return `
            <div class="stock-category" data-category="${key}">
                <div class="category-header">
                    <i class="ph ${category.icon}"></i>
                    <h3>${category.name}</h3>
                    <span class="stock-count">${category.stocks.length}</span>
                </div>
                <div class="stock-list">
                    ${stocksHtml}
                </div>
            </div>
        `;
    }

    // 渲染所有分类
    render(data) {
        if (!this.container) return;

        const html = Object.entries(data).map(([key, category]) => {
            return this.renderCategory(key, category);
        }).join('');

        this.container.innerHTML = html;

        // 绘制sparkline
        this.drawSparklines(data);

        // 绑定事件
        this.bindEvents();
    }

    // 绘制所有sparkline
    drawSparklines(data) {
        Object.values(data).forEach(category => {
            category.stocks.forEach(stock => {
                const item = this.container.querySelector(`[data-symbol="${stock.symbol}"]`);
                if (item) {
                    const canvas = item.querySelector('.sparkline-canvas');
                    const stockData = category.data[stock.symbol];
                    if (canvas && stockData) {
                        const sparklineData = SparklineChart.generateData(
                            stockData.prevClose, 
                            20, 
                            Math.abs(stockData.changePercent) / 100 + 0.01
                        );
                        new SparklineChart(canvas, sparklineData);
                    }
                }
            });
        });
    }

    // 绑定事件
    bindEvents() {
        const items = this.container.querySelectorAll('.stock-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const symbol = item.dataset.symbol;
                if (this.options.onStockClick) {
                    this.options.onStockClick(symbol);
                }
            });
        });
    }

    // 显示加载状态
    showLoading() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="stock-loading">
                <div class="loading-spinner"></div>
                <p>正在加载股票数据...</p>
            </div>
        `;
    }

    // 显示错误
    showError(message) {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="stock-error">
                <i class="ph ph-warning-circle"></i>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="stockList.load()">重试</button>
            </div>
        `;
    }

    // 加载数据
    async load() {
        this.showLoading();
        
        try {
            const data = await this.stockService.fetchAllCategories();
            this.render(data);
            this.startAutoRefresh();
        } catch (error) {
            console.error('加载股票数据失败:', error);
            this.showError('加载失败，请检查网络连接');
        }
    }

    // 开始自动刷新
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        this.refreshTimer = setInterval(() => {
            this.refresh();
        }, this.options.refreshInterval);
    }

    // 停止自动刷新
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // 刷新数据
    async refresh() {
        try {
            const data = await this.stockService.fetchAllCategories();
            this.render(data);
        } catch (error) {
            console.error('刷新失败:', error);
        }
    }
}

// ============================================
// 导出
// ============================================
window.StockModule = {
    STOCK_CATEGORIES,
    STATIC_STOCK_DATA,
    StockDataService,
    SparklineChart,
    StockListRenderer
};

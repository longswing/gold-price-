/**
 * API Service - API 服务层
 * 统一处理数据获取、缓存、错误处理和加载状态
 */

const APIService = {
    // API 配置
    config: {
        // 黄金价格 API (goldprice.org)
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
            sp500: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=1d',
            sse: 'https://query1.finance.yahoo.com/v8/finance/chart/000001.SS?interval=1d&range=1d'
        },
        
        // 黄金历史数据
        goldHistory: 'https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1h&range=5d',
        
        // 请求超时时间（毫秒）
        timeout: 10000,
        
        // 缓存时间（毫秒）
        cacheTime: 60000 // 1分钟
    },

    // 缓存存储
    _cache: new Map(),
    
    // 正在进行中的请求
    _pendingRequests: new Map(),
    
    // 请求拦截器
    _requestInterceptors: [],
    
    // 响应拦截器
    _responseInterceptors: [],

    /**
     * 初始化 API 服务
     */
    init() {
        this._loadCacheFromStorage();
        console.log('[APIService] Initialized');
    },

    // ============ 核心请求方法 ============

    /**
     * 发送 HTTP 请求
     * @param {string} url - 请求 URL
     * @param {Object} options - 请求选项
     * @returns {Promise} 响应数据
     */
    async request(url, options = {}) {
        const { 
            method = 'GET', 
            data = null, 
            headers = {}, 
            useCache = false,
            cacheKey = null,
            timeout = this.config.timeout 
        } = options;

        // 检查缓存
        if (useCache && method === 'GET') {
            const key = cacheKey || url;
            const cached = this._getCache(key);
            if (cached) {
                console.log('[APIService] Cache hit:', key);
                return cached;
            }
        }

        // 检查是否有进行中的相同请求（防止重复请求）
        const pendingKey = `${method}:${url}`;
        if (this._pendingRequests.has(pendingKey)) {
            console.log('[APIService] Reusing pending request:', pendingKey);
            return this._pendingRequests.get(pendingKey);
        }

        // 执行请求拦截器
        let finalUrl = url;
        let finalOptions = { method, headers, body: data };
        
        for (const interceptor of this._requestInterceptors) {
            const result = await interceptor(finalUrl, finalOptions);
            finalUrl = result.url;
            finalOptions = result.options;
        }

        // 创建请求 Promise
        const requestPromise = this._executeRequest(finalUrl, finalOptions, timeout)
            .then(async response => {
                // 执行响应拦截器
                let result = response;
                for (const interceptor of this._responseInterceptors) {
                    result = await interceptor(result);
                }
                
                // 缓存结果
                if (useCache && method === 'GET') {
                    const key = cacheKey || url;
                    this._setCache(key, result);
                }
                
                this._pendingRequests.delete(pendingKey);
                return result;
            })
            .catch(error => {
                this._pendingRequests.delete(pendingKey);
                throw error;
            });

        // 保存进行中的请求
        this._pendingRequests.set(pendingKey, requestPromise);
        
        return requestPromise;
    },

    /**
     * 执行实际请求
     */
    async _executeRequest(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请稍后重试');
            }
            
            throw error;
        }
    },

    // ============ 黄金价格 API ============

    /**
     * 获取黄金价格
     * @returns {Promise<Object>} 黄金价格数据
     */
    async getGoldPrice() {
        Store?.setLoading(true);
        Store?.clearError();

        try {
            const [usdData, cnyData] = await Promise.all([
                this.request(this.config.gold.usd, { useCache: true, cacheKey: 'gold:usd' }),
                this.request(this.config.gold.cny, { useCache: true, cacheKey: 'gold:cny' })
            ]);

            const result = {
                usd: this._normalizeGoldData(usdData.items?.[0], 'USD'),
                cny: this._normalizeGoldData(cnyData.items?.[0], 'CNY'),
                timestamp: new Date().toISOString()
            };

            // 更新 Store
            Store?.updatePrice('gold', result);
            
            return result;
        } catch (error) {
            const errorMsg = '获取黄金价格失败: ' + error.message;
            Store?.setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            Store?.setLoading(false);
        }
    },

    /**
     * 获取单一货币黄金价格
     * @param {string} currency - 货币代码 (USD/CNY)
     * @returns {Promise<Object>} 黄金价格数据
     */
    async getGoldPriceByCurrency(currency) {
        const url = this.config.gold[currency.toLowerCase()];
        if (!url) {
            throw new Error(`不支持的货币: ${currency}`);
        }

        const data = await this.request(url, { 
            useCache: true, 
            cacheKey: `gold:${currency.toLowerCase()}` 
        });

        return this._normalizeGoldData(data.items?.[0], currency);
    },

    // ============ 股票指数 API ============

    /**
     * 获取股票指数数据
     * @param {string} market - 市场代码 (hsi/nasdaq/sp500/sse)
     * @returns {Promise<Object>} 股票数据
     */
    async getMarketData(market) {
        const url = this.config.stocks[market.toLowerCase()];
        if (!url) {
            throw new Error(`不支持的市场: ${market}`);
        }

        const proxyUrl = this.config.corsProxy + encodeURIComponent(url);
        
        const data = await this.request(proxyUrl, {
            useCache: true,
            cacheKey: `stock:${market.toLowerCase()}`,
            timeout: 15000 // 股票 API 可能需要更长时间
        });

        const parsed = JSON.parse(data.contents);
        const normalized = this._normalizeStockData(parsed, market);
        
        // 更新 Store
        Store?.updatePrice(market.toLowerCase(), normalized);
        
        return normalized;
    },

    /**
     * 获取所有股票指数
     * @returns {Promise<Object>} 所有股票数据
     */
    async getAllMarketData() {
        const markets = Object.keys(this.config.stocks);
        const results = {};
        
        await Promise.all(
            markets.map(async market => {
                try {
                    results[market] = await this.getMarketData(market);
                } catch (error) {
                    console.warn(`[APIService] Failed to fetch ${market}:`, error.message);
                    results[market] = null;
                }
            })
        );
        
        return results;
    },

    // ============ 历史数据 API ============

    /**
     * 获取黄金历史数据
     * @param {Object} options - 选项
     * @param {string} options.interval - 时间间隔 (1h/1d)
     * @param {string} options.range - 时间范围 (5d/1mo/3mo/1y)
     * @returns {Promise<Array>} 历史数据数组
     */
    async getGoldHistory(options = {}) {
        const { interval = '1h', range = '5d' } = options;
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=${interval}&range=${range}`;
        const proxyUrl = this.config.corsProxy + encodeURIComponent(url);
        
        const data = await this.request(proxyUrl, {
            useCache: true,
            cacheKey: `gold:history:${interval}:${range}`,
            cacheTime: 300000 // 历史数据缓存5分钟
        });

        const parsed = JSON.parse(data.contents);
        return this._normalizeHistoryData(parsed);
    },

    // ============ 数据规范化 ============

    /**
     * 规范化黄金数据
     */
    _normalizeGoldData(data, currency) {
        if (!data) return null;

        const price = data.xauPrice;
        const change = data.chgXau || 0;
        const changePercent = data.pcXau || 0;
        const prevClose = data.xauClose || (price - change);

        return {
            symbol: 'XAU',
            currency: currency.toUpperCase(),
            price: price,
            change: change,
            changePercent: changePercent,
            prevClose: prevClose,
            open: prevClose, // API 不提供，使用昨收估算
            high: price + Math.abs(change) * 0.5,
            low: price - Math.abs(change) * 0.5,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * 规范化股票数据
     */
    _normalizeStockData(data, market) {
        if (!data?.chart?.result?.[0]) {
            throw new Error('无效的股票数据');
        }

        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators?.quote?.[0] || {};

        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        const marketNames = {
            hsi: '恒生指数',
            nasdaq: '纳斯达克',
            sp500: '标普500',
            sse: '上证指数'
        };

        const marketCurrencies = {
            hsi: 'HKD',
            nasdaq: 'USD',
            sp500: 'USD',
            sse: 'CNY'
        };

        return {
            symbol: market.toUpperCase(),
            name: marketNames[market.toLowerCase()] || market,
            currency: marketCurrencies[market.toLowerCase()] || 'USD',
            price: price,
            change: change,
            changePercent: changePercent,
            prevClose: prevClose,
            open: quote.open?.[0] || prevClose,
            high: meta.regularMarketDayHigh || price,
            low: meta.regularMarketDayLow || price,
            volume: meta.regularMarketVolume,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * 规范化历史数据
     */
    _normalizeHistoryData(data) {
        if (!data?.chart?.result?.[0]) {
            return [];
        }

        const result = data.chart.result[0];
        const timestamps = result.timestamp || [];
        const prices = result.indicators?.quote?.[0]?.close || [];

        return timestamps
            .map((timestamp, i) => ({
                time: new Date(timestamp * 1000).toISOString(),
                price: prices[i]
            }))
            .filter(d => d.price !== null && d.price !== undefined);
    },

    // ============ 缓存管理 ============

    /**
     * 获取缓存
     */
    _getCache(key) {
        const cached = this._cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
            this._cache.delete(key);
            return null;
        }

        return cached.data;
    },

    /**
     * 设置缓存
     */
    _setCache(key, data, ttl = this.config.cacheTime) {
        this._cache.set(key, {
            data: JSON.parse(JSON.stringify(data)), // 深克隆
            timestamp: Date.now(),
            ttl: ttl
        });
        
        this._saveCacheToStorage();
    },

    /**
     * 清除缓存
     * @param {string} pattern - 可选的匹配模式
     */
    clearCache(pattern = null) {
        if (!pattern) {
            this._cache.clear();
        } else {
            for (const key of this._cache.keys()) {
                if (key.includes(pattern)) {
                    this._cache.delete(key);
                }
            }
        }
        this._saveCacheToStorage();
    },

    /**
     * 从 localStorage 加载缓存
     */
    _loadCacheFromStorage() {
        try {
            const stored = sessionStorage.getItem('api_cache');
            if (stored) {
                const parsed = JSON.parse(stored);
                const now = Date.now();
                
                Object.entries(parsed).forEach(([key, value]) => {
                    if (now - value.timestamp < value.ttl) {
                        this._cache.set(key, value);
                    }
                });
            }
        } catch (e) {
            console.warn('[APIService] Failed to load cache:', e);
        }
    },

    /**
     * 保存缓存到 localStorage
     */
    _saveCacheToStorage() {
        try {
            const obj = Object.fromEntries(this._cache);
            sessionStorage.setItem('api_cache', JSON.stringify(obj));
        } catch (e) {
            console.warn('[APIService] Failed to save cache:', e);
        }
    },

    // ============ 拦截器 ============

    /**
     * 添加请求拦截器
     * @param {Function} interceptor - (url, options) => { url, options }
     */
    addRequestInterceptor(interceptor) {
        this._requestInterceptors.push(interceptor);
    },

    /**
     * 添加响应拦截器
     * @param {Function} interceptor - (response) => response
     */
    addResponseInterceptor(interceptor) {
        this._responseInterceptors.push(interceptor);
    },

    // ============ 工具方法 ============

    /**
     * 检查 API 健康状态
     * @returns {Promise<Object>} 健康状态
     */
    async healthCheck() {
        const results = {
            gold: false,
            stocks: false,
            timestamp: new Date().toISOString()
        };

        try {
            await this.request(this.config.gold.usd, { timeout: 5000 });
            results.gold = true;
        } catch (e) {
            console.warn('[APIService] Gold API health check failed:', e.message);
        }

        try {
            const testUrl = this.config.corsProxy + encodeURIComponent(this.config.stocks.nasdaq);
            await this.request(testUrl, { timeout: 5000 });
            results.stocks = true;
        } catch (e) {
            console.warn('[APIService] Stock API health check failed:', e.message);
        }

        return results;
    }
};

// 初始化
if (typeof window !== 'undefined') {
    APIService.init();
    window.APIService = APIService;
}

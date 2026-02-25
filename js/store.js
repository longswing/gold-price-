/**
 * Store - 全局状态管理
 * 实现一个简单的发布-订阅模式状态管理器
 */

const Store = {
    // 初始状态
    state: {
        // 当前市场
        currentMarket: 'gold',
        
        // 收藏列表
        favorites: [],
        
        // 价格提醒
        alerts: [],
        
        // 自动刷新设置
        autoRefresh: true,
        refreshInterval: 300, // 秒
        
        // 数据状态
        isLoading: false,
        lastUpdate: null,
        error: null,
        
        // 当前价格数据
        prices: {
            gold: {
                usd: null,
                cny: null
            },
            stocks: {}
        },
        
        // 用户设置
        settings: {
            currency: 'USD',
            language: 'zh-CN',
            theme: 'dark'
        }
    },

    // 订阅者存储
    _subscribers: new Map(),

    // 本地存储键名
    _storageKey: 'goldpulse_store',

    /**
     * 初始化 Store，从 localStorage 恢复数据
     */
    init() {
        this._loadFromStorage();
        this._notify('init', this.state);
    },

    /**
     * 获取状态值
     * @param {string} key - 状态键名（支持点号路径，如 'prices.gold.usd'）
     * @returns {*} 状态值
     */
    get(key) {
        if (!key) return this._deepClone(this.state);
        
        const keys = key.split('.');
        let value = this.state;
        
        for (const k of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[k];
        }
        
        return this._deepClone(value);
    },

    /**
     * 设置状态值
     * @param {string} key - 状态键名
     * @param {*} value - 新值
     * @param {boolean} persist - 是否持久化到 localStorage
     */
    setState(key, value, persist = true) {
        const oldValue = this.get(key);
        const keys = key.split('.');
        
        // 更新状态
        let target = this.state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in target)) {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        target[lastKey] = this._deepClone(value);
        
        // 通知订阅者
        this._notify(key, value, oldValue);
        
        // 持久化
        if (persist) {
            this._saveToStorage();
        }
    },

    /**
     * 批量设置状态
     * @param {Object} updates - 要更新的状态对象
     * @param {boolean} persist - 是否持久化
     */
    setStates(updates, persist = true) {
        for (const [key, value] of Object.entries(updates)) {
            this.setState(key, value, false);
        }
        if (persist) {
            this._saveToStorage();
        }
    },

    /**
     * 订阅状态变化
     * @param {string|Function} key - 要订阅的状态键名，或通配符 '*' 订阅所有变化
     * @param {Function} callback - 回调函数 (newValue, oldValue, key) => void
     * @returns {Function} 取消订阅函数
     */
    subscribe(key, callback) {
        if (typeof key === 'function') {
            callback = key;
            key = '*';
        }
        
        if (!this._subscribers.has(key)) {
            this._subscribers.set(key, new Set());
        }
        
        this._subscribers.get(key).add(callback);
        
        // 返回取消订阅函数
        return () => {
            this._subscribers.get(key)?.delete(callback);
        };
    },

    /**
     * 订阅状态变化（只执行一次）
     * @param {string} key - 状态键名
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅函数
     */
    subscribeOnce(key, callback) {
        const unsubscribe = this.subscribe(key, (newValue, oldValue, k) => {
            callback(newValue, oldValue, k);
            unsubscribe();
        });
        return unsubscribe;
    },

    /**
     * 添加收藏
     * @param {string} symbol - 品种代码
     * @param {string} name - 品种名称
     */
    addFavorite(symbol, name) {
        const favorites = this.get('favorites');
        if (!favorites.find(f => f.symbol === symbol)) {
            favorites.push({ symbol, name, addedAt: new Date().toISOString() });
            this.setState('favorites', favorites);
        }
    },

    /**
     * 移除收藏
     * @param {string} symbol - 品种代码
     */
    removeFavorite(symbol) {
        const favorites = this.get('favorites').filter(f => f.symbol !== symbol);
        this.setState('favorites', favorites);
    },

    /**
     * 是否已收藏
     * @param {string} symbol - 品种代码
     * @returns {boolean}
     */
    isFavorite(symbol) {
        return this.get('favorites').some(f => f.symbol === symbol);
    },

    /**
     * 添加价格提醒
     * @param {Object} alert - 提醒配置
     * @param {string} alert.symbol - 品种代码
     * @param {number} alert.targetPrice - 目标价格
     * @param {string} alert.condition - 条件 'above' | 'below'
     * @param {boolean} alert.enabled - 是否启用
     * @returns {string} 提醒ID
     */
    addAlert(alert) {
        const alerts = this.get('alerts');
        const newAlert = {
            id: this._generateId(),
            createdAt: new Date().toISOString(),
            triggered: false,
            ...alert
        };
        alerts.push(newAlert);
        this.setState('alerts', alerts);
        return newAlert.id;
    },

    /**
     * 移除价格提醒
     * @param {string} alertId - 提醒ID
     */
    removeAlert(alertId) {
        const alerts = this.get('alerts').filter(a => a.id !== alertId);
        this.setState('alerts', alerts);
    },

    /**
     * 更新价格提醒状态
     * @param {string} alertId - 提醒ID
     * @param {boolean} triggered - 是否已触发
     */
    setAlertTriggered(alertId, triggered = true) {
        const alerts = this.get('alerts').map(a => 
            a.id === alertId ? { ...a, triggered } : a
        );
        this.setState('alerts', alerts);
    },

    /**
     * 切换自动刷新
     * @returns {boolean} 新的自动刷新状态
     */
    toggleAutoRefresh() {
        const newValue = !this.get('autoRefresh');
        this.setState('autoRefresh', newValue);
        return newValue;
    },

    /**
     * 更新价格数据
     * @param {string} symbol - 品种代码
     * @param {Object} data - 价格数据
     */
    updatePrice(symbol, data) {
        const prices = this.get('prices');
        
        if (symbol === 'gold') {
            if (data.usd) prices.gold.usd = data.usd;
            if (data.cny) prices.gold.cny = data.cny;
        } else {
            prices.stocks[symbol] = data;
        }
        
        this.setState('prices', prices, false);
        this.setState('lastUpdate', new Date().toISOString());
        this._notify(`prices.${symbol}`, data);
    },

    /**
     * 设置加载状态
     * @param {boolean} loading - 是否加载中
     */
    setLoading(loading) {
        this.setState('isLoading', loading, false);
    },

    /**
     * 设置错误信息
     * @param {string|null} error - 错误信息
     */
    setError(error) {
        this.setState('error', error, false);
    },

    /**
     * 清除错误
     */
    clearError() {
        this.setState('error', null, false);
    },

    /**
     * 重置状态（保留用户设置）
     */
    reset() {
        const settings = this.get('settings');
        this.state = {
            ...this._getInitialState(),
            settings
        };
        this._saveToStorage();
        this._notify('reset', this.state);
    },

    /**
     * 获取所有订阅者数量
     * @returns {number}
     */
    getSubscriberCount() {
        let count = 0;
        for (const subscribers of this._subscribers.values()) {
            count += subscribers.size;
        }
        return count;
    },

    // ============ 私有方法 ============

    /**
     * 获取初始状态
     */
    _getInitialState() {
        return {
            currentMarket: 'gold',
            favorites: [],
            alerts: [],
            autoRefresh: true,
            refreshInterval: 300,
            isLoading: false,
            lastUpdate: null,
            error: null,
            prices: {
                gold: { usd: null, cny: null },
                stocks: {}
            },
            settings: {
                currency: 'USD',
                language: 'zh-CN',
                theme: 'dark'
            }
        };
    },

    /**
     * 通知订阅者
     */
    _notify(key, newValue, oldValue) {
        // 通知特定键的订阅者
        const specificSubscribers = this._subscribers.get(key);
        if (specificSubscribers) {
            specificSubscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (e) {
                    console.error('Store subscriber error:', e);
                }
            });
        }
        
        // 通知通配符订阅者
        const wildcardSubscribers = this._subscribers.get('*');
        if (wildcardSubscribers) {
            wildcardSubscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (e) {
                    console.error('Store wildcard subscriber error:', e);
                }
            });
        }
        
        // 通知父路径订阅者
        const keyParts = key.split('.');
        for (let i = 1; i < keyParts.length; i++) {
            const parentKey = keyParts.slice(0, i).join('.');
            const parentSubscribers = this._subscribers.get(parentKey);
            if (parentSubscribers) {
                const parentValue = this.get(parentKey);
                parentSubscribers.forEach(callback => {
                    try {
                        callback(parentValue, null, parentKey);
                    } catch (e) {
                        console.error('Store parent subscriber error:', e);
                    }
                });
            }
        }
    },

    /**
     * 从 localStorage 加载状态
     */
    _loadFromStorage() {
        try {
            const stored = localStorage.getItem(this._storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // 只恢复特定字段
                const persistKeys = ['favorites', 'alerts', 'autoRefresh', 'refreshInterval', 'settings'];
                persistKeys.forEach(key => {
                    if (parsed[key] !== undefined) {
                        this.state[key] = parsed[key];
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to load store from localStorage:', e);
        }
    },

    /**
     * 保存状态到 localStorage
     */
    _saveToStorage() {
        try {
            const toSave = {
                favorites: this.state.favorites,
                alerts: this.state.alerts,
                autoRefresh: this.state.autoRefresh,
                refreshInterval: this.state.refreshInterval,
                settings: this.state.settings
            };
            localStorage.setItem(this._storageKey, JSON.stringify(toSave));
        } catch (e) {
            console.warn('Failed to save store to localStorage:', e);
        }
    },

    /**
     * 深克隆
     */
    _deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * 生成唯一ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
};

// 自动初始化
if (typeof window !== 'undefined') {
    Store.init();
    window.Store = Store;
}

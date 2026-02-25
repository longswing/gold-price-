/**
 * Utils - 工具函数库
 * 提供价格格式化、时间格式化、变化格式化等通用工具函数
 */

const Utils = {
    /**
     * 格式化价格显示
     * @param {number} price - 价格数值
     * @param {string} currency - 货币类型 (USD/CNY/HKD/EUR/GBP)
     * @returns {string} 格式化后的价格字符串
     */
    formatPrice(price, currency = 'USD') {
        if (price === undefined || price === null || isNaN(price)) {
            return '--';
        }
        
        const symbols = {
            USD: '$',
            CNY: '¥',
            HKD: 'HK$',
            EUR: '€',
            GBP: '£',
            JPY: '¥'
        };
        
        const symbol = symbols[currency] || symbols.USD;
        
        // 根据价格大小调整小数位
        let fractionDigits = 2;
        if (price >= 10000) {
            fractionDigits = 0;
        } else if (price >= 1000) {
            fractionDigits = 1;
        }
        
        return symbol + price.toLocaleString('en-US', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        });
    },

    /**
     * 格式化人民币价格（每克）
     * @param {number} price - 价格数值
     * @returns {string} 格式化后的价格字符串
     */
    formatCNYPrice(price) {
        if (price === undefined || price === null || isNaN(price)) {
            return '--';
        }
        return '¥' + price.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    /**
     * 格式化涨跌幅
     * @param {number} change - 涨跌数值
     * @param {number} changePercent - 涨跌百分比
     * @returns {Object} 包含文本和CSS类的对象
     */
    formatChange(change, changePercent) {
        const isUp = change >= 0;
        const arrow = isUp ? '▲' : '▼';
        const sign = isUp ? '+' : '';
        
        const changeValue = change !== undefined ? Math.abs(change).toFixed(2) : '--';
        const percentValue = changePercent !== undefined ? changePercent.toFixed(2) : '--';
        
        return {
            text: `${arrow} ${changeValue} (${sign}${percentValue}%)`,
            html: `<span>${arrow} ${changeValue}</span><span>(${sign}${percentValue}%)</span>`,
            class: isUp ? 'up' : 'down',
            isUp: isUp,
            arrow: arrow,
            sign: sign,
            changeValue: changeValue,
            percentValue: percentValue
        };
    },

    /**
     * 格式化时间
     * @param {Date|string|number} date - 日期对象、ISO字符串或时间戳
     * @param {string} format - 格式类型: 'time' | 'datetime' | 'date' | 'relative'
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(date, format = 'time') {
        const d = date instanceof Date ? date : new Date(date);
        
        if (isNaN(d.getTime())) {
            return '--';
        }
        
        switch (format) {
            case 'time':
                return d.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            
            case 'datetime':
                return d.toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            
            case 'date':
                return d.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            
            case 'short':
                return d.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            
            case 'relative':
                return this.getRelativeTime(d);
            
            default:
                return d.toLocaleString('zh-CN');
        }
    },

    /**
     * 获取相对时间（如：5分钟前）
     * @param {Date|string} date - 日期
     * @returns {string} 相对时间字符串
     */
    getRelativeTime(date) {
        const d = date instanceof Date ? date : new Date(date);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000);
        
        if (diff < 60) return '刚刚';
        if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
        
        return this.formatTime(d, 'date');
    },

    /**
     * 格式化倒计时
     * @param {number} seconds - 剩余秒数
     * @returns {string} 格式化后的倒计时字符串 (MM:SS)
     */
    formatCountdown(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * 格式化数量（大数字简化）
     * @param {number} num - 数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (num >= 100000000) {
            return (num / 100000000).toFixed(2) + '亿';
        }
        if (num >= 10000) {
            return (num / 10000).toFixed(2) + '万';
        }
        return num.toLocaleString();
    },

    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 要执行的函数
     * @param {number} limit - 限制时间（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 数字动画
     * @param {HTMLElement} element - 目标元素
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} duration - 动画时长（毫秒）
     * @param {Function} formatter - 格式化函数
     */
    animateNumber(element, start, end, duration = 1000, formatter = null) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // 使用 easeOutCubic 缓动函数
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const current = start + (end - start) * easeProgress;
            element.textContent = formatter ? formatter(current) : current.toFixed(2);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    },

    /**
     * 深克隆对象
     * @param {Object} obj - 要克隆的对象
     * @returns {Object} 克隆后的对象
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 安全解析JSON
     * @param {string} str - JSON字符串
     * @param {*} defaultValue - 解析失败时的默认值
     * @returns {*} 解析结果
     */
    safeJSONParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return defaultValue;
        }
    },

    /**
     * 截断文本
     * @param {string} text - 原文本
     * @param {number} maxLength - 最大长度
     * @returns {string} 截断后的文本
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * 等待指定时间
     * @param {number} ms - 毫秒数
     * @returns {Promise} Promise对象
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 转换为每克价格（黄金专用）
     * @param {number} pricePerOunce - 每盎司价格
     * @param {number} exchangeRate - 汇率（可选）
     * @returns {number} 每克价格
     */
    convertToPerGram(pricePerOunce, exchangeRate = 1) {
        const GRAMS_PER_OUNCE = 31.1035;
        return (pricePerOunce / GRAMS_PER_OUNCE) * exchangeRate;
    }
};

// 导出到全局
window.Utils = Utils;

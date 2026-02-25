/**
 * GoldPulse 安全工具库
 * 提供密码哈希、XSS防护、会话管理等安全功能
 */

const SecurityUtils = {
    /**
     * 使用SHA-256对密码进行哈希（带盐）
     * @param {string} password - 原始密码
     * @param {string} salt - 盐值
     * @returns {Promise<string>} - 哈希后的密码
     */
    async hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },
    
    /**
     * 生成随机盐值
     * @returns {string} - 16字节盐值（hex）
     */
    generateSalt() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },
    
    /**
     * XSS防护 - 转义HTML特殊字符
     * @param {string} text - 原始文本
     * @returns {string} - 转义后的文本
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * 净化HTML内容（简单版）
     * 移除script标签和危险属性
     * @param {string} html - 原始HTML
     * @returns {string} - 净化后的HTML
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') return '';
        return html
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<script\s*\/?>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    },
    
    /**
     * 生成会话令牌
     * @returns {string} - 随机会话令牌
     */
    generateSessionToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },
    
    /**
     * 创建安全的会话对象
     * @param {Object} user - 用户信息
     * @param {number} expiresInHours - 过期时间（小时）
     * @returns {Object} - 会话对象
     */
    createSession(user, expiresInHours = 2) {
        const now = new Date();
        return {
            token: this.generateSessionToken(),
            name: user.name,
            email: user.email,
            createdAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString()
        };
    },
    
    /**
     * 验证会话是否有效
     * @param {Object} session - 会话对象
     * @returns {boolean} - 是否有效
     */
    isSessionValid(session) {
        if (!session || !session.expiresAt) return false;
        return new Date(session.expiresAt) > new Date();
    },
    
    /**
     * 安全的localStorage封装
     */
    storage: {
        /**
         * 安全设置（添加前缀）
         * @param {string} key - 键名
         * @param {any} value - 值
         */
        set(key, value) {
            try {
                localStorage.setItem(`gp_${key}`, JSON.stringify(value));
            } catch (e) {
                console.error('Storage error:', e);
            }
        },
        
        /**
         * 安全获取
         * @param {string} key - 键名
         * @returns {any} - 值
         */
        get(key) {
            try {
                const item = localStorage.getItem(`gp_${key}`);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Storage error:', e);
                return null;
            }
        },
        
        /**
         * 删除
         * @param {string} key - 键名
         */
        remove(key) {
            localStorage.removeItem(`gp_${key}`);
        },
        
        /**
         * 清除所有GoldPulse数据
         */
        clear() {
            Object.keys(localStorage)
                .filter(key => key.startsWith('gp_'))
                .forEach(key => localStorage.removeItem(key));
        }
    }
};

// 导出到全局
window.SecurityUtils = SecurityUtils;

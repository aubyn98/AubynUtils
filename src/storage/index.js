/**
 * 工业级 Web 存储工具类（兼容原有 API）
 * 特性：容量容错、类型校验、轻量化续期、环境解耦、可配置日志、LRU兜底、特殊值序列化
 */
export class Storage {
  /**
   * @param {Object} config 配置项
   * @param {string} config.type 存储类型：localStorage/sessionStorage
   * @param {string} [config.prefix=''] 键前缀
   * @param {number} [config.expire=0] 默认过期时间（秒），0=永不过期
   * @param {boolean} [config.silent=false] 是否静默日志（生产环境建议开启）
   * @param {Storage} [config.storageInstance] 自定义存储实例（用于测试/mock）
   */
  constructor({ type, prefix = '', expire = 0, silent = false, storageInstance } = {}) {
    // 基础配置校验 + 环境解耦
    if (!type && !storageInstance) throw new Error('[Storage] type or storageInstance is required');
    this.storage = storageInstance || window?.[type];

    // 存储实例有效性强校验
    if (!this.storage || typeof this.storage.setItem !== 'function') {
      throw new Error(`[Storage] Invalid storage type: ${type || 'undefined'}`);
    }

    // 核心属性初始化（精简赋值）
    this.prefix = prefix;
    this.defaultExpire = Math.max(Number(expire) || 0, 0);
    this.prefixStr = prefix ? `${prefix}_` : '';
    this.silent = silent;
  }

  // 私有方法：统一日志输出（简化参数+短路运算）
  #log(level, msg, err) {
    this.silent || console[level](`[Storage] ${msg}`, err || '');
  }

  // 私有方法：校验key类型（抽离重复逻辑）
  #validateKey(key) {
    if (typeof key !== 'string') {
      this.#log('warn', `Invalid key type: ${typeof key} (expected string)`);
      return false;
    }
    return true;
  }

  // 私有方法：安全JSON序列化（兼容undefined/Symbol等特殊值）
  #safeStringify(data) {
    return JSON.stringify(data, (_, val) => {
      if (val === undefined) return null;
      if (typeof val === 'symbol') return val.toString();
      return val;
    });
  }

  // 私有方法：轻量化续期（精简命名+逻辑）
  #refreshItem(key, value, expire, renewal) {
    try {
      this.storage.setItem(this.addPrefix(key), this.#safeStringify({ value, time: Date.now(), expire, renewal }));
    } catch (err) {
      this.#log('error', `Renew item failed: ${key}`, err);
    }
  }

  // 私有方法：LRU兜底 - 批量删除过期数据并重试（性能优化）
  #trySetWithLRU(key, dataStr) {
    try {
      // 批量收集过期key，减少DOM操作次数
      const expiredKeys = [];
      Array.from({ length: this.storage.length }, (_, i) => this.storage.key(i))
        .filter(key => typeof key === 'string')
        .forEach(key => {
          try {
            const data = JSON.parse(this.storage.getItem(key));
            if (data?.expire > 0 && Date.now() - data.time > data.expire) {
              expiredKeys.push(key);
            }
          } catch (_) {}
        });

      // 批量删除过期数据
      expiredKeys.forEach(k => this.storage.removeItem(k));
      // 重试存储
      this.storage.setItem(key, dataStr);
    } catch (err) {
      throw new Error('[Storage] Storage full (even after cleaning expired data)');
    }
  }

  setItem(key, val, { expire = 0, renewal = false } = {}) {
    // 复用key校验逻辑
    if (!this.#validateKey(key)) throw new Error('key must be a string');

    // 简化层级：合并try/catch
    const value = val == null || val === '' ? null : val;
    const expireNum = Number(expire);

    if (isNaN(expireNum) || expireNum < 0) {
      throw new Error('Expire must be a non-negative number');
    }

    const finalExpire = (expireNum || this.defaultExpire) * 1000;
    const dataStr = this.#safeStringify({
      value,
      time: Date.now(),
      expire: finalExpire,
      renewal
    });
    const fullKey = this.addPrefix(key);

    try {
      this.storage.setItem(fullKey, dataStr);
    } catch (storageErr) {
      if (storageErr.name === 'QuotaExceededError') {
        this.#log('warn', `Storage full, cleaning expired data: ${key}`);
        this.#trySetWithLRU(fullKey, dataStr); // LRU兜底重试
      } else {
        this.#log('error', `Set item failed: ${key}`, storageErr);
        throw storageErr;
      }
    }
  }

  getItem(key, defaultVal = null) {
    // 复用key校验逻辑
    if (!this.#validateKey(key)) return defaultVal;

    try {
      const fullKey = this.addPrefix(key);
      const rawData = this.storage.getItem(fullKey);

      if (rawData === null) return defaultVal;

      let storageData;
      try {
        storageData = JSON.parse(rawData);
      } catch (err) {
        this.#log('warn', `Parse item failed: ${key}`, err);
        this.removeItem(key);
        return defaultVal;
      }

      const now = Date.now();
      const isExpired = storageData.expire > 0 && now - storageData.time > storageData.expire;

      if (isExpired) {
        this.removeItem(key);
        return defaultVal;
      }

      // 轻量化续期（短路运算简化）
      storageData.expire > 0 && storageData.renewal && this.#refreshItem(key, storageData.value, storageData.expire, storageData.renewal);

      return storageData.value ?? defaultVal;
    } catch (err) {
      this.#log('error', `Get item failed: ${key}`, err);
      return defaultVal;
    }
  }

  setItem_simple(key, val) {
    if (!this.#validateKey(key)) throw new Error('key must be a string');
    try {
      return this.storage.setItem(key, this.#safeStringify(val));
    } catch (err) {
      this.#log('error', `Set simple item failed: ${key}`, err);
      throw err;
    }
  }

  getItem_simple(key, defaultVal) {
    if (!this.#validateKey(key)) return defaultVal;
    try {
      const val = this.storage.getItem(key);
      return val === null ? defaultVal : JSON.parse(val);
    } catch (err) {
      this.#log('error', `Get simple item failed: ${key}`, err);
      return defaultVal;
    }
  }

  removeItem_simple(key) {
    if (!this.#validateKey(key)) throw new Error('key must be a string');
    try {
      this.storage.removeItem(key);
    } catch (err) {
      this.#log('error', `Remove simple item failed: ${key}`, err);
      throw err;
    }
  }

  removeItem(key) {
    if (!this.#validateKey(key)) throw new Error('key must be a string');
    try {
      this.storage.removeItem(this.addPrefix(key));
    } catch (err) {
      this.#log('error', `Remove item failed: ${key}`, err);
      throw err;
    }
  }

  addPrefix(key) {
    return this.#validateKey(key) ? this.prefixStr + key : key;
  }

  removePrefix(key) {
    return this.#validateKey(key) && key.startsWith(this.prefixStr) ? key.slice(this.prefixStr.length) : key;
  }

  clear() {
    try {
      this.storage.clear();
    } catch (err) {
      this.#log('error', 'Clear storage failed', err);
      throw err;
    }
  }

  getKeys() {
    try {
      return Array.from({ length: this.storage.length }, (_, i) => this.storage.key(i))
        .filter(key => this.#validateKey(key) && key.startsWith(this.prefixStr))
        .map(key => this.removePrefix(key));
    } catch (err) {
      this.#log('error', 'Get keys failed', err);
      return [];
    }
  }

  removeItems(keys) {
    if (!Array.isArray(keys)) {
      this.#log('error', 'Remove items failed: keys must be array');
      throw new Error('[Storage] keys must be an array');
    }
    keys.forEach(key => this.removeItem(key));
  }

  hasItem(key) {
    if (!this.#validateKey(key)) return false;
    try {
      return this.storage.getItem(this.addPrefix(key)) !== null;
    } catch (err) {
      this.#log('error', `Check item exist failed: ${key}`, err);
      return false;
    }
  }

  hasItem_simple(key) {
    if (!this.#validateKey(key)) return false;
    try {
      return this.storage.getItem(key) !== null;
    } catch (err) {
      this.#log('error', `Check simple item exist failed: ${key}`, err);
      return false;
    }
  }
}

// 生产环境静默日志（兼容Webpack/Vite/纯浏览器环境）
const isProd = (() => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return true;
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production') return true;
  return false;
})();

export const local = new Storage({ type: 'localStorage', silent: isProd });
export const session = new Storage({ type: 'sessionStorage', silent: isProd });

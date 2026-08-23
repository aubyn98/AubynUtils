/**
 * 工业级 Web 存储工具类
 * setItem / getItem：带过期时间包装存储，支持 renewItem 续期（惰性过期）
 * setItem_simple / getItem_simple：原始JSON永久存储，无过期、不可续期
 * ✅ 内部自动隔离两套API存储key，代码层面杜绝同名key冲突
 * ✅ 新增 namespace version 版本控制，版本不匹配自动丢弃旧存储数据
 * ⚠️ 过期为惰性机制；gc() 仅清理 setItem 创建的过期缓存，不会影响 simple 存储
 * ⚠️ gc() 不会清理 simple 系列版本不匹配数据，simple版本校验仅在读取/hasItem_simple/clearNamespaceByVersion触发
 * ⚠️ localStorage 容量约5MB，禁止存储超大对象、二进制、敏感明文密钥
 * ⚠️ localStorage 易受XSS攻击，账号凭证优先使用 HttpOnly Cookie
 * ⚠️ BREAKING‑CHANGE：v2+ setItem_simple 内部改为 {value,version} 包装；历史simple裸数据会被丢弃
 */
export class Storage {
  constructor({
    type,
    prefix = '',
    expire = 0,
    silent = false,
    storageInstance,
    autoGcOnQuota = true,
    version = ''
  } = {}) {
    // 非浏览器环境初始化，补全全部实例字段
    if (typeof window === 'undefined') {
      this.storage = null;
      this.silent = silent;
      this.prefix = prefix;
      this.defaultExpire = Math.max(Number(expire) || 0, 0);
      this.prefixStr = prefix ? `${prefix}#` : '';
      this.autoGcOnQuota = !!autoGcOnQuota;
      this.version = String(version ?? '');
      this._CACHE_TAG = 'CACHE:';
      this._SIMPLE_TAG = 'SIMPLE:';
      console.warn('[Storage] Running in non‑browser environment, storage unavailable');
      return;
    }

    if (!type && !storageInstance) {
      throw new Error('[Storage] type or storageInstance is required');
    }
    this.storage = storageInstance || window?.[type];
    if (!this.storage || typeof this.storage.setItem !== 'function') {
      throw new Error(`[Storage] Invalid storage type: ${type || 'undefined'}`);
    }
    this.prefix = prefix;
    this.defaultExpire = Math.max(Number(expire) || 0, 0);
    this.prefixStr = prefix ? `${prefix}#` : '';
    this.silent = silent;
    this.autoGcOnQuota = !!autoGcOnQuota;
    this.version = String(version ?? '');

    // 内置类型分隔标记（隔离两套存储结构，请勿修改）
    this._CACHE_TAG = 'CACHE:';
    this._SIMPLE_TAG = 'SIMPLE:';
  }

  // ==================== 私有工具方法 ====================
  #log(level, msg, err) {
    if (this.silent) {
      // 生产环境：错误日志强制保留，普通日志静默
      if (level !== 'error') return;
    }
    if (err) console[level](`[Storage] ${msg}`, err);
    else console[level](`[Storage] ${msg}`);
  }

  #validateKey(key) {
    if (typeof key !== 'string') {
      this.#log('warn', `Invalid key type: ${typeof key} (expected string)`);
      return false;
    }
    return true;
  }

  #safeStringify(data) {
    try {
      return JSON.stringify(data, (_, val) => {
        if (typeof val === 'symbol') return val.toString();
        if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
        if (typeof val === 'bigint') return val.toString();
        return val;
      });
    } catch (err) {
      this.#log('error', 'JSON stringify failed', err);
      throw err;
    }
  }

  /**
   * @param {string} str
   * @param {*} defaultVal
   * @param {boolean} returnRawOnError 是否解析失败返回原始字符串
   */
  #safeParse(str, defaultVal = null, returnRawOnError = false) {
    try {
      return JSON.parse(str);
    } catch (err) {
      this.#log('warn', `JSON parse error, raw string: ${str.slice(0, 120)}`);
      return returnRawOnError ? str : defaultVal;
    }
  }

  /** 写入带过期缓存原始方法（加入版本元数据） */
  #refreshItem(key, value, expireMs) {
    const fullKey = this.addCachePrefix(key);
    const dataStr = this.#safeStringify({
      value,
      time: Date.now(),
      expire: expireMs,
      version: this.version
    });
    this.storage.setItem(fullKey, dataStr);
  }

  /** 获取【带过期缓存】数据，惰性删除过期/版本不匹配项（仅给 setItem 体系使用） */
  #getCacheStorageData(key) {
    if (!this.#validateKey(key) || !this.storage) return null;

    try {
      const fullKey = this.addCachePrefix(key);
      const rawData = this.storage.getItem(fullKey);
      if (rawData === null) return null;

      const data = this.#safeParse(rawData, null);

      if (!data || typeof data !== 'object' || !('value' in data) || !('time' in data) || !('expire' in data)) {
        this.removeItem(key);
        return null;
      }

      const now = Date.now();
      const expire = Number(data.expire);
      const time = Number(data.time);
      // 版本校验：实例version非空，且存储内version与实例不一致 → 废弃
      if (this.version !== '' && data.version !== this.version) {
        this.#log('log', `Cache key ${key} version mismatch, drop old data. storageVer=${data.version}, instanceVer=${this.version}`);
        this.removeItem(key);
        return null;
      }

      // expire === 0 永不过期
      if (expire > 0 && now - time > expire) {
        this.removeItem(key);
        return null;
      }

      return {
        value: data.value,
        time,
        expire
      };
    } catch (err) {
      this.#log('error', `Get cache data failed: ${key}`, err);
      return null;
    }
  }

  // ==================== 前缀工具（已隔离两套存储） ====================
  /** 带过期缓存key完整前缀 */
  addCachePrefix(key) {
    if (!this.#validateKey(key)) return key;
    return this.prefixStr + this._CACHE_TAG + key;
  }

  /* simple永久存储key完整前缀 */
  addSimplePrefix(key) {
    if (!this.#validateKey(key)) return key;
    return this.prefixStr + this._SIMPLE_TAG + key;
  }

  removePrefix(rawFullKey) {
    if (!this.#validateKey(rawFullKey)) return rawFullKey;
    let innerKey = rawFullKey;
    // 剥离外层命名空间
    if (rawFullKey.startsWith(this.prefixStr)) {
      innerKey = rawFullKey.slice(this.prefixStr.length);
    }
    // 剥离内部类型标记
    if (innerKey.startsWith(this._CACHE_TAG)) {
      return innerKey.slice(this._CACHE_TAG.length);
    }
    if (innerKey.startsWith(this._SIMPLE_TAG)) {
      return innerKey.slice(this._SIMPLE_TAG.length);
    }
    return innerKey;
  }

  // ==================== 公共基础API（支持过期/续期 setItem 系列） ====================
  /**
   * 设置带过期缓存
   * @param {string} key
   * @param {*} val
   * @param {{expire?:number}} options expire单位：秒；0代表永不过期
   * @returns {Storage} this
   */
  setItem(key, val, { expire = 0 } = {}) {
    if (!this.#validateKey(key)) throw new Error('[Storage] key must be a string');
    if (!this.storage) {
      this.#log('warn', 'storage unavailable, skip setItem');
      return this;
    }

    const value = val === undefined || val === null ? null : val;
    const expireNum = Number(expire);

    if (isNaN(expireNum) || expireNum < 0) {
      throw new Error('[Storage] expire must be a non‑negative number (unit: second)');
    }

    const finalExpire = (expireNum || this.defaultExpire) * 1000;
    const fullKey = this.addCachePrefix(key);
    const dataStr = this.#safeStringify({
      value,
      time: Date.now(),
      expire: finalExpire,
      version: this.version
    });

    try {
      this.storage.setItem(fullKey, dataStr);
    } catch (storageErr) {
      if (storageErr.name === 'QuotaExceededError') {
        this.#log('warn', `Storage quota exceeded when set key: ${key}`);
        // 溢出后自动GC重试一次
        if (this.autoGcOnQuota) {
          const cleared = this.gc();
          this.#log('log', `Auto GC cleared ${cleared} expired keys, retry write ${key}`);
          try {
            this.storage.setItem(fullKey, dataStr);
            return this;
          } catch (retryErr) {
            this.#log('error', `Retry set item still quota full: ${key}`, retryErr);
            throw retryErr;
          }
        }
      } else {
        this.#log('error', `Set item failed: ${key}`, storageErr);
      }
      throw storageErr;
    }

    return this;
  }

  getItem(key, defaultVal = null) {
    if (!this.#validateKey(key) || !this.storage) return defaultVal;
    const data = this.#getCacheStorageData(key);
    return data ? data.value : defaultVal;
  }

  /**
   * 续期缓存
   * @param {string} key
   * @param {number} [newExpire] 新过期时间(秒)，不传则沿用原有过期时长
   * @returns {boolean} 是否续期成功
   */
  renewItem(key, newExpire) {
    if (!this.#validateKey(key) || !this.storage) return false;

    const data = this.#getCacheStorageData(key);
    if (!data) return false;

    let targetExpireMs;
    if (newExpire !== undefined) {
      const num = Number(newExpire);
      if (isNaN(num) || num < 0) return false;
      targetExpireMs = num * 1000;
    } else {
      targetExpireMs = data.expire;
    }

    try {
      this.#refreshItem(key, data.value, targetExpireMs);
      return true;
    } catch (err) {
      this.#log('error', `Renew item failed: ${key}`, err);
      return false;
    }
  }

  hasItem(key) {
    if (!this.#validateKey(key) || !this.storage) return false;
    return this.#getCacheStorageData(key) !== null;
  }

  removeItem(key) {
    if (!this.#validateKey(key)) throw new Error('[Storage] key must be a string');
    if (!this.storage) return this;
    try {
      this.storage.removeItem(this.addCachePrefix(key));
    } catch (err) {
      this.#log('error', `Remove item failed: ${key}`, err);
      throw err;
    }
    return this;
  }

  removeItems(keys) {
    if (!Array.isArray(keys)) throw new Error('[Storage] keys must be an array');
    keys.forEach(key => {
      try {
        this.removeItem(key);
      } catch (e) {
        this.#log('warn', `removeItems skip failed key:${key}`, e);
      }
    });
    return this;
  }

  getKeys() {
    if (!this.storage) return [];
    try {
      const prefixFilter = this.prefixStr + this._CACHE_TAG;
      return Object.keys(this.storage)
        .filter(key => typeof key === 'string' && key.startsWith(prefixFilter))
        .map(key => this.removePrefix(key));
    } catch (err) {
      this.#log('error', 'Get keys failed', err);
      return [];
    }
  }

  /**
   * 【仅清理带过期缓存】原 clear() 重命名，避免歧义
   * ⚠️ 不会清理 setItem_simple 永久存储
   */
  clearCache() {
    if (!this.storage) return this;
    try {
      const keys = this.getKeys();
      keys.forEach(key => {
        try {
          this.removeItem(key);
        } catch (e) {
          this.#log('warn', `fail to remove key ${key} when clearCache`, e);
        }
      });
      this.#log('log', `clearCache finished, removed ${keys.length} cache keys in namespace "${this.prefix || 'default'}"`);
    } catch (err) {
      this.#log('error', 'clearCache failed', err);
      throw err;
    }
    return this;
  }

  /**
   * GC垃圾回收：仅清理当前命名空间下 setItem 创建的过期、版本不匹配缓存
   * ⚠️ 惰性过期补充手段；getItem访问过期key也会自动删除
   * ⚠️ **不会处理 simple 系列数据**，simple版本不匹配仅在读API/clearNamespaceByVersion时清理
   * @returns {number} 本次清理过期/版本失效cache key数量
   */
  gc() {
    if (!this.storage) return 0;
    const keys = this.getKeys();
    let clearCount = 0;
    keys.forEach(key => {
      // #getCacheStorageData 内部检测过期/版本会自动删除
      const record = this.#getCacheStorageData(key);
      if (record === null) clearCount++;
    });
    this.#log('log', `GC finished, cleaned expired cache keys: ${clearCount}`);
    return clearCount;
  }

  // ==================== Simple系列API（纯JSON永久存储，无过期，增加版本校验） ====================
  setItem_simple(key, val) {
    if (!this.#validateKey(key)) throw new Error('[Storage] key must be a string');
    if (!this.storage) {
      this.#log('warn', 'storage unavailable, skip setItem_simple');
      return this;
    }
    try {
      const value = val === undefined ? null : val;
      const fullKey = this.addSimplePrefix(key);
      const storeData = {
        value,
        version: this.version
      };
      this.storage.setItem(fullKey, this.#safeStringify(storeData));
    } catch (storageErr) {
      if (storageErr.name === 'QuotaExceededError') {
        this.#log('error', `Storage quota exceeded, set simple key: ${key}`);
      } else {
        this.#log('error', `Set simple item failed: ${key}`, storageErr);
      }
      throw storageErr;
    }
    return this;
  }

  getItem_simple(key, defaultVal = null) {
    if (!this.#validateKey(key) || !this.storage) return defaultVal;
    try {
      const fullKey = this.addSimplePrefix(key);
      const raw = this.storage.getItem(fullKey);
      if (raw === null) return defaultVal;
      const parsed = this.#safeParse(raw, null, false);
      // 版本校验
      if (this.version !== '' && parsed?.version !== this.version) {
        this.#log('log', `Simple key ${key} version mismatch, drop old data. storageVer=${parsed?.version}, instanceVer=${this.version}`);
        this.removeItem_simple(key);
        return defaultVal;
      }
      if (parsed && 'value' in parsed) {
        return parsed.value;
      }
      // 旧无version原始裸结构直接丢弃（breaking‑change）
      this.removeItem_simple(key);
      return defaultVal;
    } catch (err) {
      this.#log('error', `Get simple item failed: ${key}`, err);
      return defaultVal;
    }
  }

  hasItem_simple(key) {
    if (!this.#validateKey(key) || !this.storage) return false;
    try {
      const fullKey = this.addSimplePrefix(key);
      const raw = this.storage.getItem(fullKey);
      if (raw === null) return false;
      const parsed = this.#safeParse(raw, null);
      if (this.version !== '' && parsed?.version !== this.version) {
        this.removeItem_simple(key);
        return false;
      }
      return !!parsed && 'value' in parsed;
    } catch (err) {
      this.#log('error', `Check simple item exist failed: ${key}`, err);
      return false;
    }
  }

  removeItem_simple(key) {
    if (!this.#validateKey(key)) throw new Error('[Storage] key must be a string');
    if (!this.storage) return this;
    try {
      const fullKey = this.addSimplePrefix(key);
      this.storage.removeItem(fullKey);
    } catch (err) {
      this.#log('error', `Remove simple item failed: ${key}`, err);
      throw err;
    }
    return this;
  }

  removeItems_simple(keys) {
    if (!Array.isArray(keys)) throw new Error('[Storage] keys must be an array');
    keys.forEach(key => {
      try {
        this.removeItem_simple(key);
      } catch (e) {
        this.#log('warn', `removeItems_simple skip failed key:${key}`, e);
      }
    });
    return this;
  }

  getKeys_simple() {
    if (!this.storage) return [];
    try {
      const prefixFilter = this.prefixStr + this._SIMPLE_TAG;
      return Object.keys(this.storage)
        .filter(key => typeof key === 'string' && key.startsWith(prefixFilter))
        .map(key => this.removePrefix(key));
    } catch (err) {
      this.#log('error', 'Get simple keys failed', err);
      return [];
    }
  }

  /**
   * 清理当前命名空间下所有 simple 永久存储数据
   */
  clearSimple() {
    if (!this.storage) return this;
    try {
      const keys = this.getKeys_simple();
      keys.forEach(key => {
        try {
          this.removeItem_simple(key);
        } catch (e) {
          this.#log('warn', `fail to remove simple key ${key} when clearSimple`, e);
        }
      });
      this.#log('log', `clearSimple finished, removed ${keys.length} simple keys in namespace "${this.prefix || 'default'}"`);
    } catch (err) {
      this.#log('error', 'clearSimple failed', err);
      throw err;
    }
    return this;
  }

  /**
   * 【推荐】清空当前命名空间下：cache缓存 + simple永久存储 全部数据
   */
  clearNamespaceAll() {
    this.clearCache();
    this.clearSimple();
    return this;
  }

  /**
   * ⚠️【高危方法】
   * 直接调用原生 storage.clear()，清空当前域名下全部 localStorage/sessionStorage
   * 不受当前实例prefix命名空间限制，业务代码尽量禁止使用！优先使用 .clearNamespaceAll()
   */
  dangerouslyClearAllOriginStorage() {
    if (!this.storage) return this;
    try {
      this.storage.clear();
      this.#log('warn', '!!!! DANGER: Cleared ALL origin storage data of domain !!!!');
    } catch (err) {
      this.#log('error', 'Clear all storage failed', err);
      throw err;
    }
    return this;
  }

  /**
   * 清理当前命名空间下版本**不等于实例version**的旧缓存+simple数据
   * @returns {number} 逻辑判定失效key总数；注意：不等于实际物理删除计数（部分key可能已经提前被惰性删除）
   */
  clearNamespaceByVersion() {
    if (!this.storage) return 0;
    let removeCount = 0;
    // cache 类型
    const cacheKeys = this.getKeys();
    cacheKeys.forEach(k => {
      const res = this.#getCacheStorageData(k);
      if (res === null) removeCount++;
    });
    // simple 类型
    const simpleKeys = this.getKeys_simple();
    simpleKeys.forEach(k => {
      if (!this.hasItem_simple(k)) removeCount++;
    });
    this.#log('log', `clearNamespaceByVersion done, removed ${removeCount} version‑mismatch keys, targetVer=${this.version}`);
    return removeCount;
  }

  getStorageInfo() {
    if (!this.storage) {
      return {
        available: false,
        totalKeys: 0,
        namespaceKeys: 0,
        estimatedSize: '0 KB',
        namespace: this.prefix || 'default',
        version: this.version
      };
    }
    try {
      const allKeys = Object.keys(this.storage).filter(key => typeof key === 'string');
      const namespaceKeys = allKeys.filter(key => key.startsWith(this.prefixStr));
      let totalSize = 0;
      for (const key of allKeys) {
        const val = this.storage.getItem(key);
        if (val !== null) totalSize += key.length + val.length;
      }
      return {
        available: true,
        totalKeys: allKeys.length,
        namespaceKeys: namespaceKeys.length,
        estimatedSize: `${(totalSize / 1024).toFixed(2)} KB (char count, rough estimate)`,
        namespace: this.prefix || 'default',
        version: this.version
      };
    } catch (err) {
      this.#log('error', 'Get storage info failed', err);
      return {
        available: false,
        totalKeys: 0,
        namespaceKeys: 0,
        estimatedSize: '0 KB',
        namespace: this.prefix || 'default',
        version: this.version
      };
    }
  }
}

// ==================== 全局默认实例 ====================
const isProd = (() => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production') return true;
  } catch { /* ignore */ }
  try {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return true;
  } catch { /* ignore */ }
  return false;
})();

export const local = new Storage({
  type: 'localStorage',
  silent: isProd,
  version: ''
});

export const session = new Storage({
  type: 'sessionStorage',
  silent: isProd,
  version: ''
});

export function createStorage(config) {
  return new Storage(config);
}

export default Storage;

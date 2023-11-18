export class Storage {
  constructor(config) {
    this.storage = window[config.type]; // 存储类型 localStorage、sessionStorage
    this.prefix = config.prefix; // 名称前缀 建议：项目名 + 项目版本
    this.expire = config.expire || 0; // 过期时间 单位：秒
    // this.isEncrypt = config.isEncrypt // 默认加密 为了调试方便, 开发过程中可以不加密
  }
  setItem(key, val, { expire = 0, renewal = false } = {}) {
    if (val === '' || val === null || val === undefined) val = null;
    if (isNaN(expire) || expire < 0) throw new Error('Expire must be a number');
    expire = (expire || this.expire) * 1000;
    const data = {
      value: val, // 存储值
      time: Date.now(), // 存值时间戳
      expire, // 过期时间
      renewal
    };
    this.storage.setItem(key, JSON.stringify(data));
  }
  getItem(key, defaultVal = null) {
    const _ = this.storage;
    key = this.autoAddPrefix(key);

    // key 不存在判断
    if (_.getItem(key) === null) return defaultVal;

    const data = JSON.parse(_.getItem(key));
    const nowTime = Date.now();

    // 过期删除
    if (data.expire && data.expire < nowTime - data.time) {
      this.removeItem(key);
      return defaultVal;
    } else if (data.expire && data.renewal) {
      //  是否持续使用时会自动续期
      this.setItem(this.autoRemovePrefix(key), data.value, data.expire / 1000);
    }

    return data.value;
  }

  setItem_simple(key, val) {
    return this.storage.setItem(key, JSON.stringify(val));
  }
  getItem_simple(key) {
    const val = this.storage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  }
  removeItem_simple(key) {
    this.storage.removeItem(key);
  }

  removeItem(key) {
    this.storage.removeItem(this.autoAddPrefix(key));
  }

  // 名称前自动添加前缀
  autoAddPrefix(key) {
    const prefix = this.prefix ? this.prefix + '_' : '';
    return prefix + key;
  }

  // 移除已添加的前缀
  autoRemovePrefix(key) {
    const len = this.prefix ? this.prefix.length + 1 : '';
    return key.substr(len);
  }
}

export const local = new Storage({ type: 'localStorage' });
export const session = new Storage({ type: 'sessionStorage' });

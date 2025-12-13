/**
 * 工业级 Web 存储工具类 - TypeScript 类型声明
 * 特性：容量容错、类型校验、轻量化续期、环境解耦、可配置日志、LRU兜底、特殊值序列化
 */
declare class Storage {
  /**
   * 存储实例（localStorage/sessionStorage 或自定义 mock 实例）
   */
  private storage: Storage;
  /**
   * 键前缀
   */
  private prefix: string;
  /**
   * 默认过期时间（秒），0 表示永不过期
   */
  private defaultExpire: number;
  /**
   * 拼接后的前缀字符串（prefix + '_'）
   */
  private prefixStr: string;
  /**
   * 是否静默日志（生产环境建议开启）
   */
  private silent: boolean;

  /**
   * 构造函数
   * @param config 配置项
   */
  constructor(config?: {
    /** 存储类型：'localStorage' | 'sessionStorage' */
    type?: string;
    /** 键前缀，默认空字符串 */
    prefix?: string;
    /** 默认过期时间（秒），默认 0（永不过期） */
    expire?: number;
    /** 是否静默日志，默认 false */
    silent?: boolean;
    /** 自定义存储实例（用于测试/mock） */
    storageInstance?: Storage;
  });

  /**
   * 统一日志输出（私有方法）
   * @param level 日志级别：'log' | 'warn' | 'error'
   * @param msg 日志信息
   * @param err 错误对象（可选）
   */
  #log(level: 'log' | 'warn' | 'error', msg: string, err?: Error | string): void;

  /**
   * 校验 key 类型是否为字符串（私有方法）
   * @param key 待校验的键名
   * @returns 校验结果
   */
  #validateKey(key: unknown): key is string;

  /**
   * 安全 JSON 序列化（兼容 undefined/Symbol 等特殊值）（私有方法）
   * @param data 待序列化的数据
   * @returns 序列化后的字符串
   */
  #safeStringify(data: unknown): string;

  /**
   * 轻量化续期（私有方法）
   * @param key 键名
   * @param value 存储值
   * @param expire 过期时间（毫秒）
   * @param renewal 是否自动续期
   */
  #refreshItem(key: string, value: unknown, expire: number, renewal: boolean): void;

  /**
   * LRU 兜底 - 批量删除过期数据并重试存储（私有方法）
   * @param key 待存储的键名（带前缀）
   * @param dataStr 序列化后的存储数据
   */
  #trySetWithLRU(key: string, dataStr: string): void;

  /**
   * 带过期时间的存储设置
   * @param key 存储键名
   * @param val 存储值
   * @param options 可选配置
   * @param options.expire 过期时间（秒），默认 0
   * @param options.renewal 是否自动续期，默认 false
   * @throws {Error} key 非字符串 / 过期时间为负数时抛出错误
   */
  setItem(
    key: string,
    val: unknown,
    options?: {
      expire?: number;
      renewal?: boolean;
    }
  ): void;

  /**
   * 带过期时间的存储获取
   * @param key 存储键名
   * @param defaultVal 默认值，默认 null
   * @returns 存储值或默认值
   */
  getItem<T = unknown>(key: string, defaultVal?: T): T;

  /**
   * 简易存储设置（无过期时间、无前缀）
   * @param key 存储键名
   * @param val 存储值
   * @throws {Error} key 非字符串时抛出错误
   */
  setItem_simple(key: string, val: unknown): void;

  /**
   * 简易存储获取（无过期时间、无前缀）
   * @param key 存储键名
   * @param defaultVal 默认值
   * @returns 存储值或默认值
   */
  getItem_simple<T = unknown>(key: string, defaultVal?: T): T;

  /**
   * 移除简易存储项（无前缀）
   * @param key 存储键名
   * @throws {Error} key 非字符串时抛出错误
   */
  removeItem_simple(key: string): void;

  /**
   * 移除带前缀的存储项
   * @param key 存储键名
   * @throws {Error} key 非字符串时抛出错误
   */
  removeItem(key: string): void;

  /**
   * 给键名添加前缀
   * @param key 原始键名
   * @returns 带前缀的键名（若 key 非字符串则返回原值）
   */
  addPrefix(key: string): string;
  addPrefix(key: unknown): unknown;

  /**
   * 移除键名的前缀
   * @param key 带前缀的键名
   * @returns 原始键名（若 key 非字符串/无前缀则返回原值）
   */
  removePrefix(key: string): string;
  removePrefix(key: unknown): unknown;

  /**
   * 清空当前存储类型的所有数据
   * @throws {Error} 清空失败时抛出错误
   */
  clear(): void;

  /**
   * 获取所有带前缀的键名（原始键名，不含前缀）
   * @returns 键名数组
   */
  getKeys(): string[];

  /**
   * 批量移除带前缀的存储项
   * @param keys 键名数组
   * @throws {Error} keys 非数组时抛出错误
   */
  removeItems(keys: string[]): void;

  /**
   * 检查带前缀的键是否存在
   * @param key 存储键名
   * @returns 是否存在
   */
  hasItem(key: string): boolean;

  /**
   * 检查简易存储键是否存在（无前缀）
   * @param key 存储键名
   * @returns 是否存在
   */
  hasItem_simple(key: string): boolean;
}

/**
 * localStorage 实例
 */
declare const local: Storage;

/**
 * sessionStorage 实例
 */
declare const session: Storage;

export { Storage, local, session };
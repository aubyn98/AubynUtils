/**
 * 工业级 Web Storage 工具类型声明 v1.4.0
 */

export interface StorageConstructorOptions {
  /** localStorage / sessionStorage */
  type?: 'localStorage' | 'sessionStorage';
  /** 命名空间前缀 */
  prefix?: string;
  /** 默认过期时间 单位：秒 */
  expire?: number;
  /** 生产环境静默日志 */
  silent?: boolean;
  /** 自定义storage实例（兼容封装后的storage） */
  storageInstance?: Storage | null;
  /** 容量溢出时自动GC后重试写入 */
  autoGcOnQuota?: boolean;
}

export interface SetItemOptions {
  /** 过期时长，单位：秒；0=永不过期 */
  expire?: number;
}

export interface StorageInfo {
  available: boolean;
  totalKeys: number;
  namespaceKeys: number;
  estimatedSize: string;
  namespace: string;
}

export declare class Storage {
  constructor(options?: StorageConstructorOptions);

  /**
   * 设置【带过期缓存】
   * @param key 键名
   * @param val 存储值
   * @param options {expire:秒}
   */
  setItem<T = unknown>(key: string, val: T, options?: SetItemOptions): this;

  /**
   * 获取【带过期缓存】
   * @param key
   * @param defaultVal 取不到/过期返回默认值
   */
  getItem<T = unknown>(key: string, defaultVal?: T): T | null;

  /**
   * 续期缓存
   * @param key
   * @param newExpire 新过期时间(秒)，不传沿用原有时长
   * @returns 是否成功
   */
  renewItem(key: string, newExpire?: number): boolean;

  /** 判断带过期缓存key是否存在且未过期 */
  hasItem(key: string): boolean;

  /** 删除带过期缓存单项 */
  removeItem(key: string): this;

  /** 批量删除带过期缓存 */
  removeItems(keys: string[]): this;

  /** 获取当前命名空间下所有【带过期缓存】原始key列表 */
  getKeys(): string[];

  /**
   * ⚠️ 仅清理带过期缓存(CACHE)
   * 不会清除 setItem_simple 永久数据
   */
  clearCache(): this;

  /**
   * GC垃圾回收：自动清理当前命名空间过期缓存
   * @returns 清理数量
   */
  gc(): number;

  // ========== Simple 永久存储系列（无过期） ==========
  setItem_simple<T = unknown>(key: string, val: T): this;

  getItem_simple<T = unknown>(key: string, defaultVal?: T): T | null;

  hasItem_simple(key: string): boolean;

  removeItem_simple(key: string): this;

  removeItems_simple(keys: string[]): this;

  getKeys_simple(): string[];

  /** 仅清理当前命名空间所有 simple 永久存储 */
  clearSimple(): this;

  /** 【推荐】清空当前命名空间全部数据（CACHE + SIMPLE） */
  clearNamespaceAll(): this;

  /**
   * ⚠️ 高危！清空当前域名下全部原生 storage
   * 不受prefix命名空间隔离，谨慎使用
   */
  dangerouslyClearAllOriginStorage(): this;

  /** 获取存储概览信息（key数量、预估大小） */
  getStorageInfo(): StorageInfo;

  // ========== 内部前缀工具（业务一般不用） ==========
  addCachePrefix(key: string): string;
  addSimplePrefix(key: string): string;
  removePrefix(fullKey: string): string;
}

/** 默认 localStorage 实例 */
export declare const local: Storage;

/** 默认 sessionStorage 实例 */
export declare const session: Storage;

/** 创建新Storage实例工厂函数 */
export declare function createStorage(config?: StorageConstructorOptions): Storage;

export default Storage;
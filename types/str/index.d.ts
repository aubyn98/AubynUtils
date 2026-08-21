export * from './convert';
export * from './supports';
export * from './validate';
/**
 * 获取随机字符串
 * @param { string | number } random 随机数 可选参数
 * @param { string } sign 分隔符 可选参数
 */
export function getRandom(random?: string | number, sign?: string): string;
/**
 * 获取随机字符串 / uuid len=8
 * @param { number } len 字符串长度
 * @param { string } $chars 参考字符串
 */
export function getRandomStr(len?: number, $chars?: string): string;
/**
 * 将连字符名称转换为大写驼峰
 * @param { string } str 字符串
 */
export function getPascalCase(str: string): string;

/**
 * 解析 URL query 字符串，相同 key 自动转为数组
 * 支持传入完整 URL / query 字符串，自动剔除 hash
 *
 * @param str 完整 url / query 字符串，可以带开头 ?，可携带 #hash
 * @param options 配置选项
 * @returns 解析结果
 */
export declare function getQueryParams(
    str?: string,
    options?: GetQueryParamsOptions
  ): Record<string, string | string[]>;
  
  /**
   * 从当前页面 URL 的 search 部分解析参数（仅浏览器环境）
   * @param options 同 getQueryParams 的 options
   * @returns 解析结果
   */
  export declare function getQueryParamsFromSearch(
    options?: GetQueryParamsOptions
  ): Record<string, string | string[]>;
  
  /**
   * 从当前页面 URL 的 hash 部分解析参数（仅浏览器环境）
   * 自动提取 hash 中 ? 后的 query 参数
   *
   * @example
   * // URL: https://example.com#/pages/index?a=1&b=2
   * getQueryParamsFromHash() // => { a: '1', b: '2' }
   *
   * @param options 同 getQueryParams 的 options
   * @returns 解析结果
   */
  export declare function getQueryParamsFromHash(
    options?: GetQueryParamsOptions
  ): Record<string, string | string[]>;
  

/**
 * 对象转url query字符串
 * 数组自动展开为重复key，与 getQueryParams 解析行为双向对称
 * @param params 参数对象
 * @param addQuestionMark 是否添加开头问号 ?
 * @returns query串
 */
export declare function toQueryString(
    params: Record<string, any>,
    addQuestionMark?: boolean
  ): string;

/**
 * 版本号比较
 * @param { string } v1 字符串
 * @param { string } v2 字符串
 * compareVersion('1.0.1','1.0.2') == -1
 * compareVersion('1.0.1','1.0.1') == 0
 * compareVersion('1.0.1','1.0.0') == 1
 */
export function compareVersion(v1: string, v2: string): number;

/**
 * 生成随机HEX色值
 */
export function randomColor(): string;

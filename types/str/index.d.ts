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

export interface GetQueryParamsOptions {
  /** 是否静默模式，不输出警告 */
  silent?: boolean;
  /** 是否将 + 号解码为空格 */
  decodePlus?: boolean;
  /** 严格模式，解码失败时跳过该参数 */
  strict?: boolean;
}

/**
 * 解析 URL query 字符串，自动识别多种数组形式：a=1&a=2、a[]=1&a[]=2、a[0]=1&a[1]=2
 * 支持传入完整 URL / query 字符串，自动剔除 hash
 * @param str 完整 url / query 字符串，可以带开头 ?，可携带 #hash
 * @param options 配置选项
 * @returns 解析结果对象
 */
export function getQueryParams(str?: string, options?: GetQueryParamsOptions): Record<string, string | string[]>;

/**
 * 从当前页面 URL 的 search 部分解析参数（仅浏览器环境）
 * @param options 同 getQueryParams 的 options
 * @returns 解析结果
 */
export declare function getQueryParamsFromSearch(options?: GetQueryParamsOptions): Record<string, string | string[]>;

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
export declare function getQueryParamsFromHash(options?: GetQueryParamsOptions): Record<string, string | string[]>;

export type ArrayFormatType = 'indices' | 'brackets' | 'repeat' | 'comma';

export interface ToQueryStringOptions {
  /** 是否前置 ? */
  addQuestionMark?: boolean;
  /** 数组格式化模式，默认 comma */
  arrayFormat?: ArrayFormatType;
  /** true:空数组输出key=；false:空数组直接丢弃，默认 false */
  keepEmptyArray?: boolean;
}

/**
 * 对象转url query字符串
 * @param params 参数对象
 * @param options 配置项
 * @returns query字符串
 */
export function toQueryString(params: Record<string, any> | null | undefined, options?: ToQueryStringOptions): string;

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

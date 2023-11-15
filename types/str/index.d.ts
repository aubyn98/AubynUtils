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
export function getRandomStr(len: number, $chars?: string): string;
/**
 * 将连字符名称转换为大写驼峰
 * @param { string } str 字符串
 */
export function getPascalCase(str: string): string;

/**
 * 获取URL参数
 * @param { string } str 字符串
 */
export function getSearchParams(str: string): Record<string, any>;

/**
 * 生成URL查询字符串
 * @param { string } str 字符串
 */
export function getSearchString(str: Record<string, any>): string;

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

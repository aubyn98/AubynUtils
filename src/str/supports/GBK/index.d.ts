/**
 * gbk 转码
 */
export function encode(str: string): string;
/**
 * gbk 解码
 */
export function decode(str: string): string;

/**
 * 把utf8字符串转码成GBK二进制数据
 * @param {string} str
 */
export function strToGBKBuffer(str: string): ArrayBuffer;

/**
 * 含中文的16进制字符串转ArrayBuffer （含gbk转码）
 * @param {string} str
 */
export function CN_hexStrToBufferByGBK(str: string): ArrayBuffer;

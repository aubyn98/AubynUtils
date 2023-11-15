/**
 * ArrayBuffer转为字符串
 * @param { ArrayBuffer  } buffer
 */
export function bufferToStr(buffer: ArrayBuffer): string;

/** 字符串转为ArrayBuffer对象
 * @param { String  } str
 */
export function strToBuffer(str: string): ArrayBuffer;

/**
 * ArrayBuffer转为16进制字符串
 * @param { ArrayBuffer  } buffer
 */
export function bufferToHexStr(buffer: ArrayBuffer): string;

/**
 * 含中文的16进制字符串转ArrayBuffer （不含gbk转码）
 * @param { String  } str
 */
export function hexStrToBuffer_CN(str: string): ArrayBuffer;

/**
 * 不含中文的16进制字符串转ArrayBuffer （不含gbk转码）
 * @param { String  } str
 */
export function hexStrToBuffer(str: string): ArrayBuffer;

/**
 * 字符串转为16进制字符串
 * @param { String  } str
 */
export function strToHexStr(str: string): string;

/**
 * utf8字符串转Unicode
 * @param { String  } str
 */
export function strToUnicode(str: string): string;

/**
 * 含中文的UTF8字符串真正字节长度
 * @param { String  } str
 */
export function strLength_CN(str: string): number;

/** 判断是否为中文
 * @param { String  } str
 */
export function isCN(str: string): boolean;

/** 返回八位数组
 * @param { String  } str
 */
export function subStr(str: string): string | string[];

/**
 * 单纯只有0x0a 的ArrayBuffer
 */
export function send0X0A(): ArrayBuffer;

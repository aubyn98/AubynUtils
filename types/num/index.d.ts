/**
 * 数字转大写中文
 */
export function digit2Uppercase(val: number): string

/**
 * 数字相乘
 * @param  multiplicand  被乘数;
 * @param  multipliers    乘数 - 剩余参数;
 */
export function multiply(multiplicand: number | string, ...multipliers: (number | string)[]): number

/**
 * 数字相除
 * @param  dividend  被除数;
 * @param  divisors   除数,不能为0 - 剩余参数
 */
export function divide(dividend: number | string, ...divisors: (number | string)[]): number

/**
 * 数字相加
 * @param  summand  被加数;
 * @param  addends   加数; - 剩余参数
 */
export function add(summand: number | string, ...addends: (number | string)[]): number

/**
 * 数字相减
 * @param  minuend      被减数;
 * @param  subtrahends   减数; - 剩余参数
 */
export function subtract(minuend: number | string, ...subtrahends: (number | string)[]): number

/**
 * 对象数组指定键相加
 * @param  data      数据源-数组类型;
 * @param  keys      指定相加的键
 */
export function addBy(data: Array<string | number>): number
export function addBy(data: Array<Record<string, any>>, keys: string | string[]): number

/**
 * 对象数组指定键相乘
 * @param  data      数据源-数组类型;
 * @param  keys      指定相乘的键
 */
export function multiplyBy(data: Array<string | number>): number
export function multiplyBy(data: Array<Record<string, any>>, keys: string | string[]): number

/**
 * 科学计数法转小数 例：7e-7 -> 0.0000007
 * @param {string} numStr  科学计数法的字符串;
 */
export function scientificToNumber(numStr: string): string

/**
 * 排除NaN
 * @param {number | string} v  要判断的值
 * @param {number | string} d  如果是NaN，则返回的默认值， 默认为 0
 */
export function excludeNaN<T>(v: T, d?: T): T

/**
 * 输入框限制只能输入整数 @keypress 事件
 */
export function limitInteger(e: KeyboardEvent | Event): void

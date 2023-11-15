/**
 * 获取日期
 * @param { number } time 当前时间戳  可选，默认 Date.now()
 * @param { string | function } formatter  日期格式   可选，默认 date
 * @param { string } isPad 是否补零    可选，默认 true
 */
type Time = number | string | Date
export function getDate(time?: Time, formatter?: 'date' | 'datetime', isPad?: boolean): string;
export function getDate(time?: Time, formatter?: string, isPad?: boolean): string;
function getDate(
  time?: Time,
  formatter?: (dateInfo: { yyyy: string; MM: string; dd: string; HH: string; mm: string; ss: string; ms: string }) => string,
  isPad?: boolean
): string;

/**
 * 将符合条件的日期字符串格式化成yyyy-MM-dd
 * @param { string } str
 */
export function dateFormat(str: string): string;

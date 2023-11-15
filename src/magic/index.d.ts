type eventMaps = WindowEventMap & DocumentEventMap & HTMLElementEventMap & ElementEventMap;
/**
 * 为元素添加事件监听  返回值为移除监听事件的函数
 * @param target  需要添加监听事件的目标
 * @param event  监听的事件
 * @param fn  事件触发的函数
 * @param options  其他参数
 */
export function addEventListener<U, K extends keyof eventMaps>(target: U, event: K, fn: (this: U, ev: eventMaps[K]) => any, options?: object): () => any;
/**
 * 移除元素事件监听
 * @param target  需要移除监听事件的目标
 * @param event  监听的事件
 * @param fn  事件触发的函数
 */
export function removeEventListener<U, K extends keyof eventMaps>(target: U, event: K, fn: (this: U, ev: eventMaps[K]) => any): void;

/**
 * 防抖
 * @param { function } fn  要执行的函数
 * @param { number } delay  防抖延迟时间
 */
export function debounce<T extends (...argvs: any[]) => any>(
  fn: T,
  delay?: number
): T & {
  stop(): void;
};

/**
 * 节流
 * @param { function } func  要执行的函数
 * @param { number } wait  节流时间
 * @param { boolean } immediate  是否立即执行，默认true
 */
export function throttle<T extends (...argvs: any[]) => any>(func: T, wait?: number, immediate?: boolean): T;

/**
 * 组合函数
 */
export function compose<T extends (...params: any[]) => any>(fn: T, ...params: Array<(...params: any[]) => any>): T;

/**
 * 复制文字
 * @param { function } val  要复制的字符串
 */
export function copyText(str: string | number): Promise<any>;

/**
 * 日志
 * @param { string } msg  log message
 * @param { Object | Array } style  log style
 */
export function log(msg: string, style?: object | Array<object>): void;
export namespace log {
  export function success(msg: string): void;
  export function error(msg: string): void;
}

/* 定时器 */
interface timerRemove {
  (): void;
  timerId: number;
}

export function _setInterval<TArgs extends any[]>(callback: (...args: TArgs) => void, ms?: number, ...args: TArgs): timerRemove;
export function _setTimeout<TArgs extends any[]>(callback: (...args: TArgs) => void, ms?: number, ...args: TArgs): timerRemove;

/**
 * 将函数字符串转换成匿名函数
 * @param { string } string  符合格式的函数字符串 eg：Function.prototype.toString;
 * @returns { Function } function 匿名函数
 */
export function convertFn(string: string): Function;

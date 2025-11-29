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
export function debounce<A extends any[], R>(
  fn: (...argvs: A) => R,
  delay?: number
): ((...argvs: A) => void) & {
  stop(): void;
};

/**
 * 防抖(Promise版)
 * @param { function } fn  要执行的函数
 * @param { number } delay  防抖延迟时间
 */
export function debouncePromise<T extends (...argvs: any[]) => any>(
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

// 基础组合类型
type Compose<T extends any[]> = T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends (...args: any[]) => any
    ? Compose<R> extends (...args: any[]) => any
      ? (...args: Parameters<Compose<R>>) => ReturnType<F>
      : never
    : never
  : never;

type ComposeAsync<T extends any[]> = T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends (...args: any[]) => any
    ? ComposeAsync<R> extends (...args: any[]) => any
      ? (...args: Parameters<ComposeAsync<R>>) => Promise<Awaited<ReturnType<F>>>
      : never
    : never
  : never;

// 反转数组类型用于 pipe
type Reverse<T extends any[]> = T extends [infer First, ...infer Rest] ? [...Reverse<Rest>, First] : [];

type Pipe<T extends any[]> = Compose<Reverse<T>>;
type PipeAsync<T extends any[]> = ComposeAsync<Reverse<T>>;

/** 同步 compose - 支持任意数量函数 */
export function compose<T extends any[]>(...fns: T): T extends [] ? <U>(arg: U) => U : Compose<T>;

/** 异步 compose - 支持任意数量函数 */
export function composeAsync<T extends any[]>(...fns: T): T extends [] ? <U>(arg: U) => Promise<U> : ComposeAsync<T>;

/** 同步 pipe - 支持任意数量函数 */
export function pipe<T extends any[]>(...fns: T): T extends [] ? <U>(arg: U) => U : Pipe<T>;

/** 异步 pipe - 支持任意数量函数 */
export function pipeAsync<T extends any[]>(...fns: T): T extends [] ? <U>(arg: U) => Promise<U> : PipeAsync<T>;

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

/**
 * 插入一个函数在空闲时调用
 * @param { Function } cb 插入的函数
 */
export function idleHandle(cb: (e: { timeRemaining: () => number }) => any): number;

/**
 * 空闲时间执行任务，不阻塞渲染
 * @param { Function } task 任务函数
 */
export function idleRunTask(task: (...argvs: any[]) => any): number;

/**
 * 分时函数 - 分批处理任务（空闲时）
 * @param { number | Array } datas 任务数据
 * @param { Function } taskHandler 任务处理器
 * @param { Function } scheduler   空闲调度器
 */
export function performChunk<T extends any[] | number>(
  datas: T,
  taskHandler: (item: T extends any[] ? T[number] : void, i: number, source: T) => any,
  scheduler?: (task: (goOn: () => boolean) => void) => void
): void;

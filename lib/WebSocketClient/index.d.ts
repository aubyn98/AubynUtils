// WebSocketClient.d.ts
// 统一版类型声明（浏览器 / uni-app 共用一份 JS 实现），与 WebSocketClient.js
// 同目录同名放置（原 WebSocketClient.uni.d.ts 已更名删除）。
//
// 设计：类通过泛型参数 P（"平台档案"）描述底层传输类型与各事件原生载荷类型。
// 默认 P = BrowserWebSocketProfile（依赖 DOM lib 的 Event/MessageEvent/CloseEvent/WebSocket）：
// 裸用基类即浏览器语义；uni 工程用 UniWebSocketClient（或显式 WebSocketClient<UniAppProfile>）。
//
// 相对旧版 WebSocketClient.uni.d.ts 的变更：
// 1. 字段 socketTask → transport（类型随 P）；新增 adapter 字段、构造器第三参、options.adapter
// 2. 'reconnect' 事件载荷从 { event } 改为直接透传原生事件（与 'open' 同形）；WebSocketReconnectedInfo 已删除
// 3. 'fail' / WebSocketDropReason 新增 { type: 'heartbeatTimeout' } 变体
// 4. 方法 resetHeartbeatTimeout 已删除（改用 clearHeartbeatTimeout）
// 5. 补充声明 addEventListener / removeEventListener
// 6. 新增导出：两个适配器、UniWebSocketClient、档案 / 契约类型
// 7. 【本版】默认档案 UniAppProfile → BrowserWebSocketProfile（裸用基类的回调提示改为 DOM 事件类型）；
//    新增 BrowserWebSocketProfile 导出，BrowserWebSocketAdapter 收紧为精确类型；
//    文件因此要求 DOM lib（uni 官方模板 tsconfig 默认已含；无 DOM lib 的工程见文末可选方案）

/** 可发送的数据类型（心跳消息与 send 的载荷）。取两端交集：浏览器实际还接受 Blob/TypedArray，uni 仅支持此二者 */
export type WebSocketData = string | ArrayBuffer;

// ============ 平台档案（泛型参数 P） ============

/** 平台档案：底层传输类型 + 四类原生事件载荷 + 失败详情携带的 event 类型 */
export interface WebSocketPlatformProfile {
  /** 底层传输对象（uni: SocketTask；浏览器: WebSocket；自定义适配器: create 返回值） */
  transport: unknown;
  /** open / reconnect 事件载荷 */
  open: unknown;
  /** message 事件载荷 */
  message: unknown;
  /** close 事件载荷 */
  close: unknown;
  /** error 事件载荷 */
  error: unknown;
  /** fail(type: 'connectError') 中携带的 event：onError 载荷或同步抛出的 Error */
  errorEvent: unknown;
}

/** 浏览器档案（默认）：依赖 DOM lib */
export interface BrowserWebSocketProfile extends WebSocketPlatformProfile {
  transport: WebSocket;
  /** onopen / 'reconnect' 载荷：原生 open 事件 */
  open: Event;
  /** onmessage 载荷：res.data 为消息内容 */
  message: MessageEvent;
  /** onclose 载荷：res.code / res.reason */
  close: CloseEvent;
  /** onerror 载荷：原生 error 事件（通常无错误细节） */
  error: Event;
  errorEvent: Event | Error;
}

/** uni-app 档案：依赖 @dcloudio/types 的全局 UniApp 命名空间 */
export interface UniAppProfile extends WebSocketPlatformProfile {
  transport: UniApp.SocketTask;
  open: UniApp.OnSocketOpenCallbackResult;
  message: UniApp.OnSocketMessageCallbackResult;
  close: UniApp.OnSocketCloseCallbackResult;
  error: UniApp.GeneralCallbackResult;
  errorEvent: UniApp.GeneralCallbackResult | Error;
}

// ============ 适配器契约（对应 JS 终版导出的两个适配器；自定义平台实现同契约） ============

/** bind 绑定的四个回调：载荷类型由档案 P 决定 */
export interface WebSocketTransportHandlers<P extends WebSocketPlatformProfile = BrowserWebSocketProfile> {
  open(res: P['open']): void;
  message(res: P['message']): void;
  close(res: P['close']): void;
  error(err: P['error']): void;
}

/** 适配器五方法契约 */
export interface WebSocketAdapter<P extends WebSocketPlatformProfile = any> {
  /** 创建传输对象；失败/返回无效对象必须 throw（核心只接同步异常） */
  create(url: string): P['transport'];
  /** 绑定 { open, message, close, error } 回调 */
  bind(transport: P['transport'], handlers: WebSocketTransportHandlers<P>): void;
  /** 摘除回调；无法摘除的平台可空实现（核心有身份比对兜底） */
  unbind(transport: P['transport']): void;
  /** 发送 */
  send(transport: P['transport'], message: WebSocketData): void;
  /** 关闭；code 缺省时走平台默认关闭 */
  close(transport: P['transport'], code?: number, reason?: string): void;
}

// ============ 事件 / 失败载荷 ============

/** handleDrop 的入参：连接阶段失败原因（willRetry 由内部补上后再对外 emit fail） */
export type WebSocketDropReason<P extends WebSocketPlatformProfile = BrowserWebSocketProfile> =
  | { type: 'connectTimeout'; url: string }
  | { type: 'connectError'; url: string; event: P['errorEvent'] }
  | { type: 'heartbeatTimeout' };

/**
 * fail 事件载荷：
 * - connectTimeout / connectError / heartbeatTimeout：本轮失败，是否还会重连看 willRetry
 * - tooManyDrops / maxReconnect：终态，不再重连，willRetry 恒为 false
 */
export type WebSocketFailInfo<P extends WebSocketPlatformProfile = BrowserWebSocketProfile> =
  | { type: 'connectTimeout'; url: string; willRetry: boolean }
  | { type: 'connectError'; url: string; willRetry: boolean; event: P['errorEvent'] }
  | { type: 'heartbeatTimeout'; willRetry: boolean }
  | { type: 'tooManyDrops'; dropCount: number; stablePeriod: number; willRetry: false }
  | { type: 'maxReconnect'; maxReconnect: number; url: string; willRetry: false };

/** reconnecting 事件载荷：即将发起第 count 次重连，延迟 delay ms */
export interface WebSocketReconnectingInfo {
  /** 本次重连延迟 ms（已含指数退避与抖动） */
  delay: number;
  /** 本轮连续重连序号（连接成功后清零） */
  count: number;
}

/** getStats() 返回的运行状态快照 */
export interface WebSocketClientStats {
  /** 当前是否已连接 */
  connected: boolean;
  /** 本轮连续重连次数（成功清零） */
  reconnectCount: number;
  /** 当前不稳定窗口内"连上又掉"的次数 */
  dropCount: number;
  /** 最近一次掉线时间戳 ms，未掉过线为 0 */
  lastDropTime: number;
  /** 本次连接已存活时长 ms，未连接为 0 */
  uptime: number;
}

export interface WebSocketClientOptions<P extends WebSocketPlatformProfile = BrowserWebSocketProfile> {
  /** 初始重连间隔 ms，默认 1000 */
  reconnectDelay?: number;
  /** 重连间隔上限 ms，默认 30000 */
  maxReconnectDelay?: number;
  /** 指数退避乘数，默认 2 */
  backoffFactor?: number;
  /** 抖动比例（0~1），默认 0.3；设为 0 关闭抖动 */
  jitter?: number;
  /** 最大重连次数，-1 为无限重连，默认 -1 */
  maxReconnect?: number;
  /** 连接存活超过该时长视为"稳定"，掉线计数清零，默认 60000 */
  stablePeriod?: number;
  /** 一个不稳定窗口内容忍的掉线次数，默认 5（第 maxDrops+1 次终止） */
  maxDrops?: number;
  /** 心跳发送间隔 ms，默认 30000 */
  heartbeatInterval?: number;
  /** 心跳超时 ms（该时间内收不到任何服务端消息则判死并走掉线流程），默认 10000 */
  heartbeatTimeout?: number;
  /** 心跳消息内容，默认 'ping' */
  heartbeatMsg?: WebSocketData;
  /** 连接建立超时兜底 ms（无 open/error/close 时判死），默认 15000 */
  connectTimeout?: number;
  /**
   * 传输适配器：实例级注入，优先级最高（高于构造器第三参与平台自动探测）。
   * Node 等无内置适配器的环境必传。注意：默认档案为浏览器，
   * 注入 uni 适配器请配合 WebSocketClient<UniAppProfile> 或直接用 UniWebSocketClient
   */
  adapter?: WebSocketAdapter<P>;
}

// ============ 事件映射 ============

export type WebSocketEventName = 'open' | 'message' | 'close' | 'error' | 'reconnect' | 'reconnecting' | 'fail';

export interface WebSocketClientEventMap<P extends WebSocketPlatformProfile = BrowserWebSocketProfile> {
  /** 连接建立（首次与重连都会触发） */
  open: (res: P['open']) => void;
  /** 收到服务端消息 */
  message: (res: P['message']) => void;
  /** 底层连接关闭 */
  close: (res: P['close']) => void;
  /** 底层连接错误 */
  error: (err: P['error']) => void;
  /** 断线后重新连接成功（reconnectCount 曾 > 0 时才触发）；与 open 同形，直接透传原生事件 */
  reconnect: (res: P['open']) => void;
  /** 已安排重连，等待 delay ms 后发起 */
  reconnecting: (info: WebSocketReconnectingInfo) => void;
  /** 连接失败，注意区分 willRetry（可重试）与终态失败 */
  fail: (info: WebSocketFailInfo<P>) => void;
}

export type WebSocketEventHandler<P extends WebSocketPlatformProfile, K extends WebSocketEventName> = WebSocketClientEventMap<P>[K];

// ============ 客户端 ============

export declare class WebSocketClient<P extends WebSocketPlatformProfile = BrowserWebSocketProfile> {
  /**
   * @param url WebSocket 地址
   * @param options 配置项，全部可选，均有默认值；options.adapter 可注入适配器（优先级最高）
   * @param adapter 适配器；缺省时运行时按平台自动探测（有 uni 全局 → UniWebSocketAdapter，
   *                否则 → BrowserWebSocketAdapter）；uni 工程建议直接使用 UniWebSocketClient 子类
   */
  constructor(url: string, options?: WebSocketClientOptions<P>, adapter?: WebSocketAdapter<P>);
  // ============ 配置 ============
  /** 连接的 URL */
  url: string;
  /** 当前使用的传输适配器（优先级：options.adapter > 构造器第三参 > 平台自动探测） */
  adapter: WebSocketAdapter<P>;
  /** 初始重连间隔 ms */
  reconnectDelay: number;
  /** 重连间隔上限 ms */
  maxReconnectDelay: number;
  /** 指数退避乘数 */
  backoffFactor: number;
  /** 抖动比例 */
  jitter: number;
  /** 最大重连次数，-1 为无限重连 */
  maxReconnect: number;
  /** 稳定期阈值 ms */
  stablePeriod: number;
  /** 不稳定窗口内容忍掉线次数 */
  maxDrops: number;
  /** 心跳发送间隔 ms */
  heartbeatInterval: number;
  /** 心跳超时 ms */
  heartbeatTimeout: number;
  /** 心跳消息内容 */
  heartbeatMsg: WebSocketData;
  /** 连接超时兜底 ms */
  connectTimeout: number;
  // ============ 运行时状态 ============
  /** 当前底层连接：默认（浏览器）为 WebSocket，UniAppProfile 下为 SocketTask；未连接为 null */
  transport: P['transport'] | null;
  /** 是否已连接 */
  isConnected: boolean;
  /** 是否为主动关闭（主动关闭后不再自动重连） */
  manualClose: boolean;
  /** 心跳定时器 */
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  /** 心跳超时定时器 */
  heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null;
  /** 挂起的重连定时器 */
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  /** 连接建立超时定时器 */
  connectTimeoutTimer: ReturnType<typeof setTimeout> | null;
  /** 本轮连续重连次数（连接成功清零） */
  reconnectCount: number;
  /** 不稳定窗口内掉线次数 */
  dropCount: number;
  /** 最近一次掉线时间戳 ms（仅统计展示用） */
  lastDropTime: number;
  /** 本次连接建立时间戳 ms，未连接为 0 */
  connectedAt: number;
  /** 连接周期号，每次 connect()/close() 递增 */
  dropCycle: number;
  /** 已处理过掉线的周期号（同周期幂等） */
  handledCycle: number;
  /** 各事件监听器列表 */
  events: {
    [K in WebSocketEventName]: Array<WebSocketClientEventMap<P>[K]>;
  };
  // ============ 事件系统 ============
  /** 注册事件监听，支持链式调用 */
  on<K extends WebSocketEventName>(event: K, fn: WebSocketEventHandler<P, K>): this;
  /** 移除事件监听；once 包装过的回调可直接传入原始函数移除 */
  off<K extends WebSocketEventName>(event: K, fn: WebSocketEventHandler<P, K>): this;
  /** 注册只触发一次的事件监听，触发后自动移除 */
  once<K extends WebSocketEventName>(event: K, fn: WebSocketEventHandler<P, K>): this;
  /** on 的 DOM 风格别名 */
  addEventListener<K extends WebSocketEventName>(event: K, fn: WebSocketEventHandler<P, K>): this;
  /** off 的 DOM 风格别名 */
  removeEventListener<K extends WebSocketEventName>(event: K, fn: WebSocketEventHandler<P, K>): this;
  /** 触发事件（内部使用，外部一般不需要） */
  emit<K extends WebSocketEventName>(event: K, ...args: Parameters<WebSocketClientEventMap<P>[K]>): void;
  // ============ 连接 / 重连 ============
  /**
   * 建立连接；连接存活时重复调用会先关掉旧连接再建新连接；
   * 适配器 create / bind 异常同样走统一掉线流程
   */
  connect(): this;
  /**
   * 调度一次自动重连（指数退避 + 抖动）
   * @returns 是否成功安排重连；已连接 / 已有挂起重连 / 达到上限时返回 false
   */
  reconnect(): boolean;
  /** 计算下一次重连延迟：reconnectDelay * backoffFactor^n，封顶并加抖动 */
  getBackoffDelay(): number;
  /** 唯一掉线处理入口（按周期号幂等）；connectTimeout / connectError / heartbeatTimeout 均经此入口，外部一般不直接调用 */
  handleDrop(cycle: number, failInfo?: WebSocketDropReason<P>): void;
  // ============ 发送 / 心跳 ============
  /** 发送消息；未连接时仅打印错误、不抛异常、不缓存 */
  send(message: WebSocketData): this;
  /** 开启心跳定时发送（会先清理旧定时器） */
  startHeartbeat(): void;
  /** 停止心跳并清理心跳超时定时器 */
  stopHeartbeat(): void;
  /**
   * 启动一次心跳超时计时；超时后直接走掉线流程（emit fail: heartbeatTimeout）
   * 并关闭底层连接，不依赖平台 close 回调送达
   */
  startHeartbeatTimeout(): void;
  /** 清理心跳超时定时器（收到任意消息时内部即调用） */
  clearHeartbeatTimeout(): void;
  /** 清理连接建立超时定时器 */
  clearConnectTimeout(): void;
  // ============ 关闭 / 状态 ============
  /**
   * 主动关闭连接：立即复位 isConnected（不等底层 close 回调送达），
   * 关闭后不再自动重连并重置计数
   * @param code 关闭码，默认 1000
   * @param reason 关闭原因，默认空串
   */
  close(code?: number, reason?: string): void;
  /** 获取当前运行状态快照 */
  getStats(): WebSocketClientStats;
}

// ============ 内置适配器与平台子类（对应 JS 终版的具名导出） ============

/** 浏览器原生 WebSocket 适配器（档案为 BrowserWebSocketProfile，精确类型） */
export declare const BrowserWebSocketAdapter: WebSocketAdapter<BrowserWebSocketProfile>;

/** uni-app SocketTask 适配器 */
export declare const UniWebSocketAdapter: WebSocketAdapter<UniAppProfile>;

/** uni-app 版：显式换用 SocketTask 适配器，其余逻辑完全复用核心 */
export declare class UniWebSocketClient extends WebSocketClient<UniAppProfile> {
  constructor(url: string, options?: WebSocketClientOptions<UniAppProfile>);
}

export default WebSocketClient;

// ============ 平台选择 / 自定义平台指引 ============
// 1. 浏览器：直接 new WebSocketClient(url)（默认档案即浏览器类型）
// 2. uni-app：new UniWebSocketClient(url)，或
//    new WebSocketClient<UniAppProfile>(url, opts, UniWebSocketAdapter)。
//    不要在 uni 工程裸用基类 —— 类型是浏览器档案，而运行时探测到 uni 全局会走
//    UniWebSocketAdapter，二者载荷形状不一致
// 3. Node（ws 包）等自定义平台：定义档案 + 实现 WebSocketAdapter 五方法，
//    然后 new WebSocketClient<MyProfile>(url, { adapter: myAdapter })
//
// 可选：若需兼容未启用 DOM lib 的纯小程序 TS 工程（默认档案引用了 DOM 类型会编译报错），
// 把类及各类型默认值中的 BrowserWebSocketProfile 换成：
//   type DefaultProfile = 'MessageEvent' extends keyof typeof globalThis
//     ? BrowserWebSocketProfile : any;
// （以 MessageEvent 探测 DOM lib：Node 与小程序全局都没有这个名字，不会误判；
//  无 DOM lib 时退化为宽松 any，不阻断编译）

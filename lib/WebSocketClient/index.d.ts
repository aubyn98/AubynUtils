export interface WebSocketClientOptions {
  /** 重连间隔时间，默认 1000ms */
  reconnectDelay?: number;
  /** 心跳发送间隔，默认 30000ms */
  heartbeatInterval?: number;
  /** 心跳超时时间，收不到应答则断开，默认 10000ms */
  heartbeatTimeout?: number;
  /** 心跳消息内容，默认 'ping' */
  heartbeatMsg?: string;
  /** 最大重连次数，-1 表示无限重连，默认 -1 */
  maxReconnect?: number;
}

export type WebSocketFailInfo =
  | {
      type: 'connectError';
      url: string;
      willRetry: boolean;
      event: Event;
    }
  | {
      type: 'maxReconnect';
      url: string;
      willRetry: false;
      maxReconnect: number;
    };

/** 事件名 -> 回调参数列表 */
export interface WebSocketClientEventMap {
  /** 连接成功（首次连接） */
  open: [ev: Event];
  /** 收到消息 */
  message: [ev: MessageEvent];
  /** 连接关闭 */
  close: [ev: CloseEvent];
  /** 发生错误 */
  error: [event: Event];
  /** 重连成功 */
  reconnect: [ev: Event];
  /** 链接失败 */
  fail: [info: WebSocketFailInfo];
}

type EventName = keyof WebSocketClientEventMap;
type EventHandler<K extends EventName> = (...args: WebSocketClientEventMap[K]) => void;

export class WebSocketClient {
  /** 连接的 URL */
  url: string;
  /** 重连间隔时间(ms) */
  reconnectDelay: number;
  /** 心跳发送间隔(ms) */
  heartbeatInterval: number;
  /** 心跳超时时间(ms) */
  heartbeatTimeout: number;
  /** 心跳消息内容 */
  heartbeatMsg: string;
  /** 最大重连次数，-1 为无限重连 */
  maxReconnect: number;
  /** 当前底层 WebSocket 实例，未连接时为 null */
  ws: WebSocket | null;
  /** 是否已连接 */
  isConnected: boolean;
  /** 当前重连计数 */
  reconnectCount: number;
  /**
   * @param url websocket地址
   * @param options 配置项
   */
  constructor(url: string, options?: WebSocketClientOptions);

  /** 建立连接（重连也会走到这里） */
  connect(): this;

  /** 注册事件监听（等价于 addEventListener） */
  on<K extends EventName>(event: K, fn: EventHandler<K>): this;

  /** 移除事件监听（等价于 removeEventListener） */
  off<K extends EventName>(event: K, fn: EventHandler<K>): this;

  /** 注册事件监听，重连后不丢失 */
  addEventListener<K extends EventName>(event: K, fn: EventHandler<K>, options?: boolean | AddEventListenerOptions): this;

  /** 移除事件监听 */
  removeEventListener<K extends EventName>(event: K, fn: EventHandler<K>, options?: boolean | EventListenerOptions): this;

  /** 发送消息，仅在已连接时有效 */
  send(message: string | ArrayBuffer | Blob | ArrayBufferView): this;

  /** 主动关闭连接，不会触发重连 */
  close(code?: number, reason?: string): void;
}

export default WebSocketClient;

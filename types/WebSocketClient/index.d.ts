// WebSocketClient.d.ts
export declare class WebSocketClient {
  constructor(url: string, options?: WebSocketClientOptions);

  url: string;
  reconnectDelay: number;
  heartbeatInterval: number;
  heartbeatTimeout: number;
  heartbeatMsg: string;
  maxReconnect: number;
  ws: WebSocket | null;
  isConnected: boolean;
  heartbeatTimer: number | null;
  heartbeatTimeoutTimer: number | null;
  reconnectTimer: number | null;
  reconnectCount: number;

  addEventListener<K extends keyof WebSocketEventMap>(event: K, fn: (ev: WebSocketEventMap[K]) => void, options?: boolean | AddEventListenerOptions): this;

  removeEventListener<K extends keyof WebSocketEventMap>(event: K, fn: (ev: WebSocketEventMap[K]) => void, options?: boolean | AddEventListenerOptions): this;

  connect(): this;

  send(message: string | ArrayBufferLike | Blob | ArrayBufferView): this;

  startHeartbeat(): void;
  stopHeartbeat(): void;
  startHeartbeatTimeout(): void;
  resetHeartbeatTimeout(): void;
  clearHeartbeatTimeout(): void;

  reconnect(): void;

  close(code?: number, reason?: string): void;
}

export declare interface WebSocketClientOptions {
  /** 重连间隔 ms 默认1000 */
  reconnectDelay?: number;
  /** 心跳发送间隔 ms 默认30000 */
  heartbeatInterval?: number;
  /** 心跳应答超时 ms 默认10000 */
  heartbeatTimeout?: number;
  /** 心跳消息 默认ping */
  heartbeatMsg?: string;
  /** 最大重连次数，-1无限重连 */
  maxReconnect?: number;
}

export default WebSocketClient;

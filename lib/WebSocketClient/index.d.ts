export class WebSocketClient {
  constructor(url: string, options?: { reconnectDelay: number; heartbeatInterval: number; heartbeatMsg: string });
  ws: InstanceType<typeof WebSocket>;
  isConnected: boolean;
  connect(): this;
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): this;
  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): this;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): this;
  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): this;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): this;
  close(code?: number, reason?: string): void;
}

export class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.reconnectDelay = options.reconnectDelay || 1000; // 重连间隔时间
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 心跳发送间隔ms
    this.heartbeatTimeout = options.heartbeatTimeout || 10000; // 心跳超时，收不到应答则断开
    this.heartbeatMsg = options.heartbeatMsg || 'ping'; // 心跳消息
    this.maxReconnect = options.maxReconnect ?? -1; // 最大重连次数，-1无限重连
    this.ws = null;
    this.isConnected = false;
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null; // 心跳应答超时计时器
    this.reconnectTimer = null;
    this.reconnectCount = 0; // 当前重连计数
  }

  connect() {
    const ws = (this.ws = new WebSocket(this.url));

    ws.addEventListener('open', () => {
      this.isConnected = true;
      this.reconnectCount = 0; // 连接成功，重置重连计数
      console.log('Connection established');
      this.startHeartbeat();
    });

    // 收到任意消息，重置心跳超时计时器
    ws.addEventListener('message', ev => {
      this.resetHeartbeatTimeout();
    });

    ws.addEventListener('close', () => {
      this.isConnected = false;
      console.log('Connection closed');
      this.reconnect();
    });

    ws.addEventListener('error', event => {
      console.error('WebSocket error: ' + event);
      this.ws.close();
    });
    return this;
  }

  addEventListener(event, fn, options) {
    this.ws.addEventListener(event, fn, options);
    return this;
  }

  removeEventListener(event, fn, options) {
    this.ws.removeEventListener(event, fn, options);
    return this;
  }

  send(message) {
    if (this.isConnected) {
      this.ws.send(message);
    } else {
      console.error('WebSocket is not connected');
    }
    return this;
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send(this.heartbeatMsg);
        this.startHeartbeatTimeout();
      }
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearHeartbeatTimeout();
  }

  startHeartbeatTimeout() {
    this.clearHeartbeatTimeout();
    this.heartbeatTimeoutTimer = setTimeout(() => {
      console.warn('Heartbeat timeout, connection dead, close socket');
      if (this.ws) {
        this.ws.close();
      }
    }, this.heartbeatTimeout);
  }

  resetHeartbeatTimeout() {
    this.clearHeartbeatTimeout();
  }

  clearHeartbeatTimeout() {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  reconnect() {
    if (this.isConnected) return;

    // 判断是否达到最大重连次数
    if (this.maxReconnect !== -1 && this.reconnectCount >= this.maxReconnect) {
      console.log(`已到达最大重连次数(${this.maxReconnect})，停止重连`);
      return;
    }

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectCount += 1;
    console.log(`Reconnecting in ${this.reconnectDelay / 1000} seconds... count:${this.reconnectCount}`);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  close(code, reason) {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectCount = 0; // 手动关闭，重置计数
    this.ws.close(code, reason);
  }
}

export default WebSocketClient;

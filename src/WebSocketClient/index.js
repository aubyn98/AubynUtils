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
    this.manualClose = false; // 是否手动关闭（手动关闭不重连）
    // 事件缓存：重连后底层 ws 会替换，监听必须自己维护才不会丢失
    this.events = {
      open: [],
      message: [],
      close: [],
      error: [],
      reconnect: [],
      fail: []
    };
  }

  // 注册事件（与原生 API 同名，但走内部缓存，重连后不丢失）
  addEventListener(event, fn, options) {
    if (this.events[event]) {
      this.events[event].push(fn);
    }
    return this;
  }
  // 移除事件
  removeEventListener(event, fn, options) {
    if (!this.events[event]) return this;
    const index = this.events[event].indexOf(fn);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
    return this;
  }
  // 触发事件
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => {
      try {
        cb(...args);
      } catch (e) {
        console.error(`[${event}] callback error:`, e);
      }
    });
  }
  // 别名，方便链式调用
  on(event, fn) {
    return this.addEventListener(event, fn);
  }
  off(event, fn) {
    return this.removeEventListener(event, fn);
  }

  connect() {
    // 防止重复创建：先断开旧实例引用再关闭，旧实例的 close 不会触发重连
    if (this.ws) {
      const oldWs = this.ws;
      this.ws = null;
      oldWs.onclose = oldWs.onerror = oldWs.onopen = oldWs.onmessage = null;
      oldWs.close();
    }
    this.manualClose = false;
    const ws = (this.ws = new WebSocket(this.url));

    ws.onopen = (ev) => {
      const isReconnect = this.reconnectCount > 0; // 先记录，再重置
      this.isConnected = true;
      this.reconnectCount = 0; // 连接成功，重置重连计数
      console.log('Connection established');
      this.emit('open', ev);
      if (isReconnect) {
        console.log('Reconnected successfully');
        this.emit('reconnect', ev); // 重连成功事件
      }
      this.startHeartbeat();
    };
    // 收到任意消息，重置心跳超时计时器
    ws.onmessage = ev => {
      this.resetHeartbeatTimeout();
      this.emit('message', ev);
    };
    ws.onclose = ev => {
      this.isConnected = false;
      console.log('Connection closed');
      this.stopHeartbeat();
      this.emit('close', ev);
      // 旧实例被替换，或用户手动关闭时，不重连
      if (ws !== this.ws || this.manualClose) return;
      this.reconnect();
    };
    ws.onerror = event => {
      console.error('WebSocket error:', event);
      this.emit('error', event);
      // 关闭连接，由 close 流程触发重连
      if (ws === this.ws) {
        if (!this.isConnected) {
          const willRetry = this.maxReconnect === -1 || this.reconnectCount < this.maxReconnect;
          this.emit('fail', {
            type: 'connectError',
            url: this.url,
            willRetry,
            event
          });
        }
        ws.close();
      }
    };
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
      this.emit('fail', {
        type: 'maxReconnect',
        maxReconnect: this.maxReconnect,
        url: this.url
      });
      return;
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectCount += 1;
    console.log(`Reconnecting in ${this.reconnectDelay / 1000} seconds... count:${this.reconnectCount}`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
  }

  close(code, reason) {
    this.manualClose = true; // 手动关闭，抑制重连
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectCount = 0; // 手动关闭，重置计数
    if (this.ws) {
      this.ws.close(code, reason);
    }
  }
}
export default WebSocketClient;

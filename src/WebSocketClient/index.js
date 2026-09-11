// ============================================================
// WebSocketClient.js —— 浏览器 / uni-app 统一实现（单文件，终稿）
//
// 架构：共享核心 + 传输适配器。
//   - 核心类只管状态机、重连调度、指数退避、心跳、掉线熔断、周期幂等；
//   - 平台差异全部收敛进适配器的 5 个方法。
//
// 适配器契约（自定义平台实现这 5 个方法即可接入）：
//   {
//     create(url)                     // 创建传输对象；失败/无效必须 throw（核心只接同步异常）
//     bind(transport, handlers)       // 绑定 { open, message, close, error } 四个回调
//     unbind(transport)               // 摘除回调；无法摘除的平台空实现（核心有身份比对兜底）
//     send(transport, message)        // 发送
//     close(transport, code, reason)  // code 为 null/undefined 时走平台默认关闭
//   }
//
// 用法：
//   // 浏览器 / uni-app：默认自动探测平台，直接用
//   import WebSocketClient from './WebSocketClient.js';
//   const ws = new WebSocketClient('wss://...', { reconnectDelay: 1000 }).connect();
//
//   // uni-app 显式子类（或传 options.adapter 注入自定义平台，优先级最高）
//   import WebSocketClient, { UniWebSocketClient } from './WebSocketClient.js';
//   const ws = new UniWebSocketClient('wss://...');
//
// ⚠️ 相对旧版的迁移注意见文件底部注释。
// ============================================================

// ==================== 传输适配器 ====================

/** 浏览器原生 WebSocket 适配器 */
const BrowserWebSocketAdapter = {
  create(url) {
    return new WebSocket(url); // 无效 URL / 协议会同步抛错，由核心接住
  },
  bind(transport, handlers) {
    transport.onopen = handlers.open;
    transport.onmessage = handlers.message;
    transport.onclose = handlers.close;
    transport.onerror = handlers.error;
  },
  unbind(transport) {
    transport.onopen = transport.onmessage = transport.onclose = transport.onerror = null;
  },
  send(transport, message) {
    transport.send(message);
  },
  close(transport, code, reason) {
    // undefined 参数按 Web IDL 视同缺省 → 无状态码干净关闭
    transport.close(code, reason);
  }
};

/** uni-app SocketTask 适配器 */
const UniWebSocketAdapter = {
  create(url) {
    const task = uni.connectSocket({ url });
    // 个别平台未同步返回有效 SocketTask：抛错走核心的掉线流程
    if (!task || typeof task.onOpen !== 'function') {
      throw new Error('uni.connectSocket did not return a valid SocketTask');
    }
    return task;
  },
  bind(transport, handlers) {
    transport.onOpen(handlers.open);
    transport.onMessage(handlers.message);
    transport.onClose(handlers.close);
    transport.onError(handlers.error);
  },
  unbind() {
    // uni SocketTask 没有 off/removeListener，回调无法摘除；
    // 核心各回调首行的 transport 身份比对等效于摘回调
  },
  send(transport, message) {
    transport.send({ data: message });
  },
  close(transport, code, reason) {
    if (code != null) transport.close({ code, reason: reason || '' });
    else transport.close({});
  }
};

// ==================== 共享核心 ====================

class WebSocketClient {
  constructor(url, options = {}, adapter) {
    this.url = url;
    // 适配器优先级：options.adapter（实例级逃生口）> 显式传入（子类用）> 自动探测
    this.adapter = options.adapter || adapter ||
      (typeof uni !== 'undefined' ? UniWebSocketAdapter : BrowserWebSocketAdapter);
    // ---- 重连 / 指数退避 ----
    this.reconnectDelay = options.reconnectDelay || 1000; // 基础重连间隔 ms
    this.maxReconnectDelay = options.maxReconnectDelay || 30000; // 退避上限
    this.backoffFactor = options.backoffFactor || 2; // 指数因子
    this.jitter = options.jitter ?? 0.3; // 随机抖动，防雪崩
    this.maxReconnect = options.maxReconnect ?? -1; // -1 = 无限重连
    // ---- 掉线稳定期 ----
    this.stablePeriod = options.stablePeriod || 60 * 1000; // 连接存活多久算"稳定"
    this.maxDrops = options.maxDrops || 5; // 窗口内掉线次数上限
    // ---- 心跳 ----
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.heartbeatTimeout = options.heartbeatTimeout || 10000;
    this.heartbeatMsg = options.heartbeatMsg || 'ping';
    // ---- 连接超时兜底 ----
    this.connectTimeout = options.connectTimeout || 15000;

    this.transport = null; // 当前底层连接（浏览器 ws / uni SocketTask）
    this.isConnected = false;
    this.manualClose = false;

    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
    this.reconnectTimer = null;
    this.connectTimeoutTimer = null;

    this.reconnectCount = 0; // 本轮连续重连次数（成功后清零）
    this.dropCount = 0; // 窗口内"连上又掉"的次数
    this.lastDropTime = 0; // 仅统计展示用
    this.connectedAt = 0; // 本次连接建立时间
    this.dropCycle = 0; // 连接周期号，每次 connect() / close() 递增
    this.handledCycle = 0; // 已处理过掉线的周期号 → 同周期幂等

    // 事件缓存：重连后底层连接会替换，监听必须自己维护才不会丢失
    this.events = {
      open: [], message: [], close: [], error: [],
      reconnect: [], reconnecting: [], fail: []
    };
  }

  // ============ 事件系统（on/off 为主 API；addEventListener 为 DOM 风格别名，无兼容需求可删） ============
  on(event, fn) {
    if (this.events[event]) this.events[event].push(fn);
    return this;
  }
  off(event, fn) {
    if (!this.events[event]) return this;
    const list = this.events[event];
    const index = list.findIndex(cb => cb === fn || cb._origin === fn);
    if (index > -1) list.splice(index, 1);
    return this;
  }
  once(event, fn) {
    if (!this.events[event]?.some(cb => cb === fn || cb._origin === fn)) {
      const w = (...args) => {
        this.off(event, w);
        fn(...args);
      };
      w._origin = fn;
      this.on(event, w);
    }
    return this;
  }
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
  addEventListener(event, fn) {
    return this.on(event, fn);
  }
  removeEventListener(event, fn) {
    return this.off(event, fn);
  }

  // ============ 连接 ============
  connect() {
    // 手动 connect 时清掉挂起的重连定时器，防止它稍后反杀这条新连接
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearConnectTimeout(); // 清掉上一周期可能残留的超时定时器

    // 替换旧实例：先摘引用、复位状态、停心跳、摘回调，再关闭旧传输。
    // 否则连接存活时外部调 connect()：isConnected 仍为 true，旧心跳会对
    // CONNECTING 状态的新连接调 send()，挂起的心跳超时定时器还会误杀新连接。
    // uni 无法摘回调，由新回调的身份比对兜底；浏览器走显式 unbind。
    if (this.transport) {
      const oldTransport = this.transport;
      this.transport = null;
      this.isConnected = false;
      this.stopHeartbeat();
      this.adapter.unbind(oldTransport);
      try {
        this.adapter.close(oldTransport, 1000, 'reconnect');
      } catch (e) {}
    }

    this.manualClose = false;
    const cycle = (this.dropCycle = this.dropCycle + 1);

    let transport;
    try {
      // 无效 URL / 创建失败 / 返回无效对象，适配器契约要求抛错
      transport = this.adapter.create(this.url);
    } catch (e) {
      this.handleDrop(cycle, { type: 'connectError', url: this.url, event: e });
      return this;
    }
    // 防御：契约要求 create 抛错，但兜底处理静默返回空值的不良自定义适配器
    if (transport == null) {
      this.handleDrop(cycle, {
        type: 'connectError',
        url: this.url,
        event: new Error('adapter.create returned no transport')
      });
      return this;
    }
    this.transport = transport;

    // 连接超时兜底：CONNECTING 挂死（不 open 不 error 不 close）时判死。
    // 直接走 handleDrop（而非只 close 等 close 回调），规避"个别平台对未打开的
    // 连接调 close 不触发任何回调"导致的永久卡死
    this.connectTimeoutTimer = setTimeout(() => {
      if (transport !== this.transport || this.isConnected || this.manualClose) return;
      console.warn('Connect timeout');
      this.handleDrop(cycle, { type: 'connectTimeout', url: this.url });
      try {
        this.adapter.close(transport);
      } catch (e) {}
    }, this.connectTimeout);

    try {
      this.adapter.bind(transport, {
        open: ev => {
          if (transport !== this.transport) return;
          // [修] close() 只递增周期不换 transport，身份比对拦不住迟到的 open：
          // uni 怪癖平台对 CONNECTING 中的连接 close() 后 open 仍可能送达，
          // 不拦会导致已手动关闭的连接上发心跳 + 假 open 事件
          if (this.manualClose) return;
          this.clearConnectTimeout();
          // 超时判定与 open 竞态：该周期实际连上了，撤销超时路径已调度的重连
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          if (this.handledCycle === cycle) this.handledCycle = 0;
          const isReconnect = this.reconnectCount > 0; // 先记录，再重置
          this.isConnected = true;
          this.connectedAt = Date.now();
          this.reconnectCount = 0;
          console.log('Connection established');
          this.emit('open', ev);
          if (isReconnect) {
            console.log('Reconnected successfully');
            this.emit('reconnect', ev); // 与 'open' 同形，透传原生事件
          }
          this.startHeartbeat();
        },
        message: ev => {
          if (transport !== this.transport) return; // 迟到消息不得重置新连接的心跳超时
          this.clearHeartbeatTimeout(); // 收到任何消息即视为存活
          this.emit('message', ev);
        },
        close: ev => {
          if (transport !== this.transport) return;
          this.clearConnectTimeout();
          this.isConnected = false;
          this.stopHeartbeat();
          this.transport = null; // 死引用在此清理；手动关闭的 'close' 事件已正常 emit，两不误
          console.log('Connection closed');
          this.emit('close', ev);
          if (this.manualClose) return;
          this.handleDrop(cycle);
        },
        error: ev => {
          if (transport !== this.transport) return;
          this.clearConnectTimeout();
          console.error('WebSocket error:', ev);
          this.emit('error', ev);
          // 必须先复位再 handleDrop：否则 reconnect() 会因 isConnected 仍为
          // true 而返回 false，且随后的 close 被幂等拦截 → 永不重连
          this.isConnected = false;
          this.stopHeartbeat();
          if (!this.manualClose) {
            this.handleDrop(cycle, { type: 'connectError', url: this.url, event: ev });
          }
          try {
            this.adapter.close(transport, 1000, 'error');
          } catch (e) {}
        }
      });
    } catch (e) {
      // [加固] bind 抛错（自定义适配器实现缺陷等）不得逃逸到调用方：
      // 清理中间状态后走统一掉线流程
      this.clearConnectTimeout();
      this.transport = null;
      try {
        this.adapter.close(transport);
      } catch (e2) {}
      this.handleDrop(cycle, { type: 'connectError', url: this.url, event: e });
      return this;
    }
    return this;
  }

  // ============ 掉线统计 + 重连调度 ============
  /** 唯一掉线入口：error / close / 超时多路触发时，同周期只处理一次 */
  handleDrop(cycle, failInfo) {
    if (this.manualClose) return;
    if (cycle !== this.dropCycle) return; // 双保险（正常已被身份比对拦截）
    if (this.handledCycle === cycle) return; // 本周期已处理：error 后的 close 进不来
    this.handledCycle = cycle;

    const wasEverConnected = this.connectedAt > 0;
    const uptime = wasEverConnected ? Date.now() - this.connectedAt : 0; // 先取值再清零
    this.connectedAt = 0; // 清零：重连失败不会误计为"连上又掉"

    if (wasEverConnected) {
      if (uptime >= this.stablePeriod) this.dropCount = 0; // 稳定连接重开统计窗口
      this.dropCount++;
      this.lastDropTime = Date.now();
      console.warn(`Drop #${this.dropCount} (uptime ${(uptime / 1000).toFixed(1)}s)`);
      // 注：> 判定 = 窗口内实际允许 maxDrops 次重连、第 maxDrops+1 次终止，需严格语义改 >=
      if (this.dropCount > this.maxDrops) {
        this.emit('fail', {
          type: 'tooManyDrops',
          dropCount: this.dropCount,
          stablePeriod: this.stablePeriod,
          willRetry: false
        });
        this.dropCount = 0; // 终止后清零，留给下次手动 connect 重新开始
        return; // 幂等标记已生效，随后 close 事件无法绕过停机
      }
    }
    const willRetry = this.reconnect();
    if (failInfo) this.emit('fail', { ...failInfo, willRetry }); // willRetry 为真实结果
  }

  reconnect() {
    // 用拦截而非"清掉旧定时器再重排"：重排会推迟已调度的重连
    if (this.isConnected || this.reconnectTimer) return false;
    if (this.maxReconnect !== -1 && this.reconnectCount >= this.maxReconnect) {
      console.log(`已到达最大重连次数(${this.maxReconnect})，停止重连`);
      this.emit('fail', { type: 'maxReconnect', maxReconnect: this.maxReconnect, url: this.url, willRetry: false });
      return false;
    }
    const delay = this.getBackoffDelay();
    this.reconnectCount += 1;
    console.log(`Reconnecting in ${(delay / 1000).toFixed(1)}s... count:${this.reconnectCount}`);
    this.emit('reconnecting', { delay, count: this.reconnectCount });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null; // 关键
      this.connect();
    }, delay);
    return true;
  }

  /** 指数退避 + 抖动：base * factor^n，封顶 maxReconnectDelay */
  getBackoffDelay() {
    const n = Math.max(this.reconnectCount, 0);
    let delay = this.reconnectDelay * Math.pow(this.backoffFactor, n);
    delay = Math.min(delay, this.maxReconnectDelay);
    if (this.jitter > 0) delay += (Math.random() * 2 - 1) * delay * this.jitter;
    return Math.max(Math.round(delay), 100);
  }

  // ============ 发送 / 心跳 ============
  send(message) {
    if (this.isConnected && this.transport) {
      this.adapter.send(this.transport, message);
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
    // 捕获当前连接：触发时若连接已被替换，不误杀新连接
    const transport = this.transport;
    this.heartbeatTimeoutTimer = setTimeout(() => {
      if (transport !== this.transport || !this.isConnected) return;
      console.warn('Heartbeat timeout, connection dead');
      // [加固] 与连接超时同理直接走 handleDrop：规避个别平台对已死连接
      // close() 不触发 close 回调导致的永久卡死。先复位 isConnected，
      // 否则 reconnect() 会因 isConnected 仍为 true 而拒绝重连
      this.isConnected = false;
      this.stopHeartbeat();
      this.handleDrop(this.dropCycle, { type: 'heartbeatTimeout' });
      try {
        this.adapter.close(transport, 1000, 'heartbeat');
      } catch (e) {}
    }, this.heartbeatTimeout);
  }
  clearHeartbeatTimeout() {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }
  clearConnectTimeout() {
    if (this.connectTimeoutTimer) {
      clearTimeout(this.connectTimeoutTimer);
      this.connectTimeoutTimer = null;
    }
  }

  // ============ 手动关闭 ============
  close(code = 1000, reason = '') {
    this.manualClose = true; // 手动关闭，抑制重连
    this.isConnected = false; // [修] 立即复位，不等 close 回调送达：期间 getStats()/send() 不再撒谎
    this.stopHeartbeat();
    this.clearConnectTimeout();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectCount = 0;
    this.dropCount = 0;
    this.connectedAt = 0;
    this.dropCycle = this.dropCycle + 1; // 使所有挂起的旧周期回调（超时/迟到 close 等）全部失效
    // 不在此置空 transport：close 回调会正常 emit('close') 并顺带清理引用
    if (this.transport) {
      try {
        this.adapter.close(this.transport, code, reason);
      } catch (e) {
        try {
          this.adapter.close(this.transport);
        } catch (e2) {}
      }
    }
  }

  getStats() {
    return {
      connected: this.isConnected,
      reconnectCount: this.reconnectCount,
      dropCount: this.dropCount,
      lastDropTime: this.lastDropTime,
      uptime: this.isConnected ? Date.now() - this.connectedAt : 0
    };
  }
}

// ==================== 平台子类 ====================

/** uni-app 版：显式换用 SocketTask 适配器，其余逻辑完全复用核心 */
class UniWebSocketClient extends WebSocketClient {
  constructor(url, options = {}) {
    super(url, options, UniWebSocketAdapter);
  }
}

// ==================== 迁移注意（相对两份原版） ====================
// 1. 'reconnect' 事件统一为透传原生事件（与 'open' 同形）：
//    原 uni 版监听 ({ event }) => ... 需改为 ev => ...
// 2. resetHeartbeatTimeout 已删除（它是 clearHeartbeatTimeout 的纯转发），外部如有调用同名替换
// 3. 心跳超时新增 fail 事件 { type: 'heartbeatTimeout', willRetry }
// 4. Node 等无 WebSocket/uni 全局的环境：必须传 options.adapter，否则 create 抛错进入重连循环

export { BrowserWebSocketAdapter, UniWebSocketAdapter, UniWebSocketClient };
export default WebSocketClient;

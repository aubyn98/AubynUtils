export class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (typeof this.events[event] !== 'object') {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!listener) return delete this.events[event];
    const list = this.events[event];
    if (typeof list !== 'object') return;
    // 支持 off 原始函数来移除 once 的 wrapper
    const idx = list.findIndex(cb => cb === listener || cb._origin === listener);
    if (idx > -1) {
      list.splice(idx, 1);
    }
  }

  emit(event, ...args) {
    const list = this.events[event];
    if (typeof list !== 'object') return;
    // 拷贝一份遍历，回调中增删监听不影响本次派发
    list.slice().forEach(cb => {
      try {
        cb.apply(this, args);
      } catch (e) {
        console.error(`[${event}] listener error:`, e);
      }
    });
  }

  once(event, listener) {
    // 去重：同一函数不重复注册
    const list = this.events[event];
    if (typeof list === 'object' && list.some(cb => cb === listener || cb._origin === listener)) {
      return () => this.off(event, listener);
    }
    const wrapper = (...args) => {
      // 先移除再执行
      this.off(event, wrapper);
      listener.apply(this, args);
    };
    wrapper._origin = listener;
    this.on(event, wrapper);
    // 返回取消函数，支持提前移除
    return () => this.off(event, listener);
  }
}

export const eventBus = new EventBus();

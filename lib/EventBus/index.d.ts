export declare class EventBus {
  /** 内部事件表（event -> listener[]），不建议外部直接操作 */
  events: Record<string, Array<(...args: any[]) => any>>;
  constructor();
  /**
   * 注册事件监听
   * @returns 取消函数，调用后移除该监听
   */
  on(event: string, listener: (...args: any[]) => any): () => void;
  /**
   * 移除事件监听；不传 listener 时清空该事件的所有监听
   */
  off(event: string, listener?: (...args: any[]) => any): void;
  /** 触发事件，监听器内异常不会中断其他监听器 */
  emit(event: string, ...args: any[]): void;
  /**
   * 注册只触发一次的事件监听，触发后自动移除；
   * 支持用 off(event, fn) 传入原始函数提前移除
   * @returns 取消函数
   */
  once(event: string, listener: (...args: any[]) => any): () => void;
}
export declare const eventBus: InstanceType<typeof EventBus>;
export default EventBus;

export class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url
    this.reconnectDelay = options.reconnectDelay || 1000 // 重连间隔时间
    this.heartbeatInterval = options.heartbeatInterval || 60000 // 心跳间隔时间
    this.heartbeatMsg = options.heartbeatMsg || 'ping' // 心跳消息
    this.ws = null
    this.isConnected = false
    this.heartbeatTimer = null
    this.reconnectTimer = null
  }

  connect() {
    const ws = (this.ws = new WebSocket(this.url))

    ws.addEventListener('open', () => {
      this.isConnected = true
      console.log('Connection established')
      this.startHeartbeat()
    })

    ws.addEventListener('close', () => {
      this.isConnected = false
      console.log('Connection closed')
      this.reconnect()
    })

    ws.addEventListener('error', event => {
      console.error('WebSocket error: ' + event)
      this.ws.close()
    })
    return this
  }

  addEventListener(event, fn, options) {
    this.ws.addEventListener(event, fn, options)
    return this
  }

  removeEventListener(event, fn, options) {
    this.ws.removeEventListener(event, fn, options)
    return this
  }

  send(message) {
    if (this.isConnected) {
      this.ws.send(message)
    } else {
      console.error('WebSocket is not connected')
    }
    return this
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send(this.heartbeatMsg)
      }
    }, this.heartbeatInterval)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  reconnect() {
    if (!this.isConnected) {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
      console.log(`Reconnecting in ${this.reconnectDelay / 1000} seconds...`)
      this.reconnectTimer = setTimeout(() => {
        this.connect()
      }, this.reconnectDelay)
    }
  }

  close(code, reason) {
    this.ws.close(code, reason)
  }
}

export default WebSocketClient

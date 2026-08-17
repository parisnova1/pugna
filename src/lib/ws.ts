const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const WS_BASE = API_BASE.replace(/^http/, 'ws')

/**
 * Subscribes to an event's audience room and calls onUpdate on every
 * bracket:update broadcast. Reconnects with exponential backoff (capped at
 * 15s) if the connection drops. Returns an unsubscribe function.
 */
export function subscribeToEvent(token: string, onUpdate: (weightClassId: number) => void): () => void {
  let socket: WebSocket | null = null
  let closed = false
  let retryDelay = 1000
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  function connect() {
    if (closed) return
    socket = new WebSocket(WS_BASE)

    socket.onopen = () => {
      retryDelay = 1000
      socket?.send(JSON.stringify({ type: 'subscribe', token }))
    }

    socket.onmessage = event => {
      try {
        const msg = JSON.parse(event.data)
        if (msg?.type === 'bracket:update' && typeof msg.weightClassId === 'number') {
          onUpdate(msg.weightClassId)
        }
      } catch {
        // ignore malformed message
      }
    }

    socket.onclose = () => {
      if (closed) return
      retryTimer = setTimeout(connect, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 15000)
    }
  }

  connect()

  return () => {
    closed = true
    if (retryTimer) clearTimeout(retryTimer)
    socket?.close()
  }
}

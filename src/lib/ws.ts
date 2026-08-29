const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const WS_BASE = API_BASE.replace(/^http/, 'ws')

// Every message shape ever broadcast into an event's audience room. Extend
// this union (and the matching one in the mobile app's lib/ws.ts) whenever
// the backend's ws.js gains a new broadcast* function.
export type EventMessage =
  | { type: 'bracket:update'; weightClassId: number }
  | { type: 'bout:live'; boutId: number; weightClassId: number }
  | { type: 'bout:result'; boutId: number; weightClassId: number; winnerId: number; method: string }
  | { type: 'event:status'; status: string }

/**
 * Subscribes to an event's audience room and calls onMessage on every
 * broadcast. Reconnects with exponential backoff (capped at 15s) if the
 * connection drops. Returns an unsubscribe function.
 */
export function subscribeToEvent(token: string, onMessage: (msg: EventMessage) => void): () => void {
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
        if (msg?.type) onMessage(msg as EventMessage)
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

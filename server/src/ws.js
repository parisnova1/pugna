import { WebSocketServer } from 'ws'

// token (event.qr_token) -> Set<WebSocket>, one room per event's public audience page.
const rooms = new Map()

function leaveRoom(ws) {
  if (!ws.roomToken) return
  const set = rooms.get(ws.roomToken)
  set?.delete(ws)
  if (set && set.size === 0) rooms.delete(ws.roomToken)
  ws.roomToken = null
}

export function attachWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', ws => {
    ws.on('message', raw => {
      let msg
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (msg?.type === 'subscribe' && typeof msg.token === 'string' && msg.token) {
        leaveRoom(ws)
        ws.roomToken = msg.token
        if (!rooms.has(msg.token)) rooms.set(msg.token, new Set())
        rooms.get(msg.token).add(ws)
      }
    })
    ws.on('close', () => leaveRoom(ws))
  })

  return wss
}

function broadcast(token, payload) {
  const set = rooms.get(token)
  if (!set) return
  const message = JSON.stringify(payload)
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) ws.send(message)
  }
}

export function broadcastBracketUpdate(token, weightClassId) {
  broadcast(token, { type: 'bracket:update', weightClassId })
}

export function broadcastBoutResult(token, { boutId, weightClassId, winnerId, method }) {
  broadcast(token, { type: 'bout:result', boutId, weightClassId, winnerId, method })
}

export function broadcastBoutLive(token, { boutId, weightClassId }) {
  broadcast(token, { type: 'bout:live', boutId, weightClassId })
}

export function broadcastEventStatus(token, status) {
  broadcast(token, { type: 'event:status', status })
}

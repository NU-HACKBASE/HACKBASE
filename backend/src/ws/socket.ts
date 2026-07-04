import type { WSContext } from 'hono/ws'

export type ServerMessage = {
  type: string
  payload?: unknown
}

const sendJson = (ws: WSContext, message: ServerMessage) => {
  ws.send(JSON.stringify(message))
}

export const createWebSocketHandler = () => {
  return {
    onOpen(_event: Event, ws: WSContext) {
      sendJson(ws, {
        type: 'connected',
        payload: {
          message: 'WebSocket connected',
          timestamp: new Date().toISOString(),
        },
      })
    },
    onMessage(event: MessageEvent, ws: WSContext) {
      sendJson(ws, {
        type: 'echo',
        payload: {
          received: event.data,
          timestamp: new Date().toISOString(),
        },
      })
    },
    onClose() {
      console.log('WebSocket closed')
    },
    onError(error: Event) {
      console.error('WebSocket error', error)
    },
  }
}

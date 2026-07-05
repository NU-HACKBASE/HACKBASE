import type { WSContext } from 'hono/ws'

import { chatHub } from './hub.js'

export type ServerMessage = {
  type: string
  payload?: unknown
}

const sendJson = (ws: WSContext, message: ServerMessage) => {
  ws.send(JSON.stringify(message))
}

const parseClientMessage = (raw: unknown): { type: string; payload?: Record<string, unknown> } => {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (!parsed || typeof parsed !== 'object' || typeof (parsed as { type?: unknown }).type !== 'string') {
    throw new Error('Invalid message')
  }

  return parsed as { type: string; payload?: Record<string, unknown> }
}

export const createWebSocketHandler = () => {
  return {
    onOpen(_event: Event, ws: WSContext) {
      chatHub.addClient(ws)

      sendJson(ws, {
        type: 'connected',
        payload: {
          message: 'WebSocket connected',
          timestamp: new Date().toISOString(),
        },
      })
    },
    onMessage(event: MessageEvent, ws: WSContext) {
      try {
        const message = parseClientMessage(event.data)

        if (message.type === 'room.subscribe') {
          const roomId = message.payload?.roomId

          if (typeof roomId !== 'string' || !roomId) {
            throw new Error('roomId is required')
          }

          chatHub.subscribe(ws, roomId)

          sendJson(ws, {
            type: 'room.subscribed',
            payload: {
              roomId,
              timestamp: new Date().toISOString(),
            },
          })

          return
        }

        if (message.type === 'room.unsubscribe') {
          const roomId = message.payload?.roomId

          if (typeof roomId === 'string' && roomId) {
            chatHub.unsubscribe(ws, roomId)
          }

          return
        }

        sendJson(ws, {
          type: 'error',
          payload: {
            code: 'UNSUPPORTED_MESSAGE',
            message: `Unsupported message type: ${message.type}`,
          },
        })
      } catch {
        sendJson(ws, {
          type: 'error',
          payload: {
            code: 'INVALID_MESSAGE',
            message: 'Request body must be valid JSON with a type field',
          },
        })
      }
    },
    onClose(_event: CloseEvent, ws: WSContext) {
      chatHub.removeClient(ws)
    },
    onError(error: Event) {
      console.error('WebSocket error', error)
    },
  }
}

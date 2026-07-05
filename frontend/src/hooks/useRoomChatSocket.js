import { useEffect, useRef } from 'react'

import { normalizeChat } from '../lib/chatApi'
import { wsUrl } from '../lib/config'

export function useRoomChatSocket(roomId, handlers = {}) {
  const handlersRef = useRef(handlers)

  handlersRef.current = handlers

  useEffect(() => {
    if (!roomId) {
      return undefined
    }

    let closed = false
    let reconnectTimerId = null
    let reconnectAttempts = 0
    let socket = null

    const connect = () => {
      if (closed) {
        return
      }

      socket = new WebSocket(wsUrl)

      socket.addEventListener('open', () => {
        reconnectAttempts = 0
        socket.send(
          JSON.stringify({
            type: 'room.subscribe',
            payload: { roomId },
          }),
        )
      })

      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data)
          const currentHandlers = handlersRef.current

          switch (message.type) {
            case 'chat.created':
              currentHandlers.onChatCreated?.(normalizeChat(message.payload))
              break
            case 'chat.updated':
              currentHandlers.onChatUpdated?.(normalizeChat(message.payload))
              break
            case 'chat.deleted': {
              const chatId = message.payload?.chatId

              if (chatId) {
                currentHandlers.onChatDeleted?.(chatId)
              }

              break
            }
            default:
              break
          }
        } catch {
          // Ignore malformed realtime messages and keep the socket alive.
        }
      })

      socket.addEventListener('close', () => {
        if (closed || reconnectAttempts >= 5) {
          return
        }

        reconnectAttempts += 1
        reconnectTimerId = window.setTimeout(connect, Math.min(1000 * reconnectAttempts, 5000))
      })
    }

    connect()

    return () => {
      closed = true

      if (reconnectTimerId) {
        window.clearTimeout(reconnectTimerId)
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'room.unsubscribe',
            payload: { roomId },
          }),
        )
      }

      socket?.close()
    }
  }, [roomId])
}

function upsertChat(currentChats, nextChat) {
  const chatId = nextChat?.id

  if (!chatId) {
    return currentChats
  }

  const index = currentChats.findIndex((chat) => chat.id === chatId)

  if (index === -1) {
    return [...currentChats, nextChat]
  }

  return currentChats.map((chat) => (chat.id === chatId ? { ...chat, ...nextChat } : chat))
}

export function mergeRealtimeChat(currentChats, nextChat) {
  return upsertChat(currentChats, nextChat)
}

export function removeRealtimeChat(currentChats, chatId) {
  return currentChats.filter((chat) => chat.id !== chatId)
}

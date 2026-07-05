import { useEffect, useRef, useState } from 'react'

import { normalizeChat } from '../lib/chatApi'
import { wsUrl } from '../lib/config'

export function useRoomChatSocket(roomId, handlers = {}) {
  const handlersRef = useRef(handlers)
  const [status, setStatus] = useState(() => (roomId ? 'connecting' : 'idle'))
  const [error, setError] = useState('')

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

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

      setStatus(reconnectAttempts > 0 ? 'reconnecting' : 'connecting')
      setError('')
      socket = new WebSocket(wsUrl)

      socket.addEventListener('open', () => {
        reconnectAttempts = 0
        setStatus('subscribing')
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
            case 'room.subscribed':
              if (message.payload?.roomId === roomId) {
                setStatus('connected')
              }
              break
            case 'error':
              setStatus('error')
              setError(message.payload?.message ?? 'WebSocket error')
              break
            case 'chat.created':
              currentHandlers.onChatCreated?.(normalizeRealtimeChat(message.payload))
              break
            case 'chat.updated':
              currentHandlers.onChatUpdated?.(normalizeRealtimeChat(message.payload))
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
          if (!closed) {
            setStatus('disconnected')
          }
          return
        }

        reconnectAttempts += 1
        setStatus('reconnecting')
        reconnectTimerId = window.setTimeout(connect, Math.min(1000 * reconnectAttempts, 5000))
      })

      socket.addEventListener('error', () => {
        setStatus('error')
        setError('WebSocket connection failed')
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

  return { error, status }
}

function normalizeRealtimeChat(payload) {
  const chat = normalizeChat(payload)

  if (!chat.id) {
    throw new Error('Realtime chat payload did not include an id')
  }

  return chat
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

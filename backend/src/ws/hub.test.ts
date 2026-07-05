import assert from 'node:assert/strict'
import test from 'node:test'

import type { WSContext } from 'hono/ws'

import { WebSocketHub } from './hub.js'

function createMockWs() {
  const sent: string[] = []

  return {
    sent,
    ws: {
      send: (data: string) => {
        sent.push(data)
      },
    } as unknown as WSContext,
  }
}

test('WebSocketHub broadcasts chat events to subscribed clients in the same room', () => {
  const hub = new WebSocketHub()
  const roomA = createMockWs()
  const roomB = createMockWs()

  hub.addClient(roomA.ws)
  hub.addClient(roomB.ws)
  hub.subscribe(roomA.ws, 'room-1')
  hub.subscribe(roomB.ws, 'room-2')

  hub.broadcastToRoom('room-1', {
    type: 'chat.created',
    payload: { chatId: 'chat-1', roomId: 'room-1', body: 'hello' },
  })

  assert.equal(roomA.sent.length, 1)
  assert.equal(roomB.sent.length, 0)
  assert.match(roomA.sent[0], /chat\.created/)
})

test('WebSocketHub removes clients on disconnect', () => {
  const hub = new WebSocketHub()
  const client = createMockWs()

  hub.addClient(client.ws)
  hub.subscribe(client.ws, 'room-1')
  hub.removeClient(client.ws)

  hub.broadcastToRoom('room-1', {
    type: 'chat.updated',
    payload: { chatId: 'chat-1' },
  })

  assert.equal(client.sent.length, 0)
})

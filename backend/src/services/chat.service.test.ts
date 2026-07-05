import assert from 'node:assert/strict'
import test from 'node:test'

import type { ChatRepository } from '../repositories/chat.repository.js'
import type { RoomRepository } from '../repositories/room.repository.js'
import { WebSocketHub, type HubMessage } from '../ws/hub.js'
import { ChatService } from './chat.service.js'

const userSession = { userId: 'user-1', role: 'anonymous' as const }
const otherUserSession = { userId: 'user-2', role: 'anonymous' as const }
const adminSession = { userId: 'admin', role: 'admin' as const }

const room = {
  roomId: 'room-1',
  eventId: 'event-1',
  title: 'Main',
  heat: 0,
  summary: '',
  participants: 0,
  createdAt: '2026-07-04T00:00:00.000Z',
}

const chat = {
  chatId: 'chat-1',
  eventId: 'event-1',
  roomId: 'room-1',
  userId: 'user-1',
  userName: 'user-1',
  body: 'hello',
  likedCount: 0,
  createdAt: '2026-07-04T00:00:00.000Z',
  updatedAt: null,
}

function createService(options: { roomExists?: boolean } = {}) {
  const calls: { createInput?: unknown; deleteChatId?: string; listLimit?: number } = {}
  const broadcasts: HubMessage[] = []
  const hub = new WebSocketHub()
  const originalBroadcast = hub.broadcastToRoom.bind(hub)

  hub.broadcastToRoom = (roomId, message) => {
    broadcasts.push(message)
    originalBroadcast(roomId, message)
  }
  const roomRepository = {
    findById: async () => (options.roomExists === false ? null : room),
  } satisfies Partial<RoomRepository>
  const chatRepository = {
    create: async (input) => {
      calls.createInput = input

      return {
        ...chat,
        body: input.body,
        eventId: input.eventId,
        roomId: input.roomId,
        userId: input.userId,
      }
    },
    listByRoomId: async (_roomId, limit) => {
      calls.listLimit = limit

      return [chat]
    },
    findById: async () => chat,
    update: async (_chatId, body) => ({ ...chat, body }),
    delete: async (chatId) => {
      calls.deleteChatId = chatId
    },
    like: async () => ({ ...chat, likedCount: 1 }),
    unlike: async () => chat,
  } satisfies Partial<ChatRepository>
  const service = new ChatService(
    roomRepository as unknown as RoomRepository,
    chatRepository as unknown as ChatRepository,
    hub,
  )

  return { broadcasts, calls, hub, service }
}

test('ChatService creates a chat in an existing room and trims body', async () => {
  const { calls, service } = createService()

  const created = await service.createChat(userSession, 'room-1', {
    body: '  hello  ',
  })

  assert.equal(created.body, 'hello')
  assert.deepEqual(calls.createInput, {
    eventId: 'event-1',
    roomId: 'room-1',
    userId: 'user-1',
    body: 'hello',
  })
})

test('ChatService rejects blank chat bodies', async () => {
  const { service } = createService()

  await assert.rejects(() => service.createChat(userSession, 'room-1', { body: '   ' }), {
    status: 400,
    code: 'VALIDATION_ERROR',
  })
})

test('ChatService rejects missing rooms', async () => {
  const { service } = createService({ roomExists: false })

  await assert.rejects(() => service.listChats('missing-room'), {
    status: 404,
    code: 'ROOM_NOT_FOUND',
  })
})

test('ChatService allows the author to update a chat', async () => {
  const { service } = createService()

  const updated = await service.updateChat(userSession, 'chat-1', {
    body: 'updated',
  })

  assert.equal(updated?.body, 'updated')
})

test('ChatService rejects update by another anonymous user', async () => {
  const { service } = createService()

  await assert.rejects(
    () =>
      service.updateChat(otherUserSession, 'chat-1', {
        body: 'updated',
      }),
    {
      status: 403,
      code: 'FORBIDDEN',
    },
  )
})

test('ChatService allows admin to delete another user chat', async () => {
  const { calls, service } = createService()

  await service.deleteChat(adminSession, 'chat-1')

  assert.equal(calls.deleteChatId, 'chat-1')
})

test('ChatService clamps chat list limit to 100', async () => {
  const { calls, service } = createService()

  await service.listChats('room-1', 1000)

  assert.equal(calls.listLimit, 100)
})

test('ChatService broadcasts chat.created after creating a chat', async () => {
  const { broadcasts, service } = createService()

  await service.createChat(userSession, 'room-1', { body: 'hello' })

  assert.equal(broadcasts.length, 1)
  assert.equal(broadcasts[0]?.type, 'chat.created')
})

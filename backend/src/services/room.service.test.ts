import assert from 'node:assert/strict'
import test from 'node:test'

import type { ChatRepository } from '../repositories/chat.repository.js'
import type { EventRepository } from '../repositories/event.repository.js'
import type { RoomRepository } from '../repositories/room.repository.js'
import { ApiError } from '../utils/api-error.js'
import type { AuthService } from './auth.service.js'
import { RoomService } from './room.service.js'

const adminSession = { userId: 'admin', role: 'admin' as const }
const anonymousSession = { userId: 'user-1', role: 'anonymous' as const }

const event = {
  eventId: 'event-1',
  title: 'Event',
  address: 'Tokyo',
  latitude: null,
  longitude: null,
  radius: 100,
  heat: 0,
  participants: 0,
  startsAt: null,
  managerId: 'admin',
  createdAt: '2026-07-04T00:00:00.000Z',
}

const room = {
  roomId: 'room-1',
  eventId: 'event-1',
  title: 'Main',
  heat: 0,
  summary: '',
  participants: 0,
  createdAt: '2026-07-04T00:00:00.000Z',
}

function createService(options: { roomExists?: boolean; chats?: Awaited<ReturnType<ChatRepository['listByRoomId']>> } = {}) {
  const calls: { updateInput?: unknown; deletedRoomId?: string; analysisInput?: unknown } = {}
  const eventRepository = {
    findById: async (eventId) => (eventId === 'event-1' ? event : null),
  } satisfies Partial<EventRepository>
  const roomRepository = {
    create: async (input) => ({ ...room, ...input, roomId: 'room-1' }),
    listByEventId: async () => [room],
    findById: async () => (options.roomExists === false ? null : room),
    update: async (roomId, input) => {
      calls.updateInput = { roomId, ...input }

      return { ...room, ...input, roomId }
    },
    updateAnalysis: async (roomId, input) => {
      calls.analysisInput = { roomId, ...input }

      return { ...room, ...input, roomId }
    },
    delete: async (roomId) => {
      calls.deletedRoomId = roomId

      return true
    },
  } satisfies Partial<RoomRepository>
  const chatRepository = {
    listByRoomId: async () => options.chats ?? [],
  } satisfies Partial<ChatRepository>
  const authService = {
    requireAdmin: (session) => {
      if (session.role !== 'admin') {
        throw new ApiError(403, 'FORBIDDEN', 'Admin role is required')
      }
    },
  } satisfies Partial<AuthService>
  const service = new RoomService(
    eventRepository as unknown as EventRepository,
    roomRepository as unknown as RoomRepository,
    chatRepository as unknown as ChatRepository,
    authService as unknown as AuthService,
  )

  return { calls, service }
}

test('RoomService updates a room for an admin', async () => {
  const { calls, service } = createService()

  const updated = await service.updateRoom(adminSession, 'room-1', {
    title: '  Updated Room  ',
    summary: 'New summary',
  })

  assert.equal(updated.title, 'Updated Room')
  assert.deepEqual(calls.updateInput, {
    roomId: 'room-1',
    title: 'Updated Room',
    summary: 'New summary',
  })
})

test('RoomService rejects room update without admin role', async () => {
  const { service } = createService()

  await assert.rejects(
    () =>
      service.updateRoom(anonymousSession, 'room-1', {
        title: 'Updated Room',
      }),
    {
      status: 403,
      code: 'FORBIDDEN',
    },
  )
})

test('RoomService rejects blank room title on update', async () => {
  const { service } = createService()

  await assert.rejects(
    () =>
      service.updateRoom(adminSession, 'room-1', {
        title: '   ',
      }),
    {
      status: 400,
      code: 'VALIDATION_ERROR',
    },
  )
})

test('RoomService deletes a room for an admin', async () => {
  const { calls, service } = createService()

  await service.deleteRoom(adminSession, 'room-1')

  assert.equal(calls.deletedRoomId, 'room-1')
})

test('RoomService returns not found when deleting missing room', async () => {
  const { service } = createService({ roomExists: false })

  await assert.rejects(() => service.deleteRoom(adminSession, 'missing-room'), {
    status: 404,
    code: 'ROOM_NOT_FOUND',
  })
})

test('RoomService analyzes a room for an admin', async () => {
  const { calls, service } = createService({
    chats: [
      {
        chatId: 'chat-1',
        roomId: 'room-1',
        eventId: 'event-1',
        userId: 'user-1',
        body: 'Hello',
        likedCount: 2,
        createdAt: '2026-07-04T00:00:00.000Z',
      },
    ],
  })

  const result = await service.analyzeRoom(adminSession, 'room-1')

  assert.equal(result.analysis.heat, 16)
  assert.equal(result.analysis.summary, '最近の話題: Hello')
  assert.deepEqual(calls.analysisInput, {
    roomId: 'room-1',
    heat: 16,
    summary: '最近の話題: Hello',
  })
})

test('RoomService rejects room analysis without admin role', async () => {
  const { service } = createService()

  await assert.rejects(() => service.analyzeRoom(anonymousSession, 'room-1'), {
    status: 403,
    code: 'FORBIDDEN',
  })
})

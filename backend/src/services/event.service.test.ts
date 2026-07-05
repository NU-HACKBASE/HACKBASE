import assert from 'node:assert/strict'
import test from 'node:test'

import type { EventRepository } from '../repositories/event.repository.js'
import { ApiError } from '../utils/api-error.js'
import type { AuthService } from './auth.service.js'
import { EventService } from './event.service.js'

const adminSession = { userId: 'admin', role: 'admin' as const }
const anonymousSession = { userId: 'user-1', role: 'anonymous' as const }

function createService() {
  const event = {
    eventId: 'event-1',
    title: 'Existing Event',
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
  const calls: {
    createInput?: unknown
    listInput?: unknown
    updateInput?: unknown
    deletedEventId?: string
    joinInput?: unknown
  } = {}
  const eventRepository = {
    create: async (input) => {
      calls.createInput = input

      return {
        eventId: 'event-1',
        title: input.title,
        address: input.address ?? '',
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        radius: input.radius ?? 0,
        heat: 0,
        participants: 0,
        startsAt: input.startsAt ?? null,
        managerId: input.managerId,
        createdAt: '2026-07-04T00:00:00.000Z',
      }
    },
    list: async (input) => {
      calls.listInput = input

      return []
    },
    findById: async (eventId) => (eventId === 'event-1' ? event : null),
    update: async (eventId, input) => {
      calls.updateInput = { eventId, ...input }

      return eventId === 'event-1' ? { ...event, ...input, eventId } : null
    },
    delete: async (eventId) => {
      calls.deletedEventId = eventId

      return eventId === 'event-1'
    },
    join: async (input) => {
      calls.joinInput = input

      return {
        userId: input.userId,
        userName: input.userId,
        role: 'anonymous',
        joinedAt: '2026-07-04T00:00:00.000Z',
      }
    },
    listParticipants: async () => [],
  } satisfies Partial<EventRepository>
  const authService = {
    requireAdmin: (session) => {
      if (session.role !== 'admin') {
        throw new ApiError(403, 'FORBIDDEN', 'Admin role is required')
      }
    },
  } satisfies Partial<AuthService>
  const service = new EventService(
    eventRepository as unknown as EventRepository,
    authService as unknown as AuthService,
  )

  return { calls, service }
}

test('EventService creates an event for an admin and trims the title', async () => {
  const { calls, service } = createService()

  const event = await service.createEvent(adminSession, {
    title: '  Test Event  ',
    address: 'Tokyo',
    radius: 300,
  })

  assert.equal(event.title, 'Test Event')
  assert.equal(event.managerId, 'admin')
  assert.deepEqual(calls.createInput, {
    title: 'Test Event',
    address: 'Tokyo',
    latitude: undefined,
    longitude: undefined,
    radius: 300,
    startsAt: undefined,
    managerId: 'admin',
  })
})

test('EventService rejects event creation without admin role', async () => {
  const { service } = createService()

  await assert.rejects(
    () =>
      service.createEvent(anonymousSession, {
        title: 'Test Event',
      }),
    {
      status: 403,
      code: 'FORBIDDEN',
    },
  )
})

test('EventService rejects blank event titles', async () => {
  const { service } = createService()

  await assert.rejects(
    () =>
      service.createEvent(adminSession, {
        title: '   ',
      }),
    {
      status: 400,
      code: 'VALIDATION_ERROR',
    },
  )
})

test('EventService lists events filtered by coordinates', async () => {
  const { calls, service } = createService()

  await service.listEvents({
    latitude: 35.68,
    longitude: 139.76,
  })

  assert.deepEqual(calls.listInput, {
    latitude: 35.68,
    longitude: 139.76,
    nearbyRadiusMeters: 1000,
  })
})

test('EventService rejects incomplete event location query', async () => {
  const { service } = createService()

  await assert.rejects(
    () =>
      service.listEvents({
        latitude: 35.68,
      }),
    {
      status: 400,
      code: 'VALIDATION_ERROR',
    },
  )
})

test('EventService rejects invalid event location query values', async () => {
  const { service } = createService()

  await assert.rejects(
    () =>
      service.listEvents({
        latitude: Number.NaN,
        longitude: 139.76,
      }),
    {
      status: 400,
      code: 'VALIDATION_ERROR',
    },
  )
})

test('EventService returns not found for a missing event', async () => {
  const { service } = createService()

  await assert.rejects(() => service.getEvent('missing-event'), {
    status: 404,
    code: 'EVENT_NOT_FOUND',
  })
})

test('EventService updates an event for an admin', async () => {
  const { calls, service } = createService()

  const event = await service.updateEvent(adminSession, 'event-1', {
    title: '  Updated Event  ',
    radius: 500,
  })

  assert.equal(event.title, 'Updated Event')
  assert.deepEqual(calls.updateInput, {
    eventId: 'event-1',
    title: 'Updated Event',
    radius: 500,
  })
})

test('EventService rejects blank event title on update', async () => {
  const { service } = createService()

  await assert.rejects(
    () =>
      service.updateEvent(adminSession, 'event-1', {
        title: '   ',
      }),
    {
      status: 400,
      code: 'VALIDATION_ERROR',
    },
  )
})

test('EventService deletes an event for an admin', async () => {
  const { calls, service } = createService()

  await service.deleteEvent(adminSession, 'event-1')

  assert.equal(calls.deletedEventId, 'event-1')
})

test('EventService joins an existing event', async () => {
  const { calls, service } = createService()

  const result = await service.joinEvent(anonymousSession, 'event-1')

  assert.equal(result.event.eventId, 'event-1')
  assert.deepEqual(calls.joinInput, {
    eventId: 'event-1',
    userId: 'user-1',
  })
  assert.equal(result.participant?.userId, 'user-1')
})

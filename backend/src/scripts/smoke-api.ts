import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: new URL('../../../.env', import.meta.url), override: true })

type JsonObject = Record<string, unknown>

type SmokeContext = {
  adminToken?: string
  userToken?: string
  userId?: string
  eventId?: string
  roomId?: string
  chatId?: string
}

const apiBaseUrl = process.env.SMOKE_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? 'http://localhost:8787'
const skipAnalyze = process.env.SMOKE_SKIP_ANALYZE === '1'
const runId = `smoke-${Date.now()}`
const context: SmokeContext = {}

const supabase = createClient(
  readEnv('SUPABASE_URL'),
  readEnv('SUPABASE_SECRET_KEY'),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
)

const main = async () => {
  await step('health', async () => {
    const health = await request<JsonObject>('/health')
    assertEqual(health.status, 'ok', 'health.status')
    assertEqual((health.services as JsonObject).database, 'ok', 'health.services.database')
  })

  await step('admin login', async () => {
    const response = await request<JsonObject>('/api/v1/admin/login', {
      method: 'POST',
      expectedStatus: 200,
      body: {
        userName: 'admin',
        password: readEnv('ADMIN_PASSWORD'),
      },
    })
    context.adminToken = assertString(response.token, 'admin token')
  })

  await step('create anonymous user and read me', async () => {
    const response = await request<JsonObject>('/api/v1/users', {
      method: 'POST',
      body: {
        userName: `${runId}-user`,
      },
    })
    const user = response.user as JsonObject
    context.userId = assertString(user.userId, 'user.userId')
    context.userToken = assertString(response.token, 'user token')

    const me = await request<JsonObject>('/api/v1/users/me', {
      token: context.userToken,
    })
    assertEqual((me.user as JsonObject).userId, context.userId, 'me.user.userId')
  })

  await step('create, list, update, and read event', async () => {
    const created = await request<JsonObject>('/api/v1/events', {
      method: 'POST',
      token: context.adminToken,
      body: {
        title: `${runId}-event`,
        address: 'Smoke Test Venue',
        latitude: 35.681236,
        longitude: 139.767125,
        radius: 500,
        startsAt: new Date().toISOString(),
      },
    })
    context.eventId = assertString((created.event as JsonObject).eventId, 'event.eventId')

    const list = await request<JsonObject>('/api/v1/events')
    assertArrayIncludesId(list.events, 'eventId', context.eventId, 'events')

    const updated = await request<JsonObject>(`/api/v1/events/${context.eventId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: {
        title: `${runId}-event-updated`,
      },
    })
    assertEqual((updated.event as JsonObject).title, `${runId}-event-updated`, 'event.title')

    const read = await request<JsonObject>(`/api/v1/events/${context.eventId}`)
    assertEqual((read.event as JsonObject).eventId, context.eventId, 'read event.eventId')
  })

  await step('create, list, update, and read room', async () => {
    const created = await request<JsonObject>(`/api/v1/events/${context.eventId}/rooms`, {
      method: 'POST',
      token: context.adminToken,
      body: {
        title: `${runId}-room`,
        summary: 'Smoke room',
      },
    })
    context.roomId = assertString((created.room as JsonObject).roomId, 'room.roomId')

    const list = await request<JsonObject>(`/api/v1/events/${context.eventId}/rooms`)
    assertArrayIncludesId(list.rooms, 'roomId', context.roomId, 'rooms')

    const updated = await request<JsonObject>(`/api/v1/rooms/${context.roomId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: {
        title: `${runId}-room-updated`,
      },
    })
    assertEqual((updated.room as JsonObject).title, `${runId}-room-updated`, 'room.title')

    const read = await request<JsonObject>(`/api/v1/rooms/${context.roomId}`)
    assertEqual((read.room as JsonObject).roomId, context.roomId, 'read room.roomId')
  })

  await step('join event and list participants', async () => {
    const joined = await request<JsonObject>(`/api/v1/events/${context.eventId}/join`, {
      method: 'POST',
      token: context.userToken,
      expectedStatus: 200,
    })
    assertEqual((joined.participant as JsonObject).userId, context.userId, 'participant.userId')

    const participants = await request<JsonObject>(`/api/v1/events/${context.eventId}/participants`, {
      token: context.adminToken,
    })
    assertArrayIncludesId(participants.participants, 'userId', context.userId, 'participants')
  })

  await step(`create, list, update, like, unlike${skipAnalyze ? '' : ', analyze'}, and delete chat`, async () => {
    const created = await request<JsonObject>(`/api/v1/rooms/${context.roomId}/chats`, {
      method: 'POST',
      token: context.userToken,
      body: {
        body: `${runId} hello`,
      },
    })
    context.chatId = assertString((created.chat as JsonObject).chatId, 'chat.chatId')

    const list = await request<JsonObject>(`/api/v1/rooms/${context.roomId}/chats?limit=10`)
    assertArrayIncludesId(list.chats, 'chatId', context.chatId, 'chats')

    const updated = await request<JsonObject>(`/api/v1/chats/${context.chatId}`, {
      method: 'PATCH',
      token: context.userToken,
      body: {
        body: `${runId} hello updated`,
      },
    })
    assertEqual((updated.chat as JsonObject).body, `${runId} hello updated`, 'chat.body')

    const liked = await request<JsonObject>(`/api/v1/chats/${context.chatId}/like`, {
      method: 'PUT',
      token: context.userToken,
    })
    assertEqual((liked.chat as JsonObject).likedCount, 1, 'chat.likedCount')

    const unliked = await request<JsonObject>(`/api/v1/chats/${context.chatId}/like`, {
      method: 'DELETE',
      token: context.userToken,
    })
    assertEqual((unliked.chat as JsonObject).likedCount, 0, 'chat.likedCount')

    if (skipAnalyze) {
      console.log('skipped analyze because SMOKE_SKIP_ANALYZE=1')
    } else {
      const analyzed = await request<JsonObject>(`/api/v1/rooms/${context.roomId}/analyze`, {
        method: 'POST',
        token: context.adminToken,
        expectedStatus: 200,
      })
      assertEqual((analyzed.room as JsonObject).roomId, context.roomId, 'analyzed room.roomId')
    }

    await request<void>(`/api/v1/chats/${context.chatId}`, {
      method: 'DELETE',
      token: context.userToken,
      expectedStatus: 204,
    })
  })

  await step('delete room and event', async () => {
    await request<void>(`/api/v1/rooms/${context.roomId}`, {
      method: 'DELETE',
      token: context.adminToken,
      expectedStatus: 204,
    })
    context.roomId = undefined

    await request<void>(`/api/v1/events/${context.eventId}`, {
      method: 'DELETE',
      token: context.adminToken,
      expectedStatus: 204,
    })
    context.eventId = undefined
  })
}

try {
  await main()
  console.log('SMOKE_API_OK')
} finally {
  await cleanup()
}

async function step(name: string, run: () => Promise<void>) {
  process.stdout.write(`- ${name} ... `)
  await run()
  console.log('ok')
}

async function request<T>(
  path: string,
  options: {
    method?: string
    token?: string
    body?: unknown
    expectedStatus?: number
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {}

  if (options.body !== undefined) {
    headers['content-type'] = 'application/json'
  }

  if (options.token) {
    headers.authorization = `Bearer ${options.token}`
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  const expectedStatus = options.expectedStatus ?? (options.method === 'POST' ? 201 : 200)

  if (response.status !== expectedStatus) {
    const text = await response.text()
    throw new Error(`${options.method ?? 'GET'} ${path} returned ${response.status}: ${text}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function cleanup() {
  if (context.eventId) {
    await supabase.from('events').delete().eq('id', context.eventId)
  }

  if (context.userId) {
    await supabase.from('users').delete().eq('id', context.userId)
  }
}

function readEnv(key: string): string {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`)
  }

  return value
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${String(expected)} but got ${String(actual)}`)
  }
}

function assertArrayIncludesId(
  value: unknown,
  key: string,
  expected: string | undefined,
  label: string,
) {
  if (!expected) {
    throw new Error(`${label} expected id is missing`)
  }

  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`)
  }

  if (!value.some((item) => item && typeof item === 'object' && (item as JsonObject)[key] === expected)) {
    throw new Error(`${label} must include ${key}=${expected}`)
  }
}

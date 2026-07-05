import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { parse } from 'yaml'

import { env } from './config/env.js'
import { supabaseAdmin } from './db/supabase.js'
import { ChatHandler } from './handlers/chat.handler.js'
import { EventHandler } from './handlers/event.handler.js'
import { HealthHandler } from './handlers/health.handler.js'
import { RoomHandler } from './handlers/room.handler.js'
import { UserHandler } from './handlers/user.handler.js'
import { ChatRepository } from './repositories/chat.repository.js'
import { EventRepository } from './repositories/event.repository.js'
import { HealthRepository } from './repositories/health.repository.js'
import { RoomRepository } from './repositories/room.repository.js'
import { UserRepository } from './repositories/user.repository.js'
import { createApiRoute } from './routes/api.route.js'
import { createHealthRoute } from './routes/health.route.js'
import { AuthService } from './services/auth.service.js'
import { ChatService } from './services/chat.service.js'
import { EventService } from './services/event.service.js'
import { HealthService } from './services/health.service.js'
import { RoomService } from './services/room.service.js'
import { UserService } from './services/user.service.js'
import { ApiError, errorBody } from './utils/api-error.js'

const openApiPath = fileURLToPath(new URL('../../openapi/openapi.yaml', import.meta.url))
const allowedCorsOrigins = new Set([
  ...env.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
])

export const createApp = () => {
  const app = new Hono()
  const openApiDocument = parse(readFileSync(openApiPath, 'utf8'))

  app.use('*', logger())
  app.use(
    '*',
    cors({
      allowHeaders: ['Authorization', 'Content-Type', 'X-User-Id'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      origin: (origin) => (allowedCorsOrigins.has(origin) ? origin : null),
    }),
  )

  const healthRepository = new HealthRepository(supabaseAdmin)
  const healthService = new HealthService(healthRepository)
  const healthHandler = new HealthHandler(healthService)
  const authService = new AuthService()
  const userRepository = new UserRepository(supabaseAdmin)
  const eventRepository = new EventRepository(supabaseAdmin)
  const roomRepository = new RoomRepository(supabaseAdmin)
  const chatRepository = new ChatRepository(supabaseAdmin)
  const userService = new UserService(userRepository, authService)
  const eventService = new EventService(eventRepository, authService)
  const roomService = new RoomService(
    eventRepository,
    roomRepository,
    chatRepository,
    authService,
  )
  const chatService = new ChatService(roomRepository, chatRepository)
  const userHandler = new UserHandler(userService, authService)
  const eventHandler = new EventHandler(eventService, authService)
  const roomHandler = new RoomHandler(roomService, authService)
  const chatHandler = new ChatHandler(chatService, authService)

  app.route('/', createHealthRoute(healthHandler))
  app.route(
    '/api/v1',
    createApiRoute({
      userHandler,
      eventHandler,
      roomHandler,
      chatHandler,
    }),
  )

  app.get('/openapi.json', (c) => c.json(openApiDocument))
  app.get('/docs', swaggerUI({ url: '/openapi.json' }))

  app.notFound((c) => {
    return c.json(
      {
        message: 'Not Found',
      },
      404,
    )
  })

  app.onError((error, c) => {
    if (error instanceof ApiError) {
      return c.json(errorBody(error), { status: error.status as 400 })
    }

    console.error(error)

    return c.json(
      {
        message: 'Internal Server Error',
      },
      500,
    )
  })

  return app
}

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { parse } from 'yaml'

import { env } from './config/env.js'
import { pool } from './db/postgres.js'
import { redis } from './db/redis.js'
import { HealthHandler } from './handlers/health.handler.js'
import { HealthRepository } from './repositories/health.repository.js'
import { createHealthRoute } from './routes/health.route.js'
import { HealthService } from './services/health.service.js'

const openApiPath = fileURLToPath(new URL('../../openapi/openapi.yaml', import.meta.url))

export const createApp = () => {
  const app = new Hono()
  const openApiDocument = parse(readFileSync(openApiPath, 'utf8'))

  app.use('*', logger())
  app.use(
    '*',
    cors({
      origin: env.corsOrigin,
    }),
  )

  const healthRepository = new HealthRepository(pool, redis)
  const healthService = new HealthService(healthRepository)
  const healthHandler = new HealthHandler(healthService)

  app.route('/', createHealthRoute(healthHandler))

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

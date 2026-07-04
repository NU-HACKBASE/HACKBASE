import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'

import { createApp } from './app.js'
import { env } from './config/env.js'
import { closePostgres, pool } from './db/postgres.js'
import { closeRedis, connectRedis } from './db/redis.js'
import { ensureDatabaseSchema } from './db/schema.js'
import { createWebSocketHandler } from './ws/socket.js'

const app = createApp()
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

app.get('/ws', upgradeWebSocket(createWebSocketHandler))

await connectRedis()
await ensureDatabaseSchema(pool)

const server = serve(
  {
    fetch: app.fetch,
    hostname: env.host,
    port: env.port,
  },
  (info) => {
    console.log(`Backend running at http://${info.address}:${info.port}`)
    console.log(`Swagger UI available at http://localhost:${info.port}/docs`)
  },
)

injectWebSocket(server)

const shutdown = async () => {
  console.log('Shutting down backend')
  server.close()
  await Promise.all([closeRedis(), closePostgres()])
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

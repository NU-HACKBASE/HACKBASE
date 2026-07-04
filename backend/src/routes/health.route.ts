import { Hono } from 'hono'

import type { HealthHandler } from '../handlers/health.handler.js'

export const createHealthRoute = (healthHandler: HealthHandler) => {
  const route = new Hono()

  route.get('/health', healthHandler.getHealth)

  return route
}

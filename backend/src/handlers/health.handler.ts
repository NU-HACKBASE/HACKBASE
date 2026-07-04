import type { Context } from 'hono'

import type { HealthService } from '../services/health.service.js'

export class HealthHandler {
  constructor(private readonly healthService: HealthService) {}

  getHealth = async (c: Context) => {
    const health = await this.healthService.getHealth()
    const statusCode = health.status === 'ok' ? 200 : 503

    return c.json(health, statusCode)
  }
}

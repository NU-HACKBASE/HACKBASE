import type { DependencyStatus, HealthRepository } from '../repositories/health.repository.js'

export type HealthStatus = 'ok' | 'degraded'

export type HealthResult = {
  status: HealthStatus
  timestamp: string
  services: {
    api: 'ok'
    database: DependencyStatus
  }
}

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async getHealth(): Promise<HealthResult> {
    const database = await this.healthRepository.checkDatabase()

    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: 'ok',
        database,
      },
    }
  }
}

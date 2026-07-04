import type { DependencyStatus, HealthRepository } from '../repositories/health.repository.js'

export type HealthStatus = 'ok' | 'degraded'

export type HealthResult = {
  status: HealthStatus
  timestamp: string
  services: {
    api: 'ok'
    database: DependencyStatus
    cache: DependencyStatus
  }
}

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async getHealth(): Promise<HealthResult> {
    const [database, cache] = await Promise.all([
      this.healthRepository.checkDatabase(),
      this.healthRepository.checkCache(),
    ])

    return {
      status: database === 'ok' && cache === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: 'ok',
        database,
        cache,
      },
    }
  }
}

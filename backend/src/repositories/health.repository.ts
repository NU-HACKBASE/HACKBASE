import type pg from 'pg'

export type DependencyStatus = 'ok' | 'error'

type CacheClient = {
  ping: () => Promise<unknown>
}

export class HealthRepository {
  constructor(
    private readonly db: pg.Pool,
    private readonly cache: CacheClient,
  ) {}

  async checkDatabase(): Promise<DependencyStatus> {
    try {
      await this.db.query('select 1')
      return 'ok'
    } catch {
      return 'error'
    }
  }

  async checkCache(): Promise<DependencyStatus> {
    try {
      await this.cache.ping()
      return 'ok'
    } catch {
      return 'error'
    }
  }
}

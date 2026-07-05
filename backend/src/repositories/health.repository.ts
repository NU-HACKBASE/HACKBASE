import type { SupabaseClient } from '@supabase/supabase-js'

export type DependencyStatus = 'ok' | 'error'

export class HealthRepository {
  constructor(private readonly db: SupabaseClient) {}

  async checkDatabase(): Promise<DependencyStatus> {
    try {
      const { error } = await this.db.from('users').select('id').limit(1)

      return error ? 'error' : 'ok'
    } catch {
      return 'error'
    }
  }

}

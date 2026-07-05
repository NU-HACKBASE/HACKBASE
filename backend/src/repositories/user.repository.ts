import { randomUUID } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { UserRecord, UserRole } from '../types/api.js'
import { throwIfSupabaseError, toIsoString } from './supabase-utils.js'

type UserRow = {
  id: string
  name: string
  role: UserRole
  created_at: string
}

export class UserRepository {
  constructor(private readonly db: SupabaseClient) {}

  async createUser(input: { name?: string; role: UserRole; id?: string }): Promise<UserRecord> {
    const id = input.id ?? randomUUID()
    const name = input.name?.trim() || (input.role === 'admin' ? 'admin' : `user-${id.slice(0, 8)}`)
    const { data, error } = await this.db
      .from('users')
      .upsert(
        {
          id,
          name,
          role: input.role,
        },
        { onConflict: 'id' },
      )
      .select('id, name, role, created_at')
      .single<UserRow>()

    throwIfSupabaseError(error)

    if (!data) {
      throw new Error('Failed to create user')
    }

    return mapUser(data)
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const { data, error } = await this.db
      .from('users')
      .select('id, name, role, created_at')
      .eq('id', userId)
      .maybeSingle<UserRow>()

    throwIfSupabaseError(error)

    return data ? mapUser(data) : null
  }
}

const mapUser = (row: UserRow): UserRecord => ({
  userId: row.id,
  userName: row.name,
  role: row.role,
  createdAt: toIsoString(row.created_at),
})

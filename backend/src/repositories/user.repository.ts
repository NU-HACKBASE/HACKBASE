import { randomUUID } from 'node:crypto'

import type pg from 'pg'

import type { UserRecord, UserRole } from '../types/api.js'

type UserRow = {
  id: string
  name: string
  role: UserRole
  created_at: Date
}

export class UserRepository {
  constructor(private readonly db: pg.Pool) {}

  async createUser(input: { name?: string; role: UserRole; id?: string }): Promise<UserRecord> {
    const id = input.id ?? randomUUID()
    const name = input.name?.trim() || (input.role === 'admin' ? 'admin' : `user-${id.slice(0, 8)}`)
    const result = await this.db.query<UserRow>(
      `
        insert into users (id, name, role)
        values ($1, $2, $3)
        on conflict (id) do update
          set name = excluded.name,
              role = excluded.role
        returning id, name, role, created_at
      `,
      [id, name, input.role],
    )

    return mapUser(result.rows[0])
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRow>(
      'select id, name, role, created_at from users where id = $1',
      [userId],
    )

    return result.rows[0] ? mapUser(result.rows[0]) : null
  }
}

const mapUser = (row: UserRow): UserRecord => ({
  userId: row.id,
  userName: row.name,
  role: row.role,
  createdAt: row.created_at.toISOString(),
})

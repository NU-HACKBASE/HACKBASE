import { randomUUID } from 'node:crypto'

import type pg from 'pg'

import type { EventRecord } from '../types/api.js'

type EventRow = {
  id: string
  title: string
  address: string
  latitude: number | null
  longitude: number | null
  radius: number
  manager_id: string | null
  starts_at: Date | null
  created_at: Date
  heat: string | number
  participants: string | number
}

export class EventRepository {
  constructor(private readonly db: pg.Pool) {}

  async create(input: {
    title: string
    address?: string
    latitude?: number | null
    longitude?: number | null
    radius?: number
    managerId: string
    startsAt?: string | null
  }): Promise<EventRecord> {
    const id = randomUUID()
    const result = await this.db.query<EventRow>(
      `
        insert into events (id, title, address, latitude, longitude, radius, manager_id, starts_at)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning id, title, address, latitude, longitude, radius, manager_id, starts_at, created_at,
          0 as heat,
          0 as participants
      `,
      [
        id,
        input.title,
        input.address ?? '',
        input.latitude ?? null,
        input.longitude ?? null,
        input.radius ?? 0,
        input.managerId,
        input.startsAt ?? null,
      ],
    )

    return mapEvent(result.rows[0])
  }

  async list(input?: {
    latitude?: number
    longitude?: number
    nearbyRadiusMeters?: number
  }): Promise<EventRecord[]> {
    const hasCoordinates =
      input?.latitude !== undefined &&
      input?.longitude !== undefined &&
      input?.nearbyRadiusMeters !== undefined
    const params = hasCoordinates
      ? [input.latitude, input.longitude, input.nearbyRadiusMeters]
      : []
    const whereClause = hasCoordinates
      ? `
        where
          e.latitude is not null
          and e.longitude is not null
          and (
            6371000 * acos(
              least(
                1,
                greatest(
                  -1,
                  cos(radians($1)) * cos(radians(e.latitude)) *
                  cos(radians(e.longitude) - radians($2)) +
                  sin(radians($1)) * sin(radians(e.latitude))
                )
              )
            )
          ) <= $3
      `
      : ''
    const orderByClause = hasCoordinates
      ? `
        order by
          (
            6371000 * acos(
              least(
                1,
                greatest(
                  -1,
                  cos(radians($1)) * cos(radians(e.latitude)) *
                  cos(radians(e.longitude) - radians($2)) +
                  sin(radians($1)) * sin(radians(e.latitude))
                )
              )
            )
          ) asc,
          e.created_at desc
      `
      : 'order by e.created_at desc'
    const result = await this.db.query<EventRow>(`
      select
        e.id,
        e.title,
        e.address,
        e.latitude,
        e.longitude,
        e.radius,
        e.manager_id,
        e.starts_at,
        e.created_at,
        coalesce(avg(r.heat), 0)::int as heat,
        count(distinct c.user_id)::int as participants
      from events e
      left join rooms r on r.event_id = e.id
      left join chats c on c.event_id = e.id and c.deleted_at is null
      ${whereClause}
      group by e.id
      ${orderByClause}
    `, params)

    return result.rows.map(mapEvent)
  }

  async findById(eventId: string): Promise<EventRecord | null> {
    const result = await this.db.query<EventRow>(
      `
        select
          e.id,
          e.title,
          e.address,
          e.latitude,
          e.longitude,
          e.radius,
          e.manager_id,
          e.starts_at,
          e.created_at,
          coalesce(avg(r.heat), 0)::int as heat,
          count(distinct c.user_id)::int as participants
        from events e
        left join rooms r on r.event_id = e.id
        left join chats c on c.event_id = e.id and c.deleted_at is null
        where e.id = $1
        group by e.id
      `,
      [eventId],
    )

    return result.rows[0] ? mapEvent(result.rows[0]) : null
  }

  async update(
    eventId: string,
    input: {
      title?: string
      address?: string
      latitude?: number | null
      longitude?: number | null
      radius?: number
      startsAt?: string | null
    },
  ): Promise<EventRecord | null> {
    const current = await this.findById(eventId)

    if (!current) {
      return null
    }

    const result = await this.db.query<EventRow>(
      `
        update events
        set title = $2,
            address = $3,
            latitude = $4,
            longitude = $5,
            radius = $6,
            starts_at = $7
        where id = $1
        returning id, title, address, latitude, longitude, radius, manager_id, starts_at, created_at,
          $8::int as heat,
          $9::int as participants
      `,
      [
        eventId,
        input.title ?? current.title,
        input.address ?? current.address,
        input.latitude !== undefined ? input.latitude : current.latitude,
        input.longitude !== undefined ? input.longitude : current.longitude,
        input.radius ?? current.radius,
        input.startsAt !== undefined ? input.startsAt : current.startsAt,
        current.heat,
        current.participants,
      ],
    )

    return mapEvent(result.rows[0])
  }

  async delete(eventId: string): Promise<boolean> {
    const result = await this.db.query('delete from events where id = $1', [eventId])

    return (result.rowCount ?? 0) > 0
  }

  async join(input: { eventId: string; userId: string }) {
    await this.db.query(
      `
        insert into participants (event_id, user_id)
        values ($1, $2)
        on conflict do nothing
      `,
      [input.eventId, input.userId],
    )

    return this.findParticipant(input)
  }

  async findParticipant(input: { eventId: string; userId: string }) {
    const result = await this.db.query<{
      id: string
      name: string
      role: string
      joined_at: Date
    }>(
      `
        select u.id, u.name, u.role, p.joined_at
        from participants p
        join users u on u.id = p.user_id
        where p.event_id = $1 and p.user_id = $2
      `,
      [input.eventId, input.userId],
    )

    const row = result.rows[0]

    return row
      ? {
          userId: row.id,
          userName: row.name,
          role: row.role,
          joinedAt: row.joined_at.toISOString(),
        }
      : null
  }

  async listParticipants(eventId: string) {
    const result = await this.db.query<{
      id: string
      name: string
      role: string
      joined_at: Date
      chat_count: string
      last_active_at: Date | null
    }>(
      `
        select
          u.id,
          u.name,
          u.role,
          p.joined_at,
          count(c.id)::int as chat_count,
          max(c.created_at) as last_active_at
        from participants p
        join users u on u.id = p.user_id
        left join chats c on c.event_id = p.event_id
          and c.user_id = p.user_id
          and c.deleted_at is null
        where p.event_id = $1
        group by u.id, p.joined_at
        order by p.joined_at desc
      `,
      [eventId],
    )

    return result.rows.map((row) => ({
      userId: row.id,
      userName: row.name,
      role: row.role,
      joinedAt: row.joined_at.toISOString(),
      chatCount: Number(row.chat_count),
      lastActiveAt: row.last_active_at?.toISOString() ?? null,
    }))
  }
}

const mapEvent = (row: EventRow): EventRecord => ({
  eventId: row.id,
  title: row.title,
  address: row.address,
  latitude: row.latitude,
  longitude: row.longitude,
  radius: row.radius,
  heat: Number(row.heat),
  participants: Number(row.participants),
  startsAt: row.starts_at?.toISOString() ?? null,
  managerId: row.manager_id,
  createdAt: row.created_at.toISOString(),
})

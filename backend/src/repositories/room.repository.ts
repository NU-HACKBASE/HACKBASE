import { randomUUID } from 'node:crypto'

import type pg from 'pg'

import type { RoomRecord } from '../types/api.js'

type RoomRow = {
  id: string
  event_id: string
  title: string
  heat: number
  summary: string
  participants: string | number
  created_at: Date
}

export class RoomRepository {
  constructor(private readonly db: pg.Pool) {}

  async create(input: { eventId: string; title: string; summary?: string }): Promise<RoomRecord> {
    const id = randomUUID()
    const result = await this.db.query<RoomRow>(
      `
        insert into rooms (id, event_id, title, summary)
        values ($1, $2, $3, $4)
        returning id, event_id, title, heat, summary, 0 as participants, created_at
      `,
      [id, input.eventId, input.title, input.summary ?? ''],
    )

    return mapRoom(result.rows[0])
  }

  async listByEventId(eventId: string): Promise<RoomRecord[]> {
    const result = await this.db.query<RoomRow>(
      `
        select
          r.id,
          r.event_id,
          r.title,
          r.heat,
          r.summary,
          count(distinct c.user_id)::int as participants,
          r.created_at
        from rooms r
        left join chats c on c.room_id = r.id and c.deleted_at is null
        where r.event_id = $1
        group by r.id
        order by r.heat desc, r.created_at asc
      `,
      [eventId],
    )

    return result.rows.map(mapRoom)
  }

  async findById(roomId: string): Promise<RoomRecord | null> {
    const result = await this.db.query<RoomRow>(
      `
        select
          r.id,
          r.event_id,
          r.title,
          r.heat,
          r.summary,
          count(distinct c.user_id)::int as participants,
          r.created_at
        from rooms r
        left join chats c on c.room_id = r.id and c.deleted_at is null
        where r.id = $1
        group by r.id
      `,
      [roomId],
    )

    return result.rows[0] ? mapRoom(result.rows[0]) : null
  }

  async updateAnalysis(roomId: string, input: { heat: number; summary: string }) {
    const result = await this.db.query<RoomRow>(
      `
        update rooms
        set heat = $2,
            summary = $3
        where id = $1
        returning id, event_id, title, heat, summary, 0 as participants, created_at
      `,
      [roomId, input.heat, input.summary],
    )

    return result.rows[0] ? mapRoom(result.rows[0]) : null
  }

  async update(roomId: string, input: { title?: string; summary?: string }) {
    const current = await this.findById(roomId)

    if (!current) {
      return null
    }

    const result = await this.db.query<RoomRow>(
      `
        update rooms
        set title = $2,
            summary = $3
        where id = $1
        returning id, event_id, title, heat, summary, $4::int as participants, created_at
      `,
      [
        roomId,
        input.title ?? current.title,
        input.summary ?? current.summary,
        current.participants,
      ],
    )

    return mapRoom(result.rows[0])
  }

  async delete(roomId: string): Promise<boolean> {
    const result = await this.db.query('delete from rooms where id = $1', [roomId])

    return (result.rowCount ?? 0) > 0
  }
}

const mapRoom = (row: RoomRow): RoomRecord => ({
  roomId: row.id,
  eventId: row.event_id,
  title: row.title,
  heat: row.heat,
  summary: row.summary,
  participants: Number(row.participants),
  createdAt: row.created_at.toISOString(),
})

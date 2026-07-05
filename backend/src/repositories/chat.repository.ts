import { randomUUID } from 'node:crypto'

import type pg from 'pg'

import type { ChatRecord } from '../types/api.js'

type ChatRow = {
  id: string
  event_id: string
  room_id: string
  user_id: string
  user_name: string
  body: string
  liked_count: string | number
  created_at: Date
  updated_at: Date | null
}

export class ChatRepository {
  constructor(private readonly db: pg.Pool) {}

  async create(input: { eventId: string; roomId: string; userId: string; body: string }) {
    const id = randomUUID()
    const result = await this.db.query<ChatRow>(
      `
        insert into chats (id, event_id, room_id, user_id, body)
        values ($1, $2, $3, $4, $5)
        returning
          id,
          event_id,
          room_id,
          user_id,
          (select name from users where users.id = chats.user_id) as user_name,
          body,
          0 as liked_count,
          created_at,
          updated_at
      `,
      [id, input.eventId, input.roomId, input.userId, input.body],
    )

    return mapChat(result.rows[0])
  }

  async listByRoomId(roomId: string, limit: number): Promise<ChatRecord[]> {
    const result = await this.db.query<ChatRow>(
      `
        select
          c.id,
          c.event_id,
          c.room_id,
          c.user_id,
          u.name as user_name,
          c.body,
          count(l.chat_id)::int as liked_count,
          c.created_at,
          c.updated_at
        from chats c
        join users u on u.id = c.user_id
        left join likes l on l.chat_id = c.id
        where c.room_id = $1 and c.deleted_at is null
        group by c.id, u.name
        order by c.created_at desc
        limit $2
      `,
      [roomId, limit],
    )

    return result.rows.map(mapChat).reverse()
  }

  async findById(chatId: string): Promise<ChatRecord | null> {
    const result = await this.db.query<ChatRow>(
      `
        select
          c.id,
          c.event_id,
          c.room_id,
          c.user_id,
          u.name as user_name,
          c.body,
          count(l.chat_id)::int as liked_count,
          c.created_at,
          c.updated_at
        from chats c
        join users u on u.id = c.user_id
        left join likes l on l.chat_id = c.id
        where c.id = $1 and c.deleted_at is null
        group by c.id, u.name
      `,
      [chatId],
    )

    return result.rows[0] ? mapChat(result.rows[0]) : null
  }

  async update(chatId: string, body: string): Promise<ChatRecord | null> {
    await this.db.query('update chats set body = $2, updated_at = now() where id = $1', [
      chatId,
      body,
    ])

    return this.findById(chatId)
  }

  async delete(chatId: string) {
    await this.db.query('update chats set deleted_at = now() where id = $1', [chatId])
  }

  async like(input: { chatId: string; userId: string }) {
    await this.db.query(
      `
        insert into likes (chat_id, user_id)
        values ($1, $2)
        on conflict do nothing
      `,
      [input.chatId, input.userId],
    )

    return this.findById(input.chatId)
  }

  async unlike(input: { chatId: string; userId: string }) {
    await this.db.query('delete from likes where chat_id = $1 and user_id = $2', [
      input.chatId,
      input.userId,
    ])

    return this.findById(input.chatId)
  }
}

const mapChat = (row: ChatRow): ChatRecord => ({
  chatId: row.id,
  eventId: row.event_id,
  roomId: row.room_id,
  userId: row.user_id,
  userName: row.user_name,
  body: row.body,
  likedCount: Number(row.liked_count),
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at?.toISOString() ?? null,
})

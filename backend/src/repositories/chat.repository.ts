import { randomUUID } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { ChatRecord } from '../types/api.js'
import {
  throwIfSupabaseError,
  toIsoString,
  toNullableIsoString,
} from './supabase-utils.js'

type ChatRow = {
  id: string
  event_id: string
  room_id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string | null
}

type UserRow = {
  id: string
  name: string
}

type LikeRow = {
  chat_id: string
}

export class ChatRepository {
  constructor(private readonly db: SupabaseClient) {}

  async create(input: { eventId: string; roomId: string; userId: string; body: string }) {
    const id = randomUUID()
    const { error } = await this.db.from('chats').insert({
      id,
      event_id: input.eventId,
      room_id: input.roomId,
      user_id: input.userId,
      body: input.body,
    })

    throwIfSupabaseError(error)

    const chat = await this.findById(id)

    if (!chat) {
      throw new Error('Failed to create chat')
    }

    return chat
  }

  async listByRoomId(roomId: string, limit: number): Promise<ChatRecord[]> {
    const { data, error } = await this.db
      .from('chats')
      .select(chatSelect)
      .eq('room_id', roomId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<ChatRow[]>()

    throwIfSupabaseError(error)

    return this.mapChats(data ?? []).then((chats) => chats.reverse())
  }

  async findById(chatId: string): Promise<ChatRecord | null> {
    const { data, error } = await this.db
      .from('chats')
      .select(chatSelect)
      .eq('id', chatId)
      .is('deleted_at', null)
      .maybeSingle<ChatRow>()

    throwIfSupabaseError(error)

    return data ? this.mapChat(data) : null
  }

  async update(chatId: string, body: string): Promise<ChatRecord | null> {
    const { error } = await this.db
      .from('chats')
      .update({
        body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId)

    throwIfSupabaseError(error)

    return this.findById(chatId)
  }

  async delete(chatId: string) {
    const { error } = await this.db
      .from('chats')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', chatId)

    throwIfSupabaseError(error)
  }

  async like(input: { chatId: string; userId: string }) {
    const { error } = await this.db.from('likes').upsert(
      {
        chat_id: input.chatId,
        user_id: input.userId,
      },
      { onConflict: 'user_id,chat_id', ignoreDuplicates: true },
    )

    throwIfSupabaseError(error)

    return this.findById(input.chatId)
  }

  async unlike(input: { chatId: string; userId: string }) {
    const { error } = await this.db
      .from('likes')
      .delete()
      .eq('chat_id', input.chatId)
      .eq('user_id', input.userId)

    throwIfSupabaseError(error)

    return this.findById(input.chatId)
  }

  private async mapChats(rows: ChatRow[]): Promise<ChatRecord[]> {
    const userIds = [...new Set(rows.map((row) => row.user_id))]
    const chatIds = rows.map((row) => row.id)
    const [users, likeCounts] = await Promise.all([
      this.findUsers(userIds),
      this.countLikesByChatIds(chatIds),
    ])

    return rows.map((row) => mapChat(row, users.get(row.user_id)?.name ?? row.user_id, likeCounts.get(row.id) ?? 0))
  }

  private async mapChat(row: ChatRow): Promise<ChatRecord> {
    const [user, likedCount] = await Promise.all([
      this.findUser(row.user_id),
      this.countLikes(row.id),
    ])

    return mapChat(row, user?.name ?? row.user_id, likedCount)
  }

  private async findUser(userId: string): Promise<UserRow | null> {
    const { data, error } = await this.db
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .maybeSingle<UserRow>()

    throwIfSupabaseError(error)

    return data
  }

  private async findUsers(userIds: string[]): Promise<Map<string, UserRow>> {
    if (userIds.length === 0) {
      return new Map()
    }

    const { data, error } = await this.db
      .from('users')
      .select('id, name')
      .in('id', userIds)
      .returns<UserRow[]>()

    throwIfSupabaseError(error)

    return new Map((data ?? []).map((row) => [row.id, row]))
  }

  private async countLikes(chatId: string): Promise<number> {
    const { count, error } = await this.db
      .from('likes')
      .select('chat_id', { count: 'exact', head: true })
      .eq('chat_id', chatId)

    throwIfSupabaseError(error)

    return count ?? 0
  }

  private async countLikesByChatIds(chatIds: string[]): Promise<Map<string, number>> {
    if (chatIds.length === 0) {
      return new Map()
    }

    const { data, error } = await this.db
      .from('likes')
      .select('chat_id')
      .in('chat_id', chatIds)
      .returns<LikeRow[]>()

    throwIfSupabaseError(error)

    const counts = new Map<string, number>()

    for (const row of data ?? []) {
      counts.set(row.chat_id, (counts.get(row.chat_id) ?? 0) + 1)
    }

    return counts
  }
}

const chatSelect = 'id, event_id, room_id, user_id, body, created_at, updated_at'

const mapChat = (row: ChatRow, userName: string, likedCount: number): ChatRecord => ({
  chatId: row.id,
  eventId: row.event_id,
  roomId: row.room_id,
  userId: row.user_id,
  userName,
  body: row.body,
  likedCount,
  createdAt: toIsoString(row.created_at),
  updatedAt: toNullableIsoString(row.updated_at),
})

import { randomUUID } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { RoomRecord } from '../types/api.js'
import { throwIfSupabaseError, toIsoString } from './supabase-utils.js'

type RoomRow = {
  id: string
  event_id: string
  title: string
  heat: number
  summary: string
  created_at: string
}

type ChatUserRow = {
  user_id: string
}

export class RoomRepository {
  constructor(private readonly db: SupabaseClient) {}

  async create(input: { eventId: string; title: string; summary?: string }): Promise<RoomRecord> {
    const id = randomUUID()
    const { data, error } = await this.db
      .from('rooms')
      .insert({
        id,
        event_id: input.eventId,
        title: input.title,
        summary: input.summary ?? '',
      })
      .select(roomSelect)
      .single<RoomRow>()

    throwIfSupabaseError(error)

    if (!data) {
      throw new Error('Failed to create room')
    }

    return this.mapRoom(data)
  }

  async listByEventId(eventId: string): Promise<RoomRecord[]> {
    const { data, error } = await this.db
      .from('rooms')
      .select(roomSelect)
      .eq('event_id', eventId)
      .order('heat', { ascending: false })
      .order('created_at', { ascending: true })
      .returns<RoomRow[]>()

    throwIfSupabaseError(error)

    return Promise.all((data ?? []).map((row) => this.mapRoom(row)))
  }

  async findById(roomId: string): Promise<RoomRecord | null> {
    const { data, error } = await this.db
      .from('rooms')
      .select(roomSelect)
      .eq('id', roomId)
      .maybeSingle<RoomRow>()

    throwIfSupabaseError(error)

    return data ? this.mapRoom(data) : null
  }

  async updateAnalysis(roomId: string, input: { heat: number; summary: string }) {
    const { error } = await this.db
      .from('rooms')
      .update({
        heat: input.heat,
        summary: input.summary,
      })
      .eq('id', roomId)

    throwIfSupabaseError(error)

    return this.findById(roomId)
  }

  async update(roomId: string, input: { title?: string; summary?: string }) {
    const current = await this.findById(roomId)

    if (!current) {
      return null
    }

    const { error } = await this.db
      .from('rooms')
      .update({
        title: input.title ?? current.title,
        summary: input.summary ?? current.summary,
      })
      .eq('id', roomId)

    throwIfSupabaseError(error)

    return this.findById(roomId)
  }

  async delete(roomId: string): Promise<boolean> {
    const { data, error } = await this.db.from('rooms').delete().eq('id', roomId).select('id')

    throwIfSupabaseError(error)

    return (data ?? []).length > 0
  }

  private async mapRoom(row: RoomRow): Promise<RoomRecord> {
    return {
      roomId: row.id,
      eventId: row.event_id,
      title: row.title,
      heat: row.heat,
      summary: row.summary,
      participants: await this.countParticipants(row.id),
      createdAt: toIsoString(row.created_at),
    }
  }

  private async countParticipants(roomId: string): Promise<number> {
    const { data, error } = await this.db
      .from('chats')
      .select('user_id')
      .eq('room_id', roomId)
      .is('deleted_at', null)
      .returns<ChatUserRow[]>()

    throwIfSupabaseError(error)

    return new Set((data ?? []).map((row) => row.user_id)).size
  }
}

const roomSelect = 'id, event_id, title, heat, summary, created_at'

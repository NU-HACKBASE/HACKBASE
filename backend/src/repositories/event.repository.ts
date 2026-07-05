import { randomUUID } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { EventRecord } from '../types/api.js'
import {
  throwIfSupabaseError,
  toIsoString,
  toNullableIsoString,
} from './supabase-utils.js'

type EventRow = {
  id: string
  title: string
  address: string
  latitude: number | null
  longitude: number | null
  radius: number
  manager_id: string | null
  starts_at: string | null
  created_at: string
}

type ParticipantRow = {
  user_id: string
  joined_at: string
}

type UserRow = {
  id: string
  name: string
  role: string
}

type ChatActivityRow = {
  user_id: string
  created_at: string
}

export class EventRepository {
  constructor(private readonly db: SupabaseClient) {}

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
    const { data, error } = await this.db
      .from('events')
      .insert({
        id,
        title: input.title,
        address: input.address ?? '',
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        radius: input.radius ?? 0,
        manager_id: input.managerId,
        starts_at: input.startsAt ?? null,
      })
      .select(eventSelect)
      .single<EventRow>()

    throwIfSupabaseError(error)

    if (!data) {
      throw new Error('Failed to create event')
    }

    return this.mapEventWithStats(data)
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

    throwIfSupabaseError(error)

    return Promise.all((data ?? []).map((row) => this.mapEventWithStats(row)))
  }

  async findById(eventId: string): Promise<EventRecord | null> {
    const { data, error } = await this.db
      .from('events')
      .select(eventSelect)
      .eq('id', eventId)
      .maybeSingle<EventRow>()

    throwIfSupabaseError(error)

    return data ? this.mapEventWithStats(data) : null
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

    const { data, error } = await this.db
      .from('events')
      .update({
        title: input.title ?? current.title,
        address: input.address ?? current.address,
        latitude: input.latitude !== undefined ? input.latitude : current.latitude,
        longitude: input.longitude !== undefined ? input.longitude : current.longitude,
        radius: input.radius ?? current.radius,
        starts_at: input.startsAt !== undefined ? input.startsAt : current.startsAt,
      })
      .eq('id', eventId)
      .select(eventSelect)
      .single<EventRow>()

    throwIfSupabaseError(error)

    if (!data) {
      throw new Error('Failed to update event')
    }

    return this.mapEventWithStats(data)
  }

  async delete(eventId: string): Promise<boolean> {
    const { data, error } = await this.db.from('events').delete().eq('id', eventId).select('id')

    throwIfSupabaseError(error)

    return (data ?? []).length > 0
  }

  async join(input: { eventId: string; userId: string }) {
    const { error } = await this.db.from('participants').upsert(
      {
        event_id: input.eventId,
        user_id: input.userId,
      },
      { onConflict: 'event_id,user_id', ignoreDuplicates: true },
    )

    throwIfSupabaseError(error)

    return this.findParticipant(input)
  }

  async findParticipant(input: { eventId: string; userId: string }) {
    const { data: participant, error: participantError } = await this.db
      .from('participants')
      .select('user_id, joined_at')
      .eq('event_id', input.eventId)
      .eq('user_id', input.userId)
      .maybeSingle<ParticipantRow>()

    throwIfSupabaseError(participantError)

    if (!participant) {
      return null
    }

    const user = await this.findUser(participant.user_id)

    return user
      ? {
          userId: user.id,
          userName: user.name,
          role: user.role,
          joinedAt: toIsoString(participant.joined_at),
        }
      : null
  }

  async listParticipants(eventId: string) {
    const { data: participants, error: participantsError } = await this.db
      .from('participants')
      .select('user_id, joined_at')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: false })
      .returns<ParticipantRow[]>()

    throwIfSupabaseError(participantsError)

    const userIds = [...new Set((participants ?? []).map((row) => row.user_id))]
    const users = await this.findUsers(userIds)
    const activity = await this.findChatActivity(eventId, userIds)

    return (participants ?? []).map((row) => {
      const user = users.get(row.user_id)
      const userActivity = activity.get(row.user_id)

      return {
        userId: row.user_id,
        userName: user?.name ?? row.user_id,
        role: user?.role ?? 'anonymous',
        joinedAt: toIsoString(row.joined_at),
        chatCount: userActivity?.chatCount ?? 0,
        lastActiveAt: userActivity?.lastActiveAt ?? null,
      }
    })
  }

  private async mapEventWithStats(row: EventRow): Promise<EventRecord> {
    const [heat, participants] = await Promise.all([
      this.calculateEventHeat(row.id),
      this.countParticipants(row.id),
    ])

    return {
      eventId: row.id,
      title: row.title,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
      heat,
      participants,
      startsAt: toNullableIsoString(row.starts_at),
      managerId: row.manager_id,
      createdAt: toIsoString(row.created_at),
    }
  }

  private async calculateEventHeat(eventId: string): Promise<number> {
    const { data, error } = await this.db.from('rooms').select('heat').eq('event_id', eventId)

    throwIfSupabaseError(error)

    const heats = (data ?? []).map((row) => Number(row.heat) || 0)

    if (heats.length === 0) {
      return 0
    }

    return Math.round(heats.reduce((total, heat) => total + heat, 0) / heats.length)
  }

  private async countParticipants(eventId: string): Promise<number> {
    const { count, error } = await this.db
      .from('participants')
      .select('event_id', { count: 'exact', head: true })
      .eq('event_id', eventId)

    throwIfSupabaseError(error)

    return count ?? 0
  }

  private async findUser(userId: string): Promise<UserRow | null> {
    const { data, error } = await this.db
      .from('users')
      .select('id, name, role')
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
      .select('id, name, role')
      .in('id', userIds)
      .returns<UserRow[]>()

    throwIfSupabaseError(error)

    return new Map((data ?? []).map((row) => [row.id, row]))
  }

  private async findChatActivity(eventId: string, userIds: string[]) {
    if (userIds.length === 0) {
      return new Map<string, { chatCount: number; lastActiveAt: string | null }>()
    }

    const { data, error } = await this.db
      .from('chats')
      .select('user_id, created_at')
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .in('user_id', userIds)
      .returns<ChatActivityRow[]>()

    throwIfSupabaseError(error)

    const activity = new Map<string, { chatCount: number; lastActiveAt: string | null }>()

    for (const row of data ?? []) {
      const current = activity.get(row.user_id) ?? { chatCount: 0, lastActiveAt: null }
      const createdAt = toIsoString(row.created_at)

      activity.set(row.user_id, {
        chatCount: current.chatCount + 1,
        lastActiveAt:
          !current.lastActiveAt || createdAt > current.lastActiveAt ? createdAt : current.lastActiveAt,
      })
    }

    return activity
  }
}

const eventSelect =
  'id, title, address, latitude, longitude, radius, manager_id, starts_at, created_at'

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
    const { data, error } = await this.db
      .from('events')
      .select(eventSelect)
      .order('created_at', { ascending: false })
      .returns<EventRow[]>()

    throwIfSupabaseError(error)

    const rows = data ?? []

    if (
      input?.latitude === undefined ||
      input.longitude === undefined ||
      input.nearbyRadiusMeters === undefined
    ) {
      return Promise.all(rows.map((row) => this.mapEventWithStats(row)))
    }

    const latitude = input.latitude
    const longitude = input.longitude
    const nearbyRadiusMeters = input.nearbyRadiusMeters
    const filteredRows = rows
      .filter(
        (row) =>
          row.latitude !== null &&
          row.longitude !== null &&
          calculateDistanceMeters(latitude, longitude, row.latitude, row.longitude) <=
            nearbyRadiusMeters,
      )
      .sort(
        (a, b) =>
          calculateDistanceMeters(latitude, longitude, a.latitude ?? 0, a.longitude ?? 0) -
          calculateDistanceMeters(latitude, longitude, b.latitude ?? 0, b.longitude ?? 0),
      )

    return Promise.all(filteredRows.map((row) => this.mapEventWithStats(row)))
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

function calculateDistanceMeters(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  const earthRadiusMeters = 6371000
  const latitudeDistance = toRadians(toLatitude - fromLatitude)
  const longitudeDistance = toRadians(toLongitude - fromLongitude)
  const fromLatitudeRadians = toRadians(fromLatitude)
  const toLatitudeRadians = toRadians(toLatitude)
  const a =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDistance / 2) ** 2

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

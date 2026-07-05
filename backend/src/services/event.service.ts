import type { EventRepository } from '../repositories/event.repository.js'
import type { AuthSession } from '../types/api.js'
import { ApiError } from '../utils/api-error.js'
import type { AuthService } from './auth.service.js'

const NEARBY_EVENT_RADIUS_METERS = 500

export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly authService: AuthService,
  ) {}

  async createEvent(
    session: AuthSession,
    input: {
      title?: string
      address?: string
      latitude?: number | null
      longitude?: number | null
      radius?: number
      startsAt?: string | null
    },
  ) {
    this.authService.requireAdmin(session)

    if (!input.title?.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'title is required')
    }

    return this.eventRepository.create({
      title: input.title.trim(),
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      radius: input.radius,
      startsAt: input.startsAt,
      managerId: session.userId,
    })
  }

  async listEvents(input?: {
    latitude?: number
    longitude?: number
  }) {
    const hasLatitude = input?.latitude !== undefined
    const hasLongitude = input?.longitude !== undefined

    if (hasLatitude !== hasLongitude) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'latitude and longitude must be provided together',
      )
    }

    if (
      input?.latitude !== undefined &&
      (!Number.isFinite(input.latitude) ||
        !Number.isFinite(input.longitude))
    ) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'latitude and longitude must be valid numbers',
      )
    }

    return this.eventRepository.list({
      ...input,
      nearbyRadiusMeters:
        input?.latitude !== undefined ? NEARBY_EVENT_RADIUS_METERS : undefined,
    })
  }

  async getEvent(eventId: string) {
    const event = await this.eventRepository.findById(eventId)

    if (!event) {
      throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found')
    }

    return event
  }

  async updateEvent(
    session: AuthSession,
    eventId: string,
    input: {
      title?: string
      address?: string
      latitude?: number | null
      longitude?: number | null
      radius?: number
      startsAt?: string | null
    },
  ) {
    this.authService.requireAdmin(session)
    await this.getEvent(eventId)

    if (input.title !== undefined && !input.title.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'title must not be blank')
    }

    const event = await this.eventRepository.update(eventId, {
      ...input,
      title: input.title?.trim(),
    })

    if (!event) {
      throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found')
    }

    return event
  }

  async deleteEvent(session: AuthSession, eventId: string) {
    this.authService.requireAdmin(session)
    await this.getEvent(eventId)
    await this.eventRepository.delete(eventId)
  }

  async joinEvent(session: AuthSession, eventId: string) {
    const event = await this.getEvent(eventId)
    const participant = await this.eventRepository.join({
      eventId,
      userId: session.userId,
    })

    return {
      event,
      participant,
    }
  }

  async listParticipants(session: AuthSession, eventId: string) {
    this.authService.requireAdmin(session)
    await this.getEvent(eventId)

    return this.eventRepository.listParticipants(eventId)
  }
}

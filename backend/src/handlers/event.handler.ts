import type { Context } from 'hono'

import type { AuthService } from '../services/auth.service.js'
import type { EventService } from '../services/event.service.js'
import { getBearerToken, readJson, requireParam } from '../utils/request.js'

type CreateEventBody = {
  title?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  radius?: number
  startsAt?: string | null
}

type UpdateEventBody = CreateEventBody

type ListEventsQuery = {
  latitude?: string
  longitude?: string
}

export class EventHandler {
  constructor(
    private readonly eventService: EventService,
    private readonly authService: AuthService,
  ) {}

  createEvent = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const body = await readJson<CreateEventBody>(c)
    const event = await this.eventService.createEvent(session, body)

    return c.json({ event }, 201)
  }

  listEvents = async (c: Context) => {
    const query = c.req.query() as ListEventsQuery
    const latitude =
      query.latitude !== undefined ? Number(query.latitude) : undefined
    const longitude =
      query.longitude !== undefined ? Number(query.longitude) : undefined
    const events = await this.eventService.listEvents({
      latitude,
      longitude,
    })

    return c.json({ events })
  }

  getEvent = async (c: Context) => {
    const event = await this.eventService.getEvent(requireParam(c, 'eventId'))

    return c.json({ event })
  }

  updateEvent = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const body = await readJson<UpdateEventBody>(c)
    const event = await this.eventService.updateEvent(
      session,
      requireParam(c, 'eventId'),
      body,
    )

    return c.json({ event })
  }

  deleteEvent = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    await this.eventService.deleteEvent(session, requireParam(c, 'eventId'))

    return c.body(null, 204)
  }

  joinEvent = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const result = await this.eventService.joinEvent(session, requireParam(c, 'eventId'))

    return c.json(result)
  }

  listParticipants = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const participants = await this.eventService.listParticipants(
      session,
      requireParam(c, 'eventId'),
    )

    return c.json({ participants })
  }
}

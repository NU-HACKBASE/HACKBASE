import { apiRequest } from './apiClient'

export async function fetchEvents(params = {}, options = {}) {
  const data = await apiRequest('/events', {
    query: params,
    signal: options.signal,
  })

  return normalizeEvents(data)
}

export async function fetchEvent(eventId, options = {}) {
  const data = await apiRequest(`/events/${eventId}`, {
    signal: options.signal,
  })

  return normalizeEvent(data)
}

export async function fetchEventRooms(eventId, options = {}) {
  const data = await apiRequest(`/events/${eventId}/rooms`, {
    signal: options.signal,
  })

  return normalizeRooms(data)
}

function normalizeEvents(data) {
  const items = data?.events ?? data?.items ?? data?.data ?? data

  if (!Array.isArray(items)) {
    return []
  }

  return items.map(normalizeEvent)
}

function normalizeEvent(data) {
  const source = data?.event ?? data
  const id = source.eventId ?? source.id

  return {
    id,
    eventId: id,
    title: source.title ?? '',
    address: source.address ?? source.place ?? source.locationName ?? '',
    latitude: source.latitude ?? source.lat ?? null,
    longitude: source.longitude ?? source.lng ?? null,
    radius: source.radius ?? source.range ?? 0,
    heat: source.heat ?? source.excitementLevel ?? source.popularity ?? 0,
    participants: source.participants ?? source.participantCount ?? 0,
    startsAt: source.startsAt ?? source.startTime ?? null,
    raw: source,
  }
}

function normalizeRooms(data) {
  const items = data?.rooms ?? data?.items ?? data?.data ?? data

  if (!Array.isArray(items)) {
    return []
  }

  return items.map(normalizeRoom)
}

function normalizeRoom(data) {
  const source = data?.room ?? data
  const id = source.roomId ?? source.id

  return {
    id,
    roomId: id,
    title: source.roomTitle ?? source.title ?? '',
    heat: source.roomHeat ?? source.heat ?? source.excitementLevel ?? 0,
    participants: source.participants ?? source.participantCount ?? 0,
    summary: source.roomSummary ?? source.summary ?? '',
    raw: source,
  }
}

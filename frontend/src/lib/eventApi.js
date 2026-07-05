import { apiRequest } from './apiClient'

export { fetchEventRooms } from './roomApi'

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

export async function joinEvent(eventId, options = {}) {
  const data = await apiRequest(`/events/${eventId}/join`, {
    method: 'POST',
    signal: options.signal,
  })

  return {
    event: normalizeEvent(data?.event),
    participant: normalizeParticipant(data?.participant),
  }
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

function normalizeParticipant(data) {
  if (!data) {
    return null
  }

  return {
    userId: data.userId ?? data.id ?? null,
    userName: data.userName ?? data.name ?? '',
    role: data.role ?? '',
    joinedAt: data.joinedAt ?? null,
    raw: data,
  }
}

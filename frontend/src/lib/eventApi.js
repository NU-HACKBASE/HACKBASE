import { apiRequest } from './apiClient'

export { fetchEventRooms } from './roomApi'

export async function fetchEvents(params = {}, options = {}) {
  const data = await apiRequest('/events', {
    query: params,
    signal: options.signal,
    token: options.token,
  })

  return normalizeEvents(data)
}

export async function fetchEvent(eventId, options = {}) {
  const data = await apiRequest(`/events/${eventId}`, {
    signal: options.signal,
    token: options.token,
  })

  return normalizeEvent(data)
}

export async function createEvent(input, options = {}) {
  const data = await apiRequest('/events', {
    body: normalizeEventInput(input),
    method: 'POST',
    signal: options.signal,
    token: options.token,
  })

  return normalizeEvent(data)
}

export async function updateEvent(eventId, input, options = {}) {
  const data = await apiRequest(`/events/${eventId}`, {
    body: normalizeEventInput(input),
    method: 'PATCH',
    signal: options.signal,
    token: options.token,
  })

  return normalizeEvent(data)
}

export async function deleteEvent(eventId, options = {}) {
  await apiRequest(`/events/${eventId}`, {
    method: 'DELETE',
    signal: options.signal,
    token: options.token,
  })
}

export async function joinEvent(eventId, options = {}) {
  const data = await apiRequest(`/events/${eventId}/join`, {
    method: 'POST',
    signal: options.signal,
    token: options.token,
  })

  return {
    event: normalizeEvent(data?.event),
    participant: normalizeParticipant(data?.participant),
  }
}

export async function fetchEventParticipants(eventId, options = {}) {
  const data = await apiRequest(`/events/${eventId}/participants`, {
    signal: options.signal,
    token: options.token,
  })

  return normalizeParticipants(data)
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

function normalizeEventInput(input = {}) {
  return {
    title: input.title,
    address: input.address,
    latitude: normalizeOptionalNumber(input.latitude),
    longitude: normalizeOptionalNumber(input.longitude),
    radius: normalizeOptionalNumber(input.radius) ?? 0,
    startsAt: input.startsAt || null,
  }
}

function normalizeOptionalNumber(value) {
  if (value === '' || value === undefined || value === null) {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function normalizeParticipants(data) {
  const items = data?.participants ?? data?.items ?? data?.data ?? data

  if (!Array.isArray(items)) {
    return []
  }

  return items.map(normalizeParticipant)
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
    chatCount: data.chatCount ?? 0,
    lastActiveAt: data.lastActiveAt ?? null,
    raw: data,
  }
}

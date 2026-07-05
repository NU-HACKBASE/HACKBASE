import { apiRequest } from './apiClient'
import { normalizeChats } from './chatApi'

export async function fetchEventRooms(eventId, options = {}) {
  const data = await apiRequest(`/events/${eventId}/rooms`, {
    signal: options.signal,
    token: options.token,
  })

  return normalizeRooms(data)
}

export async function createRoom(eventId, input, options = {}) {
  const data = await apiRequest(`/events/${eventId}/rooms`, {
    body: normalizeRoomInput(input),
    method: 'POST',
    signal: options.signal,
    token: options.token,
  })

  return normalizeRoom(data)
}

export async function fetchRoom(roomId, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}`, {
    signal: options.signal,
    token: options.token,
  })

  return normalizeRoom(data)
}

export async function updateRoom(roomId, input, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}`, {
    body: normalizeRoomInput(input),
    method: 'PATCH',
    signal: options.signal,
    token: options.token,
  })

  return normalizeRoom(data)
}

export async function deleteRoom(roomId, options = {}) {
  await apiRequest(`/rooms/${roomId}`, {
    method: 'DELETE',
    signal: options.signal,
    token: options.token,
  })
}

export async function analyzeRoom(roomId, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}/analyze`, {
    method: 'POST',
    signal: options.signal,
    token: options.token,
  })

  return {
    room: normalizeRoom(data?.room),
    analysis: data?.analysis ?? null,
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
  const chats = data?.chats ?? source.chats ?? source.latestChats ?? source.messages ?? []

  return {
    id,
    roomId: id,
    eventId: source.eventId ?? null,
    title: source.roomTitle ?? source.title ?? '',
    heat: source.roomHeat ?? source.heat ?? source.excitementLevel ?? 0,
    participants: source.participants ?? source.participantCount ?? 0,
    summary: source.roomSummary ?? source.summary ?? '',
    chats: normalizeChats(chats),
    raw: source,
  }
}

function normalizeRoomInput(input = {}) {
  return {
    title: input.title,
    summary: input.summary,
  }
}

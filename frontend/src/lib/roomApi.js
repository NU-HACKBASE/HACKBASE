import { apiRequest } from './apiClient'

export async function fetchEventRooms(eventId, options = {}) {
  const data = await apiRequest(`/events/${eventId}/rooms`, {
    signal: options.signal,
  })

  return normalizeRooms(data)
}

export async function fetchRoom(roomId, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}`, {
    signal: options.signal,
  })

  return normalizeRoom(data)
}

export async function fetchRoomChats(roomId, params = {}, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}/chats`, {
    query: params,
    signal: options.signal,
  })

  return normalizeChats(data)
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
  const chats = source.chats ?? source.latestChats ?? source.messages ?? []

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

function normalizeChats(data) {
  const items = data?.chats ?? data?.items ?? data?.data ?? data

  if (!Array.isArray(items)) {
    return []
  }

  return items.map(normalizeChat)
}

function normalizeChat(data) {
  const source = data?.chat ?? data
  const id = source.chatId ?? source.id

  return {
    id,
    chatId: id,
    eventId: source.eventId ?? null,
    roomId: source.roomId ?? null,
    userId: source.userId ?? null,
    userName: source.userName ?? source.name ?? source.user?.userName ?? '',
    body: source.chatText ?? source.text ?? source.body ?? source.message ?? '',
    likedCount: source.likedCount ?? source.likes ?? source.likeCount ?? 0,
    createdAt: source.timestamp ?? source.createdAt ?? null,
    raw: source,
  }
}

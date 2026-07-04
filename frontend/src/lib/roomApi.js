import { apiRequest } from './apiClient'

export async function fetchEventRooms(eventId, options = {}) {
  const data = await apiRequest(`/events/${eventId}/rooms`, {
    signal: options.signal,
  })

  return normalizeRooms(data)
}

export async function createRoom(eventId, input, options = {}) {
  const data = await apiRequest(`/events/${eventId}/rooms`, {
    body: normalizeRoomInput(input),
    method: 'POST',
    signal: options.signal,
  })

  return normalizeRoom(data)
}

export async function fetchRoom(roomId, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}`, {
    signal: options.signal,
  })

  return normalizeRoom(data)
}

export async function updateRoom(roomId, input, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}`, {
    body: normalizeRoomInput(input),
    method: 'PATCH',
    signal: options.signal,
  })

  return normalizeRoom(data)
}

export async function deleteRoom(roomId, options = {}) {
  await apiRequest(`/rooms/${roomId}`, {
    method: 'DELETE',
    signal: options.signal,
  })
}

export async function analyzeRoom(roomId, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}/analyze`, {
    method: 'POST',
    signal: options.signal,
  })

  return {
    room: normalizeRoom(data?.room),
    analysis: data?.analysis ?? null,
  }
}

export async function fetchRoomChats(roomId, params = {}, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}/chats`, {
    query: params,
    signal: options.signal,
  })

  return normalizeChats(data)
}

export async function createRoomChat(roomId, input, options = {}) {
  const data = await apiRequest(`/rooms/${roomId}/chats`, {
    body: normalizeChatInput(input),
    method: 'POST',
    signal: options.signal,
  })

  return normalizeChat(data)
}

export const createChat = createRoomChat

export async function updateChat(chatId, input, options = {}) {
  const data = await apiRequest(`/chats/${chatId}`, {
    body: normalizeChatInput(input),
    method: 'PATCH',
    signal: options.signal,
  })

  return normalizeChat(data)
}

export async function deleteChat(chatId, options = {}) {
  await apiRequest(`/chats/${chatId}`, {
    method: 'DELETE',
    signal: options.signal,
  })
}

export async function likeChat(chatId, options = {}) {
  const data = await apiRequest(`/chats/${chatId}/like`, {
    method: 'PUT',
    signal: options.signal,
  })

  return normalizeChat(data)
}

export async function unlikeChat(chatId, options = {}) {
  const data = await apiRequest(`/chats/${chatId}/like`, {
    method: 'DELETE',
    signal: options.signal,
  })

  return normalizeChat(data)
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

function normalizeRoomInput(input = {}) {
  return {
    title: input.title,
    summary: input.summary,
  }
}

function normalizeChatInput(input = {}) {
  return {
    body: input.body,
  }
}

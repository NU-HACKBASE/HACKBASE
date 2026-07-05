import { apiRequest } from './apiClient'

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

export function normalizeChats(data) {
  const items = data?.chats ?? data?.items ?? data?.data ?? data

  if (!Array.isArray(items)) {
    return []
  }

  return items.map(normalizeChat)
}

export function normalizeChat(data) {
  const source = data?.chat ?? data ?? {}
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
    updatedAt: source.updatedAt ?? null,
    raw: source,
  }
}

function normalizeChatInput(input = {}) {
  return {
    body: input.body,
  }
}

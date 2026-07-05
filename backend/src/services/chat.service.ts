import type { ChatRepository } from '../repositories/chat.repository.js'
import type { RoomRepository } from '../repositories/room.repository.js'
import type { AuthSession, ChatRecord } from '../types/api.js'
import { ApiError } from '../utils/api-error.js'
import { chatHub, type WebSocketHub } from '../ws/hub.js'

export class ChatService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly chatRepository: ChatRepository,
    private readonly hub: WebSocketHub = chatHub,
  ) {}

  async listChats(roomId: string, limit = 50) {
    await this.ensureRoom(roomId)

    return this.chatRepository.listByRoomId(roomId, Math.min(Math.max(limit, 1), 100))
  }

  async createChat(session: AuthSession, roomId: string, input: { body?: string }) {
    const room = await this.ensureRoom(roomId)

    if (!input.body?.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'body is required')
    }

    const chat = await this.chatRepository.create({
      eventId: room.eventId,
      roomId,
      userId: session.userId,
      body: input.body.trim(),
    })

    await this.roomRepository.markAnalysisRequested(roomId)
    this.publishChatEvent('chat.created', chat)

    return chat
  }

  async updateChat(session: AuthSession, chatId: string, input: { body?: string }) {
    if (!input.body?.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'body is required')
    }

    const chat = await this.ensureOwnChat(session, chatId)
    const updated = await this.chatRepository.update(chat.chatId, input.body.trim())

    await this.roomRepository.markAnalysisRequested(chat.roomId)

    if (updated) {
      this.publishChatEvent('chat.updated', updated)
    }

    return updated
  }

  async deleteChat(session: AuthSession, chatId: string) {
    const chat = await this.ensureOwnChat(session, chatId)

    await this.chatRepository.delete(chat.chatId)
    await this.roomRepository.markAnalysisRequested(chat.roomId)
    this.publishChatEvent('chat.deleted', {
      chatId: chat.chatId,
      roomId: chat.roomId,
    })
  }

  async likeChat(session: AuthSession, chatId: string) {
    const chat = await this.ensureChat(chatId)
    const liked = await this.chatRepository.like({
      chatId,
      userId: session.userId,
    })

    await this.roomRepository.markAnalysisRequested(chat.roomId)

    if (liked) {
      this.publishChatEvent('chat.updated', liked)
    }

    return liked
  }

  async unlikeChat(session: AuthSession, chatId: string) {
    const chat = await this.ensureChat(chatId)
    const unliked = await this.chatRepository.unlike({
      chatId,
      userId: session.userId,
    })

    await this.roomRepository.markAnalysisRequested(chat.roomId)

    if (unliked) {
      this.publishChatEvent('chat.updated', unliked)
    }

    return unliked
  }

  private publishChatEvent(type: string, payload: ChatRecord | { chatId: string; roomId: string }) {
    const roomId = 'roomId' in payload ? payload.roomId : undefined

    if (!roomId) {
      return
    }

    this.hub.broadcastToRoom(roomId, { type, payload })
  }

  private async ensureRoom(roomId: string) {
    const room = await this.roomRepository.findById(roomId)

    if (!room) {
      throw new ApiError(404, 'ROOM_NOT_FOUND', 'Room not found')
    }

    return room
  }

  private async ensureChat(chatId: string) {
    const chat = await this.chatRepository.findById(chatId)

    if (!chat) {
      throw new ApiError(404, 'CHAT_NOT_FOUND', 'Chat not found')
    }

    return chat
  }

  private async ensureOwnChat(session: AuthSession, chatId: string) {
    const chat = await this.ensureChat(chatId)

    if (chat.userId !== session.userId && session.role !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Only the author can modify this chat')
    }

    return chat
  }
}

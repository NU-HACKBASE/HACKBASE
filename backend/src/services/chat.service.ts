import type { ChatRepository } from '../repositories/chat.repository.js'
import type { RoomRepository } from '../repositories/room.repository.js'
import type { AuthSession } from '../types/api.js'
import { ApiError } from '../utils/api-error.js'

export class ChatService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly chatRepository: ChatRepository,
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

    return this.chatRepository.create({
      eventId: room.eventId,
      roomId,
      userId: session.userId,
      body: input.body.trim(),
    })
  }

  async updateChat(session: AuthSession, chatId: string, input: { body?: string }) {
    if (!input.body?.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'body is required')
    }

    const chat = await this.ensureOwnChat(session, chatId)

    return this.chatRepository.update(chat.chatId, input.body.trim())
  }

  async deleteChat(session: AuthSession, chatId: string) {
    const chat = await this.ensureOwnChat(session, chatId)

    await this.chatRepository.delete(chat.chatId)
  }

  async likeChat(session: AuthSession, chatId: string) {
    await this.ensureChat(chatId)

    return this.chatRepository.like({
      chatId,
      userId: session.userId,
    })
  }

  async unlikeChat(session: AuthSession, chatId: string) {
    await this.ensureChat(chatId)

    return this.chatRepository.unlike({
      chatId,
      userId: session.userId,
    })
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

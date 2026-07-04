import type { ChatRepository } from '../repositories/chat.repository.js'
import type { EventRepository } from '../repositories/event.repository.js'
import type { RoomRepository } from '../repositories/room.repository.js'
import type { AuthSession } from '../types/api.js'
import { ApiError } from '../utils/api-error.js'
import type { AuthService } from './auth.service.js'

export class RoomService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly roomRepository: RoomRepository,
    private readonly chatRepository: ChatRepository,
    private readonly authService: AuthService,
  ) {}

  async createRoom(session: AuthSession, eventId: string, input: { title?: string; summary?: string }) {
    this.authService.requireAdmin(session)
    await this.ensureEvent(eventId)

    if (!input.title?.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'title is required')
    }

    return this.roomRepository.create({
      eventId,
      title: input.title.trim(),
      summary: input.summary,
    })
  }

  async listRooms(eventId: string) {
    await this.ensureEvent(eventId)

    return this.roomRepository.listByEventId(eventId)
  }

  async getRoom(roomId: string) {
    const room = await this.roomRepository.findById(roomId)

    if (!room) {
      throw new ApiError(404, 'ROOM_NOT_FOUND', 'Room not found')
    }

    const chats = await this.chatRepository.listByRoomId(roomId, 20)

    return {
      room,
      chats,
    }
  }

  async updateRoom(session: AuthSession, roomId: string, input: { title?: string; summary?: string }) {
    this.authService.requireAdmin(session)
    await this.ensureRoom(roomId)

    if (input.title !== undefined && !input.title.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'title must not be blank')
    }

    const room = await this.roomRepository.update(roomId, {
      ...input,
      title: input.title?.trim(),
    })

    if (!room) {
      throw new ApiError(404, 'ROOM_NOT_FOUND', 'Room not found')
    }

    return room
  }

  async deleteRoom(session: AuthSession, roomId: string) {
    this.authService.requireAdmin(session)
    await this.ensureRoom(roomId)
    await this.roomRepository.delete(roomId)
  }

  async analyzeRoom(session: AuthSession, roomId: string) {
    this.authService.requireAdmin(session)
    const room = await this.roomRepository.findById(roomId)

    if (!room) {
      throw new ApiError(404, 'ROOM_NOT_FOUND', 'Room not found')
    }

    const chats = await this.chatRepository.listByRoomId(roomId, 50)
    const likedCount = chats.reduce((total, chat) => total + chat.likedCount, 0)
    const heat = Math.min(100, chats.length * 8 + likedCount * 4)
    const latestBodies = chats
      .slice(-5)
      .map((chat) => chat.body)
      .filter(Boolean)
    const summary =
      latestBodies.length > 0
        ? `最近の話題: ${latestBodies.join(' / ')}`
        : 'まだチャットがありません。'
    const updatedRoom = await this.roomRepository.updateAnalysis(roomId, { heat, summary })

    if (!updatedRoom) {
      throw new ApiError(404, 'ROOM_NOT_FOUND', 'Room not found')
    }

    return {
      room: updatedRoom,
      analysis: {
        heat,
        summary,
        trends: latestBodies.slice(-3),
      },
    }
  }

  private async ensureEvent(eventId: string) {
    const event = await this.eventRepository.findById(eventId)

    if (!event) {
      throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found')
    }
  }

  private async ensureRoom(roomId: string) {
    const room = await this.roomRepository.findById(roomId)

    if (!room) {
      throw new ApiError(404, 'ROOM_NOT_FOUND', 'Room not found')
    }

    return room
  }
}

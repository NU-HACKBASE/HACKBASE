import type { Context } from 'hono'

import type { AuthService } from '../services/auth.service.js'
import type { RoomService } from '../services/room.service.js'
import { getBearerToken, readJson, requireParam } from '../utils/request.js'

type CreateRoomBody = {
  title?: string
  summary?: string
}

type UpdateRoomBody = CreateRoomBody

export class RoomHandler {
  constructor(
    private readonly roomService: RoomService,
    private readonly authService: AuthService,
  ) {}

  createRoom = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const body = await readJson<CreateRoomBody>(c)
    const room = await this.roomService.createRoom(session, requireParam(c, 'eventId'), body)

    return c.json({ room }, 201)
  }

  listRooms = async (c: Context) => {
    const rooms = await this.roomService.listRooms(requireParam(c, 'eventId'))

    return c.json({ rooms })
  }

  getRoom = async (c: Context) => {
    const result = await this.roomService.getRoom(requireParam(c, 'roomId'))

    return c.json(result)
  }

  updateRoom = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const body = await readJson<UpdateRoomBody>(c)
    const room = await this.roomService.updateRoom(session, requireParam(c, 'roomId'), body)

    return c.json({ room })
  }

  deleteRoom = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    await this.roomService.deleteRoom(session, requireParam(c, 'roomId'))

    return c.body(null, 204)
  }

  analyzeRoom = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const result = await this.roomService.analyzeRoom(session, requireParam(c, 'roomId'))

    return c.json(result)
  }
}

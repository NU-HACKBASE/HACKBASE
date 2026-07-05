import type { Context } from 'hono'

import type { AuthService } from '../services/auth.service.js'
import type { ChatService } from '../services/chat.service.js'
import { getBearerToken, readJson, requireParam } from '../utils/request.js'

type ChatBody = {
  body?: string
}

export class ChatHandler {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  listChats = async (c: Context) => {
    const limit = Number(c.req.query('limit') ?? 50)
    const chats = await this.chatService.listChats(requireParam(c, 'roomId'), limit)

    return c.json({ chats })
  }

  createChat = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const body = await readJson<ChatBody>(c)
    const chat = await this.chatService.createChat(session, requireParam(c, 'roomId'), body)

    return c.json({ chat }, 201)
  }

  updateChat = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const body = await readJson<ChatBody>(c)
    const chat = await this.chatService.updateChat(session, requireParam(c, 'chatId'), body)

    return c.json({ chat })
  }

  deleteChat = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    await this.chatService.deleteChat(session, requireParam(c, 'chatId'))

    return c.body(null, 204)
  }

  likeChat = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const chat = await this.chatService.likeChat(session, requireParam(c, 'chatId'))

    return c.json({ chat })
  }

  unlikeChat = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const chat = await this.chatService.unlikeChat(session, requireParam(c, 'chatId'))

    return c.json({ chat })
  }
}

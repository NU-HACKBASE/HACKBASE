import { Hono } from 'hono'

import type { ChatHandler } from '../handlers/chat.handler.js'
import type { EventHandler } from '../handlers/event.handler.js'
import type { RoomHandler } from '../handlers/room.handler.js'
import type { UserHandler } from '../handlers/user.handler.js'

export const createApiRoute = (handlers: {
  userHandler: UserHandler
  eventHandler: EventHandler
  roomHandler: RoomHandler
  chatHandler: ChatHandler
}) => {
  const route = new Hono()

  route.post('/users', handlers.userHandler.createUser)
  route.get('/users/me', handlers.userHandler.getMe)
  route.post('/admin/login', handlers.userHandler.loginAdmin)

  route.get('/events', handlers.eventHandler.listEvents)
  route.post('/events', handlers.eventHandler.createEvent)
  route.get('/events/:eventId', handlers.eventHandler.getEvent)
  route.patch('/events/:eventId', handlers.eventHandler.updateEvent)
  route.delete('/events/:eventId', handlers.eventHandler.deleteEvent)
  route.post('/events/:eventId/join', handlers.eventHandler.joinEvent)
  route.get('/events/:eventId/participants', handlers.eventHandler.listParticipants)

  route.get('/events/:eventId/rooms', handlers.roomHandler.listRooms)
  route.post('/events/:eventId/rooms', handlers.roomHandler.createRoom)
  route.get('/rooms/:roomId', handlers.roomHandler.getRoom)
  route.patch('/rooms/:roomId', handlers.roomHandler.updateRoom)
  route.delete('/rooms/:roomId', handlers.roomHandler.deleteRoom)
  route.post('/rooms/:roomId/analyze', handlers.roomHandler.analyzeRoom)

  route.get('/rooms/:roomId/chats', handlers.chatHandler.listChats)
  route.post('/rooms/:roomId/chats', handlers.chatHandler.createChat)
  route.patch('/chats/:chatId', handlers.chatHandler.updateChat)
  route.delete('/chats/:chatId', handlers.chatHandler.deleteChat)
  route.put('/chats/:chatId/like', handlers.chatHandler.likeChat)
  route.delete('/chats/:chatId/like', handlers.chatHandler.unlikeChat)

  return route
}

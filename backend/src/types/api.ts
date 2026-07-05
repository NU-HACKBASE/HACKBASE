export type UserRole = 'anonymous' | 'admin'

export type AuthSession = {
  userId: string
  role: UserRole
}

export type EventRecord = {
  eventId: string
  title: string
  address: string
  latitude: number | null
  longitude: number | null
  radius: number
  heat: number
  participants: number
  startsAt: string | null
  managerId: string | null
  createdAt: string
}

export type RoomRecord = {
  roomId: string
  eventId: string
  title: string
  heat: number
  summary: string
  participants: number
  createdAt: string
}

export type ChatRecord = {
  chatId: string
  eventId: string
  roomId: string
  userId: string
  userName: string
  body: string
  likedCount: number
  createdAt: string
  updatedAt: string | null
}

export type UserRecord = {
  userId: string
  userName: string
  role: UserRole
  createdAt: string
}

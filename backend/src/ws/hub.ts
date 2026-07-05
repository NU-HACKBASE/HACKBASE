import type { WSContext } from 'hono/ws'

export type HubMessage = {
  type: string
  payload?: unknown
}

type Client = {
  ws: WSContext
  roomIds: Set<string>
}

export class WebSocketHub {
  private readonly clients = new Set<Client>()

  addClient(ws: WSContext) {
    const client: Client = { ws, roomIds: new Set() }
    this.clients.add(client)

    return client
  }

  removeClient(ws: WSContext) {
    for (const client of this.clients) {
      if (client.ws === ws) {
        this.clients.delete(client)
        return
      }
    }
  }

  subscribe(ws: WSContext, roomId: string) {
    const client = this.findClient(ws)

    if (client) {
      client.roomIds.add(roomId)
    }
  }

  unsubscribe(ws: WSContext, roomId: string) {
    const client = this.findClient(ws)

    if (client) {
      client.roomIds.delete(roomId)
    }
  }

  broadcastToRoom(roomId: string, message: HubMessage) {
    const payload = JSON.stringify(message)

    for (const client of this.clients) {
      if (!client.roomIds.has(roomId)) {
        continue
      }

      try {
        client.ws.send(payload)
      } catch {
        this.clients.delete(client)
      }
    }
  }

  getRoomSubscriberCount(roomId: string) {
    let count = 0

    for (const client of this.clients) {
      if (client.roomIds.has(roomId)) {
        count += 1
      }
    }

    return count
  }

  private findClient(ws: WSContext) {
    for (const client of this.clients) {
      if (client.ws === ws) {
        return client
      }
    }

    return undefined
  }
}

export const chatHub = new WebSocketHub()

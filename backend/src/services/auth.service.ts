import { createHmac, timingSafeEqual } from 'node:crypto'

import { env } from '../config/env.js'
import type { AuthSession, UserRole } from '../types/api.js'
import { ApiError } from '../utils/api-error.js'

type TokenPayload = AuthSession & {
  iat: number
}

const encodeBase64Url = (value: string) => Buffer.from(value).toString('base64url')
const decodeBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8')

export class AuthService {
  createToken(userId: string, role: UserRole): string {
    const payload: TokenPayload = {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
    }
    const encodedPayload = encodeBase64Url(JSON.stringify(payload))
    const signature = this.sign(encodedPayload)

    return `${encodedPayload}.${signature}`
  }

  verifyToken(token: string): AuthSession {
    const [encodedPayload, signature] = token.split('.')

    if (!encodedPayload || !signature) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid token')
    }

    const expectedSignature = this.sign(encodedPayload)

    if (!this.isEqual(signature, expectedSignature)) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid token')
    }

    try {
      const payload = JSON.parse(decodeBase64Url(encodedPayload)) as TokenPayload

      if (!payload.userId || !payload.role) {
        throw new Error('Invalid payload')
      }

      return {
        userId: payload.userId,
        role: payload.role,
      }
    } catch {
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid token')
    }
  }

  requireAdmin(session: AuthSession) {
    if (session.role !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Admin role is required')
    }
  }

  private sign(value: string): string {
    return createHmac('sha256', env.authSecret).update(value).digest('base64url')
  }

  private isEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left)
    const rightBuffer = Buffer.from(right)

    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  }
}

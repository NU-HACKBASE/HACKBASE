import { env } from '../config/env.js'
import type { UserRepository } from '../repositories/user.repository.js'
import type { AuthSession, UserRecord } from '../types/api.js'
import { ApiError } from '../utils/api-error.js'
import type { AuthService } from './auth.service.js'

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
  ) {}

  async createAnonymousUser(input: { userName?: string }) {
    const user = await this.userRepository.createUser({
      name: input.userName,
      role: 'anonymous',
    })

    return {
      user,
      token: this.authService.createToken(user.userId, user.role),
    }
  }

  async loginAdmin(input: { password?: string; userName?: string }) {
    if (input.password !== env.adminPassword) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid admin credentials')
    }

    const user = await this.userRepository.createUser({
      id: 'admin',
      name: input.userName || 'admin',
      role: 'admin',
    })

    return {
      user,
      token: this.authService.createToken(user.userId, user.role),
    }
  }

  async getMe(session: AuthSession): Promise<UserRecord> {
    const user = await this.userRepository.findById(session.userId)

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found')
    }

    return user
  }
}

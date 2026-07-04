import type { Context } from 'hono'

import type { AuthService } from '../services/auth.service.js'
import type { UserService } from '../services/user.service.js'
import { getBearerToken, readJson } from '../utils/request.js'

type CreateUserBody = {
  userName?: string
}

type AdminLoginBody = {
  userName?: string
  password?: string
}

export class UserHandler {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  createUser = async (c: Context) => {
    const body = await readJson<CreateUserBody>(c)
    const result = await this.userService.createAnonymousUser(body)

    return c.json(result, 201)
  }

  getMe = async (c: Context) => {
    const session = this.authService.verifyToken(getBearerToken(c))
    const user = await this.userService.getMe(session)

    return c.json({ user })
  }

  loginAdmin = async (c: Context) => {
    const body = await readJson<AdminLoginBody>(c)
    const result = await this.userService.loginAdmin(body)

    return c.json(result)
  }
}

import type { Context } from 'hono'

import { ApiError } from './api-error.js'

export const getBearerToken = (c: Context): string => {
  const authorization = c.req.header('Authorization') ?? ''
  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Bearer token is required')
  }

  return token
}

export const readJson = async <T>(c: Context): Promise<T> => {
  const text = await c.req.text()

  if (text.trim() === '') {
    return {} as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }
}

export const requireParam = (c: Context, name: string): string => {
  const value = c.req.param(name)

  if (!value) {
    throw new ApiError(400, 'MISSING_PARAM', `${name} is required`)
  }

  return value
}

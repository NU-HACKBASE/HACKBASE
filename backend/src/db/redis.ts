import { createClient } from 'redis'

import { env } from '../config/env.js'

export const redis = createClient({
  url: env.redisUrl,
})

redis.on('error', (error) => {
  console.error('Redis client error', error)
})

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect()
  }
}

export const closeRedis = async () => {
  if (redis.isOpen) {
    await redis.quit()
  }
}

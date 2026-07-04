import { config } from 'dotenv'

config({ path: new URL('../../../.env', import.meta.url) })

export type AppEnv = {
  appEnv: string
  host: string
  port: number
  corsOrigin: string
  databaseUrl: string
  redisUrl: string
  authSecret: string
  adminPassword: string
}

const readEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export const env: AppEnv = {
  appEnv: readEnv('APP_ENV', 'development'),
  host: readEnv('BACKEND_HOST', '0.0.0.0'),
  port: Number(readEnv('BACKEND_PORT', '8787')),
  corsOrigin: readEnv('CORS_ORIGIN', 'http://localhost:5173'),
  databaseUrl: readEnv(
    'DATABASE_URL',
    'postgres://hackbase:hackbase@localhost:5432/hackbase',
  ),
  redisUrl: readEnv('REDIS_URL', 'redis://localhost:6379'),
  authSecret: readEnv('AUTH_SECRET', 'local-development-secret'),
  adminPassword: readEnv('ADMIN_PASSWORD', 'admin'),
}

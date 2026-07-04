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

export const readEnv = (
  key: string,
  fallback?: string,
  processEnv: NodeJS.ProcessEnv = process.env,
): string => {
  const value = processEnv[key] ?? fallback

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

const appEnv = readEnv('APP_ENV', 'development')

export const env: AppEnv = {
  appEnv,
  host: readEnv('BACKEND_HOST', '0.0.0.0'),
  port: Number(readEnv('BACKEND_PORT', '8787')),
  corsOrigin: readEnv('CORS_ORIGIN', 'http://localhost:5173'),
  databaseUrl: readEnv(
    'DATABASE_URL',
    'postgres://hackbase:hackbase@localhost:5432/hackbase',
  ),
  redisUrl: readEnv('REDIS_URL', 'redis://localhost:6379'),
  authSecret: readEnv('AUTH_SECRET'),
  adminPassword: readEnv('ADMIN_PASSWORD'),
}

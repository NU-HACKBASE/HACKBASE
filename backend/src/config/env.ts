import { config } from 'dotenv'

config({ path: new URL('../../../.env', import.meta.url) })

export type AppEnv = {
  appEnv: string
  host: string
  port: number
  corsOrigin: string
  supabaseUrl: string
  supabasePublishableKey: string
  supabaseSecretKey: string
  supabaseJwksUrl: string
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

const appEnv = readEnv('APP_ENV')

export const env: AppEnv = {
  appEnv,
  host: readEnv('BACKEND_HOST'),
  port: Number(readEnv('BACKEND_PORT')),
  corsOrigin: readEnv('CORS_ORIGIN'),
  supabaseUrl: readEnv('SUPABASE_URL'),
  supabasePublishableKey: readEnv('SUPABASE_PUBLISHABLE_KEY'),
  supabaseSecretKey: readEnv('SUPABASE_SECRET_KEY'),
  supabaseJwksUrl: readEnv('SUPABASE_JWKS_URL'),
  authSecret: readEnv('AUTH_SECRET'),
  adminPassword: readEnv('ADMIN_PASSWORD'),
}

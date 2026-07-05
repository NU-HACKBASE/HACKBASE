import { config } from 'dotenv'

import { readEnv } from './read-env.js'

config({ path: new URL('../../../.env', import.meta.url) })

export type AppEnv = {
  appEnv: string
  host: string
  port: number
  corsOrigin: string
  supabaseUrl: string
  supabasePublishableKey: string
  supabaseSecretKey: string
  supabaseServiceRoleKey: string
  supabaseJwksUrl: string
  authSecret: string
  adminPassword: string
}

export { readEnv } from './read-env.js'

export const env: AppEnv = {
  appEnv: readEnv('APP_ENV'),
  host: readEnv('BACKEND_HOST'),
  port: Number(readEnv('BACKEND_PORT')),
  corsOrigin: readEnv('CORS_ORIGIN'),
  supabaseUrl: readEnv('SUPABASE_URL'),
  supabasePublishableKey: readEnv('SUPABASE_PUBLISHABLE_KEY'),
  supabaseSecretKey: readEnv('SUPABASE_SECRET_KEY'),
  supabaseServiceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SECRET_KEY),
  supabaseJwksUrl: readEnv('SUPABASE_JWKS_URL'),
  authSecret: readEnv('AUTH_SECRET'),
  adminPassword: readEnv('ADMIN_PASSWORD'),
}

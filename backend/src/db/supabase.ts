import type { SupabaseEnv } from '@supabase/server'
import { createAdminClient, resolveEnv } from '@supabase/server/core'

import { env } from '../config/env.js'

export const supabaseEnv: SupabaseEnv = {
  url: env.supabaseUrl,
  publishableKeys: {
    default: env.supabasePublishableKey,
  },
  secretKeys: {
    default: env.supabaseSecretKey,
  },
  jwks: new URL(env.supabaseJwksUrl),
}

const resolvedEnv = resolveEnv(supabaseEnv)

if (resolvedEnv.error) {
  throw resolvedEnv.error
}

export const supabaseAdmin = createAdminClient({
  env: resolvedEnv.data,
})

import type { PostgrestError } from '@supabase/supabase-js'

export const throwIfSupabaseError = (error: PostgrestError | null) => {
  if (error) {
    throw new Error(error.message)
  }
}

export const toIsoString = (value: Date | string): string => new Date(value).toISOString()

export const toNullableIsoString = (value: Date | string | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null

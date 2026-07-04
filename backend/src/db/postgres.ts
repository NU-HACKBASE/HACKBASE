import pg from 'pg'

import { env } from '../config/env.js'

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
})

export const closePostgres = async () => {
  await pool.end()
}

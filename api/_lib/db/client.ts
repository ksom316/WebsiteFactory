import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { requireEnv } from '../env.js'

let cachedSql: NeonQueryFunction<false, false> | null = null

/**
 * Lazily-created, cached HTTP query function. The Neon serverless (HTTP) driver issues
 * one stateless request per query — there is no connection to pool or leak across
 * invocations, which is why this is safe to reuse as a module-level singleton.
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (!cachedSql) {
    cachedSql = neon(requireEnv('DATABASE_URL'))
  }
  return cachedSql
}

export class DatabaseError extends Error {
  constructor(cause: unknown) {
    super('Database operation failed')
    this.cause = cause
  }
}

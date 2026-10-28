import { sendJson, type ApiResponse } from './http.js'
import { MissingEnvError } from './env.js'
import { DatabaseError } from './db/client.js'
import { VercelApiError } from './vercel/client.js'

/** A requested resource (project, config version) doesn't exist. Maps to 404. */
export class NotFoundError extends Error {}

/** A request conflicts with current server state (duplicate slug, stale version). Maps to 409. */
export class ConflictError extends Error {}

/** Logs the real error server-side, but only ever sends a generic, non-sensitive message to the browser. */
export function handleApiError(res: ApiResponse, error: unknown): void {
  if (error instanceof NotFoundError) {
    sendJson(res, 404, { error: error.message || 'Not found' })
    return
  }

  if (error instanceof ConflictError) {
    sendJson(res, 409, { error: error.message || 'Conflict' })
    return
  }

  if (error instanceof VercelApiError) {
    console.error('[vercel]', error.kind, error.status, error.message)
    const status = error.kind === 'rate_limited' ? 429 : error.kind === 'not_found' ? 404 : error.kind === 'conflict' ? 409 : 502
    sendJson(res, status, { error: error.message })
    return
  }

  if (error instanceof MissingEnvError) {
    console.error('[config]', error.message)
    sendJson(res, 503, { error: 'Server is not configured correctly. Check server logs.' })
    return
  }

  if (error instanceof DatabaseError) {
    console.error('[database]', error.cause instanceof Error ? error.cause.message : error.cause)
    sendJson(res, 503, { error: 'Database is currently unavailable.' })
    return
  }

  console.error('[api]', error instanceof Error ? error.stack ?? error.message : error)
  sendJson(res, 500, { error: 'Internal server error.' })
}

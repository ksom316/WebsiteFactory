import { sendJson, type ApiRequest, type ApiResponse } from './_lib/http.js'
import { checkDatabaseHealth } from './_lib/db/queries/health.js'

/** Public, sanitized health check: never reveals connection strings or query details. */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    await checkDatabaseHealth()
    sendJson(res, 200, { status: 'ok', database: 'connected' })
  } catch {
    sendJson(res, 200, { status: 'degraded', database: 'unavailable' })
  }
}

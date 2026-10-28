import { appendSetCookie, parseCookies, sendJson, serializeCookie, type ApiRequest, type ApiResponse } from './http.js'
import { isProduction } from './env.js'
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, verifySessionToken } from './session.js'
import { verifyCsrf } from './csrf.js'

export function setSessionCookie(res: ApiResponse, token: string): void {
  appendSetCookie(
    res,
    serializeCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'Lax',
      maxAgeSeconds: SESSION_MAX_AGE_SECONDS,
    }),
  )
}

export function clearSessionCookie(res: ApiResponse): void {
  appendSetCookie(
    res,
    serializeCookie(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'Lax',
      maxAgeSeconds: 0,
    }),
  )
}

export async function isAuthenticated(req: ApiRequest): Promise<boolean> {
  const token = parseCookies(req)[SESSION_COOKIE]
  if (!token) return false
  return verifySessionToken(token)
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

type Handler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void

/**
 * Wraps a handler so it requires a valid session for every request, and a valid
 * CSRF double-submit token for state-changing methods. Frontend route guards are a UX
 * nicety only — this is the actual enforcement point.
 */
export function withAuth(handler: Handler): Handler {
  return async (req, res) => {
    const authenticated = await isAuthenticated(req)
    if (!authenticated) {
      sendJson(res, 401, { error: 'Unauthorized' })
      return
    }

    if (req.method && MUTATING_METHODS.has(req.method) && !verifyCsrf(req)) {
      sendJson(res, 403, { error: 'Invalid or missing CSRF token' })
      return
    }

    await handler(req, res)
  }
}

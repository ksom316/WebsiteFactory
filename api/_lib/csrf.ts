import { randomBytes, timingSafeEqual } from 'node:crypto'
import { appendSetCookie, parseCookies, serializeCookie, type ApiRequest, type ApiResponse } from './http.js'
import { isProduction } from './env.js'

export const CSRF_COOKIE = 'wf_csrf'
export const CSRF_HEADER = 'x-csrf-token'

export function issueCsrfCookie(res: ApiResponse): string {
  const token = randomBytes(24).toString('hex')
  appendSetCookie(
    res,
    serializeCookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: isProduction(),
      sameSite: 'Lax',
      maxAgeSeconds: 60 * 60 * 24 * 7,
    }),
  )
  return token
}

/** Double-submit cookie check for state-changing requests. */
export function verifyCsrf(req: ApiRequest): boolean {
  const cookieToken = parseCookies(req)[CSRF_COOKIE]
  const headerToken = req.headers[CSRF_HEADER]

  if (!cookieToken || typeof headerToken !== 'string' || headerToken.length === 0) return false
  if (cookieToken.length !== headerToken.length) return false

  return timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
}

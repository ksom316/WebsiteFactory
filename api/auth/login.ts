import { z } from 'zod'
import { readJsonBody, sendJson, getClientIp, InvalidJsonError, PayloadTooLargeError, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { requireEnv } from '../_lib/env.js'
import { verifyPassword } from '../_lib/password.js'
import { createSessionToken } from '../_lib/session.js'
import { setSessionCookie } from '../_lib/auth.js'
import { issueCsrfCookie } from '../_lib/csrf.js'
import { isRateLimited } from '../_lib/rateLimit.js'
import { handleApiError } from '../_lib/errors.js'

const loginSchema = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(200),
})

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const ip = getClientIp(req)
  if (isRateLimited(`login:${ip}`)) {
    sendJson(res, 429, { error: 'Too many login attempts. Try again later.' })
    return
  }

  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      sendJson(res, 413, { error: 'Request body too large' })
    } else if (error instanceof InvalidJsonError) {
      sendJson(res, 400, { error: 'Invalid JSON body' })
    } else {
      sendJson(res, 400, { error: 'Invalid request' })
    }
    return
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    sendJson(res, 400, { error: 'Username and password are required.' })
    return
  }

  try {
    const expectedUsername = requireEnv('ADMIN_USERNAME')
    const expectedPasswordHash = requireEnv('ADMIN_PASSWORD_HASH')

    const usernameMatches = parsed.data.username === expectedUsername
    const passwordMatches = await verifyPassword(parsed.data.password, expectedPasswordHash)

    if (!usernameMatches || !passwordMatches) {
      sendJson(res, 401, { error: 'Invalid username or password.' })
      return
    }

    const token = await createSessionToken()
    setSessionCookie(res, token)
    issueCsrfCookie(res)
    sendJson(res, 200, { ok: true })
  } catch (error) {
    handleApiError(res, error)
  }
}

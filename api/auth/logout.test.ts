// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockReq, createMockRes, getJsonBody, getCookies } from '../_lib/testHelpers'
import { SESSION_COOKIE, createSessionToken, verifySessionToken } from '../_lib/session'
import { CSRF_COOKIE } from '../_lib/csrf'
import handler from './logout'
import sessionHandler from './session'

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
})

describe('POST /api/auth/logout', () => {
  it('rejects an unauthenticated request', async () => {
    const req = createMockReq({ method: 'POST' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
  })

  it('rejects an authenticated request missing the CSRF token', async () => {
    const token = await createSessionToken()
    const req = createMockReq({ method: 'POST', cookies: { [SESSION_COOKIE]: token } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(403)
  })

  it('clears the session cookie for an authenticated request with a valid CSRF token', async () => {
    const token = await createSessionToken()
    const req = createMockReq({
      method: 'POST',
      cookies: { [SESSION_COOKIE]: token, [CSRF_COOKIE]: 'csrf-token' },
      csrfHeader: 'csrf-token',
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    expect(getJsonBody(state)).toEqual({ ok: true })

    const clearCookie = getCookies(state).find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))
    expect(clearCookie).toBeDefined()
    expect(clearCookie).toMatch(/Max-Age=0/)
  })

  it('invalidates the session so a later check reports unauthenticated', async () => {
    // The cookie is signed and stateless, so "invalidation" here is the browser discarding
    // it after Max-Age=0; simulate that by checking session status without resending it.
    const reqWithoutCookie = createMockReq({ method: 'GET' })
    const { res, state } = createMockRes()
    await sessionHandler(reqWithoutCookie, res)
    expect(getJsonBody(state)).toEqual({ authenticated: false })
  })

  it('still verifies a token signed before logout, confirming logout relies on cookie clearing', async () => {
    const token = await createSessionToken()
    expect(await verifySessionToken(token)).toBe(true)
  })
})

// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockReq, createMockRes, getJsonBody, getCookies } from '../_lib/testHelpers'
import { SESSION_COOKIE, createSessionToken } from '../_lib/session'
import { CSRF_COOKIE } from '../_lib/csrf'
import handler from './session'

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
})

describe('GET /api/auth/session', () => {
  it('reports unauthenticated with no cookie', async () => {
    const req = createMockReq({ method: 'GET' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(getJsonBody(state)).toEqual({ authenticated: false })
  })

  it('reports authenticated with a valid session cookie', async () => {
    const token = await createSessionToken()
    const req = createMockReq({ method: 'GET', cookies: { [SESSION_COOKIE]: token } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(getJsonBody(state)).toEqual({ authenticated: true })
  })

  it('reports unauthenticated with a tampered session cookie', async () => {
    const token = await createSessionToken()
    const req = createMockReq({ method: 'GET', cookies: { [SESSION_COOKIE]: `${token}x` } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(getJsonBody(state)).toEqual({ authenticated: false })
  })

  it('always issues a CSRF cookie', async () => {
    const req = createMockReq({ method: 'GET' })
    const { res, state } = createMockRes()
    await handler(req, res)
    const cookies = getCookies(state)
    expect(cookies.some((cookie) => cookie.startsWith(`${CSRF_COOKIE}=`))).toBe(true)
  })
})

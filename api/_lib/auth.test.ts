// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockReq, createMockRes, getJsonBody } from './testHelpers'
import { CSRF_COOKIE } from './csrf'

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
})

describe('withAuth', () => {
  it('rejects requests with no session cookie', async () => {
    const { withAuth } = await import('./auth')
    const handler = withAuth(() => {
      throw new Error('should not be called')
    })
    const req = createMockReq({ method: 'GET' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
    expect(getJsonBody(state)).toEqual({ error: 'Unauthorized' })
  })

  it('rejects requests with a tampered session cookie', async () => {
    const { withAuth } = await import('./auth')
    const { SESSION_COOKIE } = await import('./session')
    const handler = withAuth(() => {
      throw new Error('should not be called')
    })
    const req = createMockReq({ method: 'GET', cookies: { [SESSION_COOKIE]: 'garbage.garbage.garbage' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
  })

  it('allows GET requests with a valid session and no CSRF token', async () => {
    const { withAuth } = await import('./auth')
    const { SESSION_COOKIE, createSessionToken } = await import('./session')
    const token = await createSessionToken()
    let called = false
    const handler = withAuth(() => {
      called = true
    })
    const req = createMockReq({ method: 'GET', cookies: { [SESSION_COOKIE]: token } })
    const { res } = createMockRes()
    await handler(req, res)
    expect(called).toBe(true)
  })

  it('rejects mutating requests with a valid session but no CSRF token', async () => {
    const { withAuth } = await import('./auth')
    const { SESSION_COOKIE, createSessionToken } = await import('./session')
    const token = await createSessionToken()
    const handler = withAuth(() => {
      throw new Error('should not be called')
    })
    const req = createMockReq({ method: 'POST', cookies: { [SESSION_COOKIE]: token } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(403)
  })

  it('allows mutating requests with a valid session and matching CSRF token', async () => {
    const { withAuth } = await import('./auth')
    const { SESSION_COOKIE, createSessionToken } = await import('./session')
    const token = await createSessionToken()
    let called = false
    const handler = withAuth(() => {
      called = true
    })
    const req = createMockReq({
      method: 'POST',
      cookies: { [SESSION_COOKIE]: token, [CSRF_COOKIE]: 'csrf-token' },
      csrfHeader: 'csrf-token',
    })
    const { res } = createMockRes()
    await handler(req, res)
    expect(called).toBe(true)
  })
})

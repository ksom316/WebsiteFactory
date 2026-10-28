// @vitest-environment node
import { randomBytes, scryptSync } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockReq, createMockRes, getJsonBody, getCookies } from '../_lib/testHelpers'
import { SESSION_COOKIE } from '../_lib/session'
import handler from './login'

function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`
}

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
  process.env.ADMIN_USERNAME = 'owner'
  process.env.ADMIN_PASSWORD_HASH = hashPassword('super-secret-password')
})

describe('POST /api/auth/login', () => {
  it('rejects a non-POST request', async () => {
    const req = createMockReq({ method: 'GET', ip: '10.0.0.1' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(405)
  })

  it('rejects missing credentials with a validation error', async () => {
    const req = createMockReq({ method: 'POST', ip: '10.0.0.2', jsonBody: { username: '' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
  })

  it('rejects an incorrect password with a generic message', async () => {
    const req = createMockReq({
      method: 'POST',
      ip: '10.0.0.3',
      jsonBody: { username: 'owner', password: 'wrong' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
    expect(getJsonBody(state)).toEqual({ error: 'Invalid username or password.' })
  })

  it('rejects an unknown username with the same generic message', async () => {
    const req = createMockReq({
      method: 'POST',
      ip: '10.0.0.4',
      jsonBody: { username: 'someone-else', password: 'super-secret-password' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
    expect(getJsonBody(state)).toEqual({ error: 'Invalid username or password.' })
  })

  it('accepts valid credentials and sets session + csrf cookies', async () => {
    const req = createMockReq({
      method: 'POST',
      ip: '10.0.0.5',
      jsonBody: { username: 'owner', password: 'super-secret-password' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const cookies = getCookies(state)
    expect(cookies.some((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))).toBe(true)
    expect(cookies.some((cookie) => cookie.includes('HttpOnly'))).toBe(true)
  })

  it('rate limits repeated attempts from the same IP', async () => {
    const ip = '10.0.0.99'
    let lastState: ReturnType<typeof createMockRes>['state'] | undefined
    for (let i = 0; i < 12; i++) {
      const req = createMockReq({
        method: 'POST',
        ip,
        jsonBody: { username: 'owner', password: 'wrong' },
      })
      const { res, state } = createMockRes()
      await handler(req, res)
      lastState = state
    }
    expect(lastState?.statusCode).toBe(429)
  })

  it('fails safely when server configuration is missing', async () => {
    delete process.env.ADMIN_PASSWORD_HASH
    const req = createMockReq({
      method: 'POST',
      ip: '10.0.0.6',
      jsonBody: { username: 'owner', password: 'super-secret-password' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(503)
    expect(getJsonBody(state)).toEqual({ error: 'Server is not configured correctly. Check server logs.' })
  })
})

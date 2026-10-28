// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
})

describe('session tokens', () => {
  it('creates a token that verifies successfully', async () => {
    const { createSessionToken, verifySessionToken } = await import('./session')
    const token = await createSessionToken()
    expect(await verifySessionToken(token)).toBe(true)
  })

  it('rejects a tampered token', async () => {
    const { createSessionToken, verifySessionToken } = await import('./session')
    const token = await createSessionToken()
    const tampered = token.slice(0, -2) + (token.at(-2) === 'a' ? 'b' : 'a') + token.at(-1)
    expect(await verifySessionToken(tampered)).toBe(false)
  })

  it('rejects an expired token', async () => {
    const { SignJWT } = await import('jose')
    const { verifySessionToken } = await import('./session')
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('website-factory')
      .setSubject('admin')
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(secret)
    expect(await verifySessionToken(expired)).toBe(false)
  })

  it('rejects garbage input', async () => {
    const { verifySessionToken } = await import('./session')
    expect(await verifySessionToken('not-a-token')).toBe(false)
  })
})

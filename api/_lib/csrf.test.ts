// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { verifyCsrf, CSRF_COOKIE } from './csrf'
import { createMockReq } from './testHelpers'

describe('verifyCsrf', () => {
  it('accepts matching cookie and header', () => {
    const req = createMockReq({ cookies: { [CSRF_COOKIE]: 'token123' }, csrfHeader: 'token123' })
    expect(verifyCsrf(req)).toBe(true)
  })

  it('rejects a mismatched header', () => {
    const req = createMockReq({ cookies: { [CSRF_COOKIE]: 'token123' }, csrfHeader: 'different' })
    expect(verifyCsrf(req)).toBe(false)
  })

  it('rejects a missing cookie', () => {
    const req = createMockReq({ csrfHeader: 'token123' })
    expect(verifyCsrf(req)).toBe(false)
  })

  it('rejects a missing header', () => {
    const req = createMockReq({ cookies: { [CSRF_COOKIE]: 'token123' } })
    expect(verifyCsrf(req)).toBe(false)
  })
})

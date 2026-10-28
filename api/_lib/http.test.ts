// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createMockRes } from './testHelpers'
import { sendBinary, sendJson } from './http'

describe('sendJson', () => {
  it('sets no-store caching and nosniff on every JSON response', () => {
    const { res, state } = createMockRes()
    sendJson(res, 200, { ok: true })
    expect(state.headers['cache-control']).toBe('no-store')
    expect(state.headers['x-content-type-options']).toBe('nosniff')
    expect(state.headers['content-type']).toBe('application/json; charset=utf-8')
  })

  it('applies the same headers to an error response', () => {
    const { res, state } = createMockRes()
    sendJson(res, 503, { error: 'Database is currently unavailable.' })
    expect(state.headers['cache-control']).toBe('no-store')
    expect(state.headers['x-content-type-options']).toBe('nosniff')
  })
})

describe('sendBinary', () => {
  it('sets no-store caching and nosniff, and quotes the filename', () => {
    const { res, state } = createMockRes()
    sendBinary(res, 200, new Uint8Array([1, 2, 3]), 'application/zip', 'acme.zip')
    expect(state.headers['cache-control']).toBe('no-store')
    expect(state.headers['x-content-type-options']).toBe('nosniff')
    expect(state.headers['content-disposition']).toBe('attachment; filename="acme.zip"')
    expect(state.headers['content-type']).toBe('application/zip')
  })

  it('omits Content-Disposition when no filename is given', () => {
    const { res, state } = createMockRes()
    sendBinary(res, 200, new Uint8Array([1]), 'application/octet-stream')
    expect(state.headers['content-disposition']).toBeUndefined()
  })
})

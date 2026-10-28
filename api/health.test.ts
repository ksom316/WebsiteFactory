// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createMockReq, createMockRes, getJsonBody } from './_lib/testHelpers'

const checkDatabaseHealth = vi.fn()

vi.mock('./_lib/db/queries/health', () => ({
  checkDatabaseHealth: () => checkDatabaseHealth(),
}))

beforeEach(() => {
  checkDatabaseHealth.mockReset()
})

describe('GET /api/health', () => {
  it('reports ok when the database responds', async () => {
    checkDatabaseHealth.mockResolvedValue(true)
    const { default: handler } = await import('./health')
    const req = createMockReq({ method: 'GET' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    expect(getJsonBody(state)).toEqual({ status: 'ok', database: 'connected' })
  })

  it('reports degraded without leaking details when the database is unavailable', async () => {
    checkDatabaseHealth.mockRejectedValue(new Error('connection string invalid: postgres://secret'))
    const { default: handler } = await import('./health')
    const req = createMockReq({ method: 'GET' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const body = getJsonBody(state) as { status: string; database: string }
    expect(body).toEqual({ status: 'degraded', database: 'unavailable' })
    expect(JSON.stringify(body)).not.toContain('postgres://')
  })

  it('rejects non-GET requests', async () => {
    const { default: handler } = await import('./health')
    const req = createMockReq({ method: 'POST' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(405)
  })
})

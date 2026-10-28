// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes, getJsonBody } from '../_lib/testHelpers'
import { SESSION_COOKIE, createSessionToken } from '../_lib/session'
import { NotFoundError } from '../_lib/errors'
import { DatabaseError } from '../_lib/db/client'
import { parseCorporateConfig } from '../../src/templates/corporate/schema'

const getProjectById = vi.fn()
const getProjectVersions = vi.fn()

vi.mock('../_lib/db/queries/projects', () => ({
  getProjectById: (...args: unknown[]) => getProjectById(...args),
  getProjectVersions: (...args: unknown[]) => getProjectVersions(...args),
}))

const VALID_ID = '11111111-1111-4111-8111-111111111111'
const PROJECT = {
  id: VALID_ID,
  name: 'Riverside Landscaping',
  slug: 'riverside-landscaping',
  businessName: null,
  templateId: 'corporate',
  status: 'draft',
  createdAt: 'x',
  updatedAt: 'x',
}

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
  getProjectById.mockReset().mockResolvedValue(PROJECT)
  getProjectVersions.mockReset().mockResolvedValue([
    { id: 'v1', projectId: VALID_ID, versionNumber: 1, config: parseCorporateConfig({}), createdAt: 'x' },
  ])
})

async function authedReq(overrides: Parameters<typeof createMockReq>[0] = {}) {
  const token = await createSessionToken()
  return createMockReq({ cookies: { [SESSION_COOKIE]: token }, ...overrides })
}

describe('GET /api/projects/export', () => {
  it('rejects unauthenticated requests', async () => {
    const { default: handler } = await import('./export')
    const req = createMockReq({ method: 'GET', url: `/api/projects/export?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
  })

  it('rejects non-GET methods', async () => {
    const { default: handler } = await import('./export')
    const req = await authedReq({ method: 'POST', url: `/api/projects/export?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(405)
  })

  it('rejects a missing or malformed id', async () => {
    const { default: handler } = await import('./export')
    const req = await authedReq({ method: 'GET', url: '/api/projects/export?id=not-a-uuid' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
  })

  it('returns a zip with the correct headers for a valid, authenticated request', async () => {
    const { default: handler } = await import('./export')
    const req = await authedReq({ method: 'GET', url: `/api/projects/export?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)

    expect(state.statusCode).toBe(200)
    expect(state.headers['content-type']).toBe('application/zip')
    expect(state.headers['content-disposition']).toBe('attachment; filename="riverside-landscaping.zip"')
    expect(Buffer.isBuffer(state.body) || typeof state.body === 'string').toBeTruthy()
  })

  it('does not require a CSRF token (GET is exempt by design)', async () => {
    // authedReq above deliberately omits a CSRF cookie/header entirely, and the
    // previous test already proves that succeeds — this test documents why: GET is
    // treated as side-effect-free and exempt from CSRF in withAuth.
    const { default: handler } = await import('./export')
    const req = await authedReq({ method: 'GET', url: `/api/projects/export?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
  })

  it('returns 404 for a missing project without leaking internals', async () => {
    getProjectById.mockRejectedValue(new NotFoundError('Project not found'))
    const { default: handler } = await import('./export')
    const req = await authedReq({ method: 'GET', url: `/api/projects/export?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(404)
    expect(getJsonBody(state)).toEqual({ error: 'Project not found' })
  })

  it('returns 404 when the project has no saved configuration yet', async () => {
    getProjectVersions.mockResolvedValue([])
    const { default: handler } = await import('./export')
    const req = await authedReq({ method: 'GET', url: `/api/projects/export?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(404)
  })

  it('returns a sanitized 503 when the database is unavailable, without leaking details', async () => {
    getProjectById.mockRejectedValue(new DatabaseError(new Error('postgres://secret:detail@host/db')))
    const { default: handler } = await import('./export')
    const req = await authedReq({ method: 'GET', url: `/api/projects/export?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(503)
    const body = getJsonBody(state) as { error: string }
    expect(body.error).not.toContain('postgres://')
  })
})

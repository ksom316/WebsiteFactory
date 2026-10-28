// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes, getJsonBody } from '../_lib/testHelpers'
import { SESSION_COOKIE, createSessionToken } from '../_lib/session'
import { CSRF_COOKIE } from '../_lib/csrf'
import { NotFoundError, ConflictError } from '../_lib/errors'

const getProjectById = vi.fn()
const getProjectVersions = vi.fn()
const updateProjectMeta = vi.fn()

vi.mock('../_lib/db/queries/projects', () => ({
  getProjectById: (...args: unknown[]) => getProjectById(...args),
  getProjectVersions: (...args: unknown[]) => getProjectVersions(...args),
  updateProjectMeta: (...args: unknown[]) => updateProjectMeta(...args),
}))

const VALID_ID = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
  getProjectById.mockReset()
  getProjectVersions.mockReset()
  updateProjectMeta.mockReset()
})

async function authedReq(overrides: Parameters<typeof createMockReq>[0] = {}) {
  const token = await createSessionToken()
  return createMockReq({
    cookies: { [SESSION_COOKIE]: token, [CSRF_COOKIE]: 'csrf-token' },
    csrfHeader: 'csrf-token',
    ...overrides,
  })
}

describe('GET /api/projects/detail', () => {
  it('rejects unauthenticated requests', async () => {
    const { default: handler } = await import('./detail')
    const req = createMockReq({ method: 'GET', url: `/api/projects/detail?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
  })

  it('rejects a missing or malformed id', async () => {
    const { default: handler } = await import('./detail')
    const req = await authedReq({ method: 'GET', url: '/api/projects/detail?id=not-a-uuid' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
  })

  it('returns 404 for a missing project without leaking internals', async () => {
    getProjectById.mockRejectedValue(new NotFoundError('Project not found'))
    const { default: handler } = await import('./detail')
    const req = await authedReq({ method: 'GET', url: `/api/projects/detail?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(404)
    expect(getJsonBody(state)).toEqual({ error: 'Project not found' })
  })

  it('returns the project and its version history', async () => {
    getProjectById.mockResolvedValue({ id: VALID_ID, name: 'Acme', slug: 'acme', businessName: null, templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'x' })
    getProjectVersions.mockResolvedValue([{ id: 'v1', projectId: VALID_ID, versionNumber: 1, config: {}, createdAt: 'x' }])
    const { default: handler } = await import('./detail')
    const req = await authedReq({ method: 'GET', url: `/api/projects/detail?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const body = getJsonBody(state) as { project: { slug: string }; versions: unknown[] }
    expect(body.project.slug).toBe('acme')
    expect(body.versions).toHaveLength(1)
  })
})

describe('PATCH /api/projects/detail', () => {
  it('rejects a request missing a CSRF token', async () => {
    const token = await createSessionToken()
    const { default: handler } = await import('./detail')
    const req = createMockReq({ method: 'PATCH', cookies: { [SESSION_COOKIE]: token }, url: `/api/projects/detail?id=${VALID_ID}`, jsonBody: { name: 'New name' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(403)
  })

  it('updates project metadata', async () => {
    updateProjectMeta.mockResolvedValue({ id: VALID_ID, name: 'New name', slug: 'acme', businessName: null, templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'y' })
    const { default: handler } = await import('./detail')
    const req = await authedReq({ method: 'PATCH', url: `/api/projects/detail?id=${VALID_ID}`, jsonBody: { name: 'New name' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    expect(updateProjectMeta).toHaveBeenCalledWith(VALID_ID, { name: 'New name' })
  })

  it('archives a project via the status field', async () => {
    updateProjectMeta.mockResolvedValue({ id: VALID_ID, name: 'Acme', slug: 'acme', businessName: null, templateId: 'corporate', status: 'archived', createdAt: 'x', updatedAt: 'y' })
    const { default: handler } = await import('./detail')
    const req = await authedReq({ method: 'PATCH', url: `/api/projects/detail?id=${VALID_ID}`, jsonBody: { status: 'archived' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const body = getJsonBody(state) as { project: { status: string } }
    expect(body.project.status).toBe('archived')
  })

  it('rejects a status value outside the editable set', async () => {
    const { default: handler } = await import('./detail')
    const req = await authedReq({ method: 'PATCH', url: `/api/projects/detail?id=${VALID_ID}`, jsonBody: { status: 'deployed' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
    expect(updateProjectMeta).not.toHaveBeenCalled()
  })

  it('rejects an empty update body', async () => {
    const { default: handler } = await import('./detail')
    const req = await authedReq({ method: 'PATCH', url: `/api/projects/detail?id=${VALID_ID}`, jsonBody: {} })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
  })

  it('returns 409 when the new slug collides with another project', async () => {
    updateProjectMeta.mockRejectedValue(new ConflictError('A project with that slug already exists'))
    const { default: handler } = await import('./detail')
    const req = await authedReq({ method: 'PATCH', url: `/api/projects/detail?id=${VALID_ID}`, jsonBody: { slug: 'taken' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(409)
  })
})

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes, getJsonBody } from '../_lib/testHelpers'
import { SESSION_COOKIE, createSessionToken } from '../_lib/session'
import { CSRF_COOKIE } from '../_lib/csrf'
import { DatabaseError } from '../_lib/db/client'
import { ConflictError } from '../_lib/errors'

const listProjects = vi.fn()
const createProjectWithConfig = vi.fn()

vi.mock('../_lib/db/queries/projects', () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
  createProjectWithConfig: (...args: unknown[]) => createProjectWithConfig(...args),
}))

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
  listProjects.mockReset()
  createProjectWithConfig.mockReset()
})

async function authedReq(overrides: Parameters<typeof createMockReq>[0] = {}) {
  const token = await createSessionToken()
  return createMockReq({
    cookies: { [SESSION_COOKIE]: token, [CSRF_COOKIE]: 'csrf-token' },
    csrfHeader: 'csrf-token',
    ...overrides,
  })
}

describe('GET /api/projects', () => {
  it('rejects unauthenticated requests', async () => {
    const { default: handler } = await import('./index')
    const req = createMockReq({ method: 'GET' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
  })

  it('returns active projects by default', async () => {
    listProjects.mockResolvedValue({
      projects: [{ id: '1', name: 'Acme', slug: 'acme', businessName: null, templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'x' }],
      total: 1,
    })
    const { default: handler } = await import('./index')
    const req = await authedReq({ method: 'GET', url: '/api/projects' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    expect(listProjects).toHaveBeenCalledWith({ status: 'active', limit: 20, offset: 0 })
    expect(getJsonBody(state)).toEqual({
      projects: [expect.objectContaining({ slug: 'acme' })],
      total: 1,
    })
  })

  it('passes through status and pagination query params', async () => {
    listProjects.mockResolvedValue({ projects: [], total: 0 })
    const { default: handler } = await import('./index')
    const req = await authedReq({ method: 'GET', url: '/api/projects?status=archived&limit=5&offset=10' })
    const { res } = createMockRes()
    await handler(req, res)
    expect(listProjects).toHaveBeenCalledWith({ status: 'archived', limit: 5, offset: 10 })
  })

  it('rejects an invalid status query param', async () => {
    const { default: handler } = await import('./index')
    const req = await authedReq({ method: 'GET', url: '/api/projects?status=deleted' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
  })

  it('returns a sanitized error when the database is unavailable', async () => {
    listProjects.mockRejectedValue(new DatabaseError(new Error('secret connection detail')))
    const { default: handler } = await import('./index')
    const req = await authedReq({ method: 'GET' })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(503)
    expect(getJsonBody(state)).toEqual({ error: 'Database is currently unavailable.' })
  })
})

describe('POST /api/projects', () => {
  it('rejects unauthenticated requests', async () => {
    const { default: handler } = await import('./index')
    const req = createMockReq({ method: 'POST', jsonBody: { name: 'Acme', slug: 'acme' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
  })

  it('rejects an authenticated request missing a CSRF token', async () => {
    const token = await createSessionToken()
    const { default: handler } = await import('./index')
    const req = createMockReq({ method: 'POST', cookies: { [SESSION_COOKIE]: token }, jsonBody: { name: 'Acme', slug: 'acme' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(403)
  })

  it('rejects an invalid slug', async () => {
    const { default: handler } = await import('./index')
    const req = await authedReq({ method: 'POST', jsonBody: { name: 'Acme', slug: 'Not A Slug!' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
    expect(createProjectWithConfig).not.toHaveBeenCalled()
  })

  it('rejects a missing name', async () => {
    const { default: handler } = await import('./index')
    const req = await authedReq({ method: 'POST', jsonBody: { name: '', slug: 'acme' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
  })

  it('creates a project with an initial configuration built from the shared schema', async () => {
    createProjectWithConfig.mockResolvedValue({
      project: { id: '1', name: 'Acme', slug: 'acme', businessName: 'Acme Inc', templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'x' },
      version: { id: 'v1', projectId: '1', versionNumber: 1, config: { variant: 'premium' }, createdAt: 'x' },
    })
    const { default: handler } = await import('./index')
    const req = await authedReq({
      method: 'POST',
      jsonBody: { name: 'Acme', businessName: 'Acme Inc', slug: 'acme', variant: 'premium' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(201)
    const call = createProjectWithConfig.mock.calls[0][0]
    expect(call.name).toBe('Acme')
    expect(call.slug).toBe('acme')
    expect(call.templateId).toBe('corporate')
    expect(call.config.variant).toBe('premium')
    expect(call.config.business.name).toBe('Acme Inc')
  })

  it('returns 409 on a duplicate slug', async () => {
    createProjectWithConfig.mockRejectedValue(new ConflictError('A project with that slug already exists'))
    const { default: handler } = await import('./index')
    const req = await authedReq({ method: 'POST', jsonBody: { name: 'Acme', slug: 'acme' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(409)
  })

  it('creates a corporate project by default when no family is given (backward compatible)', async () => {
    createProjectWithConfig.mockResolvedValue({
      project: { id: '1', name: 'Acme', slug: 'acme', businessName: null, templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'x' },
      version: { id: 'v1', projectId: '1', versionNumber: 1, config: { family: 'corporate' }, createdAt: 'x' },
    })
    const { default: handler } = await import('./index')
    const req = await authedReq({ method: 'POST', jsonBody: { name: 'Acme', slug: 'acme' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(201)
    expect(createProjectWithConfig.mock.calls[0][0].templateId).toBe('corporate')
    expect(createProjectWithConfig.mock.calls[0][0].config.family).toBe('corporate')
  })

  it('creates a restaurant project with the restaurant schema and template id', async () => {
    createProjectWithConfig.mockResolvedValue({
      project: { id: '2', name: 'Bistro', slug: 'bistro', businessName: null, templateId: 'restaurant', status: 'draft', createdAt: 'x', updatedAt: 'x' },
      version: { id: 'v1', projectId: '2', versionNumber: 1, config: { family: 'restaurant' }, createdAt: 'x' },
    })
    const { default: handler } = await import('./index')
    const req = await authedReq({
      method: 'POST',
      jsonBody: { name: 'Bistro', slug: 'bistro', family: 'restaurant', location: 'Portland, OR' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(201)
    const call = createProjectWithConfig.mock.calls[0][0]
    expect(call.templateId).toBe('restaurant')
    expect(call.config.family).toBe('restaurant')
    expect(call.config.restaurant.name).toBe('Bistro')
    expect(call.config.restaurant.location).toBe('Portland, OR')
  })

  it('rejects an unsupported family outright', async () => {
    const { default: handler } = await import('./index')
    const req = await authedReq({ method: 'POST', jsonBody: { name: 'Acme', slug: 'acme', family: 'beauty' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
    expect(createProjectWithConfig).not.toHaveBeenCalled()
  })

  it('creates a real-estate project with the real-estate schema, template id, and matching config family', async () => {
    createProjectWithConfig.mockResolvedValue({
      project: { id: '3', name: 'Meridian', slug: 'meridian', businessName: null, templateId: 'real-estate', status: 'draft', createdAt: 'x', updatedAt: 'x' },
      version: { id: 'v1', projectId: '3', versionNumber: 1, config: { family: 'real-estate' }, createdAt: 'x' },
    })
    const { default: handler } = await import('./index')
    const req = await authedReq({
      method: 'POST',
      jsonBody: { name: 'Meridian', slug: 'meridian', family: 'real-estate', location: 'Portland, OR' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(201)
    const call = createProjectWithConfig.mock.calls[0][0]
    // The project-level template id and the saved config's own family tag must agree —
    // both come from the same `family` switch in buildStartingConfig, not two
    // independently-chosen values that could drift apart.
    expect(call.templateId).toBe('real-estate')
    expect(call.config.family).toBe('real-estate')
    expect(call.config.agency.name).toBe('Meridian')
    expect(call.config.agency.location).toBe('Portland, OR')
  })

  it('creates a portfolio project with the portfolio schema, template id, and matching config family', async () => {
    createProjectWithConfig.mockResolvedValue({
      project: { id: '4', name: 'Jamie Oak', slug: 'jamie-oak', businessName: null, templateId: 'portfolio', status: 'draft', createdAt: 'x', updatedAt: 'x' },
      version: { id: 'v1', projectId: '4', versionNumber: 1, config: { family: 'portfolio' }, createdAt: 'x' },
    })
    const { default: handler } = await import('./index')
    const req = await authedReq({
      method: 'POST',
      jsonBody: { name: 'Jamie Oak', slug: 'jamie-oak', family: 'portfolio', location: 'Remote' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(201)
    const call = createProjectWithConfig.mock.calls[0][0]
    expect(call.templateId).toBe('portfolio')
    expect(call.config.family).toBe('portfolio')
    expect(call.config.person.name).toBe('Jamie Oak')
    expect(call.config.person.location).toBe('Remote')
  })

  it('creates a catalog project with the catalog schema, template id, and matching config family', async () => {
    createProjectWithConfig.mockResolvedValue({
      project: { id: '5', name: 'Marlow & Finch', slug: 'marlow-finch', businessName: null, templateId: 'catalog', status: 'draft', createdAt: 'x', updatedAt: 'x' },
      version: { id: 'v1', projectId: '5', versionNumber: 1, config: { family: 'catalog' }, createdAt: 'x' },
    })
    const { default: handler } = await import('./index')
    const req = await authedReq({
      method: 'POST',
      jsonBody: { name: 'Marlow & Finch', slug: 'marlow-finch', family: 'catalog', location: 'Hudson, NY' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(201)
    const call = createProjectWithConfig.mock.calls[0][0]
    expect(call.templateId).toBe('catalog')
    expect(call.config.family).toBe('catalog')
    expect(call.config.business.name).toBe('Marlow & Finch')
    expect(call.config.business.location).toBe('Hudson, NY')
  })

  it('creates an ecommerce project with the ecommerce schema, template id, and matching config family', async () => {
    createProjectWithConfig.mockResolvedValue({
      project: { id: '6', name: 'Northfield Supply Co.', slug: 'northfield', businessName: null, templateId: 'ecommerce', status: 'draft', createdAt: 'x', updatedAt: 'x' },
      version: { id: 'v1', projectId: '6', versionNumber: 1, config: { family: 'ecommerce' }, createdAt: 'x' },
    })
    const { default: handler } = await import('./index')
    const req = await authedReq({
      method: 'POST',
      jsonBody: { name: 'Northfield Supply Co.', slug: 'northfield', family: 'ecommerce' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(201)
    const call = createProjectWithConfig.mock.calls[0][0]
    expect(call.templateId).toBe('ecommerce')
    expect(call.config.family).toBe('ecommerce')
    expect(call.config.store.name).toBe('Northfield Supply Co.')
  })
})

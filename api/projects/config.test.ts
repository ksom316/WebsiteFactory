// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes, getJsonBody } from '../_lib/testHelpers'
import { SESSION_COOKIE, createSessionToken } from '../_lib/session'
import { CSRF_COOKIE } from '../_lib/csrf'
import { NotFoundError, ConflictError } from '../_lib/errors'

const getProjectById = vi.fn()
const getProjectVersions = vi.fn()
const getConfigVersionByNumber = vi.fn()
const saveConfigVersionIfChanged = vi.fn()
const restoreConfigVersion = vi.fn()

vi.mock('../_lib/db/queries/projects', () => ({
  getProjectById: (...args: unknown[]) => getProjectById(...args),
  getProjectVersions: (...args: unknown[]) => getProjectVersions(...args),
  getConfigVersionByNumber: (...args: unknown[]) => getConfigVersionByNumber(...args),
  saveConfigVersionIfChanged: (...args: unknown[]) => saveConfigVersionIfChanged(...args),
  restoreConfigVersion: (...args: unknown[]) => restoreConfigVersion(...args),
}))

const VALID_ID = '11111111-1111-4111-8111-111111111111'
const SOME_PROJECT = { id: VALID_ID, name: 'Acme', slug: 'acme', businessName: null, templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'x' }

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
  getProjectById.mockReset().mockResolvedValue(SOME_PROJECT)
  getProjectVersions.mockReset()
  getConfigVersionByNumber.mockReset()
  saveConfigVersionIfChanged.mockReset()
  restoreConfigVersion.mockReset()
})

async function authedReq(overrides: Parameters<typeof createMockReq>[0] = {}) {
  const token = await createSessionToken()
  return createMockReq({
    cookies: { [SESSION_COOKIE]: token, [CSRF_COOKIE]: 'csrf-token' },
    csrfHeader: 'csrf-token',
    ...overrides,
  })
}

describe('GET /api/projects/config', () => {
  it('rejects unauthenticated requests', async () => {
    const { default: handler } = await import('./config')
    const req = createMockReq({ method: 'GET', url: `/api/projects/config?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
  })

  it('returns the latest version when no version query param is given', async () => {
    getProjectVersions.mockResolvedValue([{ id: 'v2', projectId: VALID_ID, versionNumber: 2, config: {}, createdAt: 'x' }])
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'GET', url: `/api/projects/config?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const body = getJsonBody(state) as { version: { versionNumber: number } }
    expect(body.version.versionNumber).toBe(2)
  })

  it('returns a specific historical version when ?version= is given', async () => {
    getConfigVersionByNumber.mockResolvedValue({ id: 'v1', projectId: VALID_ID, versionNumber: 1, config: {}, createdAt: 'x' })
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'GET', url: `/api/projects/config?id=${VALID_ID}&version=1` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    expect(getConfigVersionByNumber).toHaveBeenCalledWith(VALID_ID, 1)
  })

  it('returns 404 for a missing project', async () => {
    getProjectById.mockRejectedValue(new NotFoundError('Project not found'))
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'GET', url: `/api/projects/config?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(404)
  })

  it('returns 404 for a missing historical version', async () => {
    getConfigVersionByNumber.mockRejectedValue(new NotFoundError('Configuration version not found'))
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'GET', url: `/api/projects/config?id=${VALID_ID}&version=99` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(404)
  })

  it('fails safely with a generic 500 (never a silent corporate render) when a stored row has an unrecognized family tag', async () => {
    const { UnknownTemplateFamilyError } = await import('../../src/templates/parseConfig')
    getProjectVersions.mockRejectedValue(new UnknownTemplateFamilyError('beauty'))
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'GET', url: `/api/projects/config?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(500)
  })
})

describe('PUT /api/projects/config', () => {
  it('rejects a request missing a CSRF token', async () => {
    const token = await createSessionToken()
    const { default: handler } = await import('./config')
    const req = createMockReq({ method: 'PUT', cookies: { [SESSION_COOKIE]: token }, url: `/api/projects/config?id=${VALID_ID}`, jsonBody: { variant: 'premium' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(403)
  })

  it('rejects an unsupported variant outright', async () => {
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'PUT', url: `/api/projects/config?id=${VALID_ID}`, jsonBody: { variant: 'flashy' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
    expect(saveConfigVersionIfChanged).not.toHaveBeenCalled()
  })

  it('saves a changed config as a new version', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: { variant: 'premium' }, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'PUT', url: `/api/projects/config?id=${VALID_ID}`, jsonBody: { variant: 'premium', business: { name: 'Acme' } } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const body = getJsonBody(state) as { changed: boolean; version: { versionNumber: number } }
    expect(body.changed).toBe(true)
    expect(body.version.versionNumber).toBe(2)
  })

  it('does not create a duplicate version when the config is unchanged', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v1', projectId: VALID_ID, versionNumber: 1, config: {}, createdAt: 'x' },
      changed: false,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'PUT', url: `/api/projects/config?id=${VALID_ID}`, jsonBody: {} })
    const { res, state } = createMockRes()
    await handler(req, res)
    const body = getJsonBody(state) as { changed: boolean }
    expect(body.changed).toBe(false)
  })

  it('normalizes an unsafe link instead of rejecting the whole save', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: {}, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { hero: { heading: 'Hi', primaryCta: { label: 'Go', href: 'javascript:alert(1)' } } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const passedConfig = saveConfigVersionIfChanged.mock.calls[0][1]
    expect(passedConfig.hero.primaryCta.href).toBe('#')
  })

  it('returns 409 on a concurrent version-number conflict', async () => {
    saveConfigVersionIfChanged.mockRejectedValue(new ConflictError('Someone else saved a newer version. Reload and try again.'))
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'PUT', url: `/api/projects/config?id=${VALID_ID}`, jsonBody: {} })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(409)
  })

  it('rejects an unsupported family outright', async () => {
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'PUT', url: `/api/projects/config?id=${VALID_ID}`, jsonBody: { family: 'beauty' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
    expect(saveConfigVersionIfChanged).not.toHaveBeenCalled()
  })

  it('does not apply the corporate variant gate to a restaurant-family save', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: { family: 'restaurant' }, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'restaurant', restaurant: { name: 'Bistro' } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const passedConfig = saveConfigVersionIfChanged.mock.calls[0][1]
    expect(passedConfig.family).toBe('restaurant')
    expect(passedConfig.restaurant.name).toBe('Bistro')
  })

  it('saves a restaurant config and normalizes an unsafe reservation URL', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: {}, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'restaurant', contact: { reservationUrl: 'javascript:alert(1)' } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const passedConfig = saveConfigVersionIfChanged.mock.calls[0][1]
    expect(passedConfig.contact.reservationUrl).toBeUndefined()
  })

  it('saves a real-estate config and normalizes an unsafe inquiry URL', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: {}, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'real-estate', agency: { name: 'Meridian' }, contact: { inquiryUrl: 'javascript:alert(1)' } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const passedConfig = saveConfigVersionIfChanged.mock.calls[0][1]
    expect(passedConfig.family).toBe('real-estate')
    expect(passedConfig.agency.name).toBe('Meridian')
    expect(passedConfig.contact.inquiryUrl).toBeUndefined()
  })

  it('does not apply the corporate variant gate to a real-estate-family save', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: { family: 'real-estate' }, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'real-estate', listings: { properties: [{ title: 'A house' }] } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
  })

  it('saves a portfolio config and normalizes an unsafe booking URL', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: {}, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'portfolio', person: { name: 'Jamie Oak' }, contact: { bookingUrl: 'javascript:alert(1)' } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const passedConfig = saveConfigVersionIfChanged.mock.calls[0][1]
    expect(passedConfig.family).toBe('portfolio')
    expect(passedConfig.person.name).toBe('Jamie Oak')
    expect(passedConfig.contact.bookingUrl).toBeUndefined()
  })

  it('does not apply the corporate variant gate to a portfolio-family save', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: { family: 'portfolio' }, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'portfolio', work: { projects: [{ title: 'A project' }] } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
  })

  it('saves a catalog config and drops an invalid sale price (higher than regular price)', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: {}, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'catalog', business: { name: 'Marlow & Finch' }, shop: { products: [{ name: 'A mug', price: 20, salePrice: 30 }] } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const passedConfig = saveConfigVersionIfChanged.mock.calls[0][1]
    expect(passedConfig.family).toBe('catalog')
    expect(passedConfig.business.name).toBe('Marlow & Finch')
    expect(passedConfig.shop.products[0].salePrice).toBeUndefined()
  })

  it('does not apply the corporate variant gate to a catalog-family save', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: { family: 'catalog' }, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'catalog', shop: { products: [{ name: 'A product' }] } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
  })

  it('saves an ecommerce config and drops an invalid sale price (higher than regular price)', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: {}, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'ecommerce', store: { name: 'Northfield' }, shop: { products: [{ name: 'A jacket', price: 20, salePrice: 30 }] } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const passedConfig = saveConfigVersionIfChanged.mock.calls[0][1]
    expect(passedConfig.family).toBe('ecommerce')
    expect(passedConfig.store.name).toBe('Northfield')
    expect(passedConfig.shop.products[0].salePrice).toBeUndefined()
  })

  it('does not apply the corporate variant gate to an ecommerce-family save', async () => {
    saveConfigVersionIfChanged.mockResolvedValue({
      version: { id: 'v2', projectId: VALID_ID, versionNumber: 2, config: { family: 'ecommerce' }, createdAt: 'x' },
      changed: true,
    })
    const { default: handler } = await import('./config')
    const req = await authedReq({
      method: 'PUT',
      url: `/api/projects/config?id=${VALID_ID}`,
      jsonBody: { family: 'ecommerce', shop: { products: [{ name: 'A product' }] } },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
  })
})

describe('POST /api/projects/config (restore)', () => {
  it('requires a version query parameter', async () => {
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'POST', url: `/api/projects/config?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
  })

  it('creates a new version cloned from a historical one', async () => {
    restoreConfigVersion.mockResolvedValue({ id: 'v3', projectId: VALID_ID, versionNumber: 3, config: {}, createdAt: 'x' })
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'POST', url: `/api/projects/config?id=${VALID_ID}&version=1` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(201)
    expect(restoreConfigVersion).toHaveBeenCalledWith(VALID_ID, 1)
  })

  it('returns 404 when the historical version does not exist', async () => {
    restoreConfigVersion.mockRejectedValue(new NotFoundError('Configuration version not found'))
    const { default: handler } = await import('./config')
    const req = await authedReq({ method: 'POST', url: `/api/projects/config?id=${VALID_ID}&version=999` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(404)
  })
})

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes, getJsonBody } from '../_lib/testHelpers'
import { SESSION_COOKIE, createSessionToken } from '../_lib/session'
import { CSRF_COOKIE } from '../_lib/csrf'
import { NotFoundError } from '../_lib/errors'
import { VercelApiError } from '../_lib/vercel/client'

const getProjectById = vi.fn()
const listDeploymentRecords = vi.fn()
const isVercelConfigured = vi.fn()
const startDeployment = vi.fn()
const refreshDeploymentStatus = vi.fn()

vi.mock('../_lib/db/queries/projects', () => ({
  getProjectById: (...args: unknown[]) => getProjectById(...args),
}))

vi.mock('../_lib/db/queries/deployments', () => ({
  listDeploymentRecords: (...args: unknown[]) => listDeploymentRecords(...args),
}))

vi.mock('../_lib/vercel/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../_lib/vercel/client')>()
  return { ...actual, isVercelConfigured: () => isVercelConfigured() }
})

vi.mock('../_lib/deployment/deployProject', () => ({
  startDeployment: (...args: unknown[]) => startDeployment(...args),
  refreshDeploymentStatus: (...args: unknown[]) => refreshDeploymentStatus(...args),
}))

const VALID_ID = '11111111-1111-4111-8111-111111111111'
const PROJECT = {
  id: VALID_ID,
  name: 'Acme',
  slug: 'acme',
  businessName: null,
  templateId: 'corporate',
  status: 'draft',
  vercelProjectId: 'prj_1',
  createdAt: 'x',
  updatedAt: 'x',
}

beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
  getProjectById.mockReset().mockResolvedValue(PROJECT)
  listDeploymentRecords.mockReset().mockResolvedValue([])
  isVercelConfigured.mockReset().mockReturnValue(true)
  startDeployment.mockReset()
  refreshDeploymentStatus.mockReset().mockImplementation(async (r: unknown) => r)
})

async function authedReq(overrides: Parameters<typeof createMockReq>[0] = {}) {
  const token = await createSessionToken()
  return createMockReq({
    cookies: { [SESSION_COOKIE]: token, [CSRF_COOKIE]: 'csrf-token' },
    csrfHeader: 'csrf-token',
    ...overrides,
  })
}

describe('GET /api/projects/deploy', () => {
  it('rejects unauthenticated requests', async () => {
    const { default: handler } = await import('./deploy')
    const req = createMockReq({ method: 'GET', url: `/api/projects/deploy?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
  })

  it('reports whether Vercel is configured and the linked project id', async () => {
    isVercelConfigured.mockReturnValue(false)
    const { default: handler } = await import('./deploy')
    const req = await authedReq({ method: 'GET', url: `/api/projects/deploy?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(200)
    const body = getJsonBody(state) as { configured: boolean; vercelProjectId: string }
    expect(body.configured).toBe(false)
    expect(body.vercelProjectId).toBe('prj_1')
  })

  it('refreshes each history record (status check consolidated into history)', async () => {
    const records = [{ id: 'r1', status: 'building' }, { id: 'r2', status: 'success' }]
    listDeploymentRecords.mockResolvedValue(records)
    const { default: handler } = await import('./deploy')
    const req = await authedReq({ method: 'GET', url: `/api/projects/deploy?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(refreshDeploymentStatus).toHaveBeenCalledTimes(2)
    const body = getJsonBody(state) as { deployments: unknown[] }
    expect(body.deployments).toHaveLength(2)
  })

  it('returns 404 for a missing project without leaking internals', async () => {
    getProjectById.mockRejectedValue(new NotFoundError('Project not found'))
    const { default: handler } = await import('./deploy')
    const req = await authedReq({ method: 'GET', url: `/api/projects/deploy?id=${VALID_ID}` })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(404)
  })
})

describe('POST /api/projects/deploy', () => {
  it('rejects unauthenticated requests', async () => {
    const { default: handler } = await import('./deploy')
    const req = createMockReq({ method: 'POST', url: `/api/projects/deploy?id=${VALID_ID}`, jsonBody: { environment: 'preview' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(401)
  })

  it('rejects a request missing a CSRF token', async () => {
    const token = await createSessionToken()
    const { default: handler } = await import('./deploy')
    const req = createMockReq({
      method: 'POST',
      cookies: { [SESSION_COOKIE]: token },
      url: `/api/projects/deploy?id=${VALID_ID}`,
      jsonBody: { environment: 'preview' },
    })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(403)
    expect(startDeployment).not.toHaveBeenCalled()
  })

  it('returns a clear 503 setup error when Vercel is not configured, before touching the database', async () => {
    isVercelConfigured.mockReturnValue(false)
    const { default: handler } = await import('./deploy')
    const req = await authedReq({ method: 'POST', url: `/api/projects/deploy?id=${VALID_ID}`, jsonBody: { environment: 'preview' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(503)
    const body = getJsonBody(state) as { error: string }
    expect(body.error).toContain('VERCEL_TOKEN')
    expect(getProjectById).not.toHaveBeenCalled()
    expect(startDeployment).not.toHaveBeenCalled()
  })

  it('defaults to a preview deployment when no environment is given', async () => {
    startDeployment.mockResolvedValue({ id: 'r1', environment: 'preview', status: 'building' })
    const { default: handler } = await import('./deploy')
    const req = await authedReq({ method: 'POST', url: `/api/projects/deploy?id=${VALID_ID}`, jsonBody: {} })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(201)
    expect(startDeployment).toHaveBeenCalledWith({ project: PROJECT, environment: 'preview' })
  })

  it('starts a production deployment only when explicitly requested', async () => {
    startDeployment.mockResolvedValue({ id: 'r1', environment: 'production', status: 'building' })
    const { default: handler } = await import('./deploy')
    const req = await authedReq({ method: 'POST', url: `/api/projects/deploy?id=${VALID_ID}`, jsonBody: { environment: 'production' } })
    const { res } = createMockRes()
    await handler(req, res)
    expect(startDeployment).toHaveBeenCalledWith({ project: PROJECT, environment: 'production' })
  })

  it('rejects an invalid environment value', async () => {
    const { default: handler } = await import('./deploy')
    const req = await authedReq({ method: 'POST', url: `/api/projects/deploy?id=${VALID_ID}`, jsonBody: { environment: 'staging' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(400)
    expect(startDeployment).not.toHaveBeenCalled()
  })

  it('ignores any config/content fields in the request body — only the saved version is ever deployed', async () => {
    startDeployment.mockResolvedValue({ id: 'r1', environment: 'preview', status: 'building' })
    const { default: handler } = await import('./deploy')
    const req = await authedReq({
      method: 'POST',
      url: `/api/projects/deploy?id=${VALID_ID}`,
      jsonBody: { environment: 'preview', config: { hero: { heading: 'Smuggled unsaved draft' } } },
    })
    const { res } = createMockRes()
    await handler(req, res)
    // startDeployment is only ever given the project — it reads the saved version
    // itself (see deployProject.test.ts) — so a "config" field in the body is simply
    // never read, let alone deployed.
    expect(startDeployment).toHaveBeenCalledWith({ project: PROJECT, environment: 'preview' })
  })

  it('does not report success when the Vercel call fails, and returns a sanitized error', async () => {
    startDeployment.mockRejectedValue(new VercelApiError('Vercel rejected the configured token.', 'auth', 401))
    const { default: handler } = await import('./deploy')
    const req = await authedReq({ method: 'POST', url: `/api/projects/deploy?id=${VALID_ID}`, jsonBody: { environment: 'preview' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(502)
    const body = getJsonBody(state) as { error: string }
    expect(body.error).toBe('Vercel rejected the configured token.')
  })

  it('returns 404 when the project itself does not exist', async () => {
    getProjectById.mockRejectedValue(new NotFoundError('Project not found'))
    const { default: handler } = await import('./deploy')
    const req = await authedReq({ method: 'POST', url: `/api/projects/deploy?id=${VALID_ID}`, jsonBody: { environment: 'preview' } })
    const { res, state } = createMockRes()
    await handler(req, res)
    expect(state.statusCode).toBe(404)
  })
})

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError } from '../errors'
import { VercelApiError } from '../vercel/client'
import { parseCorporateConfig } from '../../../src/templates/corporate/schema'
import type { Project } from '../db/queries/projects'

const getProjectVersions = vi.fn()
const linkVercelProject = vi.fn()
const createDeploymentRecord = vi.fn()
const updateDeploymentRecord = vi.fn()
const createVercelDeployment = vi.fn()
const getVercelDeployment = vi.fn()

vi.mock('../db/queries/projects', () => ({
  getProjectVersions: (...args: unknown[]) => getProjectVersions(...args),
  linkVercelProject: (...args: unknown[]) => linkVercelProject(...args),
}))

vi.mock('../db/queries/deployments', () => ({
  createDeploymentRecord: (...args: unknown[]) => createDeploymentRecord(...args),
  updateDeploymentRecord: (...args: unknown[]) => updateDeploymentRecord(...args),
}))

vi.mock('../vercel/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../vercel/client')>()
  return {
    ...actual,
    createVercelDeployment: (...args: unknown[]) => createVercelDeployment(...args),
    getVercelDeployment: (...args: unknown[]) => getVercelDeployment(...args),
  }
})

const PROJECT: Project = {
  id: 'p1',
  name: 'Acme',
  slug: 'acme',
  businessName: null,
  templateId: 'corporate',
  status: 'draft',
  vercelProjectId: null,
  createdAt: 'x',
  updatedAt: 'x',
}

const SAVED_VERSION = {
  id: 'v1',
  projectId: 'p1',
  versionNumber: 3,
  config: parseCorporateConfig({ variant: 'premium', hero: { heading: 'From saved version' } }),
  createdAt: 'x',
}

const PENDING_RECORD = {
  id: 'rec1',
  projectId: 'p1',
  provider: 'vercel' as const,
  deploymentUrl: null,
  providerDeploymentId: null,
  status: 'pending' as const,
  environment: 'preview' as const,
  configVersionId: 'v1',
  errorMessage: null,
  createdAt: 'x',
  updatedAt: 'x',
}

beforeEach(() => {
  getProjectVersions.mockReset().mockResolvedValue([SAVED_VERSION])
  linkVercelProject.mockReset()
  createDeploymentRecord.mockReset().mockResolvedValue(PENDING_RECORD)
  updateDeploymentRecord.mockReset().mockImplementation(async (id: string, patch: Record<string, unknown>) => ({
    ...PENDING_RECORD,
    id,
    ...patch,
  }))
  createVercelDeployment.mockReset()
  getVercelDeployment.mockReset()
})

describe('startDeployment', () => {
  it('uses the latest saved version, never anything passed from outside', async () => {
    const { startDeployment } = await import('./deployProject')
    createVercelDeployment.mockResolvedValue({ id: 'dpl_1', url: 'wf-acme.vercel.app', readyState: 'QUEUED', projectId: 'prj_1', errorMessage: null })

    await startDeployment({ project: PROJECT, environment: 'preview' })

    const call = createVercelDeployment.mock.calls[0][0]
    const siteConfigFile = call.files.find((f: { path: string }) => f.path === 'src/site-config.ts')
    const content = Buffer.from(siteConfigFile.content).toString('utf8')
    expect(content).toContain('From saved version')
  })

  it('throws NotFoundError when the project has no saved configuration', async () => {
    getProjectVersions.mockResolvedValue([])
    const { startDeployment } = await import('./deployProject')
    await expect(startDeployment({ project: PROJECT, environment: 'preview' })).rejects.toThrow(NotFoundError)
    expect(createDeploymentRecord).not.toHaveBeenCalled()
  })

  it('creates a pending record before calling Vercel', async () => {
    const { startDeployment } = await import('./deployProject')
    createVercelDeployment.mockResolvedValue({ id: 'dpl_1', url: 'wf-acme.vercel.app', readyState: 'QUEUED', projectId: 'prj_1', errorMessage: null })
    await startDeployment({ project: PROJECT, environment: 'preview' })
    expect(createDeploymentRecord).toHaveBeenCalledWith({ projectId: 'p1', environment: 'preview', configVersionId: 'v1' })
  })

  it('passes a deterministic project name when no Vercel project is linked yet', async () => {
    const { startDeployment } = await import('./deployProject')
    createVercelDeployment.mockResolvedValue({ id: 'dpl_1', url: 'x.vercel.app', readyState: 'QUEUED', projectId: 'prj_1', errorMessage: null })
    await startDeployment({ project: PROJECT, environment: 'preview' })
    expect(createVercelDeployment.mock.calls[0][0]).toMatchObject({ projectName: 'wf-acme', existingVercelProjectId: null })
  })

  it('reuses an already-linked Vercel project instead of a name', async () => {
    const { startDeployment } = await import('./deployProject')
    createVercelDeployment.mockResolvedValue({ id: 'dpl_1', url: 'x.vercel.app', readyState: 'QUEUED', projectId: 'prj_existing', errorMessage: null })
    await startDeployment({ project: { ...PROJECT, vercelProjectId: 'prj_existing' }, environment: 'preview' })
    expect(createVercelDeployment.mock.calls[0][0]).toMatchObject({ existingVercelProjectId: 'prj_existing' })
    // Already linked to this same id — no redundant write.
    expect(linkVercelProject).not.toHaveBeenCalled()
  })

  it('links the newly learned Vercel project id on first success', async () => {
    const { startDeployment } = await import('./deployProject')
    createVercelDeployment.mockResolvedValue({ id: 'dpl_1', url: 'x.vercel.app', readyState: 'QUEUED', projectId: 'prj_new', errorMessage: null })
    await startDeployment({ project: PROJECT, environment: 'preview' })
    expect(linkVercelProject).toHaveBeenCalledWith('p1', 'prj_new')
  })

  it('maps a QUEUED/BUILDING readyState to the "building" status, never "success" prematurely', async () => {
    const { startDeployment } = await import('./deployProject')
    createVercelDeployment.mockResolvedValue({ id: 'dpl_1', url: 'x.vercel.app', readyState: 'QUEUED', projectId: 'prj_1', errorMessage: null })
    const result = await startDeployment({ project: PROJECT, environment: 'preview' })
    expect(result.status).toBe('building')
  })

  it('maps a READY readyState to "success"', async () => {
    const { startDeployment } = await import('./deployProject')
    createVercelDeployment.mockResolvedValue({ id: 'dpl_1', url: 'x.vercel.app', readyState: 'READY', projectId: 'prj_1', errorMessage: null })
    const result = await startDeployment({ project: PROJECT, environment: 'preview' })
    expect(result.status).toBe('success')
  })

  it('marks the record failed (not silently successful) when Vercel rejects the request, and rethrows', async () => {
    const { startDeployment } = await import('./deployProject')
    createVercelDeployment.mockRejectedValue(new VercelApiError('Vercel rejected the configured token.', 'auth', 401))

    await expect(startDeployment({ project: PROJECT, environment: 'preview' })).rejects.toThrow(VercelApiError)
    expect(updateDeploymentRecord).toHaveBeenCalledWith('rec1', {
      status: 'failed',
      errorMessage: 'Vercel rejected the configured token.',
    })
  })

  it('sends target=production only for a production deployment', async () => {
    const { startDeployment } = await import('./deployProject')
    createVercelDeployment.mockResolvedValue({ id: 'dpl_1', url: 'x.vercel.app', readyState: 'QUEUED', projectId: 'prj_1', errorMessage: null })
    await startDeployment({ project: PROJECT, environment: 'production' })
    expect(createVercelDeployment.mock.calls[0][0]).toMatchObject({ environment: 'production' })
  })
})

describe('refreshDeploymentStatus', () => {
  it('does not poll a record that already reached a terminal state', async () => {
    const { refreshDeploymentStatus } = await import('./deployProject')
    const record = { ...PENDING_RECORD, status: 'success' as const, providerDeploymentId: 'dpl_1' }
    const result = await refreshDeploymentStatus(record)
    expect(result).toBe(record)
    expect(getVercelDeployment).not.toHaveBeenCalled()
  })

  it('polls and updates a building record that is now ready', async () => {
    const { refreshDeploymentStatus } = await import('./deployProject')
    getVercelDeployment.mockResolvedValue({ id: 'dpl_1', url: 'x.vercel.app', readyState: 'READY', projectId: 'prj_1', errorMessage: null })
    const record = { ...PENDING_RECORD, status: 'building' as const, providerDeploymentId: 'dpl_1' }
    const result = await refreshDeploymentStatus(record)
    expect(result.status).toBe('success')
  })

  it('does not fail the deployment just because one status poll failed', async () => {
    const { refreshDeploymentStatus } = await import('./deployProject')
    getVercelDeployment.mockRejectedValue(new VercelApiError('timeout', 'timeout'))
    const record = { ...PENDING_RECORD, status: 'building' as const, providerDeploymentId: 'dpl_1' }
    const result = await refreshDeploymentStatus(record)
    expect(result.status).toBe('building')
    expect(updateDeploymentRecord).not.toHaveBeenCalled()
  })

  it('cannot poll a record with no provider deployment id yet', async () => {
    const { refreshDeploymentStatus } = await import('./deployProject')
    const record = { ...PENDING_RECORD, status: 'pending' as const, providerDeploymentId: null }
    const result = await refreshDeploymentStatus(record)
    expect(result).toBe(record)
    expect(getVercelDeployment).not.toHaveBeenCalled()
  })
})

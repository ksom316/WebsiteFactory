// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError, ConflictError } from '../../errors'
import { DatabaseError } from '../client'
import { parseCorporateConfig } from '../../../../src/templates/corporate/schema'

interface FakeCall {
  strings: readonly string[]
  values: unknown[]
}

let queue: Array<(call: FakeCall) => unknown> = []
const calls: FakeCall[] = []

function fakeSql(strings: TemplateStringsArray, ...values: unknown[]) {
  const call = { strings: [...strings], values }
  calls.push(call)
  const next = queue.shift()
  if (!next) throw new Error('fakeSql called with no queued response')
  const result = next(call)
  if (result instanceof Error) return Promise.reject(result)
  return Promise.resolve(result)
}

vi.mock('../client', () => ({
  getSql: () => fakeSql,
  DatabaseError: class DatabaseError extends Error {
    cause: unknown
    constructor(cause: unknown) {
      super('Database operation failed')
      this.cause = cause
    }
  },
}))

function pgError(code: string) {
  const error = new Error('pg error') as Error & { code: string }
  error.code = code
  return error
}

beforeEach(() => {
  queue = []
  calls.length = 0
})

describe('listProjects', () => {
  it('returns projects and total count from the window function', async () => {
    const { listProjects } = await import('./projects')
    queue.push(() => [
      { id: '1', name: 'Acme', slug: 'acme', business_name: null, template_id: 'corporate', status: 'draft', created_at: 'x', updated_at: 'x', total_count: '3' },
    ])
    const result = await listProjects({ status: 'active', limit: 20, offset: 0 })
    expect(result.total).toBe(3)
    expect(result.projects).toHaveLength(1)
    expect(result.projects[0].slug).toBe('acme')
  })

  it('returns an empty list with total 0 when there are no matches', async () => {
    const { listProjects } = await import('./projects')
    queue.push(() => [])
    const result = await listProjects({ status: 'archived', limit: 20, offset: 0 })
    expect(result).toEqual({ projects: [], total: 0 })
  })
})

describe('mapConfigVersion family integrity', () => {
  it('fails safely (throws) when a stored row carries an unrecognized family tag, rather than silently rendering it as corporate', async () => {
    const { getProjectVersions } = await import('./projects')
    queue.push(() => [
      { id: 'v1', project_id: 'p1', version_number: 1, config: { family: 'beauty', business: { name: 'Acme' } }, created_at: 'x' },
    ])
    await expect(getProjectVersions('p1')).rejects.toThrow(/Unknown template family/)
  })
})

describe('getProjectById', () => {
  it('throws NotFoundError when no row matches', async () => {
    const { getProjectById } = await import('./projects')
    queue.push(() => [])
    await expect(getProjectById('missing')).rejects.toThrow(NotFoundError)
  })

  it('wraps an unexpected driver error in DatabaseError', async () => {
    const { getProjectById } = await import('./projects')
    queue.push(() => new Error('connection reset'))
    await expect(getProjectById('x')).rejects.toThrow(DatabaseError)
  })
})

describe('createProjectWithConfig', () => {
  it('maps the compound insert result into a project and its first version', async () => {
    const { createProjectWithConfig } = await import('./projects')
    queue.push(() => [
      {
        id: 'p1', name: 'Acme', slug: 'acme', business_name: 'Acme Inc', template_id: 'corporate', status: 'draft', created_at: 'x', updated_at: 'x',
        version_id: 'v1', version_project_id: 'p1', version_number: 1, version_config: { variant: 'premium' }, version_created_at: 'x',
      },
    ])
    const result = await createProjectWithConfig({
      name: 'Acme', slug: 'acme', businessName: 'Acme Inc', templateId: 'corporate',
      config: { variant: 'premium' } as never,
    })
    expect(result.project.slug).toBe('acme')
    expect(result.version.versionNumber).toBe(1)
  })

  it('translates a unique-constraint violation into a ConflictError', async () => {
    const { createProjectWithConfig } = await import('./projects')
    queue.push(() => pgError('23505'))
    await expect(
      createProjectWithConfig({ name: 'Acme', slug: 'acme', templateId: 'corporate', config: {} as never }),
    ).rejects.toThrow(ConflictError)
  })
})

describe('saveConfigVersionIfChanged', () => {
  it('does not insert when the new config equals the latest version', async () => {
    // Callers always pass an already-normalized config (see api/projects/config.ts),
    // so "unchanged" means deep-equal after normalization, not before.
    const normalized = parseCorporateConfig({ variant: 'neutral' })
    const latestRow = { id: 'v1', project_id: 'p1', version_number: 1, config: normalized, created_at: 'x' }
    const { saveConfigVersionIfChanged } = await import('./projects')
    queue.push(() => [latestRow])
    const result = await saveConfigVersionIfChanged('p1', normalized)
    expect(result.changed).toBe(false)
    expect(calls).toHaveLength(1) // only the SELECT ran — no INSERT was attempted
  })

  it('inserts a new version when the config differs from the latest', async () => {
    const latestConfig = parseCorporateConfig({ variant: 'neutral' })
    const newConfig = parseCorporateConfig({ variant: 'premium' })
    const latestRow = { id: 'v1', project_id: 'p1', version_number: 1, config: latestConfig, created_at: 'x' }
    const newRow = { id: 'v2', project_id: 'p1', version_number: 2, config: newConfig, created_at: 'y' }
    const { saveConfigVersionIfChanged } = await import('./projects')
    queue.push(() => [latestRow])
    queue.push(() => [newRow])
    const result = await saveConfigVersionIfChanged('p1', newConfig)
    expect(result.changed).toBe(true)
    expect(result.version.versionNumber).toBe(2)
    expect(calls).toHaveLength(2)
  })

  it('maps a restaurant-family row through the family-aware parser, unlike a plain corporate parser', async () => {
    const restaurantConfig = { family: 'restaurant', restaurant: { name: 'Bistro' } }
    const latestRow = { id: 'v1', project_id: 'p1', version_number: 1, config: {}, created_at: 'x' }
    const newRow = { id: 'v2', project_id: 'p1', version_number: 2, config: restaurantConfig, created_at: 'y' }
    const { saveConfigVersionIfChanged } = await import('./projects')
    queue.push(() => [latestRow])
    queue.push(() => [newRow])
    const result = await saveConfigVersionIfChanged('p1', restaurantConfig as never)
    expect(result.version.config.family).toBe('restaurant')
    if (result.version.config.family === 'restaurant') {
      expect(result.version.config.restaurant.name).toBe('Bistro')
    }
  })

  it('inserts a first version when none exists yet', async () => {
    const newRow = { id: 'v1', project_id: 'p1', version_number: 1, config: {}, created_at: 'x' }
    const { saveConfigVersionIfChanged } = await import('./projects')
    queue.push(() => [])
    queue.push(() => [newRow])
    const result = await saveConfigVersionIfChanged('p1', {} as never)
    expect(result.changed).toBe(true)
    expect(result.version.versionNumber).toBe(1)
  })

  it('turns a concurrent unique-constraint violation into a ConflictError', async () => {
    const { saveConfigVersionIfChanged } = await import('./projects')
    queue.push(() => [])
    queue.push(() => pgError('23505'))
    await expect(saveConfigVersionIfChanged('p1', {} as never)).rejects.toThrow(ConflictError)
  })
})

describe('restoreConfigVersion', () => {
  it('returns the newly created version cloned from history', async () => {
    const { restoreConfigVersion } = await import('./projects')
    queue.push(() => [{ id: 'v3', project_id: 'p1', version_number: 3, config: { variant: 'premium' }, created_at: 'x' }])
    const result = await restoreConfigVersion('p1', 1)
    expect(result.versionNumber).toBe(3)
  })

  it('maps a not-null violation (missing source version) to NotFoundError', async () => {
    const { restoreConfigVersion } = await import('./projects')
    queue.push(() => pgError('23502'))
    await expect(restoreConfigVersion('p1', 999)).rejects.toThrow(NotFoundError)
  })

  it('maps a unique-constraint violation to ConflictError', async () => {
    const { restoreConfigVersion } = await import('./projects')
    queue.push(() => pgError('23505'))
    await expect(restoreConfigVersion('p1', 1)).rejects.toThrow(ConflictError)
  })
})

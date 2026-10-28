// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError } from '../../errors'
import { DatabaseError } from '../client'

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
fakeSql.unsafe = (raw: string) => raw

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

const ROW = {
  id: 'd1',
  project_id: 'p1',
  provider: 'vercel',
  deployment_url: null,
  provider_deployment_id: null,
  status: 'pending',
  environment: 'preview',
  config_version_id: 'v1',
  error_message: null,
  created_at: 'x',
  updated_at: 'x',
}

beforeEach(() => {
  queue = []
  calls.length = 0
})

describe('createDeploymentRecord', () => {
  it('inserts a pending record and maps it back', async () => {
    const { createDeploymentRecord } = await import('./deployments')
    queue.push(() => [ROW])
    const result = await createDeploymentRecord({ projectId: 'p1', environment: 'preview', configVersionId: 'v1' })
    expect(result.status).toBe('pending')
    expect(result.environment).toBe('preview')
    expect(result.configVersionId).toBe('v1')
  })

  it('wraps an unexpected driver error in DatabaseError', async () => {
    const { createDeploymentRecord } = await import('./deployments')
    queue.push(() => new Error('connection reset'))
    await expect(
      createDeploymentRecord({ projectId: 'p1', environment: 'preview', configVersionId: null }),
    ).rejects.toThrow(DatabaseError)
  })
})

describe('updateDeploymentRecord', () => {
  it('updates and returns the record', async () => {
    const { updateDeploymentRecord } = await import('./deployments')
    queue.push(() => [{ ...ROW, status: 'success', deployment_url: 'https://wf-acme.vercel.app' }])
    const result = await updateDeploymentRecord('d1', { status: 'success', deploymentUrl: 'https://wf-acme.vercel.app' })
    expect(result.status).toBe('success')
    expect(result.deploymentUrl).toBe('https://wf-acme.vercel.app')
  })

  it('throws NotFoundError when no row matches', async () => {
    const { updateDeploymentRecord } = await import('./deployments')
    queue.push(() => [])
    await expect(updateDeploymentRecord('missing', { status: 'failed' })).rejects.toThrow(NotFoundError)
  })
})

describe('listDeploymentRecords', () => {
  it('returns mapped records newest first', async () => {
    const { listDeploymentRecords } = await import('./deployments')
    queue.push(() => [ROW, { ...ROW, id: 'd0', created_at: 'earlier' }])
    const results = await listDeploymentRecords('p1')
    expect(results).toHaveLength(2)
    expect(results[0].id).toBe('d1')
  })
})

describe('getDeploymentRecordById', () => {
  it('throws NotFoundError when missing', async () => {
    const { getDeploymentRecordById } = await import('./deployments')
    queue.push(() => [])
    await expect(getDeploymentRecordById('missing')).rejects.toThrow(NotFoundError)
  })

  it('returns the mapped record when found', async () => {
    const { getDeploymentRecordById } = await import('./deployments')
    queue.push(() => [ROW])
    const result = await getDeploymentRecordById('d1')
    expect(result.id).toBe('d1')
  })
})

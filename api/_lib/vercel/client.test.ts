// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createVercelDeployment,
  getVercelDeployment,
  isVercelConfigured,
  VercelApiError,
} from './client'

const TOKEN = 'secret-vercel-token-do-not-leak'

beforeEach(() => {
  delete process.env.VERCEL_TOKEN
  delete process.env.VERCEL_TEAM_ID
  vi.unstubAllGlobals()
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const READY_RESPONSE = { id: 'dpl_abc123', url: 'wf-acme-xyz.vercel.app', readyState: 'QUEUED', projectId: 'prj_123' }

describe('isVercelConfigured', () => {
  it('is false when VERCEL_TOKEN is unset', () => {
    expect(isVercelConfigured()).toBe(false)
  })

  it('is true once VERCEL_TOKEN is set', () => {
    process.env.VERCEL_TOKEN = TOKEN
    expect(isVercelConfigured()).toBe(true)
  })
})

describe('createVercelDeployment', () => {
  it('throws a clear setup error when VERCEL_TOKEN is missing', async () => {
    await expect(
      createVercelDeployment({ projectName: 'wf-acme', files: [], environment: 'preview' }),
    ).rejects.toThrow('Missing required environment variable: VERCEL_TOKEN')
  })

  it('sends the expected endpoint, headers, and body for a preview deployment', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(READY_RESPONSE))
    vi.stubGlobal('fetch', fetchMock)

    await createVercelDeployment({
      projectName: 'wf-acme',
      files: [{ path: 'package.json', content: new TextEncoder().encode('{}') }],
      environment: 'preview',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toContain('https://api.vercel.com/v13/deployments')
    expect(url.toString()).toContain('skipAutoDetectionConfirmation=1')
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`)

    const body = JSON.parse(init.body as string)
    expect(body.name).toBe('wf-acme')
    expect(body.project).toBeUndefined()
    expect(body.target).toBeUndefined() // omitted => preview
    expect(body.projectSettings).toEqual({ framework: 'vite' })
    expect(body.files).toEqual([{ file: 'package.json', data: Buffer.from('{}').toString('base64'), encoding: 'base64' }])
  })

  it('targets production explicitly and reuses an existing Vercel project by id', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(READY_RESPONSE))
    vi.stubGlobal('fetch', fetchMock)

    await createVercelDeployment({
      projectName: 'wf-acme',
      existingVercelProjectId: 'prj_existing',
      files: [],
      environment: 'production',
    })

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.project).toBe('prj_existing')
    expect(body.name).toBeUndefined()
    expect(body.target).toBe('production')
  })

  it('includes teamId as a query parameter when VERCEL_TEAM_ID is set', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    process.env.VERCEL_TEAM_ID = 'team_123'
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(READY_RESPONSE))
    vi.stubGlobal('fetch', fetchMock)

    await createVercelDeployment({ projectName: 'wf-acme', files: [], environment: 'preview' })

    const [url] = fetchMock.mock.calls[0] as [URL]
    expect(url.toString()).toContain('teamId=team_123')
  })

  it.each([
    [401, 'auth'],
    [403, 'auth'],
    [404, 'not_found'],
    [409, 'conflict'],
    [429, 'rate_limited'],
    [500, 'upstream'],
    [503, 'upstream'],
  ])('maps a %i response to a sanitized %s error without leaking the response body', async (status, kind) => {
    process.env.VERCEL_TOKEN = TOKEN
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => new Response(`secret upstream detail ${TOKEN}`, { status })))

    await expect(createVercelDeployment({ projectName: 'wf-acme', files: [], environment: 'preview' })).rejects.toSatisfy(
      (error: unknown) => {
        expect(error).toBeInstanceOf(VercelApiError)
        expect((error as VercelApiError).kind).toBe(kind)
        expect((error as Error).message).not.toContain(TOKEN)
        expect((error as Error).message).not.toContain('secret upstream detail')
        return true
      },
    )
  })

  it('treats a network failure as a sanitized "network" error', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('getaddrinfo ENOTFOUND'))),
    )
    await expect(createVercelDeployment({ projectName: 'wf-acme', files: [], environment: 'preview' })).rejects.toMatchObject({
      kind: 'network',
    })
  })

  it('treats an unparseable response body as a sanitized "invalid_response" error', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => new Response('not json', { status: 200 })))
    await expect(createVercelDeployment({ projectName: 'wf-acme', files: [], environment: 'preview' })).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })

  it('rejects a response missing required fields instead of treating it as success', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => jsonResponse({ id: 'dpl_abc' }))) // missing url/readyState
    await expect(createVercelDeployment({ projectName: 'wf-acme', files: [], environment: 'preview' })).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })

  it('rejects an oversized file set before ever calling fetch', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const huge = new Uint8Array(6 * 1024 * 1024)
    await expect(
      createVercelDeployment({ projectName: 'wf-acme', files: [{ path: 'big.bin', content: huge }], environment: 'preview' }),
    ).rejects.toMatchObject({ kind: 'too_large' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('never includes the token anywhere in a thrown error message', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => new Response('err', { status: 401 })))
    try {
      await createVercelDeployment({ projectName: 'wf-acme', files: [], environment: 'preview' })
      expect.unreachable()
    } catch (error) {
      expect(JSON.stringify(error)).not.toContain(TOKEN)
      expect((error as Error).message).not.toContain(TOKEN)
      expect((error as Error).stack ?? '').not.toContain(TOKEN)
    }
  })
})

describe('getVercelDeployment', () => {
  it('requests the deployment by id at the expected endpoint', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ ...READY_RESPONSE, readyState: 'READY' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getVercelDeployment('dpl_abc123')
    expect(result.readyState).toBe('READY')
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe('https://api.vercel.com/v13/deployments/dpl_abc123')
    expect(init.method).toBe('GET')
  })

  it('rejects a malformed deployment id without making a request', async () => {
    process.env.VERCEL_TOKEN = TOKEN
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(getVercelDeployment('; rm -rf /')).rejects.toMatchObject({ kind: 'invalid_response' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

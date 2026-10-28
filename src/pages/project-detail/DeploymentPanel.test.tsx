import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DeploymentPanel } from './DeploymentPanel'
import { parseCorporateConfig } from '../../templates/corporate'
import type { ConfigVersion, DeploymentRecord, Project } from '../../auth/apiClient'

const PROJECT: Project = {
  id: 'p1',
  name: 'Riverside Landscaping',
  slug: 'riverside-landscaping',
  businessName: null,
  templateId: 'corporate',
  status: 'draft',
  vercelProjectId: null,
  createdAt: 'x',
  updatedAt: 'x',
}

const VERSION: ConfigVersion = {
  id: 'v1',
  projectId: 'p1',
  versionNumber: 2,
  config: parseCorporateConfig({ variant: 'neutral' }),
  createdAt: '2026-01-05T00:00:00.000Z',
}

function statusResponse(overrides: Partial<{ configured: boolean; vercelProjectId: string | null; deployments: DeploymentRecord[] }> = {}) {
  return new Response(
    JSON.stringify({ configured: true, vercelProjectId: null, deployments: [], ...overrides }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DeploymentPanel', () => {
  it('renders nothing when there is no saved version yet', () => {
    const { container } = render(<DeploymentPanel project={PROJECT} latestVersion={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a "not configured" state and disables deploy actions', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => statusResponse({ configured: false })))
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)
    expect(await screen.findByText('Not configured')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deploy preview' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deploy to production' })).not.toBeInTheDocument()
  })

  it('explains which saved version and variant will be deployed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => statusResponse()))
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)
    expect(await screen.findByText(/Deploys version 2/)).toBeInTheDocument()
    expect(screen.getByText(/Neutral Business website/)).toBeInTheDocument()
  })

  it('requires explicit confirmation before a preview deploy, distinct from production', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => statusResponse()))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)

    await user.click(await screen.findByRole('button', { name: 'Deploy preview' }))
    expect(screen.getByText(/creates a new/)).toBeInTheDocument()
    expect(screen.queryByText(/live production website/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deploy preview' })).toBeInTheDocument() // the confirm button
  })

  it('shows a stronger, distinct warning before a production deploy', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => statusResponse()))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)

    await user.click(await screen.findByRole('button', { name: 'Deploy to production' }))
    expect(screen.getByText(/live production website/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deploy to production' })).toBeInTheDocument() // the confirm button
  })

  it('cancelling the confirmation starts no deployment', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') throw new Error('should not have deployed')
      return statusResponse()
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)

    await user.click(await screen.findByRole('button', { name: 'Deploy preview' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Deploy preview' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.every(([, init]) => init?.method !== 'POST')).toBe(true)
  })

  it('disables the confirm button while a deployment is starting, preventing duplicate submissions', async () => {
    let resolvePost!: (value: Response) => void
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolvePost = resolve
        })
      }
      return statusResponse()
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)

    await user.click(await screen.findByRole('button', { name: 'Deploy preview' }))
    await user.click(screen.getByRole('button', { name: 'Deploy preview' }))
    expect(screen.getByRole('button', { name: 'Starting…' })).toBeDisabled()

    resolvePost(
      new Response(
        JSON.stringify({ deployment: { id: 'd1', projectId: 'p1', provider: 'vercel', deploymentUrl: null, providerDeploymentId: 'dpl_1', status: 'building', environment: 'preview', configVersionId: 'v1', errorMessage: null, createdAt: 'x', updatedAt: 'x' } }),
        { status: 201 },
      ),
    )
    expect(await screen.findByText('Building')).toBeInTheDocument()
  })

  it('shows deployment history with status and an "Open site" link once ready', async () => {
    const record: DeploymentRecord = {
      id: 'd1',
      projectId: 'p1',
      provider: 'vercel',
      deploymentUrl: 'https://wf-riverside-landscaping.vercel.app',
      providerDeploymentId: 'dpl_1',
      status: 'success',
      environment: 'preview',
      configVersionId: 'v1',
      errorMessage: null,
      createdAt: '2026-01-06T00:00:00.000Z',
      updatedAt: 'x',
    }
    vi.stubGlobal('fetch', vi.fn(async () => statusResponse({ deployments: [record] })))
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)

    expect(await screen.findByText('Ready')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Open site/ })
    expect(link).toHaveAttribute('href', 'https://wf-riverside-landscaping.vercel.app')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows a failed deployment distinctly, with its error message and no link', async () => {
    const record: DeploymentRecord = {
      id: 'd1',
      projectId: 'p1',
      provider: 'vercel',
      deploymentUrl: null,
      providerDeploymentId: 'dpl_1',
      status: 'failed',
      environment: 'preview',
      configVersionId: 'v1',
      errorMessage: 'Vercel rejected the configured token.',
      createdAt: 'x',
      updatedAt: 'x',
    }
    vi.stubGlobal('fetch', vi.fn(async () => statusResponse({ deployments: [record] })))
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)

    expect(await screen.findByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Vercel rejected the configured token.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Open site/ })).not.toBeInTheDocument()
  })

  it('polls for status while a deployment is building, and stops once it is ready', async () => {
    let call = 0
    const buildingRecord: DeploymentRecord = {
      id: 'd1',
      projectId: 'p1',
      provider: 'vercel',
      deploymentUrl: null,
      providerDeploymentId: 'dpl_1',
      status: 'building',
      environment: 'preview',
      configVersionId: 'v1',
      errorMessage: null,
      createdAt: 'x',
      updatedAt: 'x',
    }
    const fetchMock = vi.fn(async () => {
      call += 1
      if (call === 1) return statusResponse({ deployments: [buildingRecord] })
      return statusResponse({ deployments: [{ ...buildingRecord, status: 'success', deploymentUrl: 'https://x.vercel.app' }] })
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)

    expect(await screen.findByText('Building')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(await screen.findByText('Ready')).toBeInTheDocument()
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('shows an actionable error, without a stack trace, when starting a deployment fails', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return new Response(JSON.stringify({ error: 'Vercel is rate-limiting this token right now. Try again in a minute.' }), { status: 429 })
      }
      return statusResponse()
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DeploymentPanel project={PROJECT} latestVersion={VERSION} />)

    await user.click(await screen.findByRole('button', { name: 'Deploy preview' }))
    await user.click(screen.getByRole('button', { name: 'Deploy preview' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Vercel is rate-limiting this token right now. Try again in a minute.')
  })

  it('mentions reusing the linked Vercel project when one is already associated', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => statusResponse({ vercelProjectId: 'prj_existing' })))
    render(<DeploymentPanel project={{ ...PROJECT, vercelProjectId: 'prj_existing' }} latestVersion={VERSION} />)
    expect(await screen.findByText(/Reuses the already-linked Vercel project/)).toBeInTheDocument()
  })
})

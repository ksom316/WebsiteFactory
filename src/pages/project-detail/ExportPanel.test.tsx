import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExportPanel } from './ExportPanel'
import { parseCorporateConfig } from '../../templates/corporate'
import type { ConfigVersion, Project } from '../../auth/apiClient'

const PROJECT: Project = {
  id: 'p1',
  name: 'Riverside Landscaping',
  slug: 'riverside-landscaping',
  businessName: null,
  vercelProjectId: null,
  templateId: 'corporate',
  status: 'draft',
  createdAt: 'x',
  updatedAt: 'x',
}

function version(overrides: Partial<ConfigVersion> = {}): ConfigVersion {
  return {
    id: 'v1',
    projectId: 'p1',
    versionNumber: 2,
    config: parseCorporateConfig({ variant: 'premium' }),
    createdAt: '2026-01-05T00:00:00.000Z',
    ...overrides,
  }
}

function zipResponse(body = 'zip-bytes') {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="riverside-landscaping.zip"',
    },
  })
}

describe('ExportPanel', () => {
  it('renders nothing when there is no saved version yet', () => {
    const { container } = render(<ExportPanel project={PROJECT} latestVersion={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('explains which saved version and variant will be exported', () => {
    render(<ExportPanel project={PROJECT} latestVersion={version()} />)
    expect(screen.getByText(/Exports version 2 of Riverside Landscaping/)).toBeInTheDocument()
    expect(screen.getByText(/Premium Agency \/ Technology website/)).toBeInTheDocument()
  })

  it('sends a plain GET with no body — the saved version, not an unsaved draft', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => zipResponse())
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })

    const user = userEvent.setup()
    render(<ExportPanel project={PROJECT} latestVersion={version()} />)
    await user.click(screen.getByRole('button', { name: 'Export website' }))

    expect(fetchMock).toHaveBeenCalledWith('/api/projects/export?id=p1', expect.objectContaining({ method: 'GET' }))
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.body).toBeUndefined()
  })

  it('shows an exporting state and disables the button while the request is in flight', async () => {
    let resolveFetch!: (value: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve))),
    )
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })

    const user = userEvent.setup()
    render(<ExportPanel project={PROJECT} latestVersion={version()} />)
    const button = screen.getByRole('button', { name: 'Export website' })
    await user.click(button)

    expect(screen.getByRole('button', { name: 'Exporting…' })).toBeDisabled()
    resolveFetch(zipResponse())
  })

  it('ignores a second click while an export is already in progress', async () => {
    // A mock that never resolves on its own keeps the first export genuinely "in
    // progress" for the whole test, so a second click can be proven to have no effect
    // — a fetch mock resolving instantly would finish before a second click even fires.
    let resolveFetch!: (value: Response) => void
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve)))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })

    const user = userEvent.setup()
    render(<ExportPanel project={PROJECT} latestVersion={version()} />)
    const button = screen.getByRole('button', { name: 'Export website' })
    await user.click(button)
    await user.click(button) // button is disabled now, but click the same element again regardless

    expect(fetchMock).toHaveBeenCalledTimes(1)
    resolveFetch(zipResponse())
  })

  it('shows an actionable error when export fails, without a misleading success state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'Database is currently unavailable.' }), { status: 503 })),
    )

    const user = userEvent.setup()
    render(<ExportPanel project={PROJECT} latestVersion={version()} />)
    await user.click(screen.getByRole('button', { name: 'Export website' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Database is currently unavailable.')
    expect(screen.queryByText(/Downloaded/)).not.toBeInTheDocument()
  })

  it('confirms the download after a successful export', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => zipResponse()))
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })

    const user = userEvent.setup()
    render(<ExportPanel project={PROJECT} latestVersion={version()} />)
    await user.click(screen.getByRole('button', { name: 'Export website' }))

    expect(await screen.findByText('Downloaded riverside-landscaping.zip.')).toBeInTheDocument()
  })
})

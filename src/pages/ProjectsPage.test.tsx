import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ProjectsPage } from './ProjectsPage'

function project(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '1',
    name: 'Acme Site',
    slug: 'acme',
    businessName: 'Acme Inc',
    templateId: 'corporate',
    status: 'draft',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('ProjectsPage', () => {
  it('shows a loading state, then the empty state for an empty active list', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ projects: [], total: 0 })))
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Loading projects…')).toBeInTheDocument()
    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
  })

  it('shows a retryable error state on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'Database is currently unavailable.' }, 503)))
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText("Couldn't load projects")).toBeInTheDocument()
  })

  it('lists projects with their status and links to the detail page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ projects: [project()], total: 1 })))
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )
    const link = await screen.findByRole('link', { name: /Acme Site/ })
    expect(link).toHaveAttribute('href', '/projects/1')
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('switches between active and archived and refetches with the new status', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString()
      if (url.includes('status=archived')) {
        return jsonResponse({ projects: [project({ id: '2', name: 'Old Site', status: 'archived' })], total: 1 })
      }
      return jsonResponse({ projects: [project()], total: 1 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )
    await screen.findByRole('link', { name: /Acme Site/ })
    await user.click(screen.getByRole('radio', { name: 'archived' }))
    await screen.findByRole('link', { name: /Old Site/ })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('status=archived'), expect.anything())
  })

  it('paginates when there are more projects than the page size', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString()
      const projects = url.includes('offset=10') ? [project({ id: '2', name: 'Page Two Site' })] : [project()]
      return jsonResponse({ projects, total: 11 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )
    await screen.findByRole('link', { name: /Acme Site/ })
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('offset=10'), expect.anything()))
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'

function mockFetchOnce(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })),
  )
}

describe('DashboardPage', () => {
  it('shows the real active project count once loaded', async () => {
    mockFetchOnce({
      projects: [{ id: '1', name: 'Acme Site', slug: 'acme', businessName: null, templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'x' }],
      total: 4,
    })
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(screen.getByText('active projects')).toBeInTheDocument()
    expect(screen.getByText('Most recently updated: Acme Site')).toBeInTheDocument()
  })

  it('uses singular wording for exactly one project', async () => {
    mockFetchOnce({
      projects: [{ id: '1', name: 'Acme Site', slug: 'acme', businessName: null, templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'x' }],
      total: 1,
    })
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('1')).toBeInTheDocument()
    expect(screen.getByText('active project')).toBeInTheDocument()
  })

  it('shows a neutral empty state when there are no projects yet', async () => {
    mockFetchOnce({ projects: [], total: 0 })
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('0')).toBeInTheDocument()
    expect(screen.getByText('active projects')).toBeInTheDocument()
    expect(screen.getByText('Nothing in production yet')).toBeInTheDocument()
  })
})

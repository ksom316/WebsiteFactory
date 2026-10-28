import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CreateProjectPage } from './CreateProjectPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('CreateProjectPage', () => {
  it('suggests a slug from the project name until the slug is edited directly', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CreateProjectPage />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Project name'), "Joe's Coffee Shop!")
    expect(screen.getByLabelText('Slug')).toHaveValue('joe-s-coffee-shop')

    await user.clear(screen.getByLabelText('Slug'))
    await user.type(screen.getByLabelText('Slug'), 'custom-slug')
    await user.type(screen.getByLabelText('Project name'), ' Two')
    expect(screen.getByLabelText('Slug')).toHaveValue('custom-slug')
  })

  it('preserves form input and shows a conflict error on a duplicate slug', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'A project with that slug already exists' }, 409)))
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CreateProjectPage />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Project name'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Create project' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A project with that slug already exists')
    expect(screen.getByLabelText('Project name')).toHaveValue('Acme')
    expect(screen.getByLabelText('Slug')).toHaveValue('acme')
  })

  it('creates a project and navigates to its detail page', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString()
      if (init?.method === 'POST' && url.includes('/api/projects')) {
        return jsonResponse(
          {
            project: { id: 'p1', name: 'Acme', slug: 'acme', businessName: null, templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'x' },
            version: { id: 'v1', projectId: 'p1', versionNumber: 1, config: {}, createdAt: 'x' },
          },
          201,
        )
      }
      if (url.includes('/api/projects/detail')) {
        return jsonResponse({
          project: { id: 'p1', name: 'Acme', slug: 'acme', businessName: null, templateId: 'corporate', status: 'draft', createdAt: 'x', updatedAt: 'x' },
          versions: [{ id: 'v1', projectId: 'p1', versionNumber: 1, config: { variant: 'neutral' }, createdAt: 'x' }],
        })
      }
      return jsonResponse({ error: 'not found' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/new" element={<CreateProjectPage />} />
          <Route path="/projects/:id" element={<div>Project detail page</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Project name'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Create project' }))
    expect(await screen.findByText('Project detail page')).toBeInTheDocument()
  })
})

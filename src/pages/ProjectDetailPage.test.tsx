import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProjectDetailPage } from './ProjectDetailPage'
import { UnsavedChangesProvider } from '../navigation/UnsavedChangesProvider'
import { parseCorporateConfig } from '../templates/corporate'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const PROJECT = {
  id: 'p1',
  name: 'Acme',
  slug: 'acme',
  businessName: 'Acme Inc',
  templateId: 'corporate',
  status: 'draft',
  createdAt: 'x',
  updatedAt: 'x',
}

function detailResponse(overrides: Partial<typeof PROJECT> = {}, versionNumber = 1) {
  return {
    project: { ...PROJECT, ...overrides },
    versions: [
      {
        id: 'v1',
        projectId: 'p1',
        versionNumber,
        config: parseCorporateConfig({ variant: 'neutral', business: { name: 'Acme Inc' } }),
        createdAt: 'x',
      },
    ],
  }
}

function renderDetail() {
  return render(
    <UnsavedChangesProvider>
      <MemoryRouter initialEntries={['/projects/p1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    </UnsavedChangesProvider>,
  )
}

describe('ProjectDetailPage', () => {
  it('shows a loading state, then the project', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(detailResponse())))
    renderDetail()
    expect(screen.getByText('Loading project…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Acme' })).toBeInTheDocument()
  })

  it('shows a retryable error state when the project fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'Project not found' }, 404)))
    renderDetail()
    expect(await screen.findByText("Couldn't load this project")).toBeInTheDocument()
  })

  it('shows the configuration tab by default with the saved heading', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(detailResponse())))
    renderDetail()
    await screen.findByRole('heading', { name: 'Acme' })
    expect(screen.getByDisplayValue('A website that works as hard as you do')).toBeInTheDocument()
    expect(screen.getByText('Up to date')).toBeInTheDocument()
  })

  it('enables Save once the draft config is edited, and saves successfully', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString()
      if (init?.method === 'PUT') {
        return jsonResponse({
          version: { id: 'v2', projectId: 'p1', versionNumber: 2, config: parseCorporateConfig(JSON.parse(init.body as string)), createdAt: 'y' },
          changed: true,
        })
      }
      if (url.includes('/api/projects/detail')) return jsonResponse(detailResponse())
      return jsonResponse({ error: 'not found' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDetail()
    await screen.findByRole('heading', { name: 'Acme' })

    const saveButton = screen.getByRole('button', { name: 'Save configuration' })
    expect(saveButton).toBeDisabled()

    const headingInput = screen.getByDisplayValue('A website that works as hard as you do')
    await user.clear(headingInput)
    await user.type(headingInput, 'New heading')
    expect(saveButton).toBeEnabled()

    await user.click(saveButton)
    expect(await screen.findByText('Saved.')).toBeInTheDocument()
  })

  it('switches to the history tab and restores a prior version', async () => {
    const versions = [
      { id: 'v2', projectId: 'p1', versionNumber: 2, config: parseCorporateConfig({}), createdAt: 'y' },
      { id: 'v1', projectId: 'p1', versionNumber: 1, config: parseCorporateConfig({}), createdAt: 'x' },
    ]
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString()
      if (init?.method === 'POST' && url.includes('version=1')) {
        return jsonResponse({ version: { id: 'v3', projectId: 'p1', versionNumber: 3, config: parseCorporateConfig({}), createdAt: 'z' } })
      }
      if (url.includes('/api/projects/detail')) return jsonResponse({ project: PROJECT, versions })
      return jsonResponse({ error: 'not found' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDetail()
    await screen.findByRole('heading', { name: 'Acme' })
    await user.click(screen.getByRole('tab', { name: 'History' }))

    expect(screen.getByText('Version 2')).toBeInTheDocument()
    expect(screen.getByText('Version 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Restore' }))
    await user.click(screen.getByRole('button', { name: 'Yes, restore' }))

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('version=1'), expect.objectContaining({ method: 'POST' }))
  })

  it('renders a live preview iframe in draft mode, isolated from the dashboard DOM', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(detailResponse())))
    renderDetail()
    await screen.findByRole('heading', { name: 'Acme' })

    const frame = screen.getByTitle('Live project preview') as HTMLIFrameElement
    expect(frame.src).toContain('/templates/preview?mode=draft')
    // The corporate template's scoped classes only ever exist inside the iframe's own
    // (separate) document — never in the dashboard's own DOM.
    expect(document.querySelector('.wf-corporate--neutral')).not.toBeInTheDocument()
    expect(document.querySelector('.wf-corporate--premium')).not.toBeInTheDocument()
  })

  it('switching between the mobile Edit/Preview toggle preserves the draft and makes no network calls', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString()
      if (url.includes('/api/projects/detail')) return jsonResponse(detailResponse())
      return jsonResponse({ error: 'not found' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDetail()
    await screen.findByRole('heading', { name: 'Acme' })

    const headingInput = screen.getByDisplayValue('A website that works as hard as you do')
    await user.clear(headingInput)
    await user.type(headingInput, 'Edited heading')

    const callsBeforeToggle = fetchMock.mock.calls.length
    await user.click(screen.getByRole('radio', { name: 'Preview' }))
    await user.click(screen.getByRole('radio', { name: 'Edit' }))

    expect(fetchMock.mock.calls.length).toBe(callsBeforeToggle)
    expect(screen.getByDisplayValue('Edited heading')).toBeInTheDocument()
  })

  it('does not overwrite a newer edit made while a save is still in flight', async () => {
    let resolveSave!: (value: Response) => void
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString()
      if (init?.method === 'PUT') {
        return new Promise<Response>((resolve) => {
          resolveSave = resolve
        })
      }
      if (url.includes('/api/projects/detail')) return jsonResponse(detailResponse())
      return jsonResponse({ error: 'not found' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDetail()
    await screen.findByRole('heading', { name: 'Acme' })

    const headingInput = within(screen.getByRole('group', { name: 'Hero' })).getByLabelText('Heading')
    await user.clear(headingInput)
    await user.type(headingInput, 'First edit')
    await user.click(screen.getByRole('button', { name: 'Save configuration' }))
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeInTheDocument()

    // A second, newer edit arrives while the first save is still pending.
    await user.clear(within(screen.getByRole('group', { name: 'Hero' })).getByLabelText('Heading'))
    await user.type(within(screen.getByRole('group', { name: 'Hero' })).getByLabelText('Heading'), 'Second edit')

    resolveSave(
      jsonResponse({
        version: { id: 'v2', projectId: 'p1', versionNumber: 2, config: parseCorporateConfig({ hero: { heading: 'First edit' } }), createdAt: 'y' },
        changed: true,
      }),
    )
    await screen.findByRole('button', { name: 'Save configuration' }) // save finished

    // The in-flight save resolved with "First edit", but the user has since typed
    // "Second edit" — that newer draft must survive, not be clobbered by the stale save,
    // and the status must not claim "Saved." while a newer edit is actually unsaved.
    expect(within(screen.getByRole('group', { name: 'Hero' })).getByLabelText('Heading')).toHaveValue('Second edit')
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument()
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  it('shows "No changes to save." and does not duplicate the version when the server reports nothing changed', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString()
      if (init?.method === 'PUT') {
        return jsonResponse({
          version: { id: 'v1', projectId: 'p1', versionNumber: 1, config: parseCorporateConfig({ variant: 'neutral', business: { name: 'Acme Inc' } }), createdAt: 'x' },
          changed: false,
        })
      }
      if (url.includes('/api/projects/detail')) return jsonResponse(detailResponse())
      return jsonResponse({ error: 'not found' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDetail()
    await screen.findByRole('heading', { name: 'Acme' })

    const headingInput = screen.getByDisplayValue('A website that works as hard as you do')
    await user.clear(headingInput)
    await user.type(headingInput, 'temp')
    await user.click(screen.getByRole('button', { name: 'Save configuration' }))

    expect(await screen.findByText('No changes to save.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'History' }))
    expect(screen.getAllByText(/^Version \d+$/)).toHaveLength(1)
  })

  it('asks for confirmation before restoring over unsaved changes, and respects "cancel"', async () => {
    const versions = [
      { id: 'v2', projectId: 'p1', versionNumber: 2, config: parseCorporateConfig({ hero: { heading: 'A website that works as hard as you do' } }), createdAt: 'y' },
      { id: 'v1', projectId: 'p1', versionNumber: 1, config: parseCorporateConfig({}), createdAt: 'x' },
    ]
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString()
      if (url.includes('/api/projects/detail')) return jsonResponse({ project: PROJECT, versions })
      return jsonResponse({ error: 'not found' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    const user = userEvent.setup()
    renderDetail()
    await screen.findByRole('heading', { name: 'Acme' })
    await user.type(screen.getByDisplayValue('A website that works as hard as you do'), '!')

    await user.click(screen.getByRole('tab', { name: 'History' }))
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    await user.click(screen.getByRole('button', { name: 'Yes, restore' }))

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('discard your unsaved configuration changes'))
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('version=1'), expect.objectContaining({ method: 'POST' }))
  })

  it('warns before navigating away with unsaved changes, and allows it once confirmed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(detailResponse())))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    const user = userEvent.setup()
    render(
      <UnsavedChangesProvider>
        <MemoryRouter initialEntries={['/projects/p1']}>
          <Routes>
            <Route path="/projects" element={<div>Projects list page</div>} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      </UnsavedChangesProvider>,
    )
    await screen.findByRole('heading', { name: 'Acme' })
    await user.type(screen.getByDisplayValue('A website that works as hard as you do'), '!')

    await user.click(screen.getByRole('link', { name: 'Back to projects' }))
    expect(confirmSpy).toHaveBeenCalled()
    expect(screen.queryByText('Projects list page')).not.toBeInTheDocument()

    confirmSpy.mockReturnValue(true)
    await user.click(screen.getByRole('link', { name: 'Back to projects' }))
    expect(await screen.findByText('Projects list page')).toBeInTheDocument()
  })

  it('archives a project with confirmation from the settings tab', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString()
      if (init?.method === 'PATCH') {
        return jsonResponse({ project: { ...PROJECT, status: 'archived' } })
      }
      if (url.includes('/api/projects/detail')) return jsonResponse(detailResponse())
      return jsonResponse({ error: 'not found' }, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderDetail()
    await screen.findByRole('heading', { name: 'Acme' })
    await user.click(screen.getByRole('tab', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Archive project' }))
    await user.click(screen.getByRole('button', { name: 'Confirm archive' }))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/detail'),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'archived' }) }),
    )
  })
})

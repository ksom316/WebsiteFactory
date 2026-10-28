import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { installMockApi } from './test/mockApi'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  window.history.pushState({}, '', '/')
})

describe('App routing', () => {
  it('renders the dashboard at the root route when authenticated', async () => {
    installMockApi({ authenticated: true })
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Website Factory' })).toBeInTheDocument()
  })

  it('redirects to the login page when unauthenticated', async () => {
    installMockApi({ authenticated: false })
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('navigates to the projects empty state', async () => {
    installMockApi({ authenticated: true })
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Website Factory' })
    await user.click(screen.getByRole('link', { name: 'Projects' }))
    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'New project' })[0]).toHaveAttribute('href', '/projects/new')
  })

  it('shows a not-found page for an unknown route', async () => {
    installMockApi({ authenticated: true })
    window.history.pushState({}, '', '/does-not-exist')
    render(<App />)
    expect(await screen.findByText('Nothing here')).toBeInTheDocument()
  })

  it('navigates to the template showcase from the sidebar', async () => {
    installMockApi({ authenticated: true })
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Website Factory' })
    await user.click(screen.getByRole('link', { name: 'Templates' }))
    expect(await screen.findByRole('heading', { name: 'Template showcase' })).toBeInTheDocument()
  })

  it('redirects to login for the showcase route when unauthenticated', async () => {
    installMockApi({ authenticated: false })
    window.history.pushState({}, '', '/templates')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('redirects to login for the bare preview route when unauthenticated', async () => {
    installMockApi({ authenticated: false })
    window.history.pushState({}, '', '/templates/preview?variant=premium&profile=fathom')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('renders the bare preview route without the dashboard shell when authenticated', async () => {
    installMockApi({ authenticated: true })
    window.history.pushState({}, '', '/templates/preview?variant=premium&profile=fathom')
    render(<App />)
    await screen.findByText('Fathom', { selector: 'a' })
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('does not change the factory theme attribute while the template preview renders', async () => {
    installMockApi({ authenticated: true })
    window.history.pushState({}, '', '/templates/preview?variant=premium&profile=fathom')
    render(<App />)
    await screen.findByText('Fathom', { selector: 'a' })
    expect(['light', 'dark']).toContain(document.documentElement.getAttribute('data-theme'))
  })
})

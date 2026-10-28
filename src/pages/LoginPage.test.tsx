import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import { installMockApi } from '../test/mockApi'
import { LoginPage } from './LoginPage'

beforeEach(() => {
  localStorage.clear()
})

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('shows a generic error on invalid credentials', async () => {
    const fetchMock = installMockApi({ authenticated: false })
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/api/auth/session')) {
        return new Response(JSON.stringify({ authenticated: false }), { status: 200 })
      }
      if (url.includes('/api/auth/login')) {
        return new Response(JSON.stringify({ error: 'Invalid username or password.' }), { status: 401 })
      }
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
    })

    const user = userEvent.setup()
    renderLoginPage()

    await screen.findByLabelText('Username')
    await user.type(screen.getByLabelText('Username'), 'owner')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.')
  })

  it('submits credentials and signals success', async () => {
    installMockApi({ authenticated: false })
    const user = userEvent.setup()
    renderLoginPage()

    await screen.findByLabelText('Username')
    await user.type(screen.getByLabelText('Username'), 'owner')
    await user.type(screen.getByLabelText('Password'), 'super-secret-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

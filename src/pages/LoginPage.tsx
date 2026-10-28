import { AlertCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/ui/BrandMark'
import { Button } from '../components/ui/Button'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch {
      setError('Invalid username or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <BrandMark />
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-border bg-surface p-6"
        >
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-text">Sign in</h1>
            <p className="text-sm text-text-muted">Private workspace — administrator access only.</p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-text">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text outline-none focus-visible:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-text">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text outline-none focus-visible:border-accent"
            />
          </div>

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}

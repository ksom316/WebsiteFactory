import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

/**
 * Frontend route guard. This is a UX convenience only — the real enforcement happens
 * server-side in every protected /api handler (api/_lib/auth.ts#withAuth).
 */
export function RequireAuth() {
  const { status } = useAuth()

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-muted">Checking session…</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

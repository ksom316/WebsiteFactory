import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-border-strong hover:text-text"
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}

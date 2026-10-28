import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchSessionStatus, login as apiLogin, logout as apiLogout } from './apiClient'
import { AuthContext, type AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')

  useEffect(() => {
    let cancelled = false
    fetchSessionStatus()
      .then(({ authenticated }) => {
        if (!cancelled) setStatus(authenticated ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    await apiLogin(username, password)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setStatus('unauthenticated')
    }
  }, [])

  const value = useMemo(() => ({ status, login, logout }), [status, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

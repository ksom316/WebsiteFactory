import { createContext } from 'react'

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  status: AuthStatus
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

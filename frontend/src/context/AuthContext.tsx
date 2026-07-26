import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import * as api from '../api'
import { onUnauthorized, setAuthToken } from '../api/client'
import { clearToken, getToken, setToken } from '../api/storage'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, displayName: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setDisplayName: (name: string) => Promise<void>
  applyUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const clearSession = useCallback(async () => {
    setAuthToken(null)
    setUser(null)
    await clearToken()
  }, [])

  // Bootstrap: restore a persisted token and resolve the current user.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const token = await getToken()
      if (token) {
        setAuthToken(token)
        try {
          const me = await api.fetchMe()
          if (!cancelled) setUser(me)
        } catch {
          await clearSession()
        }
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [clearSession])

  // Auto-logout when any authed request returns 401.
  useEffect(() => {
    onUnauthorized(() => {
      void clearSession()
    })
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login(email, password)
    setAuthToken(token)
    await setToken(token)
    setUser(user)
  }, [])

  const register = useCallback(
    async (email: string, displayName: string, password: string) => {
      const { token, user } = await api.register(email, displayName, password)
      setAuthToken(token)
      await setToken(token)
      setUser(user)
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* revoke best-effort; clear locally regardless */
    }
    await clearSession()
  }, [clearSession])

  const setDisplayName = useCallback(async (name: string) => {
    const updated = await api.updateDisplayName(name)
    setUser(updated)
  }, [])

  const applyUser = useCallback((next: User) => setUser(next), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      ready,
      login,
      register,
      logout,
      setDisplayName,
      applyUser,
    }),
    [user, ready, login, register, logout, setDisplayName, applyUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

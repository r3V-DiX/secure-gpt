'use client'
// packages/dashboard/src/contexts/auth-context.tsx
// Single source of truth for auth. Cookie-session based — no JWT, no localStorage.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiGet, apiPost } from '@/lib/api/client'
import type { AuthUser } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await apiGet<AuthUser>('/auth/me')
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  // FIX: logout now throws on API failure so callers can catch it and show a toast.
  // State is cleared and redirect happens only after the API call succeeds (or
  // in the finally if the caller doesn't re-throw).
  const logout = async () => {
    await apiPost('/auth/logout')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
'use client'

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
    console.log('[AuthContext] refresh() called')
    try {
      const me = await apiGet<AuthUser>('/auth/me')
      console.log('[AuthContext] /auth/me success:', me)
      setUser(me)
    } catch (err) {
      console.warn('[AuthContext] /auth/me failed:', err)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    console.log('[AuthContext] Initial auth check starting...')
    refresh().finally(() => {
      console.log('[AuthContext] Initial auth check done. loading → false')
      setLoading(false)
    })
  }, [refresh])

  const logout = async () => {
    console.log('[AuthContext] logout() called')
    await apiPost('/auth/logout')
    console.log('[AuthContext] logout API success, clearing user')
    setUser(null)
    window.location.href = '/login'
  }

  console.log('[AuthContext] Render — user:', user?.email ?? 'null', '| loading:', loading)

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
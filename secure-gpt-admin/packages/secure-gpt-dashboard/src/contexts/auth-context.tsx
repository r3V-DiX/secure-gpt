'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { apiGet, apiPost } from '@/lib/api/client'
import type { AuthUser } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  sessionExpired: boolean
  logout: () => Promise<void>
  refresh: () => Promise<AuthUser>             
  dismissExpired: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  // Prevent firing the expired modal multiple times from concurrent 401s
  const expiredFired = useRef(false)

  const refresh = useCallback(async () => {        
    try {
      const me = await apiGet<AuthUser>('/auth/me')
      setUser(me)
      // Session is valid — clear any prior expiry state
      expiredFired.current = false
      setSessionExpired(false)
      return me
    } catch (err) {
      setUser(null)
      throw err
    }
  }, [])

  useEffect(() => {
    void refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [refresh])

  // Listen for 401s fired by the axios interceptor
  useEffect(() => {
    const handleExpired = () => {
      if (expiredFired.current) return
      expiredFired.current = true
      setUser(null)
      setSessionExpired(true)
    }
    window.addEventListener('session-expired', handleExpired)
    return () => window.removeEventListener('session-expired', handleExpired)
  }, [])

  // When user returns to the tab, silently re-check session
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !sessionExpired) {
        void refresh().catch(() => undefined)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [refresh, sessionExpired])

  const logout = async () => {
    try { await apiPost('/auth/logout') } catch { /* ignore */ }
    setUser(null)
    setSessionExpired(false)
    expiredFired.current = false
    window.location.href = '/login'
  }

  const dismissExpired = useCallback(() => {
    setSessionExpired(false)
    expiredFired.current = false
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, sessionExpired, logout, refresh, dismissExpired }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

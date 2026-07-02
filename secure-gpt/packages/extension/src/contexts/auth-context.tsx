// ─────────────────────────────────────────────
// Auth Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, fetchCurrentUser } from '@/features/auth/services/auth.service'
import type { User } from '@securegpt/shared/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isLoggedIn: boolean
  reload: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isLoggedIn: false,
  reload: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function reload() {
    setLoading(true)
    try {
      // Try cache first for speed
      const cached = await getCurrentUser()
      if (cached) {
        setUser(cached)
        setLoading(false)
        return
      }
      // No cache — hit network
      const fresh = await fetchCurrentUser()
      setUser(fresh)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()

    // Listen for AUTH_SUCCESS from background (fired after OAuth tab completes)
    const handler = (message: { type: string; user?: User }) => {
      if (message.type === 'AUTH_SUCCESS') {
        if (message.user) setUser(message.user)
        else void reload()
      }
      if (message.type === 'AUTH_LOST') {
        setUser(null)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, reload }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
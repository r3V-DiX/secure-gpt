// ─────────────────────────────────────────────
// Auth Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser } from '@/features/auth/services/auth.service'
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
  reload: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function reload() {
    setLoading(true)
    try {
      const u = await getCurrentUser()
      setUser(u)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void reload() }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, reload }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}

// packages/extension/src/features/auth/hooks/use-auth.ts

import { useState, useEffect } from 'react'
import {
  getCurrentUser,
  fetchCurrentUser,
  signInWithGoogle,
  signInWithEmail,
  signOut,
} from '../services/auth.service'
import type { User } from '@securegpt/shared/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadAuth()
  }, [])

  async function loadAuth() {
    setLoading(true)
    try {
      // Try cached user first (fast)
      const cached = await getCurrentUser()
      if (cached) {
        setUser(cached)
        setLoading(false)
        return
      }
      // No cached user — check with backend
      const fresh = await fetchCurrentUser()
      setUser(fresh)
    } finally {
      setLoading(false)
    }
  }

  async function login() {
    await signInWithGoogle()
  }

  async function loginWithEmail(email: string) {
    const fresh = await signInWithEmail(email)
    setUser(fresh)
  }

  async function logout() {
    await signOut()
    setUser(null)
  }

  return {
    user,
    loading,
    isLoggedIn: !!user,
    login,
    loginWithEmail,
    logout,
    reload: loadAuth,
  }
}
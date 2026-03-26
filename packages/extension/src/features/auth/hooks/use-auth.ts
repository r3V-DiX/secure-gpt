// packages/extension/src/features/auth/hooks/use-auth.ts

import { useState, useEffect } from 'react'
import {
  getCurrentUser,
  fetchCurrentUser,
  signInWithGoogle,
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

  async function logout() {
    await signOut()
    setUser(null)
  }

  return {
    user,
    loading,
    isLoggedIn: !!user,
    login,
    logout,
    reload: loadAuth,
  }
}
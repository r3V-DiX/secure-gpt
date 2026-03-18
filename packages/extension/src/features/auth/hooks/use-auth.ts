// ─────────────────────────────────────────────
// useAuth Hook
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { isAuthenticated, getCurrentUser, signInWithGoogle, signOut } from '../services/auth.service'
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
      const u = await getCurrentUser()
      setUser(u)
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

  return { user, loading, isLoggedIn: !!user, login, logout, reload: loadAuth }
}

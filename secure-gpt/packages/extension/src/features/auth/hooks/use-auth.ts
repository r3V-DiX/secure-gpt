// packages/extension/src/features/auth/hooks/use-auth.ts

import { useState, useEffect } from 'react'
import {
  getCurrentUser,
  fetchCurrentUser,
  signInWithGoogle,
  signInWithMicrosoft,
  requestEmailOtp,
  verifyEmailOtp,
  signInWithEmail,
  signOut,
  registerDevice,
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
        // Ensure device registration / heartbeat is synced in the background
        void registerDevice()
        return
      }
      // No cached user — check with backend
      const fresh = await fetchCurrentUser()
      setUser(fresh ?? null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login() {
    await signInWithGoogle()
  }

  async function loginWithMicrosoft() {
    await signInWithMicrosoft()
  }

  async function sendOtp(email: string) {
    await requestEmailOtp(email)
  }

  async function verifyOtp(email: string, code: string) {
    const fresh = await verifyEmailOtp(email, code)
    setUser(fresh)
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
    loginWithMicrosoft,
    sendOtp,
    verifyOtp,
    loginWithEmail,
    logout,
    reload: loadAuth,
  }
}
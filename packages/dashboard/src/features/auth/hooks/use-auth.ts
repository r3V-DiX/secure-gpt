'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api/client'
import type { User } from '@securegpt/shared/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { void loadUser() }, [])

  async function loadUser() {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
      const res = await apiClient.get('/auth/me')
      setUser((res.data as { data: User }).data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  function signOut() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
  }

  return { user, loading, isLoggedIn: !!user, signOut, reload: loadUser }
}

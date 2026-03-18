'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = params.get('code')
    if (!code) { setError('Missing authorization code'); return }
    void handleCallback(code)
  }, [params])

  async function handleCallback(code: string) {
    try {
      const res = await fetch(`/api/backend/auth/google/callback?code=${code}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Authentication failed')
      const data = await res.json() as { data: { tokens: { access_token: string; refresh_token: string }; user: { role: string } } }

      // Store tokens
      localStorage.setItem('access_token', data.data.tokens.access_token)
      localStorage.setItem('refresh_token', data.data.tokens.refresh_token)

      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        SUPER_ADMIN: '/super-admin/dashboard',
        SECURITY_ADMIN: '/security-admin/dashboard',
        AUDITOR: '/auditor/dashboard',
        HR_MANAGER: '/security-admin/dashboard',
        USER: '/user/dashboard',
      }
      router.replace(roleRoutes[data.data.user.role] ?? '/user/dashboard')
    } catch {
      setError('Authentication failed. Please try again.')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.push('/login')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">S</span>
        </div>
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Signing you in...</p>
      </div>
    </div>
  )
}

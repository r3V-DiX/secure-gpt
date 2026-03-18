'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }

    const roleRoutes: Record<string, string> = {
      SUPER_ADMIN: '/super-admin/dashboard',
      SECURITY_ADMIN: '/security-admin/dashboard',
      AUDITOR: '/auditor/dashboard',
      HR_MANAGER: '/security-admin/dashboard',
      USER: '/user/dashboard',
    }
    router.replace(roleRoutes[user.role] ?? '/user/dashboard')
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold">S</span>
        </div>
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

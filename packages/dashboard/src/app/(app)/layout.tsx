'use client'
// src/app/(app)/layout.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Sidebar } from '@/components/layout/Sidebar'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 rounded-full border-2 border-t-[var(--accent)] animate-spin"
            style={{ borderColor: 'var(--accent-border)', borderTopColor: 'var(--accent)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Loading…
          </p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto px-7 py-6">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}
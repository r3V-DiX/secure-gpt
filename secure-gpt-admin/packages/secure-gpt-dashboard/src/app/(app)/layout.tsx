'use client'
// src/app/(app)/layout.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Sidebar } from '@/components/layout/Sidebar'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { Modal } from '@/components/ui/modal/modal'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionExpired, dismissExpired } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user && !sessionExpired) {
        router.replace('/login')
      } else if (user && user.deactivatedAt) {
        router.replace('/restore-account')
      }
    }
  }, [user, loading, sessionExpired, router])

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

  if (!user && !sessionExpired) return null

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto px-7 py-6">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Session expired modal */}
      <Modal open={sessionExpired} onClose={dismissExpired} size="sm" closeOnBackdrop={false}>
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div
            className="size-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'var(--warning-light)',
              border: '1.5px solid var(--warning-border)',
              color: 'var(--warning)',
            }}
          >
            <Clock size={24} />
          </div>

          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Session Expired
            </h2>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your session has expired due to inactivity. Please sign in again to continue.
            </p>
          </div>

          <button
            onClick={dismissExpired}
            className="w-full h-9 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)' }}
          >
            <LogIn size={15} />
            Sign in again
          </button>
        </div>
      </Modal>
    </div>
  )
}
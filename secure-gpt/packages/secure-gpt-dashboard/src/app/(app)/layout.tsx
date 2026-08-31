'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { Modal } from '@/components/ui/modal/modal'
import { OnboardingTour } from '@/components/layout/OnboardingTour'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionExpired, dismissExpired } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 rounded-full border-2 border-t-[var(--accent)] border-[var(--accent-border)] animate-spin" />
          <p className="text-sm font-semibold text-[var(--text-tertiary)]">
            Loading SecureGPT…
          </p>
        </div>
      </div>
    )
  }

  if (!user && !sessionExpired) return null

  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <OnboardingTour />

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-[var(--modal-backdrop)] z-50 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* PTK-style Responsive Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area with TopNav */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopNav onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 py-7">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Session Expired Modal */}
      <Modal open={sessionExpired} onClose={dismissExpired} size="sm" closeOnBackdrop={false}>
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div
            className="size-14 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--warning-light)] border border-[var(--warning-border)] text-[var(--warning)]"
          >
            <Clock size={24} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Session Expired
            </h2>
            <p className="text-sm mt-1.5 leading-relaxed text-[var(--text-secondary)]">
              Your session has expired due to inactivity. Please sign in again to continue.
            </p>
          </div>

          <button
            onClick={dismissExpired}
            className="w-full h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-sm"
          >
            <LogIn size={16} />
            Sign in again
          </button>
        </div>
      </Modal>
    </div>
  )
}

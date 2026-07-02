'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { apiPost } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react'

export default function RestoreAccountPage() {
  const { user, loading, logout, refresh } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [restoring, setRestoring] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    // If not loading, and user is not authenticated or not deactivated, redirect accordingly
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (!user.deactivatedAt) {
        router.replace('/dashboard')
      }
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user?.deactivatedAt) return

    const deactivatedDate = new Date(user.deactivatedAt)
    const purgeDate = new Date(deactivatedDate.getTime() + 45 * 24 * 60 * 60 * 1000)

    const updateTimer = () => {
      const diff = purgeDate.getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Permanently deleted (processing)')
        return
      }

      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
      const seconds = Math.floor((diff % (60 * 1000)) / 1000)

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [user])

  async function handleRestore() {
    try {
      setRestoring(true)
      await apiPost('/auth/restore', {})
      toast.success('Account successfully reactivated!')
      // Refresh AuthContext user state
      await refresh()
      router.replace('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore account')
    } finally {
      setRestoring(false)
    }
  }

  if (loading || !user || !user.deactivatedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
      </div>
    )
  }

  const reasonMap: Record<string, string> = {
    deletion: 'You requested to delete your account.',
    deactivation: 'Your account was deactivated by a security administrator.',
    inactivity: 'Your account was automatically deactivated due to 3 years of inactivity.',
  }

  const deactivationReasonText = reasonMap[user.deactivationReason || ''] || 'Your account is currently deactivated.'

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          opacity: 0.6,
        }}
        aria-hidden
      />

      {/* Glow blob */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)' }}
        aria-hidden
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[440px] rounded-2xl p-8 text-center"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-2)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex justify-center mb-6">
          <div
            className="size-14 rounded-2xl flex items-center justify-center text-[var(--warning)]"
            style={{
              background: 'var(--warning-light)',
              border: '1px solid var(--warning-border)',
            }}
          >
            <ShieldAlert size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
          Reactivate Your Account?
        </h1>
        
        <p className="text-xs mb-6 px-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {deactivationReasonText} Under compliance guidelines, your data will be permanently purged when the grace period expires.
        </p>

        {/* Timer Box */}
        <div
          className="rounded-xl border p-4 mb-8 text-center"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border-2)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Permanent Deletion In
          </p>
          <p className="text-xl font-mono font-bold tracking-tight" style={{ color: 'var(--danger)' }}>
            {timeLeft || 'Calculating...'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleRestore}
            disabled={restoring}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            <RefreshCw size={15} className={restoring ? 'animate-spin' : ''} />
            {restoring ? 'Reactivating...' : 'Reactivate Account'}
          </button>

          <button
            onClick={logout}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border-2)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-3)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-2)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-2)'
            }}
          >
            <LogOut size={15} />
            Cancel & Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

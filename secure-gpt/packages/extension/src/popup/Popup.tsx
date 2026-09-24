// packages/extension/src/popup/Popup.tsx
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { stateStorage, policyStorage, localStorageExt } from '@/lib/storage/storage'
import { DASHBOARD_URL } from '@/config/api.config'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/button/button'
import { StatusIndicator } from '@/components/common/StatusIndicator'

export function Popup() {
  const { user, loading, isLoggedIn, login, loginWithEmail, logout, reload } = useAuth()
  const [isActive, setIsActive] = useState(true)
  const [stats, setStats] = useState({ blockCount: 0, maskCount: 0, warnCount: 0 })
  const [pausing, setPausing] = useState(false)
  const [policyVersion, setPolicyVersion] = useState<number | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const loadState = useCallback(async () => {
    const active = await stateStorage.isActive()
    let s = await stateStorage.getSessionStats()
    setIsActive(active)

    if (isLoggedIn) {
      try {
        const res = await apiClient.get<{ success: boolean; data: { blockedCount?: number; maskedCount?: number; warnedCount?: number; cancelledCount?: number } }>('/api/v1/event-logs/stats')
        if (res.data?.data) {
          const d = res.data.data
          s = {
            blockCount: d.blockedCount ?? s.blockCount,
            maskCount: d.maskedCount ?? s.maskCount,
            warnCount: d.warnedCount ?? d.cancelledCount ?? s.warnCount,
          }
          await stateStorage.setSessionStats(s)
        }
      } catch {
        // Fallback to local session storage if offline or during sync
      }
    }

    setStats(s as typeof stats)

    const version = await policyStorage.getPolicyVersion()
    const syncedAt = await localStorageExt.get<string>('policyLastSyncedAt')
    setPolicyVersion(version)
    setLastSyncedAt(syncedAt)
  }, [isLoggedIn])

  const handleSync = useCallback(async () => {
    setIsSyncing(true)
    chrome.runtime.sendMessage({ type: 'SYNC_POLICY' }, (res) => {
      if (res?.success) {
        setPolicyVersion(res.version ?? 0)
        setLastSyncedAt(res.lastSyncedAt ?? null)
      } else {
        console.error('[Popup] On-demand sync failed:', res?.error)
      }
      setIsSyncing(false)
    })
  }, [])

  useEffect(() => {
    void loadState()

    const handler = (msg: { type: string }) => {
      if (msg.type === 'AUTH_SUCCESS') {
        void reload()
        void loadState()
      }
      if (msg.type === 'AUTH_LOST') {
        void reload()
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [loadState, reload])

  async function handleToggle() {
    if (isActive) {
      setPausing(true)
      await stateStorage.pauseFor(60)
      setIsActive(false)
      setPausing(false)
    } else {
      await stateStorage.setActive(true)
      setIsActive(true)
    }
  }

  async function handleLogout() {
    await logout()
  }

  if (loading) {
    return (
      <div className="w-[320px] h-[150px] flex items-center justify-center font-[var(--font-poppins)]" style={{ background: 'var(--bg-popup)' }}>
        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={login} onLoginWithEmail={loginWithEmail} />
  }

  return (
    <div className="w-[320px] font-[var(--font-poppins)] flex flex-col rounded-xl overflow-hidden shadow-2xl border"
      style={{ background: 'var(--bg-popup)', borderColor: 'var(--border-subtle)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#091a2a] rounded-lg flex items-center justify-center p-0.5 border border-slate-700/40 shadow-sm">
            <img src="/icons/icon48.png" alt="SecureGPT" className="w-full h-full object-contain" />
          </div>
          <span className="text-white text-[15.5px] font-bold tracking-tight">Secure<span style={{ color: 'var(--brand-primary)' }}>GPT</span></span>
        </div>
        <StatusIndicator status={isActive ? 'active' : 'paused'} size="sm" />
      </div>

      {/* User row */}
      <div className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ background: 'var(--bg-surface-soft)', borderColor: 'var(--border-subtle)' }}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full border-2 border-white/80 shadow-sm object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/80 shadow-sm"
            style={{ background: 'var(--brand-light)', color: 'var(--brand-text)' }}>
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold truncate" style={{ color: 'var(--text-main)' }}>{user?.fullName ?? 'User'}</div>
          <div className="text-[11.5px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 mt-1">
        <div className="text-[10px] font-black tracking-wider uppercase mb-2.5" style={{ color: 'var(--text-muted)' }}>Session Activity</div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Blocked" value={stats.blockCount} colorClass="text-red-600" bgClass="bg-red-500/10 border-red-500/20" />
          <StatCard label="Masked" value={stats.maskCount} colorClass="text-amber-600" bgClass="bg-amber-500/10 border-amber-500/20" />
          <StatCard label="Warned" value={stats.warnCount} colorClass="text-blue-600" bgClass="bg-blue-500/10 border-blue-500/20" />
        </div>
      </div>

      <div className="h-px mx-4 mt-2 mb-1" style={{ background: 'var(--border-subtle)' }} />

      {/* Policy Sync Section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-black tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Security Policy</span>
          <button 
            className={`text-[10.5px] font-bold hover:underline transition-colors flex items-center gap-1 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ color: 'var(--brand-primary)' }}
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <span className="w-3 h-3 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <span>Sync Now ↻</span>
            )}
          </button>
        </div>

        <div className="border rounded-xl p-3 shadow-sm relative overflow-hidden"
          style={{ background: 'var(--bg-surface-soft)', borderColor: 'var(--border-subtle)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(to right, var(--brand-primary), var(--brand-secondary))' }} />
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11.5px] font-bold" style={{ color: 'var(--text-secondary)' }}>Enforced Version</div>
            <div className="text-[10.5px] font-black px-2 py-0.5 rounded-md border shadow-sm"
              style={{ background: 'var(--brand-light)', color: 'var(--brand-text)', borderColor: 'var(--brand-border)' }}>
              v{policyVersion ?? 1}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11.5px] font-bold" style={{ color: 'var(--text-secondary)' }}>Last Synced</div>
            <div className="text-[11.5px] font-black" style={{ color: 'var(--text-main)' }}>
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
            <span className="text-[10.5px] font-semibold" style={{ color: 'var(--text-muted)' }}>Active & protecting local inputs</span>
          </div>
        </div>
      </div>

      <div className="h-px mx-4 my-1" style={{ background: 'var(--border-subtle)' }} />

      {/* Actions */}
      <div className="px-4 py-4 flex flex-col gap-2.5">
        <Button
          variant="secondary"
          size="md"
          fullWidth
          loading={pausing}
          onClick={handleToggle}
        >
          {isActive ? 'Pause Protection' : 'Resume Protection'}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard` })}
          >
            Dashboard ↗
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t flex justify-between items-center"
        style={{ background: 'var(--bg-surface-soft)', borderColor: 'var(--border-subtle)' }}>
        <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>v{chrome.runtime.getManifest().version}</span>
        <button 
          onClick={() => chrome.tabs.create({ url: `${DASHBOARD_URL}/versions` })}
          className="text-[10px] font-bold hover:underline transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          SecureGPT DLP
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, colorClass, bgClass }: { label: string; value: number; colorClass: string; bgClass: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-3 text-center border shadow-sm flex flex-col items-center justify-center ${bgClass}`}>
      <div className={`text-[24px] font-black leading-none mb-1 tracking-tight ${colorClass}`}>{value}</div>
      <div className={`text-[9.5px] font-black uppercase tracking-wider opacity-80 ${colorClass}`}>{label}</div>
    </div>
  )
}

function LoginView({ 
  onLogin, 
  onLoginWithEmail 
}: { 
  onLogin: () => void
  onLoginWithEmail: (email: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const isLocalDev = DASHBOARD_URL.includes('localhost') || DASHBOARD_URL.includes('127.0.0.1')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      setLoading(true)
      await onLoginWithEmail(email)
    } catch (err: any) {
      alert(err.message || 'Developer login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[320px] px-6 py-10 flex flex-col items-center font-[var(--font-poppins)] text-center shadow-2xl rounded-xl border"
      style={{ background: 'var(--bg-popup)', borderColor: 'var(--border-subtle)' }}>
      <div className="w-16 h-16 bg-[#091a2a] rounded-2xl flex items-center justify-center p-2 mb-5 shadow-[0_8px_20px_rgba(99,102,241,0.4)] border border-slate-700/40">
        <img src="/icons/icon128.png" alt="SecureGPT" className="w-full h-full object-contain" />
      </div>
      <div className="text-[20px] font-black tracking-tight mb-2" style={{ color: 'var(--text-main)' }}>Secure<span style={{ color: 'var(--brand-primary)' }}>GPT</span></div>
      <div className="text-[12.5px] font-semibold leading-relaxed mb-8 max-w-[240px]" style={{ color: 'var(--text-muted)' }}>
        Sign in to enforce data privacy and secure your AI interactions.
      </div>
      <Button 
        variant="secondary"
        size="lg"
        fullWidth
        loading={loading}
        onClick={onLogin}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        }
      >
        Sign in with Google
      </Button>

      {isLocalDev && (
        <form onSubmit={handleSubmit} className="w-full mt-7 flex flex-col gap-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Developer</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          </div>
          <input
            type="email"
            placeholder="Enter test user email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border text-[12.5px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
            style={{ 
              background: 'var(--bg-surface-soft)', 
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-main)'
            }}
            required
          />
          <Button
            type="submit"
            variant="secondary"
            size="md"
            fullWidth
            loading={loading}
            disabled={!email}
          >
            Bypass Login
          </Button>
        </form>
      )}
    </div>
  )
}
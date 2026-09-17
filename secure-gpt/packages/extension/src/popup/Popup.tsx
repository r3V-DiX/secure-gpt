// packages/extension/src/popup/Popup.tsx
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { stateStorage, policyStorage, localStorageExt } from '@/lib/storage/storage'
import { DASHBOARD_URL } from '@/config/api.config'
import apiClient from '@/lib/api/client'

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
      <div className="w-[320px] h-[150px] flex items-center justify-center bg-white font-[var(--font-poppins)]">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={login} onLoginWithEmail={loginWithEmail} />
  }

  return (
    <div className="w-[320px] font-[var(--font-poppins)] bg-white flex flex-col rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#060d1f] px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-[0_2px_8px_rgba(99,102,241,0.35)]">
            R
          </div>
          <span className="text-white text-[15.5px] font-bold tracking-tight">Rivedix</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isActive ? 'bg-green-500/15 border-green-500/20' : 'bg-amber-500/15 border-amber-500/20'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]'}`} />
          <span className={`text-[11px] font-bold tracking-wide ${isActive ? 'text-green-500' : 'text-amber-500'}`}>
            {isActive ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      {/* User row */}
      <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-b from-[#f0f4ff]/70 to-white">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 border-2 border-white shadow-sm">
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold text-slate-900 truncate">{user?.fullName ?? 'User'}</div>
          <div className="text-[11.5px] font-medium text-slate-600 truncate">{user?.email}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 mt-1">
        <div className="text-[10px] font-black text-slate-400 tracking-wider uppercase mb-2.5">Session Activity</div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Blocked" value={stats.blockCount} colorClass="text-red-600" bgClass="bg-red-50 border-red-100" />
          <StatCard label="Masked" value={stats.maskCount} colorClass="text-amber-600" bgClass="bg-amber-50 border-amber-100" />
          <StatCard label="Warned" value={stats.warnCount} colorClass="text-blue-600" bgClass="bg-blue-50 border-blue-100" />
        </div>
      </div>

      <div className="h-px bg-slate-100 mx-4 mt-2 mb-1" />

      {/* Policy Sync Section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Security Policy</span>
          <button 
            className={`text-[10.5px] font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
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

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11.5px] text-slate-600 font-bold">Enforced Version</div>
            <div className="bg-blue-100 text-blue-700 text-[10.5px] font-black px-2 py-0.5 rounded-md border border-blue-200 shadow-sm">v{policyVersion ?? 1}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11.5px] text-slate-600 font-bold">Last Synced</div>
            <div className="text-[11.5px] text-slate-800 font-black">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-200/80">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
            <span className="text-[10.5px] text-slate-600 font-semibold">Active & protecting local inputs</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100 mx-4 my-1" />

      {/* Actions */}
      <div className="px-4 py-4 flex flex-col gap-2.5">
        <button
          className="w-full py-2.5 rounded-xl text-[13px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm flex items-center justify-center active:scale-[0.98]"
          onClick={handleToggle}
          disabled={pausing}
        >
          {pausing ? '...' : isActive ? 'Pause Protection' : 'Resume Protection'}
        </button>
        <div className="flex gap-2">
          <button
            className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:shadow-[0_4px_12px_rgba(29,78,216,0.4)] transition-all border border-blue-600 flex items-center justify-center active:scale-[0.98]"
            onClick={() => chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard` })}
          >
            Dashboard ↗
          </button>
          <button
            className="px-4 py-2.5 rounded-xl text-[12.5px] font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100 shadow-sm flex items-center justify-center active:scale-[0.98]"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400">v{chrome.runtime.getManifest().version}</span>
        <span className="text-[10px] font-bold text-slate-400">rivedix.com</span>
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
    <div className="w-[320px] px-6 py-10 flex flex-col items-center bg-[#f0f4ff] font-[var(--font-poppins)] text-center shadow-2xl rounded-xl">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black text-white mb-5 shadow-[0_8px_20px_rgba(99,102,241,0.4)] border border-blue-400/30">
        R
      </div>
      <div className="text-[20px] font-black text-slate-900 tracking-tight mb-2">Rivedix</div>
      <div className="text-[12.5px] font-semibold text-slate-600 leading-relaxed mb-8 max-w-[240px]">
        Sign in to enforce data privacy and secure your AI interactions.
      </div>
      <button 
        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-[13.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all border border-slate-200 shadow-sm disabled:opacity-50 active:scale-[0.98]"
        onClick={onLogin}
        disabled={loading}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </button>

      {isLocalDev && (
        <form onSubmit={handleSubmit} className="w-full mt-7 flex flex-col gap-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Developer</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <input
            type="email"
            placeholder="Enter test user email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-[12.5px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold placeholder-slate-400 bg-white"
            required
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 rounded-xl text-[13px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm disabled:opacity-50 flex justify-center active:scale-[0.98]"
          >
            {loading ? 'Bypassing...' : 'Bypass Login'}
          </button>
        </form>
      )}
    </div>
  )
}
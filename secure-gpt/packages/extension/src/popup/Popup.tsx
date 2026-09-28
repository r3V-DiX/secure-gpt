// packages/extension/src/popup/Popup.tsx
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { stateStorage, policyStorage, localStorageExt } from '@/lib/storage/storage'
import { DASHBOARD_URL } from '@/config/api.config'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/button/button'
import { StatusIndicator } from '@/components/common/StatusIndicator'
import { LoginView } from './components/LoginView'
import { StatCard } from './components/StatCard'

export function Popup() {
  const { 
    user, 
    loading, 
    isLoggedIn, 
    login, 
    loginWithMicrosoft,
    sendOtp,
    verifyOtp,
    loginWithEmail, 
    logout, 
    reload 
  } = useAuth()
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
      <div className="w-[320px] h-[150px] flex items-center justify-center font-[var(--font-jakarta)]" style={{ background: 'var(--bg-popup)' }}>
        <div className="size-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <LoginView 
        onLogin={login} 
        onLoginWithMicrosoft={loginWithMicrosoft}
        onRequestOtp={sendOtp}
        onVerifyOtp={verifyOtp}
        onLoginWithEmail={loginWithEmail} 
      />
    )
  }

  return (
    <div className="w-[320px] font-[var(--font-jakarta)] flex flex-col rounded-lg overflow-hidden shadow-xl border"
      style={{ background: 'var(--bg-popup)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between border-b"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="size-6 bg-[#091a2a] rounded flex items-center justify-center p-0.5 border border-slate-700/50 shadow-xs">
            <img src="/icons/icon48.png" alt="SecureGPT" className="w-full h-full object-contain" />
          </div>
          <span className="text-white text-sm font-bold tracking-tight">SecureGPT</span>
        </div>
        <StatusIndicator status={isActive ? 'active' : 'paused'} size="sm" />
      </div>

      {/* User row */}
      <div className="flex items-center gap-3 px-3.5 py-3 border-b"
        style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-9 rounded-full border border-[var(--border)] shadow-xs object-cover" />
        ) : (
          <div className="size-9 rounded-full flex items-center justify-center text-xs font-bold border shadow-xs"
            style={{ background: 'var(--accent-light)', color: 'var(--accent-text)', borderColor: 'var(--accent-border)' }}>
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate text-[var(--text-primary)]">{user?.fullName ?? 'User'}</div>
          <div className="text-[11px] font-medium truncate text-[var(--text-tertiary)]">{user?.email}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-3.5 pt-3 pb-1">
        <div className="text-[10px] font-bold tracking-wider uppercase mb-2 text-[var(--text-tertiary)]">Session Activity</div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Blocked" value={stats.blockCount} colorClass="text-red-700 dark:text-red-400" bgClass="bg-red-500/10 border-red-500/20" />
          <StatCard label="Masked" value={stats.maskCount} colorClass="text-amber-800 dark:text-amber-400" bgClass="bg-amber-500/10 border-amber-500/20" />
          <StatCard label="Warned" value={stats.warnCount} colorClass="text-blue-800 dark:text-blue-400" bgClass="bg-blue-500/10 border-blue-500/20" />
        </div>
      </div>

      {/* Policy Sync Section */}
      <div className="px-3.5 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-tertiary)]">Security Policy</span>
          <button 
            className={`min-h-[26px] px-2 py-0.5 rounded text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--bg-surface-2)] transition-colors flex items-center gap-1 cursor-pointer ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleSync}
            disabled={isSyncing}
            aria-label="Sync Security Policy"
          >
            {isSyncing ? (
              <span className="size-3 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
            ) : (
              <span>Sync Now ↻</span>
            )}
          </button>
        </div>

        <div className="border rounded-md p-2.5 shadow-xs relative overflow-hidden bg-[var(--bg-surface-2)]"
          style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[11px] font-medium text-[var(--text-secondary)]">Enforced Version</div>
            <div className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border"
              style={{ background: 'var(--accent-light)', color: 'var(--accent-text)', borderColor: 'var(--accent-border)' }}>
              v{policyVersion ?? 1}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-medium text-[var(--text-secondary)]">Last Synced</div>
            <div className="text-[11px] font-bold text-[var(--text-primary)]">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="size-1.5 rounded-full bg-[var(--success)] shadow-[0_0_4px_var(--success)]" />
            <span className="text-[10px] font-medium text-[var(--text-tertiary)]">Active &amp; protecting local inputs</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3.5 py-3 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="md"
          fullWidth
          loading={pausing}
          onClick={handleToggle}
        >
          {isActive ? 'Pause Protection (60s)' : 'Resume Protection'}
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
      <div className="px-3.5 py-2 border-t flex justify-between items-center bg-[var(--bg-surface-2)]"
        style={{ borderColor: 'var(--border)' }}>
        <span className="text-[10px] font-medium text-[var(--text-muted)]">v{chrome.runtime.getManifest().version}</span>
        <button 
          onClick={() => chrome.tabs.create({ url: `${DASHBOARD_URL}/versions` })}
          className="min-h-[24px] px-1 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline transition-colors cursor-pointer"
        >
          SecureGPT DLP
        </button>
      </div>
    </div>
  )
}
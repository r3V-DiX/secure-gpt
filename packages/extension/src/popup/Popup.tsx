// packages/extension/src/popup/Popup.tsx
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { stateStorage, policyStorage, localStorageExt } from '@/lib/storage/storage'
import { DASHBOARD_URL } from '@/config/api.config'

export function Popup() {
  const { user, loading, isLoggedIn, login, logout, reload } = useAuth()
  const [isActive, setIsActive] = useState(true)
  const [stats, setStats] = useState({ blockCount: 0, maskCount: 0, warnCount: 0 })
  const [pausing, setPausing] = useState(false)
  const [policyVersion, setPolicyVersion] = useState<number | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const loadState = useCallback(async () => {
    const active = await stateStorage.isActive()
    const s = await stateStorage.getSessionStats()
    setIsActive(active)
    setStats(s as typeof stats)

    const version = await policyStorage.getPolicyVersion()
    const syncedAt = await localStorageExt.get<string>('policyLastSyncedAt')
    setPolicyVersion(version)
    setLastSyncedAt(syncedAt)
  }, [])

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

    // Listen for auth events from background
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
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={login} />
  }

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>S</div>
          <span style={styles.logoText}>SecureGPT</span>
        </div>
        <div style={{ ...styles.statusPill, background: isActive ? 'rgba(34,197,94,.15)' : 'rgba(251,191,36,.15)' }}>
          <div style={{ ...styles.statusDot, background: isActive ? '#22c55e' : '#fbbf24' }} />
          <span style={{ ...styles.statusLabel, color: isActive ? '#16a34a' : '#d97706' }}>
            {isActive ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      {/* User row */}
      <div style={styles.userRow}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" style={styles.avatar} />
        ) : (
          <div style={styles.avatarFallback}>
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}
        <div style={styles.userInfo}>
          <div style={styles.userName}>{user?.fullName ?? 'User'}</div>
          <div style={styles.userEmail}>{user?.email}</div>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Stats */}
      <div style={styles.statsLabel}>Session activity</div>
      <div style={styles.statsGrid}>
        <StatCard label="Blocked" value={stats.blockCount} color="#ef4444" bg="#fef2f2" />
        <StatCard label="Masked" value={stats.maskCount} color="#f59e0b" bg="#fffbeb" />
        <StatCard label="Warned" value={stats.warnCount} color="#3b82f6" bg="#eff6ff" />
      </div>

      <div style={styles.divider} />

      {/* Policy Sync Section */}
      <div style={styles.syncSection}>
        <div style={styles.syncHeaderRow}>
          <span style={styles.syncSectionLabel}>Security Policy</span>
          <button 
            style={{ 
              ...styles.syncBtn, 
              opacity: isSyncing ? 0.5 : 1, 
              cursor: isSyncing ? 'not-allowed' : 'pointer' 
            }}
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <span className="spin-animation" style={styles.syncSpinnerInline} />
            ) : (
              <span>Sync Now ↻</span>
            )}
          </button>
        </div>

        <div style={styles.syncStatusCard}>
          <div style={styles.syncStatusRow}>
            <div style={styles.syncInfoLabel}>Enforced Version</div>
            <div style={styles.syncVersionBadge}>v{policyVersion ?? 1}</div>
          </div>
          <div style={styles.syncStatusRow}>
            <div style={styles.syncInfoLabel}>Last Synced</div>
            <div style={styles.syncTimestamp}>
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
            </div>
          </div>
          <div style={styles.syncStatusIndicatorRow}>
            <div style={{ ...styles.syncStatusDot, background: '#22c55e' }} />
            <span style={styles.syncStatusText}>Active & protecting local inputs</span>
          </div>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Actions */}
      <div style={styles.actions}>
        <button
          style={{ ...styles.btn, ...styles.btnSecondary }}
          onClick={handleToggle}
          disabled={pausing}
        >
          {pausing ? '...' : isActive ? 'Pause protection' : 'Resume protection'}
        </button>
        <div style={styles.actionRow}>
          <button
            style={{ ...styles.btn, ...styles.btnGhost, flex: 1 }}
            onClick={() => chrome.tabs.create({ url: DASHBOARD_URL })}
          >
            Dashboard ↗
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnDanger }}
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>v{chrome.runtime.getManifest().version}</span>
        <span style={styles.footerText}>securegpt.rkavach.com</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ ...styles.statCard, background: bg }}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={{ ...styles.statLabel, color }}>{label}</div>
    </div>
  )
}

function LoginView({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginIcon}>S</div>
      <div style={styles.loginTitle}>SecureGPT</div>
      <div style={styles.loginSub}>Sign in to start protecting your data across AI platforms</div>
      <button style={{ ...styles.btn, ...styles.btnPrimary, width: '100%' }} onClick={onLogin}>
        <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: 300, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#fff', borderRadius: 12, overflow: 'hidden' },
  loadingWrap: { width: 300, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' },
  spinner: { width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  header: { background: '#1e40af', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 8 },
  logoIcon: { width: 24, height: 24, background: 'white', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1e40af' },
  logoText: { color: 'white', fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' },
  statusPill: { display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: '50%' },
  statusLabel: { fontSize: 11, fontWeight: 500 },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' },
  avatar: { width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #e5e7eb' },
  avatarFallback: { width: 34, height: 34, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#1d4ed8' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  divider: { height: 1, background: '#f3f4f6', margin: '0 14px' },
  statsLabel: { fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px 14px 6px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: '0 14px 10px' },
  statCard: { borderRadius: 8, padding: '8px 6px', textAlign: 'center' },
  statValue: { fontSize: 20, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 10, fontWeight: 500, marginTop: 3, opacity: 0.8 },
  actions: { padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 },
  actionRow: { display: 'flex', gap: 6 },
  btn: { display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, padding: '8px 12px', transition: 'opacity .15s', fontFamily: 'inherit' },
  btnPrimary: { background: '#2563eb', color: 'white' },
  btnSecondary: { background: '#f3f4f6', color: '#374151', width: '100%' },
  btnGhost: { background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' },
  btnDanger: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  footer: { padding: '8px 14px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' },
  footerText: { fontSize: 10, color: '#d1d5db' },
  loginWrap: { width: 300, padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  loginIcon: { width: 44, height: 44, background: '#1e40af', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 4 },
  loginTitle: { fontSize: 16, fontWeight: 700, color: '#111827' },
  loginSub: { fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 1.5, marginBottom: 8 },
  syncSection: { padding: '10px 14px' },
  syncHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  syncSectionLabel: { fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' },
  syncBtn: { background: 'transparent', border: 'none', color: '#2563eb', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, transition: 'background .15s', cursor: 'pointer', outline: 'none' },
  syncStatusCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' },
  syncStatusRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  syncInfoLabel: { fontSize: 11, color: '#64748b', fontWeight: 500 },
  syncVersionBadge: { background: '#dbeafe', color: '#1d4ed8', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 },
  syncTimestamp: { fontSize: 11, color: '#334155', fontWeight: 600 },
  syncStatusIndicatorRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 6, borderTop: '1px solid #f1f5f9' },
  syncStatusDot: { width: 5, height: 5, borderRadius: '50%' },
  syncStatusText: { fontSize: 10, color: '#475569', fontWeight: 500 },
  syncSpinnerInline: { display: 'inline-block', width: 8, height: 8, border: '1.5px solid #d1d5db', borderTopColor: '#2563eb', borderRadius: '50%' },
}
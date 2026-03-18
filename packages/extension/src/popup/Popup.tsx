// ─────────────────────────────────────────────
// Popup Component
// Main extension toolbar popup
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { stateStorage } from '@/lib/storage/storage'
import { StatusIndicator } from '@/components/common/StatusIndicator'
import { Button } from '@/components/ui/button/button'
import { Badge } from '@/components/ui/badge/badge'
import { Card } from '@/components/ui/card/card'
import { PAUSE_OPTIONS } from '@/config/defaults.config'

type PopupView = 'main' | 'pause'

export function Popup() {
  const { user, loading, isLoggedIn, login } = useAuth()
  const [view, setView] = useState<PopupView>('main')
  const [isActive, setIsActive] = useState(true)
  const [stats, setStats] = useState({ blockCount: 0, maskCount: 0, warnCount: 0 })
  const [pausing, setPausing] = useState(false)

  useEffect(() => {
    void loadState()
  }, [])

  async function loadState() {
    const active = await stateStorage.isActive()
    const s = await stateStorage.getSessionStats()
    setIsActive(active)
    setStats(s as typeof stats)
  }

  async function handlePause(minutes: number) {
    setPausing(true)
    await stateStorage.pauseFor(minutes)
    setIsActive(false)
    setView('main')
    setPausing(false)
  }

  async function handleResume() {
    await stateStorage.setActive(true)
    setIsActive(true)
  }

  if (loading) {
    return (
      <div className="w-80 h-32 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <NotSignedIn onSignIn={login} />
  }

  return (
    <div className="w-80 animate-fade-in" style={{ fontFamily: 'var(--sg-font)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm">
            <span className="text-blue-600 text-xs font-bold">S</span>
          </div>
          <span className="text-white font-semibold text-sm">SecureGPT</span>
        </div>
        <StatusIndicator
          status={isActive ? 'active' : 'paused'}
          size="sm"
        />
      </div>

      <div className="p-4 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Status card */}
        <Card padding="sm" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Protection status</span>
            <StatusIndicator status={isActive ? 'active' : 'paused'} size="sm" />
          </div>
          <p className="text-xs text-gray-500">
            {isActive
              ? 'Monitoring all configured LLM platforms'
              : 'Protection paused — data is not being scanned'}
          </p>
        </Card>

        {/* Session stats */}
        <Card padding="sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Session stats</p>
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="Blocked" value={stats.blockCount} color="red" />
            <StatPill label="Masked" value={stats.maskCount} color="amber" />
            <StatPill label="Warned" value={stats.warnCount} color="orange" />
          </div>
        </Card>

        {/* Actions */}
        {view === 'main' && (
          <div className="space-y-2">
            {isActive ? (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setView('pause')}
              >
                Pause protection
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleResume}
              >
                Resume protection
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('settings/index.html') })}
              >
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => chrome.tabs.create({ url: 'https://securegpt.app/dashboard' })}
              >
                Dashboard ↗
              </Button>
            </div>
          </div>
        )}

        {view === 'pause' && (
          <PauseView onPause={handlePause} onCancel={() => setView('main')} loading={pausing} />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">v{chrome.runtime.getManifest().version}</span>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); chrome.tabs.create({ url: 'https://securegpt.app' }) }}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          securegpt.app
        </a>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className={`rounded-lg p-2 text-center ${colorMap[color] ?? 'bg-gray-50 text-gray-700'}`}>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  )
}

function NotSignedIn({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="w-80 p-6 flex flex-col items-center gap-4 animate-fade-in">
      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-white text-xl font-bold">S</span>
      </div>
      <div className="text-center">
        <h2 className="font-semibold text-gray-800">Welcome to SecureGPT</h2>
        <p className="text-xs text-gray-500 mt-1">Sign in to start protecting your data</p>
      </div>
      <Button variant="primary" size="md" fullWidth onClick={onSignIn}>
        Sign in with Google
      </Button>
    </div>
  )
}

function PauseView({ onPause, onCancel, loading }: {
  onPause: (minutes: number) => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="space-y-2 animate-slide-up">
      <p className="text-xs text-gray-500 font-medium">Pause protection for:</p>
      <div className="space-y-1.5">
        {PAUSE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPause(opt.value)}
            disabled={loading}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-100 disabled:opacity-50"
          >
            {opt.label}
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" fullWidth onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, ChevronRight, ShieldCheck, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { useAuth } from '@/contexts/auth-context'

import { useProfile } from '@/features/profile/hooks/use-profile'

interface TopNavProps {
  onMenuClick: () => void
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Security Dashboard',
  'get-started': 'Get Started',
  incidents: 'Incidents Stream',
  'event-logs': 'Event Logs & Audit',
  policy: 'Policy Governance',
  team: 'Team & Organization Admin',
  profile: 'User Profile',
  settings: 'System Settings',
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const { devices, loading: devicesLoading } = useProfile()

  const segments = pathname.split('/').filter(Boolean)
  const currentKey = segments[0] || 'dashboard'
  const pageTitle = ROUTE_LABELS[currentKey] || 'Dashboard'

  // Consider protected only if there is an active device seen recently (e.g. last 5 mins)
  const isProtected = devices.some((d) => {
    if (!d.isActive) return false
    if (!d.lastSeenAt) return false
    const lastSeenTime = new Date(d.lastSeenAt).getTime()
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return lastSeenTime >= fiveMinutesAgo
  })

  return (
    <header className="h-[58px] border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* ── Left Side: Mobile Menu & Breadcrumbs ─────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-lg md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-sm font-medium">
          <Link
            href="/dashboard"
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline"
          >
            SecureGPT
          </Link>
          <ChevronRight size={14} className="text-[var(--text-muted)] hidden sm:inline" />
          <span className="font-bold text-[var(--text-primary)] tracking-tight">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* ── Right Side: Live Protection Badge & Theme Toggle ── */}
      <div className="flex items-center gap-3">
        {isProtected ? (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-tight shadow-sm"
            style={{
              background: 'var(--success-light)',
              borderColor: 'var(--success-border)',
              borderWidth: '1px',
              color: 'var(--success)',
            }}
          >
            <span
              className="size-2 rounded-full animate-pulse"
              style={{ background: 'var(--success)' }}
            />
            <span>Real-time DLP Guard Active</span>
          </div>
        ) : (
          <Link
            href="/get-started"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/15 transition-all"
          >
            <span className="size-2 rounded-full bg-amber-500" />
            <span>Extension Offline • Pair Browser</span>
          </Link>
        )}

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] border border-[var(--border)] transition-colors"
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-amber-400" />
          ) : (
            <Moon size={17} className="text-indigo-500" />
          )}
        </button>
      </div>
    </header>
  )
}

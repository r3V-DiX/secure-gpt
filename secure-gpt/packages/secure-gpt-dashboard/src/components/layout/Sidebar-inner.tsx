'use client'

import React, { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, FileText, ShieldCheck,
  User, Settings, LogOut, Users, Sparkles, ShieldAlert,
  PanelLeftClose, PanelLeft, X, Sun, Moon, Shield, History
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { Avatar } from '@/components/shared/Avatar'
import { VersionModal } from '@/components/shared/VersionModal'
import { useLogoutConfirm } from '@/components/ui/modal/modal'
import { useToast } from '@/contexts/toast-context'

export interface NavItemConfig {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  exact?: boolean
  adminOnly?: boolean
  badge?: string
}

export interface NavGroup {
  label: string
  items: NavItemConfig[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Get Started', href: '/get-started', icon: Sparkles, badge: 'Setup' },
    ],
  },
  {
    label: 'Security & Telemetry',
    items: [
      { label: 'Incidents Stream', href: '/incidents', icon: ShieldAlert },
      { label: 'Event Log', href: '/event-logs', icon: FileText },
    ],
  },
  {
    label: 'Governance & Admin',
    items: [
      { label: 'Policy Rules', href: '/policy', icon: ShieldCheck },
      { label: 'Team & Org', href: '/team', icon: Users, adminOnly: true },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: '/profile', icon: User },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

interface SidebarInnerProps {
  isMobile?: boolean
  collapsed: boolean
  expanded: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}

export function SidebarInner({
  isMobile = false,
  collapsed,
  expanded,
  onToggleCollapse,
  onNavigate,
}: SidebarInnerProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const confirmLogout = useLogoutConfirm()
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const [versionModalOpen, setVersionModalOpen] = useState(false)

  if (!user) return null

  const isPlatformAdmin = ['super_admin', 'security_admin', 'org_admin', 'admin'].includes(user.role)
  const isCompact = collapsed && !expanded && !isMobile

  async function handleLogout() {
    const confirmed = await confirmLogout()
    if (!confirmed) return
    try {
      await logout()
    } catch {
      toast.error('Failed to sign out. Please try again.')
    }
  }

  return (
    <div className="flex flex-col h-full select-none justify-between overflow-hidden">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div>
        <div className={clsx(
          'flex items-center h-[58px] border-b border-[var(--sidebar-border)] px-3.5 transition-all',
          isCompact ? 'justify-center px-2' : 'justify-between'
        )}>
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <div className="size-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-700/20" style={{ background: '#091a2a' }}>
              <img src="/rivedix_logo.png" alt="Rivedix Logo" className="w-full h-full object-contain p-0.5" />
            </div>

            {!isCompact && (
              <div className="min-w-0 flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold tracking-tight text-[var(--sidebar-text-active)] leading-none">
                    SecureGPT
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] leading-none">
                    DLP
                  </span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate leading-none">
                  Data Security Engine
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          {!isMobile && !isCompact && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-hover-bg)] transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && onNavigate && (
            <button
              type="button"
              onClick={onNavigate}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-hover-bg)] transition-colors"
              title="Close navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Collapsed rail expand trigger */}
        {isCompact && !isMobile && onToggleCollapse && (
          <div className="flex justify-center py-2 border-b border-[var(--sidebar-border)]">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-hover-bg)] transition-colors"
              title="Expand sidebar"
            >
              <PanelLeft size={16} />
            </button>
          </div>
        )}

        {/* ── Navigation Items ─────────────────────────────────── */}
        <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-175px)]">
          {NAV_GROUPS.map((group) => {
            const filteredItems = group.items.filter(item => !item.adminOnly || isPlatformAdmin)
            if (filteredItems.length === 0) return null

            return (
              <div key={group.label} className="space-y-1">
                {!isCompact && (
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--sidebar-group-label)] flex items-center justify-between">
                    <span>{group.label}</span>
                    {group.label === 'Overview' && (
                      <button
                        onClick={() => window.dispatchEvent(new Event('start-tour'))}
                        className="text-[10px] font-semibold text-[var(--sidebar-accent)] hover:underline capitalize"
                      >
                        Tour
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const active = item.exact
                      ? pathname === item.href
                      : (pathname === item.href || pathname.startsWith(item.href + '/'))

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        id={`tour-${item.href.replace('/', '')}`}
                        onClick={onNavigate}
                        title={isCompact ? item.label : undefined}
                        className={clsx(
                          'group flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13.5px] font-semibold transition-all duration-150 relative',
                          isCompact ? 'justify-center px-2' : '',
                          active
                            ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-accent)] shadow-sm'
                            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]'
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--sidebar-accent)] rounded-r-full" />
                        )}

                        <item.icon
                          size={18}
                          className={clsx(
                            'shrink-0 transition-colors',
                            active ? 'text-[var(--sidebar-accent)]' : 'text-[var(--sidebar-subtext)] group-hover:text-[var(--sidebar-text-active)]'
                          )}
                        />

                        {!isCompact && (
                          <span className="flex-1 truncate text-[var(--sidebar-text)] group-hover:text-[var(--sidebar-text-active)]">{item.label}</span>
                        )}

                        {!isCompact && item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border)]">
                            {item.badge}
                          </span>
                        )}

                        {!isCompact && active && !item.badge && (
                          <span className="size-1.5 rounded-full bg-[var(--sidebar-accent)] animate-pulse-dot" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      {/* ── Footer Deck (Theme, Profile & Logout) ─────────────── */}
      <div className="p-2 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] space-y-1">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={clsx(
            'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-[13px] font-medium text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-hover-bg)] transition-colors',
            isCompact ? 'justify-center px-2' : ''
          )}
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-amber-400 shrink-0" />
          ) : (
            <Moon size={17} className="text-indigo-500 shrink-0" />
          )}
          {!isCompact && (
            <span className="flex-1 text-left">{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          )}
        </button>

        {/* User profile & Logout */}
        <div className={clsx(
          'flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--sidebar-hover-bg)] transition-colors group',
          isCompact ? 'justify-center p-1' : 'justify-between'
        )}>
          <Link
            href="/profile"
            onClick={onNavigate}
            className={clsx(
              'flex items-center gap-2.5 min-w-0 flex-1',
              isCompact ? 'justify-center' : ''
            )}
            title={user.email}
          >
            <Avatar src={user.avatarUrl} name={user.fullName} email={user.email} size="sm" />
            {!isCompact && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-[13px] font-bold text-[var(--sidebar-text-active)] truncate leading-snug">
                  {user.fullName || 'User'}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={clsx(
                      'text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider',
                      user.role === 'super_admin' || user.role === 'platform_super_admin'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : user.role === 'org_admin' || user.role === 'security_admin'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : user.role === 'employee'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    )}
                  >
                    {user.role === 'super_admin' || user.role === 'platform_super_admin'
                      ? 'Super Admin'
                      : user.role === 'org_admin'
                      ? 'Org Admin'
                      : user.role === 'employee'
                      ? 'Employee'
                      : user.orgId
                      ? 'Organization'
                      : 'Personal User'}
                  </span>
                </div>
              </div>
            )}
          </Link>

          {!isCompact && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {/* Release Version Tag */}
        {!isCompact && (
          <button
            type="button"
            onClick={() => setVersionModalOpen(true)}
            className="w-full px-2 pt-1.5 pb-1 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono border-t border-[var(--sidebar-border)]/50 mt-1 hover:bg-[var(--sidebar-hover-bg)] rounded transition-colors group cursor-pointer"
            title="Click to check live system & component versions"
          >
            <span className="flex items-center gap-1 group-hover:text-[var(--sidebar-text-active)]">
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              v1.1.3
            </span>
            <span className="opacity-60 group-hover:opacity-100 group-hover:text-emerald-400 transition-opacity">
              Status ↗
            </span>
          </button>
        )}
      </div>

      <VersionModal
        open={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
      />
    </div>
  )
}

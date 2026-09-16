'use client'

import React, { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, FileText, ShieldCheck, Shield, Key,
  User, Settings, LogOut, Users, ClipboardList, Database,
  PanelLeftClose, PanelLeft, X, Sun, Moon
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { Avatar } from '@/components/shared/Avatar'
import { useLogoutConfirm } from '@/components/ui/modal/modal'
import { useToast } from '@/contexts/toast-context'
import { useSidebarStore } from '@/lib/api/client'
import { VersionModal } from '@/components/shared/VersionModal'

export interface NavItemConfig {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  exact?: boolean
  permission?: string
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
    ],
  },
  {
    label: 'Security & Logs',
    items: [
      { label: 'Event Logs', href: '/event-logs', icon: FileText },
      { label: 'Audit Logs', href: '/audit', icon: ClipboardList, permission: 'audit:view_all' },
      { label: 'System Logs', href: '/system-logs', icon: Database, permission: 'audit:view_all' },
    ],
  },
  {
    label: 'Access & Governance',
    items: [
      { label: 'Policy Rules', href: '/policy', icon: ShieldCheck },
      { label: 'Users', href: '/users', icon: Users, permission: 'user:view_all' },
      { label: 'Roles', href: '/roles', icon: Shield, permission: 'role:view' },
      { label: 'Permissions', href: '/permissions', icon: Key, permission: 'role:view' },
    ],
  },
  {
    label: 'Account & System',
    items: [
      { label: 'Profile', href: '/profile', icon: User },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  setMobileOpen?: (v: boolean) => void
}

export function Sidebar({ mobileOpen = false, setMobileOpen }: SidebarProps) {
  const { collapsed, toggle } = useSidebarStore()
  const [hovered, setHovered] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const confirmLogout = useLogoutConfirm()
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const [versionModalOpen, setVersionModalOpen] = useState(false)

  const handleMouseEnter = useCallback(() => {
    if (!collapsed) return
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setHovered(true)
  }, [collapsed])

  const handleMouseLeave = useCallback(() => {
    if (!collapsed) return
    hoverTimer.current = setTimeout(() => {
      setHovered(false)
    }, 140)
  }, [collapsed])

  if (!user) return null

  const isExpanded = !collapsed || hovered
  const isCompact = collapsed && !hovered

  async function handleLogout() {
    const confirmed = await confirmLogout()
    if (!confirmed) return
    try {
      await logout()
    } catch {
      toast.error('Failed to sign out. Please try again.')
    }
  }

  const renderInner = (isMobileView: boolean) => {
    const compactMode = isCompact && !isMobileView

    return (
      <div className="flex flex-col h-full select-none justify-between overflow-hidden">
        {/* Header */}
        <div>
          <div className={clsx(
            'flex items-center h-[58px] border-b border-[var(--sidebar-border)] px-3.5 transition-all',
            compactMode ? 'justify-center px-2' : 'justify-between'
          )}>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen?.(false)}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              <div className="size-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-700/20" style={{ background: '#091a2a' }}>
                <img src="/rivedix_logo.png" alt="Rivedix Logo" className="w-full h-full object-contain p-0.5" />
              </div>

              {!compactMode && (
                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold tracking-tight text-[var(--sidebar-text-active)] leading-none">
                      SecureGPT
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] leading-none">
                      ADMIN
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate leading-none">
                    Security Control Plane
                  </span>
                </div>
              )}
            </Link>

            {!isMobileView && !compactMode && (
              <button
                type="button"
                onClick={toggle}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-hover-bg)] transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            )}

            {isMobileView && setMobileOpen && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-hover-bg)] transition-colors"
                title="Close navigation"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {compactMode && (
            <div className="flex justify-center py-2 border-b border-[var(--sidebar-border)]">
              <button
                type="button"
                onClick={toggle}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-hover-bg)] transition-colors"
                title="Expand sidebar"
              >
                <PanelLeft size={16} />
              </button>
            </div>
          )}

          {/* Nav Items */}
          <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-175px)]">
            {NAV_GROUPS.map((group) => {
              const filteredItems = group.items.filter(({ permission }) => {
                if (!permission) return true
                if (user.role === 'super_admin' || user.role === 'security_admin') return true
                return user.permissions?.includes(permission)
              })

              if (filteredItems.length === 0) return null

              return (
                <div key={group.label} className="space-y-1">
                  {!compactMode && (
                    <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--sidebar-group-label)]">
                      {group.label}
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
                          onClick={() => setMobileOpen?.(false)}
                          title={compactMode ? item.label : undefined}
                          className={clsx(
                            'group flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13.5px] font-semibold transition-all duration-150 relative',
                            compactMode ? 'justify-center px-2' : '',
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

                          {!compactMode && (
                            <span className="flex-1 truncate text-[var(--sidebar-text)] group-hover:text-[var(--sidebar-text-active)]">
                              {item.label}
                            </span>
                          )}

                          {!compactMode && item.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border)]">
                              {item.badge}
                            </span>
                          )}

                          {!compactMode && active && !item.badge && (
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

        {/* Footer Deck */}
        <div className="p-2 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] space-y-1">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={clsx(
              'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-[13px] font-medium text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-hover-bg)] transition-colors',
              compactMode ? 'justify-center px-2' : ''
            )}
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-400 shrink-0" />
            ) : (
              <Moon size={17} className="text-indigo-500 shrink-0" />
            )}
            {!compactMode && (
              <span className="flex-1 text-left">{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            )}
          </button>

          <div className={clsx(
            'flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--sidebar-hover-bg)] transition-colors group',
            compactMode ? 'justify-center p-1' : 'justify-between'
          )}>
            <Link
              href="/profile"
              onClick={() => setMobileOpen?.(false)}
              className={clsx(
                'flex items-center gap-2.5 min-w-0 flex-1',
                compactMode ? 'justify-center' : ''
              )}
              title={user.email}
            >
              <Avatar src={user.avatarUrl} name={user.fullName} email={user.email} size="sm" />
              {!compactMode && (
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-[13px] font-bold text-[var(--sidebar-text-active)] truncate leading-snug">
                    {user.fullName || 'Admin User'}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={clsx(
                        'text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider',
                        user.role === 'super_admin'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : user.role === 'security_admin'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      )}
                    >
                      {user.role === 'super_admin'
                        ? 'Super Admin'
                        : user.role === 'security_admin'
                        ? 'Security Admin'
                        : 'Admin'}
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {!compactMode && (
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
          {!compactMode && (
            <button
              type="button"
              onClick={() => setVersionModalOpen(true)}
              className="w-full px-2 pt-1.5 pb-1 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono border-t border-[var(--sidebar-border)]/50 mt-1 hover:bg-[var(--sidebar-hover-bg)] rounded transition-colors group cursor-pointer"
              title="Click to check live admin system & component versions"
            >
              <span className="flex items-center gap-1 group-hover:text-[var(--sidebar-text-active)]">
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                v1.1.2
              </span>
              <span className="opacity-60 group-hover:opacity-100 group-hover:text-emerald-400 transition-opacity">
                Status ↗
              </span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`hidden md:block sh-sidebar-wrapper${collapsed ? ' sh-sidebar-wrapper--collapsed' : ''}${collapsed && hovered ? ' sh-sidebar-wrapper--hovered' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <aside
          className={`sh-sidebar${collapsed ? ' sh-sidebar--collapsed' : ''}${isExpanded ? ' sh-sidebar--expanded' : ''}`}
          aria-label="Primary navigation"
        >
          {renderInner(false)}
        </aside>
      </div>

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!mobileOpen}
        className={`sh-sidebar-mobile${mobileOpen ? ' sh-sidebar-mobile--open' : ''} md:hidden`}
      >
        {renderInner(true)}
      </aside>

      <VersionModal
        open={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
      />
    </>
  )
}

interface TopNavProps {
  onMenuClick: () => void
}

const ADMIN_ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Security Dashboard',
  'event-logs': 'Event Logs & Audit',
  policy: 'Policy Governance',
  users: 'User Management',
  roles: 'Role-Based Access Control',
  permissions: 'Permission Scopes',
  audit: 'Audit Logs',
  'system-logs': 'System & Engine Logs',
  profile: 'Administrator Profile',
  settings: 'Control Plane Settings',
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const segments = pathname.split('/').filter(Boolean)
  const currentKey = segments[0] || 'dashboard'
  const pageTitle = ADMIN_ROUTE_LABELS[currentKey] || 'Admin Console'

  return (
    <header className="h-[58px] border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-lg md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
          aria-label="Open sidebar"
        >
          <PanelLeft size={20} />
        </button>

        <div className="flex items-center gap-2 text-sm font-medium">
          <Link
            href="/dashboard"
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline"
          >
            SecureGPT Admin
          </Link>
          <span className="text-[var(--text-muted)] hidden sm:inline">/</span>
          <span className="font-bold text-[var(--text-primary)] tracking-tight">
            {pageTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Admin Control Plane Online</span>
        </div>

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
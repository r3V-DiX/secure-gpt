'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { PanelLeftClose, PanelLeft, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { useSystemVersion } from '@/contexts/system-version-context'
import { VersionModal } from '@/components/shared/VersionModal'
import { useLogoutConfirm } from '@/components/ui/modal/modal'
import { useToast } from '@/contexts/toast-context'
import { STANDARD_NAV_GROUPS, SUPER_ADMIN_NAV_GROUPS } from './sidebar.config'
import { SidebarFooter } from './SidebarFooter'

export * from './sidebar.config'

const IS_ADMIN_MODE = process.env.NEXT_PUBLIC_APP_MODE === 'admin'

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
  const { currentVersion } = useSystemVersion()
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
                <span className="text-[11px] font-semibold text-[var(--sidebar-subtext)] mt-0.5 truncate leading-none">
                  Data Security Engine
                </span>
              </div>
            )}
          </Link>

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

        <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-175px)]">
          {(IS_ADMIN_MODE || user?.role === 'super_admin' ? SUPER_ADMIN_NAV_GROUPS : STANDARD_NAV_GROUPS).map((group) => {
            const filteredItems = group.items.filter((item) => {
              if (item.superAdminOnly && user.role !== 'super_admin' && user.role !== 'platform_super_admin') return false
              if (item.adminOnly && !isPlatformAdmin) return false
              return true
            })
            if (filteredItems.length === 0) return null

            return (
              <div key={group.label} className="space-y-1">
                {!isCompact && (
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--sidebar-group-label)] flex items-center justify-between">
                    <span>{group.label}</span>
                    {group.label === 'Overview' && (
                      <button
                        onClick={() => window.dispatchEvent(new Event('start-tour'))}
                        className="text-[11px] font-semibold text-[var(--sidebar-accent)] hover:underline capitalize cursor-pointer"
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
                          'group flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 relative',
                          isCompact ? 'justify-center px-2' : '',
                          active
                            ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-accent)] font-semibold shadow-xs'
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
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border)]">
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

      <SidebarFooter
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        isCompact={isCompact}
        onNavigate={onNavigate}
        handleLogout={handleLogout}
        currentVersion={currentVersion}
        setVersionModalOpen={setVersionModalOpen}
      />

      <VersionModal
        open={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
      />
    </div>
  )
}

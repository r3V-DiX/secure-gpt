'use client'

import { IconButton } from '@/components/ui'
import { Button } from '@/components/ui'
import React from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Sun, Moon, LogOut } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'

interface SidebarFooterProps {
  user: any
  theme: string
  toggleTheme: () => void
  isCompact: boolean
  onNavigate?: () => void
  handleLogout: () => Promise<void>
  currentVersion: string
  setVersionModalOpen: (open: boolean) => void
}

export function SidebarFooter({
  user,
  theme,
  toggleTheme,
  isCompact,
  onNavigate,
  handleLogout,
  currentVersion,
  setVersionModalOpen,
}: SidebarFooterProps) {
  return (
    <div className="p-2 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] space-y-1">
      {/* Theme Toggle Button */}
      <Button variant="ghost" type="button"
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
      </Button>

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
              <span className="text-[13px] font-semibold text-[var(--sidebar-text-active)] truncate leading-snug">
                {user.fullName || 'User'}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={clsx(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border uppercase tracking-wider',
                    user.role === 'super_admin' || user.role === 'platform_super_admin'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30'
                      : user.role === 'org_admin' || user.role === 'security_admin'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30'
                      : user.role === 'employee'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
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
          <IconButton aria-label="Sign out" variant="danger" type="button"
            onClick={handleLogout}

            title="Sign out"
          >
            <LogOut size={16} />
          </IconButton>
        )}
      </div>

      {/* Release Version Tag */}
      {!isCompact && (
        <Button variant="secondary"
          type="button"
          onClick={() => setVersionModalOpen(true)}
          className="w-full font-mono mt-1"
          title="Click to check live system & component versions"
        >
          <span className="flex items-center gap-1 group-hover:text-[var(--sidebar-text-active)]">
            <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            v{currentVersion}
          </span>
          <span className="opacity-75 group-hover:opacity-100 group-hover:text-emerald-400 transition-opacity font-semibold">
            Status ↗
          </span>
        </Button>
      )}
    </div>
  )
}

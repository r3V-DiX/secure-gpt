'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/security-admin/dashboard', icon: '📊' },
  { label: 'Event Log', href: '/security-admin/event-log', icon: '📋' },
  { label: 'Users', href: '/security-admin/users', icon: '👥' },
  { label: 'High-Risk Alerts', href: '/security-admin/alerts', icon: '🚨' },
  { label: 'Policy Manager', href: '/security-admin/policy', icon: '⚙️' },
  { label: 'Devices', href: '/security-admin/devices', icon: '💻' },
  { label: 'Reports', href: '/security-admin/reports', icon: '📄' },
]

export default function SecurityAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-200 flex-shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-tight">SecureGPT</p>
              <p className="text-xs text-gray-400 leading-tight">Admin Console</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            {sidebarOpen ? '◂' : '▸'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-100',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                )}
              >
                <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        {user && (
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.role}</p>
                </div>
              )}
              {sidebarOpen && (
                <button
                  onClick={signOut}
                  className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
                  title="Sign out"
                >
                  ↗
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}

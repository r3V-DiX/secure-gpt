'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { clsx } from 'clsx'

const NAV = [
  { label: 'My Dashboard', href: '/user/dashboard', icon: '📊' },
  { label: 'My Activity', href: '/user/logs', icon: '📋' },
  { label: 'Settings', href: '/user/settings', icon: '⚙️' },
  { label: 'Profile', href: '/user/profile', icon: '👤' },
]

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 shadow-sm flex flex-col">
        <div className="h-16 flex items-center px-4 gap-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">SecureGPT</p>
            <p className="text-xs text-gray-400 leading-tight">My Account</p>
          </div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-100',
                pathname.startsWith(item.href) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              )}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">{user.name?.[0]?.toUpperCase()}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-600" title="Sign out">↗</button>
            </div>
          </div>
        )}
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">{children}</div>
      </main>
    </div>
  )
}

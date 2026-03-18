'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { clsx } from 'clsx'

const NAV = [
  { label: 'Platform Dashboard', href: '/super-admin/dashboard', icon: '🌐' },
  { label: 'Organisations', href: '/super-admin/organisations', icon: '🏢' },
  { label: 'All Users', href: '/super-admin/users', icon: '👥' },
  { label: 'Billing', href: '/super-admin/billing', icon: '💳' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 flex-shrink-0 bg-gray-900 flex flex-col">
        <div className="h-16 flex items-center px-5 gap-3 border-b border-gray-700">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm leading-tight">SecureGPT</p>
            <p className="text-xs text-gray-400 leading-tight">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-100',
                pathname.startsWith(item.href)
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="p-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
              <button onClick={signOut} className="text-xs text-gray-400 hover:text-white">↗</button>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">{children}</div>
      </main>
    </div>
  )
}

'use client'
// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, FileText, ShieldCheck,
  User, Settings, LogOut, Users, ClipboardList, Sparkles
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Avatar } from '@/components/shared/Avatar'
import { useLogoutConfirm } from '@/components/ui/modal/modal'
import { useToast } from '@/contexts/toast-context'

const NAV = [
  { label: 'Get Started', href: '/get-started', icon: Sparkles },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Event Log', href: '/event-logs', icon: FileText },
  { label: 'Policy', href: '/policy', icon: ShieldCheck },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const confirmLogout = useLogoutConfirm()
  const { toast } = useToast()

  if (!user) return null

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
    <aside className="sidebar w-56 h-screen flex flex-col px-3 py-4 sticky top-0 shrink-0 z-30 overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 pb-5 mb-2 border-b border-[var(--sidebar-border)]">
        <div className="size-8 rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0" style={{ background: '#091a2a' }}>
          <img src="/rivedix_logo.png" alt="Rivedix Logo" className="w-full h-full object-contain p-0.5" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-white leading-none">SecureGPT</span>
          <p className="text-[10px] text-white/30 mt-0.5 leading-none">DLP Dashboard</p>
        </div>
      </div>

      {/* Nav label */}
      <div className="flex items-center justify-between px-2 mb-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
          Navigation
        </p>
        <button 
          onClick={() => window.dispatchEvent(new Event('start-tour'))} 
          className="text-[10px] font-semibold text-[var(--sidebar-accent)] hover:text-white transition-colors"
          title="Start interactive tour"
        >
          Tour
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ label, href, icon: Icon }, idx) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              id={`tour-${href.replace('/', '')}`}
              style={{ animationDelay: `${idx * 40}ms` }}
              className={clsx(
                'animate-slide-in group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 relative',
                active
                  ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text-active)] shadow-[0_4px_12px_rgba(129,140,248,0.15)] border border-white/5'
                  : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)] hover:translate-x-1',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-[var(--sidebar-accent)] to-indigo-400 rounded-r-md shadow-[0_0_8px_var(--sidebar-accent)]" />
              )}
              <Icon
                size={14}
                className={clsx(
                  'shrink-0 transition-colors',
                  active ? 'text-[var(--sidebar-accent)]' : 'text-white/30 group-hover:text-white/60',
                )}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <span className="size-1.5 rounded-full bg-[var(--sidebar-accent)] animate-pulse-dot" />
              )}
            </Link>
          )
        })}
      </nav>


      {/* Bottom section */}
      <div className="pt-3 mt-2 border-t border-[var(--sidebar-border)] space-y-1">
        {/* User row — click anywhere to sign out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-red-500/10 transition-colors group cursor-pointer"
        >
          <Avatar src={user.avatarUrl} name={user.fullName} email={user.email} size="sm" />
          <div className="flex flex-col min-w-0 flex-1 text-left">
            <span className="text-[12px] font-semibold text-white/80 truncate group-hover:text-white transition-colors">
              {user.fullName ?? 'User'}
            </span>
            <span className="text-[10px] text-white/30 truncate">{user.email}</span>
          </div>
          <LogOut size={11} className="text-white/25 group-hover:text-red-400 transition-colors shrink-0" />
        </button>
      </div>
    </aside>
  )
}
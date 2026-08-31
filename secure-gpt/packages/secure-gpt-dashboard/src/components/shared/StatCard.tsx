import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Accent = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: Accent
  icon?: React.ReactNode
  loading?: boolean
  trend?: number
  trendLabel?: string
  href?: string
}

const accentTokens: Record<Accent, { icon: string; value: string; bg: string; border: string; glow: string; iconBg: string }> = {
  indigo: {
    icon: 'text-indigo-600 dark:text-indigo-400',
    value: 'text-indigo-700 dark:text-indigo-300',
    bg: 'from-indigo-50/70 to-white dark:from-indigo-950/30 dark:to-transparent',
    border: 'border-indigo-200/80 dark:border-indigo-500/20',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.12)] hover:border-indigo-400 dark:hover:border-indigo-500/40',
    iconBg: 'bg-indigo-100/80 dark:bg-indigo-500/15',
  },
  blue: {
    icon: 'text-sky-600 dark:text-sky-400',
    value: 'text-sky-700 dark:text-sky-300',
    bg: 'from-sky-50/70 to-white dark:from-sky-950/30 dark:to-transparent',
    border: 'border-sky-200/80 dark:border-sky-500/20',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(14,165,233,0.12)] hover:border-sky-400 dark:hover:border-sky-500/40',
    iconBg: 'bg-sky-100/80 dark:bg-sky-500/15',
  },
  green: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
    bg: 'from-emerald-50/70 to-white dark:from-emerald-950/30 dark:to-transparent',
    border: 'border-emerald-200/80 dark:border-emerald-500/20',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.12)] hover:border-emerald-400 dark:hover:border-emerald-500/40',
    iconBg: 'bg-emerald-100/80 dark:bg-emerald-500/15',
  },
  amber: {
    icon: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
    bg: 'from-amber-50/70 to-white dark:from-amber-950/30 dark:to-transparent',
    border: 'border-amber-200/80 dark:border-amber-500/20',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.12)] hover:border-amber-400 dark:hover:border-amber-500/40',
    iconBg: 'bg-amber-100/80 dark:bg-amber-500/15',
  },
  red: {
    icon: 'text-rose-600 dark:text-rose-400',
    value: 'text-rose-700 dark:text-rose-300',
    bg: 'from-rose-50/70 to-white dark:from-rose-950/30 dark:to-transparent',
    border: 'border-rose-200/80 dark:border-rose-500/20',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(239,68,68,0.12)] hover:border-rose-400 dark:hover:border-rose-500/40',
    iconBg: 'bg-rose-100/80 dark:bg-rose-500/15',
  },
  purple: {
    icon: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
    bg: 'from-purple-50/70 to-white dark:from-purple-950/30 dark:to-transparent',
    border: 'border-purple-200/80 dark:border-purple-500/20',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(139,92,246,0.12)] hover:border-purple-400 dark:hover:border-purple-500/40',
    iconBg: 'bg-purple-100/80 dark:bg-purple-500/15',
  },
}

export function StatCard({ label, value, sub, accent = 'indigo', icon, loading, trend, trendLabel, href }: StatCardProps) {
  if (loading) {
    return (
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton size-8 rounded-lg" />
        </div>
        <div className="skeleton h-8 w-24 rounded" />
        <div className="skeleton h-3 w-28 rounded" />
      </div>
    )
  }

  const tokens = accentTokens[accent]
  const hasTrend = trend !== undefined

  const content = (
    <div className={`card p-5 flex flex-col gap-3 bg-gradient-to-br ${tokens.bg} border ${tokens.border} ${tokens.glow} transition-all duration-300 group ${href ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}>
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </span>
        {icon && (
          <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${tokens.iconBg} ${tokens.border} ${tokens.icon}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`text-[32px] font-extrabold tracking-tight leading-none transition-transform duration-200 group-hover:scale-[1.01] ${tokens.value}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* Sub row */}
      <div className="flex items-center justify-between gap-2">
        {sub && (
          <span className="text-[12.5px] font-medium text-[var(--text-tertiary)]">
            {sub}
          </span>
        )}
        {hasTrend && (
          <div className={`flex items-center gap-1 text-[12px] font-bold ${
            trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {trend >= 0
              ? <TrendingUp size={13} />
              : <TrendingDown size={13} />
            }
            {Math.abs(trend)}% {trendLabel ?? ''}
          </div>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

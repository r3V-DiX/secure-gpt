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
    icon: 'text-indigo-500 dark:text-indigo-400',
    value: 'text-indigo-600 dark:text-indigo-400',
    bg: 'from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-transparent',
    border: 'border-indigo-100/80 dark:border-indigo-500/15',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.12)] hover:border-indigo-300 dark:hover:border-indigo-500/40',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
  },
  blue: {
    icon: 'text-sky-500 dark:text-sky-400',
    value: 'text-sky-600 dark:text-sky-400',
    bg: 'from-sky-50/50 to-white dark:from-sky-950/20 dark:to-transparent',
    border: 'border-sky-100/80 dark:border-sky-500/15',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(14,165,233,0.12)] hover:border-sky-300 dark:hover:border-sky-500/40',
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
  },
  green: {
    icon: 'text-emerald-500 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
    bg: 'from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-transparent',
    border: 'border-emerald-100/80 dark:border-emerald-500/15',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.12)] hover:border-emerald-300 dark:hover:border-emerald-500/40',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  amber: {
    icon: 'text-amber-500 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
    bg: 'from-amber-50/50 to-white dark:from-amber-950/20 dark:to-transparent',
    border: 'border-amber-100/80 dark:border-amber-500/15',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.12)] hover:border-amber-300 dark:hover:border-amber-500/40',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  red: {
    icon: 'text-red-500 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
    bg: 'from-red-50/50 to-white dark:from-red-950/20 dark:to-transparent',
    border: 'border-red-100/80 dark:border-red-500/15',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(239,68,68,0.12)] hover:border-red-300 dark:hover:border-red-500/40',
    iconBg: 'bg-red-50 dark:bg-red-500/10',
  },
  purple: {
    icon: 'text-violet-500 dark:text-violet-400',
    value: 'text-violet-600 dark:text-violet-400',
    bg: 'from-violet-50/50 to-white dark:from-violet-950/20 dark:to-transparent',
    border: 'border-violet-100/80 dark:border-violet-500/15',
    glow: 'hover:shadow-[0_8px_30px_-4px_rgba(139,92,246,0.12)] hover:border-violet-300 dark:hover:border-violet-500/40',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
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
        <span className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </span>
        {icon && (
          <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${tokens.iconBg} ${tokens.border} ${tokens.icon}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`text-[28px] font-bold tracking-tight leading-none transition-transform duration-200 group-hover:scale-[1.01] ${tokens.value}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* Sub row */}
      <div className="flex items-center justify-between gap-2">
        {sub && (
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {sub}
          </span>
        )}
        {hasTrend && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold ${trend >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
            }`}>
            {trend >= 0
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />
            }
            {Math.abs(trend)}% {trendLabel ?? ''}
          </div>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
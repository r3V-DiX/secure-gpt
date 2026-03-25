// src/components/shared/StatCard.tsx
import { TrendingUp, TrendingDown } from 'lucide-react'

type Accent = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: Accent
  icon?: React.ReactNode
  loading?: boolean
  trend?: number        // positive = up, negative = down, undefined = no trend
  trendLabel?: string
}

const accentTokens: Record<Accent, { icon: string; value: string; bg: string; border: string }> = {
  indigo: {
    icon: 'text-indigo-500 dark:text-indigo-400',
    value: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    border: 'border-indigo-100 dark:border-indigo-500/20',
  },
  blue: {
    icon: 'text-sky-500 dark:text-sky-400',
    value: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    border: 'border-sky-100 dark:border-sky-500/20',
  },
  green: {
    icon: 'text-emerald-500 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-100 dark:border-emerald-500/20',
  },
  amber: {
    icon: 'text-amber-500 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-100 dark:border-amber-500/20',
  },
  red: {
    icon: 'text-red-500 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-100 dark:border-red-500/20',
  },
  purple: {
    icon: 'text-violet-500 dark:text-violet-400',
    value: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-100 dark:border-violet-500/20',
  },
}

export function StatCard({ label, value, sub, accent = 'indigo', icon, loading, trend, trendLabel }: StatCardProps) {
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

  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 group cursor-default">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </span>
        {icon && (
          <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${tokens.bg} ${tokens.border} ${tokens.icon}`}>
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
}
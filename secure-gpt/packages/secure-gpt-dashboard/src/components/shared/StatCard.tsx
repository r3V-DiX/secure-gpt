import { Card } from '@/components/ui'
import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Accent = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo'

interface StatCardProps {
  footer?: React.ReactNode
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

const accentTokens: Record<Accent, { icon: string; border: string; iconBg: string }> = {
  indigo: {
    icon: 'text-[var(--accent)]',
    border: 'border-[var(--border)] hover:border-[var(--accent-border)]',
    iconBg: 'bg-[var(--accent-light)] text-[var(--accent-text)] border-[var(--accent-border)]',
  },
  blue: {
    icon: 'text-[var(--info)]',
    border: 'border-[var(--border)] hover:border-[var(--info-border)]',
    iconBg: 'bg-[var(--info-light)] text-[var(--info)] border-[var(--info-border)]',
  },
  green: {
    icon: 'text-[var(--success)]',
    border: 'border-[var(--border)] hover:border-[var(--success-border)]',
    iconBg: 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success-border)]',
  },
  amber: {
    icon: 'text-[var(--warning)]',
    border: 'border-[var(--border)] hover:border-[var(--warning-border)]',
    iconBg: 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning-border)]',
  },
  red: {
    icon: 'text-[var(--danger)]',
    border: 'border-[var(--border)] hover:border-[var(--danger-border)]',
    iconBg: 'bg-[var(--danger-light)] text-[var(--danger)] border-[var(--danger-border)]',
  },
  purple: {
    icon: 'text-[var(--violet)]',
    border: 'border-[var(--border)] hover:border-[var(--border-strong)]',
    iconBg: 'bg-[var(--violet-light)] text-[var(--violet)] border-[var(--border-2)]',
  },
}

export function StatCard({ label, value, sub, accent = 'indigo', icon, loading, trend, trendLabel, href, footer }: StatCardProps) {
  if (loading) {
    return (
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton size-8 rounded-lg" />
        </div>
        <div className="skeleton h-8 w-24 rounded" />
        <div className="skeleton h-3 w-28 rounded" />
      </Card>
    )
  }

  const tokens = accentTokens[accent]
  const hasTrend = trend !== undefined
  const displayValue = (value !== undefined && value !== null) ? (typeof value === 'number' ? value.toLocaleString() : value) : '0'

  const content = (
    <div className={`card p-4 flex flex-col gap-2.5 bg-[var(--bg-surface)] border ${tokens.border} transition-colors group ${href ? 'cursor-pointer hover:bg-[var(--bg-surface-2)]' : 'cursor-default'}`}>
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </span>
        {icon && (
          <div className={`size-7 rounded-md flex items-center justify-center shrink-0 border ${tokens.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div
        className="text-[26px] font-bold tracking-tight leading-none text-[var(--text-primary)]"
      >
        {displayValue}
      </div>

      {footer}

      {/* Sub row */}
      <div className="flex items-center justify-between gap-2">
        {sub && (
          <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
            {sub}
          </span>
        )}
        {hasTrend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold ${
            trend >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
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

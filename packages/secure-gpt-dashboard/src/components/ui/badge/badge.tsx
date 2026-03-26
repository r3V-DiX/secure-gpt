// src/components/ui/badge/badge.tsx
import { clsx } from 'clsx'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  dot?: boolean
  className?: string
}

// Uses CSS variables so both themes look great
const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border-2)]',
  success: 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success-border)]',
  warning: 'bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning-border)]',
  danger: 'bg-[var(--danger-light)]  text-[var(--danger)]  border border-[var(--danger-border)]',
  info: 'bg-[var(--info-light)]    text-[var(--info)]    border border-[var(--info-border)]',
  purple: 'bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
  neutral: 'bg-[var(--bg-surface-3)] text-[var(--text-tertiary)] border border-[var(--border)]',
}

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-tertiary)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger: 'bg-[var(--danger)]',
  info: 'bg-[var(--info)]',
  purple: 'bg-violet-500',
  neutral: 'bg-[var(--text-tertiary)]',
}

export function Badge({ variant = 'default', children, dot, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
      variantClasses[variant],
      className,
    )}>
      {dot && <span className={clsx('size-1.5 rounded-full shrink-0', dotClasses[variant])} />}
      {children}
    </span>
  )
}

export function actionVariant(action: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    BLOCK: 'danger', MASK: 'warning', WARN_ALLOW: 'info', ALLOW: 'success',
  }
  return map[action] ?? 'neutral'
}

export function severityVariant(sev: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    CRITICAL: 'danger', HIGH: 'warning', MEDIUM: 'info', LOW: 'success',
  }
  return map[sev] ?? 'neutral'
}
// ─────────────────────────────────────────────
// Badge Component
// ─────────────────────────────────────────────

import React from 'react'
import { cn } from '@/lib/cn'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | undefined
  children: React.ReactNode
  dot?: boolean | undefined
  className?: string | undefined
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border-2)]',
  success: 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success-border)]',
  warning: 'bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning-border)]',
  danger:  'bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]',
  info:    'bg-[var(--info-light)] text-[var(--info)] border border-[var(--info-border)]',
  purple:  'bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
  neutral: 'bg-[var(--bg-surface-3)] text-[var(--text-tertiary)] border border-[var(--border)]',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-tertiary)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger:  'bg-[var(--danger)]',
  info:    'bg-[var(--info)]',
  purple:  'bg-violet-500',
  neutral: 'bg-[var(--text-tertiary)]',
}

export function Badge({ variant = 'default', children, dot, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('size-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}

export function actionVariant(action: string): BadgeVariant {
  const normalized = action?.toUpperCase()
  const map: Record<string, BadgeVariant> = {
    BLOCK: 'danger',
    BLOCKED: 'danger',
    MASK: 'warning',
    MASKED: 'warning',
    WARN: 'info',
    WARNED: 'info',
    WARN_ALLOW: 'info',
    ALLOW: 'success',
    ALLOWED: 'success',
  }
  return map[normalized] ?? 'neutral'
}

export function ActionBadge({ action, className }: { action: string; className?: string | undefined }) {
  return (
    <Badge variant={actionVariant(action)} {...(className ? { className } : {})}>
      {action}
    </Badge>
  )
}

// ─────────────────────────────────────────────
// Card Component
// ─────────────────────────────────────────────

import React from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'none'
  border?: boolean
  hover?: boolean
  interactive?: boolean
}

const paddingMap = { sm: 'p-3', md: 'p-4', lg: 'p-6', none: '' }

export function Card({
  children,
  className,
  padding = 'md',
  border = true,
  hover,
  interactive,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-md transition-colors',
        border && 'border border-[var(--border)]',
        paddingMap[padding],
        (hover || interactive) && 'hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-2)] cursor-pointer transition-all duration-120',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between pb-3 border-b border-[var(--border)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-xs sm:text-sm font-bold text-[var(--text-primary)]',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-3', className)} {...props}>
      {children}
    </div>
  )
}

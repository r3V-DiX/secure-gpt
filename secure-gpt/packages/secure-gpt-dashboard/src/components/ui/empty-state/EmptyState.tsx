import React, { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  icon?: LucideIcon | ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: IconOrNode,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const isLucideIcon = typeof IconOrNode === 'function'

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed ${className}`}
      style={{
        background: 'var(--bg-surface-2)',
        borderColor: 'var(--border-2)',
      }}
    >
      {IconOrNode && (
        <div
          className="size-12 rounded-2xl flex items-center justify-center mb-3.5 shadow-sm"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-tertiary)',
          }}
        >
          {isLucideIcon ? <IconOrNode size={22} /> : IconOrNode}
        </div>
      )}

      <h3
        className="text-sm font-bold tracking-tight mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-xs max-w-sm leading-relaxed mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
      )}

      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

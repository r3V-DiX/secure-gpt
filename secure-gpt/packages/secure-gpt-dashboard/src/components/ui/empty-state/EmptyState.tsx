import React, { isValidElement, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  compact?: boolean
  icon?: LucideIcon | ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  compact = false,
  icon: IconOrNode,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const isLucideIcon = typeof IconOrNode === 'function' || (typeof IconOrNode === 'object' && IconOrNode !== null && '$$typeof' in IconOrNode)

  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl ${compact ? 'py-6 gap-2' : 'p-8 border border-dashed'} ${className}`}
      style={{
        background: compact ? 'transparent' : 'var(--bg-surface-2)',
        borderColor: 'var(--border-2)',
      }}
    >
      {IconOrNode && (
        <div
          className="size-12 rounded-md flex items-center justify-center mb-3.5 shadow-sm"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-tertiary)',
          }}
        >
          {isValidElement(IconOrNode) ? IconOrNode : isLucideIcon ? React.createElement(IconOrNode as LucideIcon, { size: 22 }) : IconOrNode}
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

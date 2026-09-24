// ─────────────────────────────────────────────
// StatusIndicator
// Shows Active / Paused / Disabled state
// ─────────────────────────────────────────────

import { cn } from '@/lib/cn'
import { Badge } from '../ui/badge/badge'

type Status = 'active' | 'paused' | 'disabled'

interface StatusIndicatorProps {
  status: Status
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig: Record<Status, { label: string; variant: 'success' | 'warning' | 'neutral'; pulse: boolean }> = {
  active: { label: 'Active', variant: 'success', pulse: true },
  paused: { label: 'Paused', variant: 'warning', pulse: false },
  disabled: { label: 'Disabled', variant: 'neutral', pulse: false },
}

export function StatusIndicator({ status, showLabel = true, size = 'md', className }: StatusIndicatorProps) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant} className={cn(size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : '', className)}>
      <span
        className={cn(
          'size-1.5 rounded-full shrink-0',
          status === 'active' && 'bg-[var(--success)] animate-[pulse-dot_2s_ease-in-out_infinite]',
          status === 'paused' && 'bg-[var(--warning)]',
          status === 'disabled' && 'bg-[var(--text-tertiary)]',
        )}
      />
      {showLabel && config.label}
    </Badge>
  )
}

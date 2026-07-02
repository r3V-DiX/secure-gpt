// ─────────────────────────────────────────────
// StatusIndicator
// Shows Active / Paused / Disabled state
// ─────────────────────────────────────────────

import { clsx } from 'clsx'
import { Badge } from '../ui/badge/badge'

type Status = 'active' | 'paused' | 'disabled'

interface StatusIndicatorProps {
  status: Status
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const statusConfig: Record<Status, { label: string; variant: 'success' | 'warning' | 'neutral'; pulse: boolean }> = {
  active: { label: 'Active', variant: 'success', pulse: true },
  paused: { label: 'Paused', variant: 'warning', pulse: false },
  disabled: { label: 'Disabled', variant: 'neutral', pulse: false },
}

export function StatusIndicator({ status, showLabel = true, size = 'md' }: StatusIndicatorProps) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant} className={size === 'sm' ? 'text-xs' : ''}>
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          status === 'active' && 'bg-green-500 animate-[pulse-dot_2s_ease-in-out_infinite]',
          status === 'paused' && 'bg-amber-500',
          status === 'disabled' && 'bg-gray-400',
        )}
      />
      {showLabel && config.label}
    </Badge>
  )
}

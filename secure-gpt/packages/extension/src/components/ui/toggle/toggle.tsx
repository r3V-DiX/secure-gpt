// ─────────────────────────────────────────────
// Toggle Component
// ─────────────────────────────────────────────

import { cn } from '@/lib/cn'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  label?: string
}

export function Toggle({ checked, onChange, disabled, size = 'md', label }: ToggleProps) {
  const trackSize = size === 'sm' ? 'w-8 h-4' : 'w-10 h-5'
  const thumbSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
  const thumbTranslate = size === 'sm'
    ? (checked ? 'translate-x-4' : 'translate-x-0.5')
    : (checked ? 'translate-x-5' : 'translate-x-0.5')

  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none cursor-pointer disabled:cursor-not-allowed',
          trackSize,
          checked ? 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]' : 'bg-[var(--bg-surface-3)] border border-[var(--border)]'
        )}
      >
        <span
          className={cn(
            'absolute inline-block rounded-full bg-white shadow-xs transition-transform duration-200',
            thumbSize,
            thumbTranslate
          )}
        />
      </button>
      {label && <span className="text-xs text-[var(--text-secondary)] font-medium">{label}</span>}
    </label>
  )
}

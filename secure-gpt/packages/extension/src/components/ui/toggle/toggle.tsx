// ─────────────────────────────────────────────
// Toggle Component
// ─────────────────────────────────────────────

import { clsx } from 'clsx'

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
    <label className={clsx('inline-flex items-center gap-2 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex items-center rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          trackSize,
          checked ? 'bg-blue-600' : 'bg-gray-200'
        )}
      >
        <span
          className={clsx(
            'absolute inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
            thumbSize,
            thumbTranslate
          )}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}

'use client'
import { useId, type ReactNode } from 'react'
import { cn } from '../button/button'

export function RadioGroup<T extends string>({ label, value, onValueChange, options, disabled }: {
  label: string; value: T; onValueChange: (value: T) => void; disabled?: boolean
  options: { value: T; label: string; icon?: ReactNode }[]
}) {
  const name = useId()
  return <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] p-1">
    {options.map(option => <label key={option.value} className="relative flex-1">
      <input type="radio" name={name} value={option.value} checked={value === option.value}
        disabled={disabled} onChange={() => onValueChange(option.value)} className="peer sr-only" />
      <span className={cn('flex min-h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-disabled:cursor-not-allowed peer-disabled:opacity-50', value === option.value ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]')}>
        {option.icon}{option.label}
      </span>
    </label>)}
  </div>
}

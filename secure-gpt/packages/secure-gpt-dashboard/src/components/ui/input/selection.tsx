"use client"
import React, { useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '../button/button'

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { indeterminate?: boolean }
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ indeterminate = false, className, ...props }, ref) {
  const input = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => input.current!, [])
  useEffect(() => { if (input.current) input.current.indeterminate = indeterminate }, [indeterminate])
  return <input {...props} ref={input} type="checkbox" aria-checked={indeterminate ? 'mixed' : props.checked}
    className={cn('size-4 shrink-0 rounded border-[var(--border-2)] accent-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed', className)} />
})
type SwitchProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked: boolean; onCheckedChange: (checked: boolean) => void
}
export function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
  return <button {...props} type="button" role="switch" aria-checked={checked} disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={cn('relative h-6 w-10 shrink-0 rounded-full border border-[var(--border-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed', checked ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface-3)]', className)}>
    <span className={cn('absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform', checked && 'translate-x-4')} />
  </button>
}

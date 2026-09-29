"use client"
import React, { useId } from 'react'
import { cn } from '../button/button'

export type ControlSize = 'sm' | 'md' | 'lg'
export const controlClasses = 'w-full rounded-lg border bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border-[var(--border-2)] hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-surface-2)] transition-colors'
const sizes = { sm: 'h-7 px-2.5', md: 'h-8 px-2.5', lg: 'h-9 px-3' }
interface FieldProps { error?: string; wrapperClassName?: string; controlSize?: ControlSize }
function describedBy(existing: string | undefined, errorId: string | undefined) {
  return [existing, errorId].filter(Boolean).join(' ') || undefined
}
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FieldProps { icon?: React.ReactNode }
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, wrapperClassName, error, icon, controlSize = 'md', ...props }, ref,
) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  return <div className={cn('relative w-full', wrapperClassName)}>
    <div className="relative">
      {icon && <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)] size-4">{icon}</span>}
      <input {...props} ref={ref} aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={describedBy(props['aria-describedby'], errorId)}
        className={cn(controlClasses, sizes[controlSize], icon && 'pl-9', error && 'border-[var(--danger)]', className)} />
    </div>
    {error && <p id={errorId} className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
  </div>
})
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, wrapperClassName, error, controlSize = 'md', children, ...props }, ref,
) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  return <div className={cn('relative w-full', wrapperClassName)}>
    <select {...props} ref={ref} aria-invalid={error ? true : props['aria-invalid']}
      aria-describedby={describedBy(props['aria-describedby'], errorId)}
      className={cn(controlClasses, sizes[controlSize], 'cursor-pointer', error && 'border-[var(--danger)]', className)}>{children}</select>
    {error && <p id={errorId} className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
  </div>
})
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, Omit<FieldProps, 'controlSize'> {}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, wrapperClassName, error, ...props }, ref,
) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  return <div className={cn('w-full', wrapperClassName)}>
    <textarea {...props} ref={ref} aria-invalid={error ? true : props['aria-invalid']}
      aria-describedby={describedBy(props['aria-describedby'], errorId)}
      className={cn(controlClasses, 'min-h-24 px-3 py-2', error && 'border-[var(--danger)]', className)} />
    {error && <p id={errorId} className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
  </div>
})

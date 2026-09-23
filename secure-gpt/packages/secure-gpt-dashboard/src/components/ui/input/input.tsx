import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] flex items-center justify-center pointer-events-none size-4">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-8 px-2.5 text-xs rounded-md border transition-all duration-120',
            'bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'border-[var(--border-2)] hover:border-[var(--border-strong)]',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-surface-2)]',
            icon && 'pl-8',
            error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-8 px-2.5 text-xs rounded-md border transition-all duration-120 cursor-pointer',
            'bg-[var(--bg-surface)] text-[var(--text-primary)]',
            'border-[var(--border-2)] hover:border-[var(--border-strong)]',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-surface-2)]',
            error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

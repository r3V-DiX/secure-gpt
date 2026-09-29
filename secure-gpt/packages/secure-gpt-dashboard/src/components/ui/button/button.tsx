import React from 'react'
// src/components/ui/button/button.tsx
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility to merge tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Variant = 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-transparent shadow-xs',
  secondary: 'bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-2)]',
  danger:    'bg-[var(--danger-light)] hover:bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]',
  warning:  'bg-[var(--warning)] hover:bg-[var(--warning)] text-[var(--on-dark-full)] border-transparent shadow-xs',
  ghost:     'bg-transparent hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg font-medium',
  md: 'h-8 px-3 text-xs gap-1.5 rounded-lg font-medium',
  lg: 'h-9 px-4 text-xs gap-2 rounded-lg font-medium',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary', size = 'md', loading, icon,
  fullWidth, className, children, disabled, ...props
}: ButtonProps, ref) {
  return (
    <button
      ref={ref}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center border',
        'transition-all duration-120 select-none cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="size-4 shrink-0 flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </button>
  )
})

export type IconButtonProps = ButtonProps & { 'aria-label': string }
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', className, variant = 'ghost', type = 'button', ...props }, ref,
) {
  return <Button ref={ref} type={type} variant={variant} size={size}
    className={cn(size === 'sm' ? 'w-7' : size === 'lg' ? 'w-9' : 'w-8', 'p-0 shrink-0', className)} {...props} />
})

export function buttonStyles({ variant = 'primary', size = 'md', className }: Pick<ButtonProps, 'variant' | 'size' | 'className'> = {}) {
  return cn('inline-flex items-center justify-center border transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]', variantClasses[variant], sizeClasses[size], className)
}

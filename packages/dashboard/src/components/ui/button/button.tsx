import React from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-sm',
  secondary: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
}

export function Button({
  variant = 'primary', size = 'md', loading, icon,
  fullWidth, className, children, disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg border',
        'transition-all duration-150 select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        variantStyles[variant], sizeStyles[size],
        fullWidth && 'w-full', className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      }
      {children}
    </button>
  )
}

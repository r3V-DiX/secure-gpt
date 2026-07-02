// ─────────────────────────────────────────────
// Card Component
// ─────────────────────────────────────────────

import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
  border?: boolean
  hover?: boolean
  onClick?: () => void
}

const paddingMap = { sm: 'p-3', md: 'p-4', lg: 'p-6', none: '' }

export function Card({ children, className, padding = 'md', border = true, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl',
        border && 'border border-gray-100',
        'shadow-sm',
        paddingMap[padding],
        hover && 'hover:border-gray-200 hover:shadow-md transition-all duration-150 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-between mb-3', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-sm font-semibold text-gray-800', className)}>
      {children}
    </h3>
  )
}

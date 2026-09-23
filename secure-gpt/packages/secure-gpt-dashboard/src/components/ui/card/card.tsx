import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        interactive && 'card-interactive',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between pb-3 border-b border-[var(--border)]', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-4', className)} {...props} />
}

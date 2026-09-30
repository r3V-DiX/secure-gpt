import React from 'react'
import { cn } from '@/lib/cn'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'block w-full min-h-24 resize-y rounded-md border border-[var(--border-2)]',
          'bg-[var(--bg-surface)] px-3 py-3 text-base leading-6 text-[var(--text-primary)]',
          'placeholder:text-[var(--text-muted)]',
          'focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-glow)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)

import type { ReactNode, ComponentProps } from 'react'
import { cn } from '../button/button'
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0"><h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1>
      {description && <p className="mt-1 text-sm text-[var(--text-tertiary)]">{description}</p>}</div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
}
export function FilterBar({ className, ...props }: ComponentProps<'div'>) {
  return <div role="search" className={cn('flex flex-wrap items-center gap-2', className)} {...props} />
}
export function FormActions({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-wrap items-center justify-end gap-2 pt-4', className)} {...props} />
}

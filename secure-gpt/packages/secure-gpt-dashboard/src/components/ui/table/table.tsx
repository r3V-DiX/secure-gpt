import type { ComponentProps } from 'react'
import { cn } from '../button/button'
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return <table className={cn('w-full border-collapse text-left text-xs text-[var(--text-secondary)]', className)} {...props} />
}
export function TableHead({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('border-b border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)]', className)} {...props} />
}
export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={cn('divide-y divide-[var(--border)]', className)} {...props} />
}
export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return <tr className={cn('border-b border-[var(--border)] transition-colors last:border-b-0', className)} {...props} />
}
export function TableHeaderCell({ className, scope = 'col', ...props }: ComponentProps<'th'>) {
  return <th scope={scope} className={cn('px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider', className)} {...props} />
}
export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />
}

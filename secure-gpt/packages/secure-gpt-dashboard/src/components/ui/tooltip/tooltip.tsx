"use client"
import { cloneElement, useId, useState, type ReactElement, type ReactNode } from 'react'

/** Wrap disabled controls too, so their explanation remains keyboard accessible. */
export function Tooltip({ content, children, disabledTrigger = false }: {
  content: ReactNode; children: ReactElement<{ 'aria-describedby'?: string }>; disabledTrigger?: boolean
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return <span className="relative inline-flex max-w-full" tabIndex={disabledTrigger ? 0 : undefined}
    aria-describedby={open ? id : undefined}
    onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
    onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
    onKeyDown={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false) } }}>
    {cloneElement(children, { 'aria-describedby': [children.props['aria-describedby'], open ? id : undefined].filter(Boolean).join(' ') || undefined })}
    {open && <span id={id} role="tooltip" className="absolute bottom-full left-1/2 z-[100] mb-2 w-max max-w-64 -translate-x-1/2 rounded-lg border border-[var(--border-2)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-normal text-[var(--text-primary)] shadow-[var(--shadow-lg)]">{content}</span>}
  </span>
}

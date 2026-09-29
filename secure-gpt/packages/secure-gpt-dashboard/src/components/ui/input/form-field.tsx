"use client"
import { cloneElement, useId, type ReactElement, type ReactNode } from 'react'

interface FieldControlProps { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' }
export function FormField({ label, description, error, children, required }: {
  label: ReactNode; description?: ReactNode; error?: string; required?: boolean; children: ReactElement<FieldControlProps>
}) {
  const generatedId = useId()
  const id = children.props.id ?? generatedId
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  return <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-medium text-[var(--text-primary)]">{label}{required && <span aria-hidden="true" className="text-[var(--danger)]"> *</span>}</label>
    {description && <p id={descriptionId} className="text-xs text-[var(--text-tertiary)]">{description}</p>}
    {cloneElement(children, { id, 'aria-invalid': error ? true : children.props['aria-invalid'], 'aria-describedby': [children.props['aria-describedby'], descriptionId, errorId].filter(Boolean).join(' ') || undefined })}
    {error && <p id={errorId} className="text-xs text-[var(--danger)]">{error}</p>}
  </div>
}

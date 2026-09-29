'use client'
import React, { useId, useRef, type ReactNode } from 'react'
import { AlertTriangle, Trash2, Info } from 'lucide-react'
import { Modal } from './modal'
import { Button } from '../button/button'
import { clsx } from 'clsx'

export type ConfirmVariant = 'danger' | 'warning' | 'info'

export interface ConfirmOptions {
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: ConfirmVariant
    icon?: ReactNode
    loading?: boolean
}

export const variantConfig: Record<ConfirmVariant, {
    defaultIcon: ReactNode
}> = {
    danger: {
        defaultIcon: <Trash2 size={20} />,
    },
    warning: {
        defaultIcon: <AlertTriangle size={20} />,
    },
    info: {
        defaultIcon: <Info size={20} />,
    },
}

export interface ConfirmModalProps extends ConfirmOptions {
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmModal({
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    icon,
    loading,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const cfg = variantConfig[variant]
    const displayIcon = icon ?? cfg.defaultIcon
    const cancelRef = useRef<HTMLButtonElement>(null)
    const id = useId()

    return (
        <Modal open onClose={() => { if (!loading) onCancel() }} size="sm"
            closeOnBackdrop={!loading} closeOnEscape={!loading} initialFocusRef={cancelRef}
            aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}>
            <div className="p-6 flex flex-col items-center text-center gap-4">
                <div
                    className={clsx('size-14 rounded-lg border flex items-center justify-center shrink-0', {
                        'bg-[var(--danger-light)] border-[var(--danger-border)] text-[var(--danger)]': variant === 'danger',
                        'bg-[var(--warning-light)] border-[var(--warning-border)] text-[var(--warning)]': variant === 'warning',
                        'bg-[var(--accent-light)] border-[var(--accent-border)] text-[var(--accent-text)]': variant === 'info',
                    })}
                >
                    {displayIcon}
                </div>

                <div>
                    <h2 id={`${id}-title`} className="text-base font-bold text-[var(--text-primary)]">
                        {title}
                    </h2>
                    {description && (
                        <p id={`${id}-description`} className="text-sm mt-1.5 leading-relaxed text-[var(--text-secondary)]">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex gap-2.5 w-full pt-1">
                    <Button ref={cancelRef} type="button" variant="secondary" size="lg"
                        onClick={onCancel} disabled={loading} className="flex-1">
                        {cancelLabel}
                    </Button>
                    <Button type="button" variant={variant === 'info' ? 'primary' : variant} size="lg"
                        onClick={onConfirm} loading={loading} className="flex-1">
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

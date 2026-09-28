'use client'
import React, { useEffect, useRef, type ReactNode } from 'react'
import { AlertTriangle, Trash2, Info } from 'lucide-react'
import { Modal } from './modal'

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
    iconBg: string; iconBorder: string; iconColor: string
    confirmBg: string; confirmHover: string; confirmText: string
    defaultIcon: ReactNode
}> = {
    danger: {
        iconBg: 'var(--danger-light)',
        iconBorder: 'var(--danger-border)',
        iconColor: 'var(--danger)',
        confirmBg: '#dc2626',
        confirmHover: '#b91c1c',
        confirmText: '#ffffff',
        defaultIcon: <Trash2 size={20} />,
    },
    warning: {
        iconBg: 'var(--warning-light)',
        iconBorder: 'var(--warning-border)',
        iconColor: 'var(--warning)',
        confirmBg: '#d97706',
        confirmHover: '#b45309',
        confirmText: '#ffffff',
        defaultIcon: <AlertTriangle size={20} />,
    },
    info: {
        iconBg: 'var(--accent-light)',
        iconBorder: 'var(--accent-border)',
        iconColor: 'var(--accent-text)',
        confirmBg: 'var(--accent)',
        confirmHover: 'var(--accent-hover)',
        confirmText: '#ffffff',
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
    const confirmRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const t = setTimeout(() => confirmRef.current?.focus(), 50)
        return () => clearTimeout(t)
    }, [])

    return (
        <Modal open onClose={onCancel} size="sm" closeOnBackdrop={!loading}>
            <div className="p-6 flex flex-col items-center text-center gap-4">
                <div
                    className="size-14 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                        background: cfg.iconBg,
                        border: `1.5px solid ${cfg.iconBorder}`,
                        color: cfg.iconColor,
                    }}
                >
                    {displayIcon}
                </div>

                <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex gap-2.5 w-full pt-1">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 h-9 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50"
                        style={{
                            background: 'var(--bg-surface-2)',
                            borderColor: 'var(--border-2)',
                            color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
                                ; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
                                ; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-2)'
                        }}
                    >
                        {cancelLabel}
                    </button>

                    <button
                        ref={confirmRef}
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 h-9 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                        style={{
                            background: cfg.confirmBg,
                            color: cfg.confirmText,
                        }}
                        onMouseEnter={e => {
                            if (!loading) (e.currentTarget as HTMLButtonElement).style.background = cfg.confirmHover
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = cfg.confirmBg
                        }}
                    >
                        {loading && (
                            <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        )}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

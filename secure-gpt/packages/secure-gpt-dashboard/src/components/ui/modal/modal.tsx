'use client'
// src/components/ui/modal/modal.tsx
import React, {
    createContext, useContext, useCallback,
    useEffect, useRef, useState, type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { ConfirmModal, type ConfirmOptions } from './ConfirmModal'

export * from './ConfirmModal'

interface ModalContextValue {
    confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function useModal() {
    const ctx = useContext(ModalContext)
    if (!ctx) throw new Error('useModal must be inside ModalProvider')
    return ctx
}

interface PendingConfirm extends ConfirmOptions {
    id: string
    resolve: (value: boolean) => void
}

export function ModalProvider({ children }: { children: ReactNode }) {
    const [pending, setPending] = useState<PendingConfirm | null>(null)
    const [loading] = useState(false)

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setPending({ ...opts, id: String(Date.now()), resolve })
        })
    }, [])

    const handleConfirm = () => {
        if (!pending) return
        pending.resolve(true)
        setPending(null)
    }

    const handleCancel = () => {
        if (!pending) return
        pending.resolve(false)
        setPending(null)
    }

    return (
        <ModalContext.Provider value={{ confirm }}>
            {children}
            {pending && (
                <ConfirmModal
                    key={pending.id}
                    title={pending.title}
                    {...(pending.description !== undefined && { description: pending.description })}
                    {...(pending.confirmLabel !== undefined && { confirmLabel: pending.confirmLabel })}
                    {...(pending.cancelLabel !== undefined && { cancelLabel: pending.cancelLabel })}
                    {...(pending.variant !== undefined && { variant: pending.variant })}
                    {...(pending.icon !== undefined && { icon: pending.icon })}
                    loading={loading}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ModalContext.Provider>
    )
}

interface ModalProps {
    open: boolean
    onClose: () => void
    children: ReactNode
    size?: 'sm' | 'md' | 'lg'
    closeOnBackdrop?: boolean
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
}

export function Modal({
    open, onClose, children, size = 'md', closeOnBackdrop = true,
}: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onClose])

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    if (!mounted || !open) return null

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in"
            style={{ background: 'var(--modal-backdrop)' }}
            onClick={e => { if (closeOnBackdrop && e.target === e.currentTarget) onClose() }}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={panelRef}
                className={clsx(
                    'relative w-full rounded-lg animate-modal-in',
                    sizeClasses[size],
                )}
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-2)',
                    boxShadow: 'var(--shadow-lg)',
                }}
            >
                {children}
            </div>
        </div>,
        document.body,
    )
}

export function ModalHeader({
    children, onClose,
}: {
    children: ReactNode
    onClose?: () => void
}) {
    return (
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-1 min-w-0">{children}</div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="size-7 flex items-center justify-center rounded-lg transition-colors shrink-0 mt-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-2)'
                            ; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = ''
                            ; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
                    }}
                    aria-label="Close"
                >
                    <X size={15} />
                </button>
            )}
        </div>
    )
}

export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`px-6 py-5 ${className}`}>{children}</div>
}

export function ModalFooter({ children }: { children: ReactNode }) {
    return (
        <div className="flex items-center justify-end gap-2 px-6 py-4"
            style={{ borderTop: '1px solid var(--border)' }}>
            {children}
        </div>
    )
}

export function useLogoutConfirm() {
    const { confirm } = useModal()

    return useCallback(async () => {
        return confirm({
            variant: 'danger',
            icon: <LogOut size={20} />,
            title: 'Sign out?',
            description: 'You will be signed out of all sessions and redirected to the login page.',
            confirmLabel: 'Sign out',
            cancelLabel: 'Stay signed in',
        })
    }, [confirm])
}

export function useDangerConfirm() {
    const { confirm } = useModal()

    return useCallback(
        (opts: Omit<ConfirmOptions, 'variant'>) =>
            confirm({ ...opts, variant: 'danger' }),
        [confirm],
    )
}
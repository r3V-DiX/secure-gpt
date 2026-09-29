'use client'
// src/components/ui/modal/modal.tsx
import React, {
    createContext, useContext, useCallback,
    useEffect, useId, useRef, useState, type ReactNode, type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { X, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { ConfirmModal, type ConfirmOptions } from './ConfirmModal'
import { Button } from '../button/button'

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
    closeOnEscape?: boolean
    initialFocusRef?: RefObject<HTMLElement | null>
    'aria-label'?: string
    'aria-labelledby'?: string
    'aria-describedby'?: string
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
}

// All portals share a stack so opening/closing one dialog cannot unlock another.
const modalStack: HTMLDivElement[] = []
let previousBodyOverflow = ''
const focusableSelector = 'button, [href], input, select, textarea, [tabindex], [contenteditable="true"]'

function focusableElements(panel: HTMLElement) {
    return Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(element =>
        element.tabIndex >= 0 && !element.matches(':disabled') &&
        !element.closest('[hidden], [inert]') && element.getClientRects().length > 0,
    )
}

export function Modal({
    open, onClose, children, size = 'md', closeOnBackdrop = true, closeOnEscape = true,
    initialFocusRef, 'aria-label': ariaLabel, 'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
}: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const id = useId()
    const latest = useRef({ onClose, closeOnEscape, initialFocusRef })
    useEffect(() => { latest.current = { onClose, closeOnEscape, initialFocusRef } })
    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        const panel = panelRef.current
        if (!panel) return
        const heading = panel.querySelector<HTMLElement>('h1, h2, h3, [data-modal-title]')
        const description = panel.querySelector<HTMLElement>('[data-modal-description], [data-modal-header] p')
        if (!labelledBy && !ariaLabel && heading) {
            heading.id ||= `${id}-title`
            panel.setAttribute('aria-labelledby', heading.id)
            panel.removeAttribute('aria-label')
        }
        if (!describedBy && description) {
            description.id ||= `${id}-description`
            panel.setAttribute('aria-describedby', description.id)
        }
    }, [mounted, open, children, id, labelledBy, ariaLabel, describedBy])

    useEffect(() => {
        const panel = panelRef.current
        if (!mounted || !open || !panel) return
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
        if (modalStack.length === 0) {
            previousBodyOverflow = document.body.style.overflow
            document.body.style.overflow = 'hidden'
        }
        modalStack.push(panel)
        // Portal mount order follows the stack, including dialogs mounted beneath another portal.
        panel.parentElement!.style.zIndex = String(50 + modalStack.length)
        const isTop = () => modalStack.at(-1) === panel
        const focusInside = () => {
            const target = latest.current.initialFocusRef?.current
            if (target && panel.contains(target) && !target.matches(':disabled')) target.focus()
            else (focusableElements(panel)[0] ?? panel).focus()
        }
        focusInside()
        const onKeyDown = (event: KeyboardEvent) => {
            if (!isTop() || event.defaultPrevented) return
            if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                if (latest.current.closeOnEscape) latest.current.onClose()
            }
            if (event.key === 'Tab') {
                const elements = focusableElements(panel)
                const first = elements[0]
                const last = elements.at(-1)
                const active = document.activeElement
                if (!first || !last) {
                    event.preventDefault()
                    panel.focus()
                } else if (event.shiftKey && (active === first || active === panel || !panel.contains(active))) {
                    event.preventDefault()
                    last.focus()
                } else if (!event.shiftKey && (active === last || active === panel || !panel.contains(active))) {
                    event.preventDefault()
                    first.focus()
                }
            }
        }
        const onFocusIn = (event: FocusEvent) => {
            if (isTop() && event.target instanceof Node && !panel.contains(event.target)) focusInside()
        }
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('focusin', onFocusIn)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('focusin', onFocusIn)
            const wasTop = isTop()
            modalStack.splice(modalStack.indexOf(panel), 1)
            if (modalStack.length === 0) document.body.style.overflow = previousBodyOverflow
            if (wasTop) {
                const remaining = modalStack.at(-1)
                if (previousFocus?.isConnected && (!remaining || remaining.contains(previousFocus))) previousFocus.focus()
                else if (remaining) (focusableElements(remaining)[0] ?? remaining).focus()
            }
        }
    }, [mounted, open])



    if (!mounted || !open) return null
    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--modal-backdrop)] p-4 animate-backdrop-in"
            onClick={event => {
                if (closeOnBackdrop && event.target === event.currentTarget && modalStack.at(-1) === panelRef.current) onClose()
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel ?? (labelledBy ? undefined : 'Dialog')}
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                tabIndex={-1}
                className={clsx(
                    'relative my-auto max-h-full w-full overflow-y-auto rounded-2xl border border-[var(--border-2)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] outline-none animate-modal-in',
                    sizeClasses[size],
                )}
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
        <div data-modal-header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-6 pt-5 pb-4">
            <div className="flex-1 min-w-0">{children}</div>
            {onClose && (
                <Button type="button" variant="ghost" size="sm" onClick={onClose}
                    className="shrink-0 mt-0.5" aria-label="Close dialog">
                    <X size={15} />
                </Button>
            )}
        </div>
    )
}

export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`px-6 py-5 ${className}`}>{children}</div>
}

export function ModalFooter({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
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

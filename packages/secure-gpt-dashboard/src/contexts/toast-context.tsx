'use client'
// src/contexts/toast-context.tsx
import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { ToastType } from '@/types/toast.types'

interface Toast { id: string; type: ToastType; message: string }
interface ToastContextValue {
  toast: {
    success: (msg: string) => void
    error:   (msg: string) => void
    info:    (msg: string) => void
    warning: (msg: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)
const DURATION_MS = 3800

const typeConfig: Record<ToastType, {
  icon: React.ReactNode
  borderVar: string
  iconVar: string
  bgVar: string
}> = {
  success: {
    icon: <CheckCircle size={15} />,
    bgVar: 'var(--success-light)',
    borderVar: 'var(--success-border)',
    iconVar: 'var(--success)',
  },
  error: {
    icon: <XCircle size={15} />,
    bgVar: 'var(--danger-light)',
    borderVar: 'var(--danger-border)',
    iconVar: 'var(--danger)',
  },
  warning: {
    icon: <AlertTriangle size={15} />,
    bgVar: 'var(--warning-light)',
    borderVar: 'var(--warning-border)',
    iconVar: 'var(--warning)',
  },
  info: {
    icon: <Info size={15} />,
    bgVar: 'var(--info-light)',
    borderVar: 'var(--info-border)',
    iconVar: 'var(--info)',
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev.slice(-4), { id, type, message }])
    setTimeout(() => dismiss(id), DURATION_MS)
  }, [dismiss])

  const toast = {
    success: (msg: string) => push('success', msg),
    error:   (msg: string) => push('error', msg),
    info:    (msg: string) => push('info', msg),
    warning: (msg: string) => push('warning', msg),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Portal */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(t => {
          const cfg = typeConfig[t.type]
          return (
            <div
              key={t.id}
              className="flex items-start gap-2.5 pl-3.5 pr-2.5 py-3 rounded-xl pointer-events-auto animate-fade-in-fast"
              style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${cfg.borderVar}`,
                boxShadow: 'var(--shadow-lg)',
                minWidth: '260px',
                maxWidth: '380px',
              }}
            >
              {/* Colored left bar */}
              <span
                className="shrink-0 mt-0.5"
                style={{ color: cfg.iconVar }}
              >
                {cfg.icon}
              </span>

              <span
                className="flex-1 text-sm font-medium leading-snug"
                style={{ color: 'var(--text-primary)' }}
              >
                {t.message}
              </span>

              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 size-5 flex items-center justify-center rounded-md transition-colors mt-0.5"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'}
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
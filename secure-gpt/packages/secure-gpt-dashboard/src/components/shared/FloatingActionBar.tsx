'use client'

import { Button } from '@/components/ui'
import React from 'react'

export interface FloatingActionBarProps {
  /** Controls visibility with smooth slide in/out */
  visible: boolean
  /** Indicator dot color or token (e.g. 'var(--warning)', 'var(--accent)', etc.) */
  indicatorColor?: string
  /** Pulse effect on the indicator dot */
  indicatorPulse?: boolean
  /** Status text or label on the left */
  label: React.ReactNode
  /** Main action controls on the right */
  children: React.ReactNode
  /** Optional dismiss/clear handler on far right */
  onDismiss?: () => void
  /** Optional aria label for dismiss */
  dismissLabel?: string
  /** Optional custom z-index (default: z-50) */
  className?: string
}

export function FloatingActionBar({
  visible,
  indicatorColor = 'var(--accent)',
  indicatorPulse = false,
  label,
  children,
  onDismiss,
  dismissLabel = 'Dismiss',
  className = '',
}: FloatingActionBarProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 transition-all duration-300 ease-out ${className}`}
      style={{
        transform: `translateX(-50%) translateY(${visible ? '0' : '96px'})`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
      aria-hidden={!visible}
    >
      <div
        className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-md border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px var(--border)',
        }}
      >
        {/* Indicator Dot */}
        <span
          className={`size-2 rounded-full shrink-0 ${indicatorPulse ? 'animate-pulse' : ''}`}
          style={{
            background: indicatorColor,
            boxShadow: `0 0 6px ${indicatorColor}`,
          }}
        />

        {/* Status / Message Label */}
        <div className="text-xs font-medium pr-2 text-[var(--text-secondary)] whitespace-nowrap">
          {label}
        </div>

        {/* Actions Slot */}
        <div className="flex items-center gap-2">
          {children}
        </div>

        {/* Optional Dismiss Button */}
        {onDismiss && (
          <Button variant="ghost"
            type="button"
            onClick={onDismiss}
            className="ml-0.5"
            title={dismissLabel}
            aria-label={dismissLabel}
          >
            <svg
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}

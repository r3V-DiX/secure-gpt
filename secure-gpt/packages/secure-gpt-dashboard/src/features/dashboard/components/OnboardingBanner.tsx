'use client'

import React from 'react'
import Link from 'next/link'
import { Rocket, Sparkles, X } from 'lucide-react'

interface OnboardingBannerProps {
  show: boolean
  onDismiss: () => void
}

export function OnboardingBanner({ show, onDismiss }: OnboardingBannerProps) {
  if (!show) return null

  return (
    <div
      className="relative overflow-hidden rounded-md border p-4 animate-fade-in"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--accent-border)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="size-9 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Rocket size={18} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome! Set up the SecureGPT extension
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Install the extension and connect your browser to start masking and blocking sensitive data before it reaches AI tools.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/get-started"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white transition-all hover:brightness-110"
            style={{ background: 'var(--accent)' }}
          >
            <Sparkles size={13} />
            Get Started
          </Link>
          <button
            onClick={onDismiss}
            aria-label="Dismiss onboarding"
            className="size-7 rounded-md flex items-center justify-center border transition-all hover:bg-[var(--bg-surface-2)] cursor-pointer"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

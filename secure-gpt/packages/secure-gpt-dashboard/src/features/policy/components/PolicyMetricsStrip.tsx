'use client'

import React from 'react'
import { ShieldCheck, Lock, Globe } from 'lucide-react'
import { PLATFORMS } from '@/features/policy/components/PlatformMonitorGrid'

interface PolicyMetricsStripProps {
  totalActiveCategories: number
  totalCategories: number
  totalBlockingCategories: number
  totalMonitoredPlatforms: number
}

export function PolicyMetricsStrip({
  totalActiveCategories,
  totalCategories,
  totalBlockingCategories,
  totalMonitoredPlatforms,
}: PolicyMetricsStripProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div
        className="p-4 rounded-md border flex items-center justify-between"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold text-[var(--text-tertiary)]">Active Categories</p>
          <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {totalActiveCategories} <span className="text-xs font-normal text-[var(--text-muted)]">/ {totalCategories} active</span>
          </p>
        </div>
        <span className="p-2 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent-border)]">
          <ShieldCheck size={18} />
        </span>
      </div>

      <div
        className="p-4 rounded-md border flex items-center justify-between"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold text-[var(--text-tertiary)]">Hard Blocking Rules</p>
          <p className="text-xl font-bold tabular-nums text-[var(--danger)]">
            {totalBlockingCategories} <span className="text-xs font-normal text-[var(--text-muted)]">categories blocking</span>
          </p>
        </div>
        <span className="p-2 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]">
          <Lock size={18} />
        </span>
      </div>

      <div
        className="p-4 rounded-md border flex items-center justify-between"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold text-[var(--text-tertiary)]">Protected AI Apps</p>
          <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {totalMonitoredPlatforms} <span className="text-xs font-normal text-[var(--text-muted)]">/ {PLATFORMS.length} targets</span>
          </p>
        </div>
        <span className="p-2 rounded-xl bg-[var(--success-light)] text-[var(--success)] border border-[var(--success-border)]">
          <Globe size={18} />
        </span>
      </div>
    </div>
  )
}

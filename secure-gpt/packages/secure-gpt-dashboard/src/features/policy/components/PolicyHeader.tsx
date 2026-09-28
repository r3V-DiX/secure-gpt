'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import type { Department } from '@/types'

interface PolicyHeaderProps {
  departmentId?: string
  activeDept?: Department
  isAdmin: boolean
  savedAt: Date | null
  isDirty: boolean
}

export function PolicyHeader({
  departmentId,
  activeDept,
  isAdmin,
  savedAt,
  isDirty,
}: PolicyHeaderProps) {
  return (
    <>
      {departmentId && (
        <div className="flex items-center gap-2">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-[var(--accent-light)] hover:text-[var(--accent)] hover:border-[var(--accent-border)]"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-2)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={13} /> Back to Team & Organization
          </Link>
          <span
            className="text-xs font-mono px-2.5 py-1 rounded-xl font-bold border"
            style={{
              background: 'var(--accent-light)',
              borderColor: 'var(--accent-border)',
              color: 'var(--accent-text)',
            }}
          >
            Department Scope: {activeDept?.name || departmentId}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Policy Governance
            </h1>
            <span
              className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border"
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent-text)',
                borderColor: 'var(--accent-border)',
              }}
            >
              Engine v2.4
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            {isAdmin
              ? 'Configure corporate DLP rules, content masking preferences, and active AI target platforms'
              : "Inspect your organization's active data loss prevention policies and monitored platforms"}
          </p>
        </div>

        {savedAt && !isDirty && isAdmin && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs"
            style={{
              background: 'var(--success-light)',
              borderColor: 'var(--success-border)',
              color: 'var(--success)',
            }}
          >
            <CheckCircle size={13} /> Saved at {savedAt.toLocaleTimeString()}
          </span>
        )}
      </div>
    </>
  )
}

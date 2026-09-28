'use client'

import React from 'react'
import Link from 'next/link'

export function LoginFooter({ currentVersion }: { currentVersion: string }) {
  return (
    <div className="flex flex-col items-center gap-3 pt-5 mt-5 border-t" style={{ borderColor: 'var(--border)' }}>
      <Link href="/" className="text-[12px] font-semibold hover:underline" style={{ color: 'var(--text-secondary)' }}>
        ← Back to home
      </Link>
      <div className="flex items-center gap-4 text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/versions" className="hover:text-[var(--accent)] hover:underline transition-colors flex items-center gap-1.5">
          <span>Version History</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] font-bold">
            v{currentVersion}
          </span>
        </Link>
        <span>•</span>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:underline">
          Terms
        </Link>
      </div>
    </div>
  )
}

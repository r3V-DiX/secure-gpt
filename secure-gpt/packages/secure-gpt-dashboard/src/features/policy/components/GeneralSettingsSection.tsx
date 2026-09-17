'use client'

import React from 'react'
import { Settings2 } from 'lucide-react'
import type { PIIConfig } from '@/types'

interface Props {
  config: PIIConfig
  isAdmin: boolean
  onUpdateField: (key: keyof PIIConfig, val: any) => void
}

export function GeneralSettingsSection({ config, isAdmin, onUpdateField }: Props) {
  const settings = [
    {
      key: 'enableDocumentScanning' as const,
      label: 'Document & File Scanning',
      desc: 'Inspect and redact sensitive data in uploaded PDF, Office documents, and images',
    },
    {
      key: 'allowPause' as const,
      label: 'Allow users to pause protection',
      desc: 'Users can temporarily disable SecureGPT without contacting an admin',
    },
    {
      key: 'logUserEmail' as const,
      label: 'Include email in audit logs',
      desc: "Audit entries will contain the user's email address for traceability",
    },
  ]

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Settings2 size={15} style={{ color: 'var(--accent-text)' }} />
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          General Settings
        </h2>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {settings.map(({ key, label, desc }, i) => (
          <div
            key={key}
            className={`flex items-center gap-4 px-5 py-4 transition-colors ${
              isAdmin ? 'cursor-pointer hover:bg-[var(--bg-surface-2)]' : 'cursor-default'
            }`}
            style={{ borderBottom: i < settings.length - 1 ? '1px solid var(--border)' : undefined }}
            onClick={isAdmin ? () => onUpdateField(key, !(config as any)[key]) : undefined}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {desc}
              </p>
            </div>
            <div
              className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0 pointer-events-none"
              style={{
                background: (config as any)[key] !== false ? 'var(--accent)' : 'var(--bg-surface-3)',
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                style={{
                  transform: (config as any)[key] !== false ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

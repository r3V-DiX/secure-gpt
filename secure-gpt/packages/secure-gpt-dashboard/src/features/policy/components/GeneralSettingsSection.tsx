'use client'

import React from 'react'
import { Settings2, FileSearch, ShieldCheck, MailCheck, Eye, Sparkles } from 'lucide-react'
import type { PIIConfig } from '@/types'
import { Toggle } from './PolicyManager'

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
      desc: 'Inspect and redact sensitive data in uploaded PDF, Office documents, and pasted screenshots',
      icon: <FileSearch size={16} className="text-blue-500" />,
      badge: 'Multi-Modal',
    },
    {
      key: 'allowPause' as const,
      label: 'Allow users to pause protection',
      desc: 'Users can temporarily bypass SecureGPT protection without requiring admin sign-off',
      icon: <Eye size={16} className="text-amber-500" />,
      badge: 'Flexibility',
    },
    {
      key: 'logUserEmail' as const,
      label: 'Include user emails in audit trail',
      desc: 'Incident telemetry will record originating identity and email address for compliance reviews',
      icon: <MailCheck size={16} className="text-emerald-500" />,
      badge: 'Compliance',
    },
  ]

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center p-1.5 rounded-lg border shadow-xs"
          style={{
            background: 'var(--accent-light)',
            borderColor: 'var(--accent-border)',
            color: 'var(--accent)',
          }}
        >
          <Settings2 size={15} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Global Governance Settings
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            Organization-wide enforcement defaults and privacy telemetry configurations.
          </p>
        </div>
      </div>

      <div
        className="rounded-md border divide-y divide-[var(--border)] overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        {settings.map(({ key, label, desc, icon, badge }) => {
          const isEnabled = (config as any)[key] !== false
          return (
            <div
              key={key}
              className={`flex items-center justify-between gap-4 p-3.5 sm:p-4 transition-colors ${
                isAdmin ? 'cursor-pointer hover:bg-[var(--bg-surface-2)]' : 'cursor-default'
              }`}
              onClick={isAdmin ? () => onUpdateField(key, !isEnabled) : undefined}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className="p-1.5 rounded-md border shrink-0 mt-0.5"
                  style={{
                    background: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                  }}
                >
                  {icon}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {label}
                    </p>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.2 rounded-full border"
                      style={{
                        background: 'var(--bg-surface-2)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {badge}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5 max-w-xl">
                    {desc}
                  </p>
                </div>
              </div>

              <Toggle
                on={isEnabled}
                onChange={(en) => onUpdateField(key, en)}
                disabled={!isAdmin}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}


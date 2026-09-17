'use client'

import React from 'react'
import { Settings2, FileSearch, ShieldCheck, MailCheck, Eye, Sparkles } from 'lucide-react'
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
        className="rounded-2xl border divide-y divide-[var(--border)] overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {settings.map(({ key, label, desc, icon, badge }) => {
          const isEnabled = (config as any)[key] !== false
          return (
            <div
              key={key}
              className={`flex items-center justify-between gap-4 p-4 sm:p-5 transition-colors ${
                isAdmin ? 'cursor-pointer hover:bg-[var(--bg-surface-2)]' : 'cursor-default'
              }`}
              onClick={isAdmin ? () => onUpdateField(key, !isEnabled) : undefined}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span
                  className="p-2 rounded-xl border shrink-0 mt-0.5"
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

              {/* Switch Toggle */}
              <div
                className="relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 pointer-events-none"
                style={{
                  background: isEnabled ? 'var(--accent)' : 'var(--bg-surface-3)',
                  boxShadow: isEnabled ? '0 0 10px var(--accent-glow)' : 'none',
                }}
              >
                <span
                  className="absolute top-1 left-1 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                  style={{
                    transform: isEnabled ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}


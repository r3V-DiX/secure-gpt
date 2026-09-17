'use client'

import React from 'react'
import { ShieldCheck, Check, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { POLICY_PRESETS, type PolicyPresetKey } from '../config/org-onboarding.data'

interface PolicyPresetStepProps {
  selectedPreset: PolicyPresetKey
  setSelectedPreset: (val: PolicyPresetKey) => void
  saving: boolean
  onApply: () => void
  onBack: () => void
}

export function PolicyPresetStep({
  selectedPreset,
  setSelectedPreset,
  saving,
  onApply,
  onBack,
}: PolicyPresetStepProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Step 3: Select Enterprise Policy Baseline
          </h2>
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Choose a one-click DLP enforcement baseline for all employees in your organization. Fine-grained rule customizations are available anytime on the Policy Rules page.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {(Object.keys(POLICY_PRESETS) as PolicyPresetKey[]).map((key) => {
          const preset = POLICY_PRESETS[key]
          const isSelected = selectedPreset === key
          const Icon = preset.icon

          return (
            <div
              key={key}
              onClick={() => setSelectedPreset(key)}
              className={clsx(
                'card p-5 cursor-pointer flex flex-col justify-between transition-all duration-200 group',
                isSelected && 'ring-2 ring-[var(--accent)]'
              )}
              style={{
                borderColor: isSelected ? 'var(--accent-border)' : 'var(--border)',
                background: isSelected ? 'var(--accent-light)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: key === 'strict'
                        ? 'var(--danger-light)'
                        : key === 'balanced'
                        ? 'var(--accent-light)'
                        : 'var(--success-light)',
                      color: key === 'strict'
                        ? 'var(--danger)'
                        : key === 'balanced'
                        ? 'var(--accent)'
                        : 'var(--success)',
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      background: key === 'strict'
                        ? 'var(--danger-light)'
                        : key === 'balanced'
                        ? 'var(--accent-light)'
                        : 'var(--success-light)',
                      color: key === 'strict'
                        ? 'var(--danger)'
                        : key === 'balanced'
                        ? 'var(--accent-text)'
                        : 'var(--success)',
                      border: `1px solid ${
                        key === 'strict'
                          ? 'var(--danger-border)'
                          : key === 'balanced'
                          ? 'var(--accent-border)'
                          : 'var(--success-border)'
                      }`,
                    }}
                  >
                    {preset.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {preset.name}
                </h3>
                <p className="text-xs mt-1 leading-relaxed min-h-[44px]" style={{ color: 'var(--text-secondary)' }}>
                  {preset.description}
                </p>

                <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                  {preset.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <Check size={12} style={{ color: 'var(--success)' }} className="mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-2">
                <div
                  className="w-full py-1.5 rounded-xl text-center text-xs font-semibold transition-all"
                  style={{
                    background: isSelected ? 'var(--accent)' : 'var(--bg-surface-2)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {isSelected ? '✓ Selected' : 'Select'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer hover:brightness-105"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onApply}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
        >
          {saving ? <RefreshCw className="size-3.5 animate-spin" /> : null}
          <span>Apply Preset & Continue</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

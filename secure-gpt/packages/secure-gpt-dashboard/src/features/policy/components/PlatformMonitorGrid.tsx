'use client'

import React, { useState } from 'react'
import { PlatformIcon } from '@/components/shared/PlatformIcon'
import type { LLMPlatform } from '@securegpt/shared/constants'
import { Search, CheckSquare, Square, Globe } from 'lucide-react'

export interface PlatformMeta {
  id: LLMPlatform
  label: string
  category: 'chat' | 'code' | 'writing'
  domain: string
}

export const PLATFORMS: PlatformMeta[] = [
  { id: 'chatgpt',    label: 'ChatGPT',           category: 'chat',    domain: 'chatgpt.com' },
  { id: 'claude',     label: 'Claude (Anthropic)', category: 'chat',    domain: 'claude.ai' },
  { id: 'gemini',     label: 'Google Gemini',     category: 'chat',    domain: 'gemini.google.com' },
  { id: 'copilot',    label: 'Microsoft Copilot', category: 'chat',    domain: 'copilot.microsoft.com' },
  { id: 'perplexity', label: 'Perplexity AI',     category: 'chat',    domain: 'perplexity.ai' },
  { id: 'deepseek',   label: 'DeepSeek',          category: 'chat',    domain: 'deepseek.com' },
  { id: 'mistral',    label: 'Mistral Le Chat',   category: 'chat',    domain: 'chat.mistral.ai' },
  { id: 'meta-ai',    label: 'Meta AI',           category: 'chat',    domain: 'meta.ai' },
  { id: 'poe',        label: 'Poe',               category: 'chat',    domain: 'poe.com' },
  { id: 'cursor',     label: 'Cursor Web',        category: 'code',    domain: 'cursor.com' },
  { id: 'v0',         label: 'v0.dev (Vercel)',   category: 'code',    domain: 'v0.dev' },
  { id: 'replit',     label: 'Replit Agent',      category: 'code',    domain: 'replit.com' },
  { id: 'huggingchat',label: 'HuggingChat',       category: 'code',    domain: 'huggingface.co' },
  { id: 'phind',      label: 'Phind AI',          category: 'code',    domain: 'phind.com' },
  { id: 'notion',     label: 'Notion AI',         category: 'writing', domain: 'notion.so' },
  { id: 'jasper',     label: 'Jasper AI',         category: 'writing', domain: 'jasper.ai' },
  { id: 'copy-ai',    label: 'Copy.ai',           category: 'writing', domain: 'copy.ai' },
]

interface Props {
  monitoredPlatforms: LLMPlatform[]
  isAdmin: boolean
  onChange: (platforms: LLMPlatform[]) => void
}

export function PlatformMonitorGrid({ monitoredPlatforms, isAdmin, onChange }: Props) {
  const [platformCategory, setPlatformCategory] = useState<'all' | 'chat' | 'code' | 'writing'>('all')
  const [platformSearch, setPlatformSearch] = useState('')

  const activeCount = monitoredPlatforms.length
  const totalCount = PLATFORMS.length

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Globe size={16} style={{ color: 'var(--accent-text)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Monitored AI Platforms
            </h2>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums border"
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent-text)',
                borderColor: 'var(--accent-border)',
              }}
            >
              {activeCount} / {totalCount} Active
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Select which AI platforms the extension should monitor and enforce DLP policies on.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(PLATFORMS.map(p => p.id))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-[var(--accent-light)] hover:text-[var(--accent)] cursor-pointer"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <CheckSquare size={12} /> Select All
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-[var(--danger-light)] hover:text-[var(--danger)] cursor-pointer"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Square size={12} /> Deselect All
            </button>
          </div>
        )}
      </div>

      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All Platforms (${PLATFORMS.length})` },
              { id: 'chat', label: 'Chatbots & General AI (9)' },
              { id: 'code', label: 'Coding & Dev AI (5)' },
              { id: 'writing', label: 'Enterprise & Writing (3)' },
            ].map(tab => {
              const active = platformCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPlatformCategory(tab.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                      : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="relative min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search platforms…"
              value={platformSearch}
              onChange={e => setPlatformSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {PLATFORMS
            .filter(p => platformCategory === 'all' || p.category === platformCategory)
            .filter(p => !platformSearch || p.label.toLowerCase().includes(platformSearch.toLowerCase()) || p.domain.toLowerCase().includes(platformSearch.toLowerCase()))
            .map(p => {
              const on = monitoredPlatforms.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={isAdmin ? () => {
                    const next = on
                      ? monitoredPlatforms.filter(x => x !== p.id)
                      : [...monitoredPlatforms, p.id]
                    onChange(next)
                  } : undefined}
                  className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                    isAdmin ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : 'cursor-default'
                  } ${on ? 'shadow-xs' : 'opacity-65'}`}
                  style={{
                    background: on ? 'var(--accent-light)' : 'var(--bg-surface-2)',
                    borderColor: on ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  <PlatformIcon platformId={p.id} size={32} className="shrink-0 rounded-lg shadow-sm" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold truncate" style={{ color: on ? 'var(--accent-text)' : 'var(--text-primary)' }}>
                        {p.label}
                      </p>
                      <span className={`text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded-md font-bold shrink-0 border ${
                        on
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-[var(--bg-surface-3)] text-[var(--text-muted)] border-[var(--border)]'
                      }`}>
                        {on ? 'Protected' : 'Off'}
                      </span>
                    </div>
                    <p className="text-[10.5px] truncate font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {p.domain}
                    </p>
                  </div>
                </button>
              )
            })}
        </div>
      </div>
    </section>
  )
}

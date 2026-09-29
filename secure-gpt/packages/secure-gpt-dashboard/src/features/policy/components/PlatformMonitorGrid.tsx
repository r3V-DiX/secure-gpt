'use client'

import { Badge } from '@/components/ui'
import { IconButton } from '@/components/ui'
import { Button, Input } from '@/components/ui'
import React, { useState, useMemo } from 'react'
import { PlatformIcon } from '@/components/shared/PlatformIcon'
import type { LLMPlatform } from '@securegpt/shared/constants'
import { Search, CheckSquare, Square, Globe, ShieldCheck, Sparkles, Code2, Bot, FileText, X } from 'lucide-react'

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

  const filteredPlatforms = useMemo(() => {
    return PLATFORMS
      .filter(p => platformCategory === 'all' || p.category === platformCategory)
      .filter(p => {
        if (!platformSearch.trim()) return true
        const q = platformSearch.toLowerCase()
        return p.label.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q)
      })
  }, [platformCategory, platformSearch])

  const categoryCounts = useMemo(() => {
    return {
      all: PLATFORMS.length,
      chat: PLATFORMS.filter(p => p.category === 'chat').length,
      code: PLATFORMS.filter(p => p.category === 'code').length,
      writing: PLATFORMS.filter(p => p.category === 'writing').length,
    }
  }, [])

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center p-1.5 rounded-lg border shadow-xs"
              style={{
                background: 'var(--accent-light)',
                borderColor: 'var(--accent-border)',
                color: 'var(--accent)',
              }}
            >
              <Globe size={15} />
            </span>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Monitored AI Platforms
            </h2>
            <Badge variant="info"
              className="tabular-nums"

            >
              {activeCount} / {totalCount} Protected
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Browser extension enforces DLP inspection and content masking exclusively on selected targets.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button variant="primary"
              type="button"
              onClick={() => onChange(PLATFORMS.map(p => p.id))}
              className="inline-flex"

            >
              <CheckSquare size={13} className="text-[var(--accent)]" />
              <span>Select All</span>
            </Button>
            <Button variant="danger"
              type="button"
              onClick={() => onChange([])}
              className="inline-flex"

            >
              <Square size={13} className="text-[var(--danger)]" />
              <span>Deselect All</span>
            </Button>
          </div>
        )}
      </div>

      <div
        className="rounded-md border p-4 sm:p-5 space-y-4"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Category Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Targets', count: categoryCounts.all, icon: <Sparkles size={12} /> },
              { id: 'chat', label: 'Chat & Search', count: categoryCounts.chat, icon: <Bot size={12} /> },
              { id: 'code', label: 'Coding & Dev', count: categoryCounts.code, icon: <Code2 size={12} /> },
              { id: 'writing', label: 'Enterprise Writing', count: categoryCounts.writing, icon: <FileText size={12} /> },
            ].map(tab => {
              const active = platformCategory === tab.id
              return (
                <Button variant="primary"
                  key={tab.id}
                  type="button"
                  onClick={() => setPlatformCategory(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'shadow-xs'
                      : 'hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
                  }`}
                  style={{ background: active ? 'var(--accent)' : 'transparent', borderColor: active ? 'var(--accent)' : 'var(--border)', color: active ? '#ffffff' : 'var(--text-secondary)' }}
                >
                  <span className={active ? 'text-white' : 'text-[var(--text-tertiary)]'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  <Badge variant="neutral"
                    className="tabular-nums"
                    style={{
                      background: active ? 'rgba(255,255,255,0.22)' : 'var(--bg-surface-2)',
                      color: active ? '#ffffff' : 'var(--text-tertiary)',
                    }}
                  >
                    {tab.count}
                  </Badge>
                </Button>
              )
            })}
          </div>

          {/* Search box */}
          <div className="relative min-w-[220px]">

            <Input aria-label="Search platforms by name or domain…" icon={<Search size={15} />}
              type="text"
              placeholder="Search platforms by name or domain…"
              value={platformSearch}
              onChange={e => setPlatformSearch(e.target.value)}
              className="w-full pl-8 pr-7"

            />
            {platformSearch && (
              <IconButton aria-label="Close" variant="ghost"
                type="button"
                onClick={() => setPlatformSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X size={12} />
              </IconButton>
            )}
          </div>
        </div>

        {/* Platform Grid */}
        {filteredPlatforms.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Globe size={24} className="mx-auto text-[var(--text-tertiary)] opacity-60" />
            <p className="text-xs font-semibold text-[var(--text-secondary)]">No matching platforms found</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredPlatforms.map(p => {
              const on = monitoredPlatforms.includes(p.id)
              return (
                <div
                  key={p.id}
                  onClick={isAdmin ? () => {
                    const next = on
                      ? monitoredPlatforms.filter(x => x !== p.id)
                      : [...monitoredPlatforms, p.id]
                    onChange(next)
                  } : undefined}
                  className={`group relative flex items-center gap-3 p-3.5 rounded-xl border transition-all select-none ${
                    isAdmin ? 'cursor-pointer hover:border-[var(--border-strong)]' : 'cursor-default'
                  } ${on ? 'shadow-xs' : 'opacity-70'}`}
                  style={{
                    background: on ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                    borderColor: on ? 'var(--accent-border)' : 'var(--border)',
                  }}
                >
                  <div className="relative shrink-0">
                    <PlatformIcon platformId={p.id} size={32} className="rounded-lg shadow-xs" />
                    {on && (
                      <span
                        className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-[var(--bg-surface)] flex items-center justify-center"
                        style={{ background: 'var(--success)' }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold truncate text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">
                        {p.label}
                      </p>
                    </div>
                    <p className="text-[10px] truncate font-mono text-[var(--text-tertiary)]">
                      {p.domain}
                    </p>
                  </div>

                  {/* Status Indicator Chip */}
                  <span
                    className="text-[9.5px] font-mono uppercase px-2 py-0.5 rounded-md font-bold shrink-0 border transition-all"
                    style={{
                      background: on ? 'var(--success-light)' : 'var(--bg-surface-3)',
                      borderColor: on ? 'var(--success-border)' : 'var(--border)',
                      color: on ? 'var(--success)' : 'var(--text-muted)',
                    }}
                  >
                    {on ? 'Protected' : 'Off'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}


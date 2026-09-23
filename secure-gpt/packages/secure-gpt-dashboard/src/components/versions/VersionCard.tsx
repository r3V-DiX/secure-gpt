// packages/secure-gpt-dashboard/src/components/versions/VersionCard.tsx
import React from 'react'
import { Clock, GitCommit, Sparkles, RefreshCw, Zap, Wrench, CheckCircle2 } from 'lucide-react'
import { VersionItem } from '@/config/versions.data'

export function VersionCard({ item }: { item: VersionItem }) {
  return (
    <article
      className="rounded-lg border overflow-hidden transition-all duration-300 shadow-sm"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Release Card Header */}
      <div
        className="p-6 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{
          background: 'var(--bg-surface-2)',
          borderColor: 'var(--border)',
        }}
      >
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="text-3xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
              v{item.version}
            </span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{
                background: 'var(--accent-light)',
                borderColor: 'var(--accent-border)',
                color: 'var(--accent-text)',
              }}
            >
              {item.tag}
            </span>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-md border font-mono"
              style={{
                background: 'var(--bg-base)',
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              {item.status}
            </span>
          </div>

          <p className="text-sm md:text-base font-medium leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
            {item.summary}
          </p>
        </div>

        <div
          className="flex flex-row md:flex-col items-start md:items-end justify-between gap-2 text-xs font-mono shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          <div className="flex items-center gap-1.5">
            <Clock size={13} style={{ color: 'var(--accent)' }} />
            <span>{item.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitCommit size={13} style={{ color: 'var(--accent)' }} />
            <span>Commit: {item.commit}</span>
          </div>
        </div>
      </div>

      {/* Version Info Overview Banner */}
      <div
        className="px-6 md:px-8 py-4 border-b flex items-start gap-3 text-xs md:text-sm"
        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}
      >
        <div
          className="size-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}
        >
          <Sparkles size={14} />
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
            Version Info:{' '}
          </span>
          {item.info}
        </div>
      </div>

      {/* 4 Pillars Breakdown Grid */}
      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. What was Added New */}
        <div
          className="p-6 rounded-md border"
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="size-8 rounded-xl flex items-center justify-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles size={16} />
            </div>
            <h4 className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              What was added new
            </h4>
          </div>

          <ul className="space-y-2.5">
            {item.whatsNew.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-1" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. What Functionality Changed */}
        <div
          className="p-6 rounded-md border"
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="size-8 rounded-xl flex items-center justify-center text-blue-400 bg-blue-500/10 border border-blue-500/20">
              <RefreshCw size={16} />
            </div>
            <h4 className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              What functionality changed
            </h4>
          </div>

          <ul className="space-y-2.5">
            {item.changedFunctionality.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <span className="size-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. What was Improved */}
        <div
          className="p-6 rounded-md border"
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="size-8 rounded-xl flex items-center justify-center text-purple-400 bg-purple-500/10 border border-purple-500/20">
              <Zap size={16} />
            </div>
            <h4 className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              What was improved
            </h4>
          </div>

          <ul className="space-y-2.5">
            {item.improvements.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <span className="size-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. What Problem Solved */}
        <div
          className="p-6 rounded-md border"
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="size-8 rounded-xl flex items-center justify-center text-amber-400 bg-amber-500/10 border border-amber-500/20">
              <Wrench size={16} />
            </div>
            <h4 className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              What problem was solved
            </h4>
          </div>

          <ul className="space-y-2.5">
            {item.problemsSolved.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

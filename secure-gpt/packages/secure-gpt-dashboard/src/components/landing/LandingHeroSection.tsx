'use client'

import { LinkButton, Badge } from '@/components/ui'
import React from 'react'
import {
  Lock, AlertTriangle, Shield, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import { PlatformIcon } from '@/components/shared/PlatformIcon'
import { CHROME_STORE_URL } from './LandingFooter'

export const ALL_HERO_PLATFORMS = [
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'claude', name: 'Claude' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'google-ai-mode', name: 'Google AI Mode' },
  { id: 'copilot', name: 'Copilot' },
  { id: 'perplexity', name: 'Perplexity' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'cursor', name: 'Cursor' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'meta-ai', name: 'Meta AI' },
  { id: 'v0', name: 'v0' },
  { id: 'replit', name: 'Replit' },
  { id: 'poe', name: 'Poe' },
  { id: 'huggingchat', name: 'HuggingChat' },
] as const

export function LandingHeroSection() {
  return (
    <>
      <section id="hero" className="relative pt-20 pb-28 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              opacity: 0.55,
            }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 55%, var(--bg-base) 100%)' }} />
          <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, var(--hero-blob-1) 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-25" style={{ background: 'radial-gradient(circle, var(--hero-blob-2) 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 animate-fade-in">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
          >
            <Lock size={11} className="fill-current" />
            Enterprise-grade DLP · Zero cloud exposure · Browser-native
          </div>

          <h1 className="text-5xl md:text-[4.25rem] font-extrabold tracking-tight mb-6 leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
            Your prompts carry secrets. <br />
            <span style={{ background: 'linear-gradient(135deg, var(--hero-grad-from) 0%, var(--hero-grad-to) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SecureGPT makes sure they stay that way.
            </span>
          </h1>

          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            A browser extension that intercepts every prompt you type into ChatGPT, Claude, or Gemini, strips out PII, API keys, and confidential data locally — and only then lets the message through.
          </p>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium mb-10 border"
            style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
          >
            <AlertTriangle size={13} />
            89% of employees unknowingly share sensitive data with AI tools — Cyberhaven 2024
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LinkButton size="lg" style={{ boxShadow: '0 4px 20px var(--brand-btn-shadow)' }} href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">

                <Shield size={16} className="mr-1.5" />
                Add to Chrome — Free
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />

            </LinkButton>
            <LinkButton variant="secondary" size="lg" href="mailto:info@rivedix.com?subject=SecureGPT Enterprise Demo" className="w-full sm:w-auto">

                Book Enterprise Demo

            </LinkButton>
          </div>

          <div className="mt-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-6" style={{ color: 'var(--text-tertiary)' }}>
              Active client-side DLP protection across 17+ major AI platforms
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
              {ALL_HERO_PLATFORMS.map((p) => (
                <Badge variant="neutral"
                  key={p.id}


                >
                  <PlatformIcon platformId={p.id} size={16} className="rounded-xs shrink-0" />
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat strip ── */}
      <section className="border-y py-10 px-6" style={{ background: 'var(--brand-dark)', borderColor: 'var(--brand-mid)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '50+', label: 'Sensitive data types detected' },
            { value: '< 2ms', label: 'Local analysis latency' },
            { value: '0 bytes', label: 'Raw data sent to our servers' },
            { value: '100%', label: 'Browser-side redaction' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--brand-light)' }}>{stat.value}</p>
              <p className="text-xs font-medium" style={{ color: 'var(--on-dark-mid)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

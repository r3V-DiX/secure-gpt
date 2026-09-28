'use client'

import React from 'react'
import {
  Search, EyeOff, Scan, BarChart3, Globe, Users,
  Lock, ShieldCheck, Shield
} from 'lucide-react'

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 px-6" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>What SecureGPT does</p>
          <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Enterprise DLP, Built for the AI Era</h2>
          <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Multiple detection layers designed to catch data leaks before they happen — without adding friction for your team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Search size={22} style={{ color: 'var(--accent)' }} />}
            iconBg="var(--accent-light)"
            title="Real-time Prompt Inspection"
            desc="Regex, Named Entity Recognition, and entropy analysis run on every keystroke — catching API keys, PII, IBAN numbers, JWTs, and 50+ other sensitive patterns before you hit send."
          />
          <FeatureCard
            icon={<EyeOff size={22} style={{ color: 'var(--success)' }} />}
            iconBg="var(--success-light)"
            title="100% Local Masking"
            desc="All detection and redaction happens inside your browser tab. Raw sensitive data never leaves your device — only a safe masked version reaches the AI provider."
          />
          <FeatureCard
            icon={<Scan size={22} style={{ color: 'var(--info)' }} />}
            iconBg="var(--info-light)"
            title="Image & File Scanning"
            desc="OCR analysis catches sensitive data hidden in screenshots, PDFs, and file uploads before they're attached to a prompt. No format is left unprotected."
          />
          <FeatureCard
            icon={<BarChart3 size={22} style={{ color: 'var(--warning)' }} />}
            iconBg="var(--warning-light)"
            title="Compliance Audit Logs"
            desc="Every detection and policy action is logged with full context — user, platform, data type, and outcome. Meet GDPR, HIPAA, and SOC 2 audit requirements with ease."
          />
          <FeatureCard
            icon={<Globe size={22} style={{ color: 'var(--violet)' }} />}
            iconBg="var(--violet-light)"
            title="Works on Every AI Platform"
            desc="Natively intercepts ChatGPT, Claude, Gemini, Microsoft Copilot, Perplexity, and any custom internal LLM interface — no manual configuration required."
          />
          <FeatureCard
            icon={<Users size={22} style={{ color: 'var(--danger)' }} />}
            iconBg="var(--danger-light)"
            title="Admin Policy Control"
            desc="Define per-department detection rules and enforcement levels. Admins decide what gets masked, warned, or hard-blocked. Employees keep working without interruption."
          />
        </div>
      </div>
    </section>
  )
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>Under the hood</p>
            <h2 className="text-4xl font-bold mb-10 leading-tight" style={{ color: 'var(--text-primary)' }}>
              Three steps.<br />Zero data exposure.
            </h2>
            <div className="space-y-8">
              <Step
                number="01"
                title="Intercept the prompt"
                desc="SecureGPT hooks directly into LLM input fields on supported platforms, capturing the message before your browser transmits it."
              />
              <Step
                number="02"
                title="Detect locally"
                desc="A multi-tier analysis pipeline — Regex, NER, entropy checks, and IBAN/JWT validators — runs entirely in your browser tab to flag sensitive entities in real time."
              />
              <Step
                number="03"
                title="Enforce your policy"
                desc="Based on your organisation's policy, entities are auto-masked with a safe placeholder, surfaced in a warning for user review, or blocked outright. Every action is logged."
              />
            </div>
          </div>

          {/* Mock browser UI */}
          <div className="relative">
            <div
              className="rounded-md overflow-hidden shadow-2xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
              >
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-amber-400" />
                <div className="size-3 rounded-full bg-green-400" />
                <div
                  className="flex-1 mx-4 px-3 py-1 rounded-md text-[11px] font-mono text-center"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}
                >
                  chatgpt.com
                </div>
                <div
                  className="size-4 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent-light)' }}
                >
                  <Lock size={8} style={{ color: 'var(--accent)' }} />
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div
                  className="rounded-xl border p-3 text-xs font-mono leading-relaxed"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Here is my API key for the integration:&nbsp;
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold"
                    style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}
                  >
                    ⚠ sk-proj-7aGx...
                  </span>
                  &nbsp;— please use this.
                </div>

                <div
                  className="rounded-xl border p-4 flex gap-3"
                  style={{ background: 'var(--danger-light)', borderColor: 'var(--danger-border)' }}
                >
                  <ShieldCheck size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--danger)' }}>
                      SecureGPT · API Key Detected
                    </p>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--danger)', opacity: 0.85 }}>
                      Found: OpenAI API Key (98% confidence). Company policy blocks credential sharing with external AI providers. This event is being logged.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 h-9 rounded-lg border text-[11px] font-semibold"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
                  >
                    Edit message
                  </button>
                  <button
                    className="flex-1 h-9 rounded-lg text-[11px] font-bold text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    🔒 Mask &amp; Send
                  </button>
                  <button
                    className="flex-1 h-9 rounded-lg text-[11px] font-semibold"
                    style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
                  >
                    Block
                  </button>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-4 -right-4 px-3 py-2 rounded-xl shadow-lg border flex items-center gap-2"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--accent-border)' }}
            >
              <Shield size={14} style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Protected by SecureGPT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, iconBg, title, desc }: { icon: React.ReactNode; iconBg: string; title: string; desc: string }) {
  return (
    <div
      className="p-7 rounded-md border transition-all duration-300 group hover:-translate-y-1"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'
      }}
    >
      <div
        className="size-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
  )
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-5">
      <div
        className="text-2xl font-black tabular-nums leading-none mt-0.5 w-8 shrink-0"
        style={{ color: 'var(--accent-border)' }}
      >
        {number}
      </div>
      <div>
        <h4 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</h4>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
    </div>
  )
}

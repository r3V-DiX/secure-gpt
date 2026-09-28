'use client'

import React from 'react'
import {
  FileKey,
  Fingerprint,
  BarChart3,
  Network,
  CheckCircle2,
  Lock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'

export function ThreatCoverageSection() {
  return (
    <section id="threat-coverage" className="py-28 px-6 border-t" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>Threat coverage</p>
          <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>What SecureGPT Catches</h2>
          <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Every category of sensitive data that shouldn't be in an AI prompt — detected and masked before it leaves your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <ThreatCard
            icon={<FileKey size={20} style={{ color: 'var(--accent)' }} />}
            iconBg="var(--accent-light)"
            category="Credentials & Secrets"
            items={['API keys (OpenAI, AWS, GCP…)', 'Private SSH / RSA keys', 'JWT tokens', 'Passwords & tokens', 'OAuth secrets']}
          />
          <ThreatCard
            icon={<Fingerprint size={20} style={{ color: 'var(--success)' }} />}
            iconBg="var(--success-light)"
            category="Personal Identity (PII)"
            items={['Full names & emails', 'Phone numbers', 'National ID / SSN', 'Passport numbers', 'Date of birth']}
          />
          <ThreatCard
            icon={<BarChart3 size={20} style={{ color: 'var(--warning)' }} />}
            iconBg="var(--warning-light)"
            category="Financial Data"
            items={['Credit / debit card numbers', 'IBAN & SWIFT codes', 'Bank account numbers', 'Tax IDs', 'Investment details']}
          />
          <ThreatCard
            icon={<Network size={20} style={{ color: 'var(--violet)' }} />}
            iconBg="var(--violet-light)"
            category="Corporate IP"
            items={['Internal IP addresses', 'Internal hostnames', 'Database connection strings', 'Confidential project names', 'Unreleased product data']}
          />
        </div>
      </div>
    </section>
  )
}

export function TrustSignalsSection() {
  return (
    <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrustCard
            icon={<Lock size={18} style={{ color: 'var(--accent)' }} />}
            title="Zero cloud exposure"
            desc="Detection, masking, and enforcement run entirely inside your browser tab. We never see your raw prompts."
          />
          <TrustCard
            icon={<ShieldCheck size={18} style={{ color: 'var(--success)' }} />}
            title="Compliance ready"
            desc="Audit logs and policy controls built for GDPR, HIPAA, SOC 2, and internal data governance frameworks."
          />
          <TrustCard
            icon={<AlertTriangle size={18} style={{ color: 'var(--warning)' }} />}
            title="Policy enforcement"
            desc="Admins set the rules. Employees get clear warnings. Nothing slips through undetected or unlogged."
          />
        </div>
      </div>
    </section>
  )
}

function ThreatCard({ icon, iconBg, category, items }: { icon: React.ReactNode; iconBg: string; category: string; items: string[] }) {
  return (
    <div className="p-6 rounded-md border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
      <div className="size-10 rounded-xl flex items-center justify-center mb-4" style={{ background: iconBg }}>
        {icon}
      </div>
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{category}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TrustCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-md border flex gap-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--bg-surface-2)' }}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</h4>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
    </div>
  )
}

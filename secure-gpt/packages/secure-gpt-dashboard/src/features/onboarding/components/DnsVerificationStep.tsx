'use client'

import React, { useState } from 'react'
import { Globe2, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { clsx } from 'clsx'

interface DnsVerificationStepProps {
  domain: string
  dnsToken: string
  isVerified: boolean
  verifiedAt: string | null
  verifying: boolean
  onVerify: () => void
  onBack: () => void
  onContinue: () => void
  onVerifyLater?: () => void
}

export function DnsVerificationStep({
  domain,
  dnsToken,
  isVerified,
  verifiedAt,
  verifying,
  onVerify,
  onBack,
  onContinue,
  onVerifyLater,
}: DnsVerificationStepProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!dnsToken) return
    navigator.clipboard.writeText(dnsToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Globe2 size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Step 2: DNS Domain Verification
          </h2>
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Verify ownership of <strong style={{ color: 'var(--text-primary)' }}>{domain || 'your domain'}</strong> by publishing a challenge TXT record in your DNS provider (Cloudflare, Route 53, GoDaddy, Google Domains).
        </p>
      </div>

      {/* Verification Status Banner */}
      <div
        className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          background: isVerified ? 'var(--success-light)' : 'var(--warning-light)',
          borderColor: isVerified ? 'var(--success-border)' : 'var(--warning-border)',
        }}
      >
        <div className="flex items-center gap-3">
          {isVerified ? (
            <CheckCircle2 size={22} style={{ color: 'var(--success)' }} className="shrink-0" />
          ) : (
            <AlertCircle size={22} style={{ color: 'var(--warning)' }} className="shrink-0" />
          )}
          <div>
            <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              {isVerified ? 'Domain Ownership Verified' : 'Pending DNS Challenge Verification'}
            </h4>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {isVerified
                ? `Verified on ${new Date(verifiedAt || '').toLocaleDateString()}`
                : 'Publish the record below and click "Verify DNS Record" to validate.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onVerify}
          disabled={verifying}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
        >
          <RefreshCw className={clsx('size-3.5', verifying && 'animate-spin')} />
          <span>{verifying ? 'Checking DNS…' : 'Verify DNS Record'}</span>
        </button>
      </div>

      {/* DNS Challenge Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left text-xs">
          <thead
            className="text-[10px] font-bold uppercase tracking-wider border-b"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-tertiary)',
            }}
          >
            <tr>
              <th className="px-4 py-3">Record Type</th>
              <th className="px-4 py-3">Host / Name</th>
              <th className="px-4 py-3">Value / Content</th>
              <th className="px-4 py-3 text-right">TTL</th>
            </tr>
          </thead>
          <tbody className="divide-y font-mono text-xs" style={{ borderColor: 'var(--border)' }}>
            <tr>
              <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>TXT</td>
              <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>@ or {domain}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="select-all truncate max-w-xs md:max-w-md font-medium" style={{ color: 'var(--accent-text)' }}>
                    {dnsToken || 'securegpt-challenge-token-pending'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 rounded-lg border transition-colors cursor-pointer"
                    style={{
                      background: 'var(--bg-surface-2)',
                      borderColor: 'var(--border-2)',
                      color: copied ? 'var(--success)' : 'var(--text-tertiary)',
                    }}
                    title="Copy token"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-right" style={{ color: 'var(--text-tertiary)' }}>300 (Auto)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {!isVerified && (
        <div
          className="p-3.5 rounded-xl border text-xs"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="font-semibold text-[var(--text-primary)]">Optional Verification:</span> You can verify DNS now for instant employee auto-enrollment, or choose <strong className="text-[var(--text-primary)]">"Verify Later"</strong> below to explore the dashboard. <em>Note: Until verified, enterprise policy enforcement and employee auto-enrollment remain paused.</em>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
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

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {onVerifyLater && !isVerified && (
            <button
              type="button"
              onClick={onVerifyLater}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer hover:bg-[var(--bg-surface-2)]"
              style={{
                background: 'transparent',
                borderColor: 'var(--border)',
                color: 'var(--text-tertiary)',
              }}
            >
              Verify Later (Restricted Mode)
            </button>
          )}

          <button
            type="button"
            onClick={onContinue}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 cursor-pointer"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
          >
            <span>Continue to Policy Presets</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

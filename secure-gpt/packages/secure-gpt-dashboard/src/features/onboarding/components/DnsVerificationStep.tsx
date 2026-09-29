'use client'

import { Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui'
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
        className="p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
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
                ? (verifiedAt && !isNaN(new Date(verifiedAt).getTime())
                    ? `Verified on ${new Date(verifiedAt).toLocaleDateString()}`
                    : 'Domain ownership successfully verified')
                : 'Publish the record below and click "Verify DNS Record" to validate.'}
            </p>
          </div>
        </div>

        <Button variant="primary"
          type="button"
          onClick={onVerify}
          disabled={verifying}
          className="shrink-0"

        >
          <RefreshCw className={clsx('size-3.5', verifying && 'animate-spin')} />
          <span>{verifying ? 'Checking DNS…' : 'Verify DNS Record'}</span>
        </Button>
      </div>

      {/* DNS Challenge Table */}
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <Table className="w-full text-left text-xs">
          <TableHead
            className="text-[10px] font-bold uppercase tracking-wider border-b"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-tertiary)',
            }}
          >
            <TableRow>
              <TableHeaderCell className="px-4 py-3">Record Type</TableHeaderCell>
              <TableHeaderCell className="px-4 py-3">Host / Name</TableHeaderCell>
              <TableHeaderCell className="px-4 py-3">Value / Content</TableHeaderCell>
              <TableHeaderCell className="px-4 py-3 text-right">TTL</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y font-mono text-xs" style={{ borderColor: 'var(--border)' }}>
            <TableRow>
              <TableCell className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>TXT</TableCell>
              <TableCell className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>@ or {domain}</TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="select-all truncate max-w-xs md:max-w-md font-medium" style={{ color: 'var(--accent-text)' }}>
                    {dnsToken || 'securegpt-challenge-token-pending'}
                  </span>
                  <Button variant="secondary"
                    type="button"
                    onClick={handleCopy}

                    style={{ color: copied ? 'var(--success)' : 'var(--text-tertiary)' }}
                    title="Copy token"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </Button>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 text-right" style={{ color: 'var(--text-tertiary)' }}>300 (Auto)</TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
        <Button variant="secondary"
          type="button"
          onClick={onBack}


        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {onVerifyLater && !isVerified && (
            <Button variant="secondary"
              type="button"
              onClick={onVerifyLater}


            >
              Verify Later (Restricted Mode)
            </Button>
          )}

          <Button variant="primary"
            type="button"
            onClick={onContinue}


          >
            <span>Continue to Policy Presets</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

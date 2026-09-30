'use client'

import { Badge, Button, Card, CardContent, CardHeader } from '@/components/ui'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Globe2, RefreshCw } from 'lucide-react'

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

  async function handleCopy() {
    if (!dnsToken) return
    try {
      await navigator.clipboard.writeText(dnsToken)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const verificationDate = verifiedAt && !Number.isNaN(new Date(verifiedAt).getTime())
    ? new Date(verifiedAt).toLocaleDateString()
    : null

  return (
    <section aria-labelledby="dns-step-title" className="space-y-6 animate-fade-in">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <Globe2 size={19} className="shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <h2 id="dns-step-title" className="text-lg font-semibold text-[var(--text-primary)]">
            Verify your domain
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Add a TXT record for <strong className="font-semibold text-[var(--text-primary)]">{domain || 'your domain'}</strong> at your DNS provider, then check the record here.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(19rem,1fr)]">
        <Card className="min-w-0 overflow-hidden shadow-none">
          <CardHeader className="px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">DNS TXT record</h3>
            <Badge variant="info">Required</Badge>
          </CardHeader>
          <CardContent className="px-5 py-1">
            <dl className="divide-y divide-[var(--border)] text-sm">
              <div className="grid gap-1 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-[var(--text-tertiary)]">Record type</dt>
                <dd className="font-mono font-medium text-[var(--text-primary)]">TXT</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-[var(--text-tertiary)]">Host / Name</dt>
                <dd className="break-all font-mono text-[var(--text-primary)]">@ or {domain || 'your domain'}</dd>
              </div>
              <div className="grid gap-2 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-[var(--text-tertiary)]">Value / Content</dt>
                <dd className="flex min-w-0 flex-col items-start gap-3">
                  <code className="w-full select-all break-all rounded-lg bg-[var(--bg-surface-2)] px-3 py-2 text-xs leading-5 text-[var(--text-primary)]">
                    {dnsToken || 'Verification token pending'}
                  </code>
                  <Button variant="secondary" size="sm" type="button" disabled={!dnsToken} onClick={() => void handleCopy()} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
                    {copied ? 'Copied' : 'Copy value'}
                  </Button>
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-[var(--text-tertiary)]">TTL</dt>
                <dd className="font-mono text-[var(--text-primary)]">300 (Auto)</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="self-start shadow-none">
          <CardHeader className="px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Verification status</h3>
            <Badge variant={isVerified ? 'success' : 'warning'} dot>
              {isVerified ? 'Verified' : 'Pending'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 px-5 py-5">
            <div role="status" className="flex items-start gap-3" aria-live="polite">
              {isVerified ? (
                <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[var(--success)]" aria-hidden="true" />
              ) : (
                <RefreshCw size={19} className="mt-0.5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
              )}
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {isVerified
                  ? verificationDate ? `Domain ownership verified on ${verificationDate}.` : 'Domain ownership verified.'
                  : 'Publish the record, then check whether DNS has updated.'}
              </p>
            </div>
            {!isVerified && (
              <Button variant="primary" type="button" loading={verifying} onClick={onVerify} fullWidth>
                {verifying ? 'Checking DNS…' : 'Verify DNS record'}
              </Button>
            )}
            {!isVerified && (
              <p className="border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--text-tertiary)]">
                You can verify later. Until then, enterprise policy enforcement and employee auto-enrollment remain paused.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="secondary" type="button" onClick={onBack} icon={<ArrowLeft size={14} />} className="self-start">
          Back
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {onVerifyLater && !isVerified && (
            <Button variant="secondary" type="button" onClick={onVerifyLater}>
              Verify later
            </Button>
          )}
          <Button variant="primary" type="button" onClick={onContinue}>
            Continue to policy presets <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  )
}

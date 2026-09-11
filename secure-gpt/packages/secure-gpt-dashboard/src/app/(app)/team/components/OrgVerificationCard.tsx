'use client'

import { useState } from 'react'
import { Building2, Globe, Check, Copy, CheckCircle2 } from 'lucide-react'
import { apiPost } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'

interface OrgVerificationCardProps {
  currentOrg: any
  user: any
  onVerified: () => Promise<void>
}

export function OrgVerificationCard({ currentOrg, user, onVerified }: OrgVerificationCardProps) {
  const { toast } = useToast()
  const [copiedToken, setCopiedToken] = useState(false)
  const [verifyingDns, setVerifyingDns] = useState(false)

  const userDomain = user?.email?.split('@')[1]
  const orgDisplayName = currentOrg?.name || (user?.role === 'org_admin' ? `${userDomain?.split('.')[0]?.toUpperCase()} Enterprise` : 'Acme Cybersecurity')
  const orgDomain = currentOrg?.domain || userDomain
  const rawStatus = String(currentOrg?.status || 'PENDING_VERIFICATION')
  const isOrgActive = rawStatus.toUpperCase().includes('ACTIVE')
  const orgStatus = isOrgActive ? 'ACTIVE' : 'PENDING_VERIFICATION'
  const dnsToken = currentOrg?.dns_txt_token || (user?.email?.includes('@') ? `securegpt-verification=sgpt-${user.id.slice(0, 16)}` : 'securegpt-verification=sgpt-98b1a9c8ca55fcef1ceafdb33807efaa')

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const handleVerifyDns = async () => {
    if (!currentOrg?.id) return
    setVerifyingDns(true)
    try {
      const res = await apiPost<any>('/orgs/verify-domain', { org_id: currentOrg.id })
      await onVerified()
      toast.success(res?.message || 'Domain verified successfully!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to verify DNS record')
    } finally {
      setVerifyingDns(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-6 border transition-all"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {orgDisplayName}
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{
                    background: orgStatus === 'ACTIVE' ? 'var(--success-light)' : 'var(--warning-light)',
                    color: orgStatus === 'ACTIVE' ? 'var(--success)' : 'var(--warning)',
                    border: `1px solid ${orgStatus === 'ACTIVE' ? 'var(--success-border)' : 'var(--warning-border)'}`,
                  }}
                >
                  ● {orgStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Corporate Domain: <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>@{orgDomain}</span>
                <span className="mx-1.5 text-gray-400">•</span>
                <span>Admin: {user?.email}</span>
              </p>
            </div>
          </div>
        </div>

        {dnsToken && (
          <div className="flex flex-col items-start lg:items-end gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--text-tertiary)' }}>
              <Globe size={13} /> DNS TXT Verification Challenge Record
            </div>
            <div
              className="flex items-center gap-2 p-2 rounded-xl border"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
            >
              <code className="text-xs font-mono font-bold select-all px-1" style={{ color: 'var(--text-primary)' }}>
                {dnsToken}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(dnsToken)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-2)',
                  color: 'var(--text-secondary)',
                }}
                title="Copy token to clipboard"
              >
                {copiedToken ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                <span>{copiedToken ? 'Copied' : 'Copy'}</span>
              </button>

              {orgStatus !== 'ACTIVE' && (
                <button
                  type="button"
                  disabled={verifyingDns}
                  onClick={handleVerifyDns}
                  className="px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-white"
                  style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
                >
                  {verifyingDns ? (
                    <span className="size-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  <span>{verifyingDns ? 'Checking DNS…' : 'Verify Domain'}</span>
                </button>
              )}
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              Add this TXT record to your Cloudflare DNS, then click <b>Verify Domain</b>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

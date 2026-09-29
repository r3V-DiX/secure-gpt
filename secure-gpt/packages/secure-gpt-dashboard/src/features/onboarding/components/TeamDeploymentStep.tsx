'use client'

import { Card } from '@/components/ui'
import { Textarea, Button } from '@/components/ui'
import React, { useState } from 'react'
import { UserPlus, Download, Users, RefreshCw, ArrowLeft, Sparkles, Copy, Check, ExternalLink, MailCheck } from 'lucide-react'

export interface InvitedItem {
  email: string
  status: 'auto_enrolled' | 'invitation_created'
  invite_url?: string
}

interface TeamDeploymentStepProps {
  domain: string
  inviteEmails: string
  setInviteEmails: (val: string) => void
  invitedList: InvitedItem[]
  sendingInvites: boolean
  onSendInvites: (e: React.FormEvent) => void
  onBack: () => void
  onFinish: () => void
}

export function TeamDeploymentStep({
  domain,
  inviteEmails,
  setInviteEmails,
  invitedList,
  sendingInvites,
  onSendInvites,
  onBack,
  onFinish,
}: TeamDeploymentStepProps) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedUrlIndex, setCopiedUrlIndex] = useState<number | null>(null)
  const extensionId = 'jblnbphkjikjghckgehbbidbcfjgnomf'

  function handleCopyId() {
    navigator.clipboard.writeText(extensionId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  function handleCopyInviteUrl(url: string, index: number) {
    const fullUrl = `${window.location.origin}${url}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedUrlIndex(index)
    setTimeout(() => setCopiedUrlIndex(null), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Step 4: Team Invites & Extension Rollout
          </h2>
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Invite team members matching your corporate domain or push the Chrome Extension enterprise-wide via MDM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* Team Invite Box */}
        <Card
          className="p-5 space-y-4"
          style={{ background: 'var(--bg-surface-2)' }}
        >
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[var(--accent)]" />
            <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Invite Team Members (@{domain || 'domain.com'})
            </h3>
          </div>

          <form onSubmit={onSendInvites} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Email addresses (comma or line separated):
              </label>
              <Textarea aria-label={`alice@${domain || 'company.com'}\nbob@${domain || 'company.com'}`}
                rows={4}
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder={`alice@${domain || 'company.com'}\nbob@${domain || 'company.com'}`}
                className="w-full font-mono"

              />
            </div>

            <Button variant="primary"
              type="submit"
              disabled={sendingInvites || !inviteEmails.trim()}
              className="w-full"

            >
              {sendingInvites ? <RefreshCw className="size-3.5 animate-spin" /> : <UserPlus size={14} />}
              <span>Send Invitations</span>
            </Button>
          </form>

          {invitedList.length > 0 && (
            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--success)] flex items-center gap-1">
                <MailCheck size={12} />
                <span>Invitations Dispatched ({invitedList.length})</span>
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {invitedList.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl text-[11px] font-mono border"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[var(--text-primary)] font-medium truncate">{item.email}</span>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans border border-emerald-500/20">
                        {item.status === 'auto_enrolled' ? 'Enrolled' : 'Invited'}
                      </span>
                    </div>

                    {item.invite_url && (
                      <Button variant="secondary"
                        type="button"
                        onClick={() => handleCopyInviteUrl(item.invite_url!, i)}
                        className="shrink-0"
                        style={{ color: copiedUrlIndex === i ? 'var(--success)' : 'var(--text-tertiary)' }}
                        title="Copy direct invite link"
                      >
                        {copiedUrlIndex === i ? <Check size={11} /> : <Copy size={11} />}
                        <span className="font-sans">{copiedUrlIndex === i ? 'Copied Link' : 'Copy Link'}</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Chrome Extension Box */}
        <Card
          className="p-5 space-y-4"
          style={{ background: 'var(--bg-surface-2)' }}
        >
          <div className="flex items-center gap-2">
            <Download size={16} className="text-[var(--accent)]" />
            <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Chrome Extension Rollout
            </h3>
          </div>

          <div className="space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <p className="leading-relaxed">
              SecureGPT intercepts prompts directly in the browser across 20+ AI platforms before data leaves the device.
            </p>

            <div className="p-3 rounded-xl border font-mono text-[11px] space-y-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Extension ID:
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="select-all font-semibold truncate" style={{ color: 'var(--accent-text)' }}>
                  {extensionId}
                </span>
                <Button variant="secondary"
                  type="button"
                  onClick={handleCopyId}

                  style={{ color: copiedId ? 'var(--success)' : 'var(--text-tertiary)' }}
                  title="Copy extension ID"
                >
                  {copiedId ? <Check size={12} /> : <Copy size={12} />}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <h5 className="font-bold text-[11px]" style={{ color: 'var(--text-primary)' }}>
                Google Workspace MDM Push
              </h5>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                Navigate to <em>Devices &gt; Chrome &gt; Apps &amp; Extensions</em> and force-install using the Extension ID.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <Button variant="secondary"
          type="button"
          onClick={onBack}


        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </Button>

        <Button variant="ghost"
          type="button"
          onClick={onFinish}


        >
          <Sparkles size={14} />
          <span>Launch Enterprise Dashboard</span>
        </Button>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { UserPlus, Download, Users, RefreshCw, ArrowLeft, Sparkles, Copy, Check } from 'lucide-react'

interface TeamDeploymentStepProps {
  domain: string
  inviteEmails: string
  setInviteEmails: (val: string) => void
  invitedList: string[]
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
  const [copiedId, setCopiedId] = React.useState(false)
  const extensionId = 'jblnbphkjikjghckgehbbidbcfjgnomf'

  function handleCopyId() {
    navigator.clipboard.writeText(extensionId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
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
        <div
          className="card p-5 space-y-4"
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
              <textarea
                rows={4}
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder={`alice@${domain || 'company.com'}\nbob@${domain || 'company.com'}`}
                className="w-full p-2.5 rounded-xl border font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={sendingInvites || !inviteEmails.trim()}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
            >
              {sendingInvites ? <RefreshCw className="size-3.5 animate-spin" /> : <UserPlus size={14} />}
              <span>Send Invitations</span>
            </button>
          </form>

          {invitedList.length > 0 && (
            <div className="pt-2 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--success)' }}>
                Sent:
              </span>
              <div className="flex flex-wrap gap-1">
                {invitedList.map((em, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-md font-mono border"
                    style={{
                      background: 'var(--success-light)',
                      borderColor: 'var(--success-border)',
                      color: 'var(--success)',
                    }}
                  >
                    {em}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chrome Extension Box */}
        <div
          className="card p-5 space-y-4"
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
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 rounded-lg border text-xs cursor-pointer"
                  style={{
                    background: 'var(--bg-surface-2)',
                    borderColor: 'var(--border-2)',
                    color: copiedId ? 'var(--success)' : 'var(--text-tertiary)',
                  }}
                  title="Copy extension ID"
                >
                  {copiedId ? <Check size={12} /> : <Copy size={12} />}
                </button>
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
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
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

        <button
          type="button"
          onClick={onFinish}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 cursor-pointer"
          style={{
            background: 'var(--success)',
            boxShadow: '0 2px 8px var(--success-glow)',
          }}
        >
          <Sparkles size={14} />
          <span>Launch Enterprise Dashboard</span>
        </button>
      </div>
    </div>
  )
}

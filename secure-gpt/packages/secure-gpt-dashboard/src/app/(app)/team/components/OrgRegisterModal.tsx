'use client'

import { Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { CheckCircle2 } from 'lucide-react'

interface OrgRegisterModalProps {
  open: boolean
  onClose: () => void
  orgName: string
  setOrgName: (val: string) => void
  orgAdminEmail: string
  setOrgAdminEmail: (val: string) => void
  orgError: string | null
  orgResult: any
  registeringOrg: boolean
  onRegisterOrg: () => Promise<void>
  onCopyToken: (token: string) => void
}

export function OrgRegisterModal({
  open,
  onClose,
  orgName,
  setOrgName,
  orgAdminEmail,
  setOrgAdminEmail,
  orgError,
  orgResult,
  registeringOrg,
  onRegisterOrg,
  onCopyToken,
}: OrgRegisterModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Register Enterprise Domain
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Requires a business domain email (public email providers like Gmail/Yahoo are blocked).
          </p>
        </div>

        {orgError && (
          <div
            className="p-3 text-xs rounded-xl"
            style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
          >
            {orgError}
          </div>
        )}

        {!orgResult ? (
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Company / Organization Name
              </label>
              <input
                type="text"
                placeholder="Acme Cybersecurity Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Admin Corporate Email
              </label>
              <input
                type="email"
                placeholder="security-lead@acmecorp.com"
                value={orgAdminEmail}
                onChange={(e) => setOrgAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={registeringOrg || !orgName || !orgAdminEmail}
                onClick={onRegisterOrg}
              >
                {registeringOrg ? 'Registering…' : 'Register & Generate DNS Token'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="p-4 rounded-xl border"
              style={{ background: 'var(--success-light)', borderColor: 'var(--success-border)' }}
            >
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--success)' }}>
                <CheckCircle2 size={16} /> Organization Created ({orgResult.name})
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Add this DNS TXT record to your domain DNS settings to complete activation:
              </p>
              <div
                className="mt-3 p-3 rounded-xl font-mono text-xs break-all select-all flex items-center justify-between"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <span>{orgResult.dns_txt_token}</span>
                <button
                  type="button"
                  onClick={() => onCopyToken(orgResult.dns_txt_token)}
                  className="ml-2 px-2.5 py-1 rounded text-xs font-semibold border"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-secondary)' }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

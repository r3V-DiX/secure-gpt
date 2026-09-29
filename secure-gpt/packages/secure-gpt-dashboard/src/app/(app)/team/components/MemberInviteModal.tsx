'use client'

import { Input, Select } from '@/components/ui'
import { Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react'

interface MemberInviteModalProps {
  open: boolean
  onClose: () => void
  orgDomain: string | undefined
  isOrgActive: boolean
  inviteEmail: string
  setInviteEmail: (val: string) => void
  selectedDept: string
  setSelectedDept: (val: string) => void
  departments: any[]
  inviting: boolean
  inviteError: string | null
  inviteSuccess: string | null
  onInvite: () => Promise<void>
}

export function MemberInviteModal({
  open,
  onClose,
  orgDomain,
  isOrgActive,
  inviteEmail,
  setInviteEmail,
  selectedDept,
  setSelectedDept,
  departments,
  inviting,
  inviteError,
  inviteSuccess,
  onInvite,
}: MemberInviteModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Invite Employee
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Invited email must match your corporate domain (<b style={{ color: 'var(--accent)' }}>@{orgDomain}</b>).
          </p>
        </div>

        {!isOrgActive && (
          <div
            className="p-3.5 text-xs rounded-xl flex items-start gap-2.5"
            style={{ background: 'var(--warning-light)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Domain Verification Required</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                You cannot invite team members until domain ownership is verified via the DNS TXT challenge on this page.
              </p>
            </div>
          </div>
        )}

        {inviteError && (
          <div
            className="p-3 text-xs rounded-xl"
            style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
          >
            {inviteError}
          </div>
        )}

        {inviteSuccess && (
          <div
            className="p-3 text-xs rounded-xl flex items-center gap-2"
            style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', color: 'var(--success)' }}
          >
            <CheckCircle2 size={15} /> {inviteSuccess}
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Employee Email Address
            </label>
            <Input aria-label={`developer@${orgDomain || 'yourcompany.com'}`}
              type="email"
              placeholder={`developer@${orgDomain || 'yourcompany.com'}`}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full"

            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Department / Category
            </label>
            <Select aria-label="General / Default Org Policy"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full"

            >
              <option value="">General / Default Org Policy</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!inviteEmail.trim() || inviting || !isOrgActive}
            onClick={onInvite}
          >
            <Mail size={13} className="mr-1.5" />
            {inviting ? 'Inviting…' : 'Send Invite'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

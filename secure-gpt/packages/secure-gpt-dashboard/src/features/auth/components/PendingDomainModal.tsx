'use client'

import React, { useId } from 'react'
import { AlertTriangle, ArrowRight, UserCheck, Clock } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui'

interface PendingDomainModalProps {
  orgName: string
  domain: string
  onContinuePersonal: () => void
  onCancel: () => void
  loading: boolean
}

export function PendingDomainModal({
  orgName,
  domain,
  onContinuePersonal,
  onCancel,
  loading,
}: PendingDomainModalProps) {
  const id = useId()
  const close = () => { if (!loading) onCancel() }
  return (
    <Modal open onClose={close} closeOnBackdrop={!loading} closeOnEscape={!loading}
      aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
      <ModalHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="shrink-0 text-[var(--warning)]" aria-hidden="true" />
          <div>
            <h2 id={`${id}-title`} className="text-base font-bold text-[var(--text-primary)]">
              Domain Verification Pending
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Organization: <strong className="text-[var(--text-primary)]">{orgName}</strong> ({domain})
            </p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <div id={`${id}-description`} className="space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            Your organization administrator has registered <strong>{domain}</strong>, but domain ownership DNS verification is still in progress.
          </p>
          <p className="text-[var(--text-primary)]">
            You can create a <strong>Personal Account</strong> today. Once your administrator completes DNS verification, your account will be automatically migrated to an employee account.
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" size="lg" fullWidth onClick={close}
          disabled={loading} icon={<Clock size={14} />}>
          Wait for Org Administrator
        </Button>
        <Button type="button" size="lg" fullWidth onClick={onContinuePersonal}
          loading={loading} icon={<UserCheck size={14} />}>
          {loading ? 'Setting up account…' : 'Continue with Personal Account'}
          <ArrowRight size={13} aria-hidden="true" />
        </Button>
      </ModalFooter>
    </Modal>
  )
}

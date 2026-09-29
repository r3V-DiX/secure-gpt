'use client'

import React, { useId } from 'react'
import { Building2 } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Checkbox, FormField } from '@/components/ui'

interface CreateOrgModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  name: string
  setName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  domain: string
  setDomain: (v: string) => void
  preVerify: boolean
  setPreVerify: (v: boolean) => void
  submitting: boolean
}

export function CreateOrgModal({
  open,
  onClose,
  onSubmit,
  name,
  setName,
  email,
  setEmail,
  domain,
  setDomain,
  preVerify,
  setPreVerify,
  submitting,
}: CreateOrgModalProps) {
  const id = useId()
  const close = () => { if (!submitting) onClose() }

  return (
    <Modal open={open} onClose={close} size="lg" closeOnBackdrop={!submitting}
      closeOnEscape={!submitting} aria-labelledby={`${id}-title`}>
      <ModalHeader onClose={submitting ? undefined : close}>
        <div className="flex items-center gap-2">
          <Building2 size={20} className="shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <h2 id={`${id}-title`} className="text-base font-bold text-[var(--text-primary)]">
            Register Enterprise Organization
          </h2>
        </div>
      </ModalHeader>
      <form onSubmit={onSubmit} aria-busy={submitting}>
        <ModalBody className="space-y-4">
          <FormField label="Organization Name" required>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp" required />
          </FormField>
          <FormField label="Admin Email" required>
            <Input type="email" value={email} onChange={(e) => {
              setEmail(e.target.value)
              if (!domain && e.target.value.includes('@')) {
                setDomain(e.target.value.split('@')[1] || '')
              }
            }} placeholder="admin@acme.com" required />
          </FormField>
          <FormField label="Corporate Domain">
            <Input type="text" value={domain} onChange={(e) => setDomain(e.target.value.toLowerCase())}
              placeholder="acme.com" />
          </FormField>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Checkbox checked={preVerify} onChange={(e) => setPreVerify(e.target.checked)} />
            Pre-verify domain ownership (Bypass DNS challenge)
          </label>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={submitting}>Cancel</Button>
          <Button type="submit" loading={submitting}>Create Organization</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

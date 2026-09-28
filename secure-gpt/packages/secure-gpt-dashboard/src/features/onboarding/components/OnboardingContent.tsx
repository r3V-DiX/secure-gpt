'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { PolicyPresetKey } from '@/features/onboarding/config/org-onboarding.data'
import { OrgProfileStep } from '@/features/onboarding/components/OrgProfileStep'
import { DnsVerificationStep } from '@/features/onboarding/components/DnsVerificationStep'
import { PolicyPresetStep } from '@/features/onboarding/components/PolicyPresetStep'
import { TeamDeploymentStep } from '@/features/onboarding/components/TeamDeploymentStep'

export interface CurrentOrg {
  id: string
  name: string
  domain: string | null
  admin_email: string
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED'
  dns_txt_token: string | null
  domain_verified_at: string | null
  created_at: string
}

export interface OnboardingContentProps {
  currentStepIndex: number
  setCurrentStepIndex: (idx: number) => void
  org: CurrentOrg | null
  orgName: string
  setOrgName: (v: string) => void
  orgDomain: string
  setOrgDomain: (v: string) => void
  adminEmail: string
  setAdminEmail: (v: string) => void
  registering: boolean
  handleSaveOrgProfile: (e: React.FormEvent) => Promise<void>
  verifyingDomain: boolean
  handleVerifyDNS: () => Promise<void>
  selectedPreset: PolicyPresetKey
  setSelectedPreset: (k: PolicyPresetKey) => void
  savingPolicy: boolean
  handleApplyPolicyPreset: () => Promise<void>
  inviteEmails: string
  setInviteEmails: (v: string) => void
  invitedList: Array<{ email: string; status: 'auto_enrolled' | 'invitation_created'; invite_url?: string }>
  sendingInvites: boolean
  handleSendInvites: (e: React.FormEvent) => Promise<void>
  onVerifyLater: () => void
  onFinish: () => void
}

export function OnboardingContent({
  currentStepIndex,
  setCurrentStepIndex,
  org,
  orgName,
  setOrgName,
  orgDomain,
  setOrgDomain,
  adminEmail,
  setAdminEmail,
  registering,
  handleSaveOrgProfile,
  verifyingDomain,
  handleVerifyDNS,
  selectedPreset,
  setSelectedPreset,
  savingPolicy,
  handleApplyPolicyPreset,
  inviteEmails,
  setInviteEmails,
  invitedList,
  sendingInvites,
  handleSendInvites,
  onVerifyLater,
  onFinish,
}: OnboardingContentProps) {
  return (
    <div className="card p-6 md:p-8 animate-fade-in">
      {currentStepIndex === 0 && (
        <OrgProfileStep
          orgName={orgName}
          setOrgName={setOrgName}
          orgDomain={orgDomain}
          setOrgDomain={setOrgDomain}
          adminEmail={adminEmail}
          setAdminEmail={setAdminEmail}
          isExistingOrg={Boolean(org?.domain)}
          submitting={registering}
          onSubmit={handleSaveOrgProfile}
        />
      )}

      {currentStepIndex === 1 && (
        <DnsVerificationStep
          domain={org?.domain || orgDomain}
          dnsToken={org?.dns_txt_token || ''}
          isVerified={Boolean(org?.domain_verified_at)}
          verifiedAt={org?.domain_verified_at || null}
          verifying={verifyingDomain}
          onVerify={handleVerifyDNS}
          onBack={() => setCurrentStepIndex(0)}
          onContinue={() => setCurrentStepIndex(2)}
          onVerifyLater={onVerifyLater}
        />
      )}

      {currentStepIndex === 2 && (
        <PolicyPresetStep
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          saving={savingPolicy}
          onApply={handleApplyPolicyPreset}
          onBack={() => setCurrentStepIndex(1)}
        />
      )}

      {currentStepIndex === 3 && (
        <TeamDeploymentStep
          domain={org?.domain || orgDomain}
          inviteEmails={inviteEmails}
          setInviteEmails={setInviteEmails}
          invitedList={invitedList}
          sendingInvites={sendingInvites}
          onSendInvites={handleSendInvites}
          onBack={() => setCurrentStepIndex(2)}
          onFinish={onFinish}
        />
      )}
    </div>
  )
}

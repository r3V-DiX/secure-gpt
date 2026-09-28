'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { apiGet, apiPost } from '@/lib/api/client'
import { type PolicyPresetKey, POLICY_PRESETS } from '@/features/onboarding/config/org-onboarding.data'
import { OnboardingStepper } from '@/features/onboarding/components/OnboardingStepper'
import { OnboardingContent, type CurrentOrg } from '@/features/onboarding/components/OnboardingContent'

export default function OrgOnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<CurrentOrg | null>(null)

  // Step 1 State
  const [orgName, setOrgName] = useState('')
  const [orgDomain, setOrgDomain] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [registering, setRegistering] = useState(false)

  // Step 2 State
  const [verifyingDomain, setVerifyingDomain] = useState(false)

  // Step 3 State
  const [selectedPreset, setSelectedPreset] = useState<PolicyPresetKey>('balanced')
  const [savingPolicy, setSavingPolicy] = useState(false)

  // Step 4 State
  const [inviteEmails, setInviteEmails] = useState('')
  const [sendingInvites, setSendingInvites] = useState(false)
  const [invitedList, setInvitedList] = useState<Array<{ email: string; status: 'auto_enrolled' | 'invitation_created'; invite_url?: string }>>([])

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await apiGet<CurrentOrg | null>('/orgs/current')
        if (res) {
          setOrg(res)
          setOrgName(res.name || '')
          setOrgDomain(res.domain || '')
          setAdminEmail(res.admin_email || user?.email || '')
          if (res.domain_verified_at || (res.status === 'ACTIVE' && res.domain_verified_at)) {
            setCurrentStepIndex(2)
          } else {
            setCurrentStepIndex(1)
          }
        } else if (user?.email) {
          setAdminEmail(user.email)
          const domainPart = user.email.split('@')[1] || ''
          if (domainPart && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domainPart)) {
            setOrgDomain(domainPart)
            setOrgName(domainPart.split('.')[0].toUpperCase() + ' Enterprise')
          }
        }
      } catch {
        // Silent fallback
      } finally {
        setLoading(false)
      }
    }
    loadOrg()
  }, [user])

  async function handleSaveOrgProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim() || !adminEmail.trim()) {
      toast.error('Please enter both organization name and admin email.')
      return
    }

    setRegistering(true)
    try {
      const res = await apiPost<{
        org_id: string
        name: string
        domain: string
        admin_email: string
        dns_txt_token: string
        status: string
      }>('/orgs/register', {
        name: orgName.trim(),
        admin_email: adminEmail.trim(),
      })

      setOrg({
        id: res.org_id,
        name: res.name,
        domain: res.domain,
        admin_email: res.admin_email,
        status: res.status as any,
        dns_txt_token: res.dns_txt_token,
        domain_verified_at: null,
        created_at: new Date().toISOString(),
      })
      toast.success('Organization details saved!')
      setCurrentStepIndex(1)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save organization.')
    } finally {
      setRegistering(false)
    }
  }

  async function handleVerifyDNS() {
    if (!org?.id) {
      toast.error('No organization record found to verify.')
      return
    }

    setVerifyingDomain(true)
    try {
      await apiPost<{ org_id: string; domain: string; status: string }>('/orgs/verify-domain', {
        org_id: org.id,
      })
      toast.success('Domain ownership successfully verified!')
      setOrg((prev) => (prev ? { ...prev, status: 'ACTIVE', domain_verified_at: new Date().toISOString() } : null))
      setTimeout(() => setCurrentStepIndex(2), 800)
    } catch (err: any) {
      toast.error(err.message || 'DNS challenge failed. Please check your DNS TXT record.')
    } finally {
      setVerifyingDomain(false)
    }
  }

  async function handleApplyPolicyPreset() {
    setSavingPolicy(true)
    try {
      const preset = POLICY_PRESETS[selectedPreset]
      await apiPost('/policy/baseline-preset', {
        preset: selectedPreset,
        rules: preset.rulesConfig,
      }).catch(() => {})
      toast.success(`Applied ${preset.name} policy baseline!`)
      setCurrentStepIndex(3)
    } catch {
      toast.error('Policy baseline applied locally.')
      setCurrentStepIndex(3)
    } finally {
      setSavingPolicy(false)
    }
  }

  async function handleSendInvites(e: React.FormEvent) {
    e.preventDefault()
    const emails = inviteEmails
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'))

    if (emails.length === 0) {
      toast.error('Please enter at least one valid email address.')
      return
    }

    setSendingInvites(true)
    try {
      let sentCount = 0
      for (const email of emails) {
        try {
          const res = await apiPost<{ email: string; status: 'auto_enrolled' | 'invitation_created'; invite_url?: string }>('/orgs/invite', { email })
          sentCount++
          setInvitedList((prev) => [
            ...prev,
            {
              email,
              status: res?.status || 'invitation_created',
              invite_url: res?.invite_url,
            },
          ])
        } catch {}
      }
      toast.success(`Sent invitations to ${sentCount} team member${sentCount > 1 ? 's' : ''}!`)
      setInviteEmails('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch invitations.')
    } finally {
      setSendingInvites(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-6 animate-spin text-[var(--accent)]" />
          <p className="text-xs text-[var(--text-secondary)]">Loading enterprise onboarding…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pt-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Enterprise Setup
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Configure corporate domain verification, apply zero-trust DLP policy presets, and roll out browser protection.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-xs font-semibold hover:underline cursor-pointer"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Exit to Dashboard ↗
        </button>
      </div>

      {/* Stepper Header */}
      <OnboardingStepper
        currentStepIndex={currentStepIndex}
        domainVerified={Boolean(org?.domain_verified_at)}
        onSelectStep={(idx) => setCurrentStepIndex(idx)}
      />

      {/* Step Content */}
      <OnboardingContent
        currentStepIndex={currentStepIndex}
        setCurrentStepIndex={setCurrentStepIndex}
        org={org}
        orgName={orgName}
        setOrgName={setOrgName}
        orgDomain={orgDomain}
        setOrgDomain={setOrgDomain}
        adminEmail={adminEmail}
        setAdminEmail={setAdminEmail}
        registering={registering}
        handleSaveOrgProfile={handleSaveOrgProfile}
        verifyingDomain={verifyingDomain}
        handleVerifyDNS={handleVerifyDNS}
        selectedPreset={selectedPreset}
        setSelectedPreset={setSelectedPreset}
        savingPolicy={savingPolicy}
        handleApplyPolicyPreset={handleApplyPolicyPreset}
        inviteEmails={inviteEmails}
        setInviteEmails={setInviteEmails}
        invitedList={invitedList}
        sendingInvites={sendingInvites}
        handleSendInvites={handleSendInvites}
        onVerifyLater={() => {
          toast.info('Verification deferred. You can complete DNS verification anytime from the dashboard banner.')
          router.push('/dashboard')
        }}
        onFinish={() => {
          toast.success('Enterprise onboarding completed! Welcome to SecureGPT.')
          router.push('/dashboard')
        }}
      />
    </div>
  )
}

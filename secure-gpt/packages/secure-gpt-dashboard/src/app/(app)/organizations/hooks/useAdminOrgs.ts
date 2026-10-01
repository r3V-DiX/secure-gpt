import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/contexts/toast-context'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client'
import { AdminOrgItem } from '../components/OrgTableRow'
import { OrgStatusFilter } from '../components/OrgFilterBar'

interface OrgListResponse {
  items: AdminOrgItem[]
  total: number
  limit: number
  offset: number
}

export function useAdminOrgs(isSuperAdmin: boolean) {
  const { toast } = useToast()

  const [orgs, setOrgs] = useState<AdminOrgItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<OrgStatusFilter>('ALL')

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgEmail, setNewOrgEmail] = useState('')
  const [newOrgDomain, setNewOrgDomain] = useState('')
  const [newOrgPreVerify, setNewOrgPreVerify] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Freeze Modal State
  const [freezeModalOpen, setFreezeModalOpen] = useState(false)
  const [targetOrgToFreeze, setTargetOrgToFreeze] = useState<AdminOrgItem | null>(null)

  // Action Loading states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  async function fetchOrgs() {
    try {
      setLoading(true)
      const res = await apiGet<OrgListResponse>('/admin/orgs?limit=100')
      if (res?.items) {
        setOrgs(res.items)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      fetchOrgs()
    }
  }, [isSuperAdmin])

  const filteredOrgs = useMemo(() => {
    return orgs.filter((org) => {
      if (selectedStatus !== 'ALL' && org.status !== selectedStatus) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = org.name?.toLowerCase().includes(q)
        const matchesDomain = org.domain?.toLowerCase().includes(q)
        const matchesEmail = org.admin_email?.toLowerCase().includes(q)
        if (!matchesName && !matchesDomain && !matchesEmail) return false
      }
      return true
    })
  }, [orgs, selectedStatus, searchQuery])

  async function handleManualVerify(orgId: string, orgName: string) {
    setActionInProgress(orgId)
    try {
      await apiPost('/admin/orgs/verify', { org_id: orgId })
      toast.success(`Domain verified for "${orgName}"!`)
      setOrgs((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: 'ACTIVE', domain_verified_at: new Date().toISOString() } : o))
      )
    } catch (err: any) {
      toast.error(err.message || 'Verification override failed')
    } finally {
      setActionInProgress(null)
    }
  }

  async function handleToggleStatus(org: AdminOrgItem) {
    const nextStatus = org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setActionInProgress(org.id)
    try {
      await apiPatch(`/admin/orgs/${org.id}/status`, {
        status: nextStatus,
        is_active: nextStatus === 'ACTIVE',
      })
      toast.success(`Organization status set to ${nextStatus}`)
      setOrgs((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, status: nextStatus, is_active: nextStatus === 'ACTIVE' } : o))
      )
    } catch (err: any) {
      toast.error(err.message || 'Failed to update organization status')
    } finally {
      setActionInProgress(null)
    }
  }

  function openFreezeModal(org: AdminOrgItem) {
    setTargetOrgToFreeze(org)
    setFreezeModalOpen(true)
  }

  function closeFreezeModal() {
    setFreezeModalOpen(false)
    setTargetOrgToFreeze(null)
  }

  async function handleConfirmFreeze(orgId: string, confirmation: string) {
    try {
      await apiPost(`/admin/orgs/${orgId}/freeze`, { confirmation })
      toast.success('Emergency killswitch executed: organization is frozen')
      setOrgs((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: 'SUSPENDED', is_active: false } : o))
      )
    } catch (err: any) {
      toast.error(err?.message || 'Emergency freeze failed')
      throw err
    }
  }

  async function handleImpersonate(org: AdminOrgItem) {
    if (org.user_count === 0) {
      toast.error('No users in organization to impersonate')
      return
    }
    setActionInProgress(org.id)
    try {
      const res = await apiPost<{ handoff_ticket: string }>(`/admin/orgs/${org.id}/impersonate`)
      toast.success(`Entering read-only impersonation mode for ${org.name}...`)
      const targetUrl =
        process.env.NODE_ENV === 'production'
          ? 'https://securegpt.rkavach.com/api/v1/auth/impersonate/redeem'
          : 'http://localhost:3000/api/v1/auth/impersonate/redeem'
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = targetUrl
      const ticket = document.createElement('input')
      ticket.type = 'hidden'
      ticket.name = 'ticket'
      ticket.value = res.handoff_ticket
      form.appendChild(ticket)
      document.body.appendChild(form)
      form.submit()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start impersonation session')
    } finally {
      setActionInProgress(null)
    }
  }

  async function handleDeleteOrg(orgId: string, orgName: string) {
    if (!confirm(`Are you sure you want to delete organization "${orgName}"? All users will be unlinked.`)) {
      return
    }
    setActionInProgress(orgId)
    try {
      await apiDelete(`/admin/orgs/${orgId}`)
      toast.success(`Organization "${orgName}" deleted`)
      setOrgs((prev) => prev.filter((o) => o.id !== orgId))
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete organization')
    } finally {
      setActionInProgress(null)
    }
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!newOrgName.trim() || !newOrgEmail.trim()) {
      toast.error('Please provide organization name and admin email')
      return
    }

    setSubmitting(true)
    try {
      await apiPost<AdminOrgItem>('/admin/orgs', {
        name: newOrgName.trim(),
        admin_email: newOrgEmail.trim(),
        domain: newOrgDomain.trim() || undefined,
        pre_verify: newOrgPreVerify,
      })
      toast.success(`Organization "${newOrgName}" created successfully!`)
      setCreateModalOpen(false)
      setNewOrgName('')
      setNewOrgEmail('')
      setNewOrgDomain('')
      setNewOrgPreVerify(false)
      fetchOrgs()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create organization')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    orgs,
    loading,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    filteredOrgs,
    fetchOrgs,
    actionInProgress,
    handleManualVerify,
    handleToggleStatus,
    freezeModalOpen,
    targetOrgToFreeze,
    openFreezeModal,
    closeFreezeModal,
    handleConfirmFreeze,
    handleImpersonate,
    handleDeleteOrg,
    createModalOpen,
    setCreateModalOpen,
    newOrgName,
    setNewOrgName,
    newOrgEmail,
    setNewOrgEmail,
    newOrgDomain,
    setNewOrgDomain,
    newOrgPreVerify,
    setNewOrgPreVerify,
    submitting,
    handleCreateOrg,
  }
}

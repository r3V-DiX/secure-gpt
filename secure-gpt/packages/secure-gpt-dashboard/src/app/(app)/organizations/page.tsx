'use client'

import { PageHeader } from '@/components/ui'
import { Card } from '@/components/ui'
import { IconButton } from '@/components/ui'
import { Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui'
import React, { useState, useEffect, useMemo } from 'react'
import {
  Building2, Plus, ShieldAlert, RefreshCw
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client'
import { AdminOrgItem, OrgTableRow } from './components/OrgTableRow'
import { CreateOrgModal } from './components/CreateOrgModal'
import { OrgFilterBar, OrgStatusFilter } from './components/OrgFilterBar'

interface OrgListResponse {
  items: AdminOrgItem[]
  total: number
  limit: number
  offset: number
}

export default function AdminOrganizationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [orgs, setOrgs] = useState<AdminOrgItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<OrgStatusFilter>('ALL')

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgEmail, setNewOrgEmail] = useState('')
  const [newOrgDomain, setNewOrgDomain] = useState('')
  const [newOrgPreVerify, setNewOrgPreVerify] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Action Loading states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'platform_super_admin'

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

  // Filtered List
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

  // Manual Verify Domain Action
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

  // Toggle Status Action
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

  if (!isSuperAdmin) {
    return (
      <div className="flex h-[70vh] items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="size-12 rounded-md bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Access Denied</h2>
          <p className="text-[13.5px] text-[var(--text-secondary)]">
            Only Global Super Administrators have permission to manage organizations on port 3001.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex-1 space-y-6 animate-fade-in pb-16">
      {/* ── Page Header ────────────────────────────────────────── */}
      <PageHeader title={<>
            <Building2 className="text-[var(--accent)] size-5 shrink-0" />
            Enterprise Organizations
          </>} description={<>
            Manage enterprise tenants, manual domain verification overrides, and cross-tenant telemetry.
          </>} actions={<><div className="flex items-center gap-2.5">
          <IconButton aria-label="Refresh organizations list" variant="secondary"
            type="button"
            onClick={fetchOrgs}
            disabled={loading}


            title="Refresh organizations list"
          >
            <RefreshCw size={15} className={clsx(loading && 'animate-spin')} />
          </IconButton>

          <Button variant="primary"
            type="button"
            onClick={() => setCreateModalOpen(true)}


          >
            <Plus size={15} />
            <span>New Organization</span>
          </Button>
        </div></>} />

      {/* ── Filters & Search ────────────────────────────────────── */}
      <OrgFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* ── Organizations Table ─────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left text-xs">
            <TableHead
              className="text-[10px] font-bold uppercase tracking-wider border-b"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-tertiary)',
              }}
            >
              <TableRow>
                <TableHeaderCell className="px-5 py-3.5">Organization / Domain</TableHeaderCell>
                <TableHeaderCell className="px-4 py-3.5">Admin Contact</TableHeaderCell>
                <TableHeaderCell className="px-4 py-3.5">Status</TableHeaderCell>
                <TableHeaderCell className="px-4 py-3.5">Domain Verification</TableHeaderCell>
                <TableHeaderCell className="px-4 py-3.5 text-center">Users</TableHeaderCell>
                <TableHeaderCell className="px-4 py-3.5 text-center">Depts</TableHeaderCell>
                <TableHeaderCell className="px-5 py-3.5 text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y divide-[var(--border)]">
              {loading && orgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-[var(--text-muted)]">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[var(--accent)]" />
                    <span>Loading organizations...</span>
                  </TableCell>
                </TableRow>
              ) : filteredOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-12 text-center text-[var(--text-muted)]">
                    <Building2 className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-[14px]">No organizations found</p>
                    <p className="text-[12px] mt-0.5">Try adjusting your search query or status filter.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrgs.map((org) => (
                  <OrgTableRow
                    key={org.id}
                    org={org}
                    actionInProgress={actionInProgress}
                    onManualVerify={handleManualVerify}
                    onToggleStatus={handleToggleStatus}
                    onDeleteOrg={handleDeleteOrg}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── New Organization Modal ───────────────────────────────── */}
      <CreateOrgModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateOrg}
        name={newOrgName}
        setName={setNewOrgName}
        email={newOrgEmail}
        setEmail={setNewOrgEmail}
        domain={newOrgDomain}
        setDomain={setNewOrgDomain}
        preVerify={newOrgPreVerify}
        setPreVerify={setNewOrgPreVerify}
        submitting={submitting}
      />
    </div>
  )
}

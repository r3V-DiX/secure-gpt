'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Building2, Search, Plus, Globe2, ShieldCheck, ShieldAlert,
  Users, CheckCircle2, AlertCircle, RefreshCw, MoreVertical,
  X, Check, Trash2, Ban, PlayCircle, ExternalLink
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client'

interface AdminOrgItem {
  id: string
  name: string
  domain: string | null
  admin_email: string
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'
  plan: string
  is_active: boolean
  dns_txt_token: string | null
  domain_verified_at: string | null
  created_at: string | null
  user_count: number
  active_user_count: number
  department_count: number
}

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
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'>('ALL')

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

  // Delete Org Action
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

  // Create Org Submit
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
          <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
            <Building2 className="text-[var(--accent)] size-5 shrink-0" />
            Enterprise Organizations
          </h1>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Manage enterprise tenants, manual domain verification overrides, and cross-tenant telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchOrgs}
            disabled={loading}
            className="p-2 rounded-xl border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
            title="Refresh organizations list"
          >
            <RefreshCw size={15} className={clsx(loading && 'animate-spin')} />
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 cursor-pointer shadow-sm"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
          >
            <Plus size={15} />
            <span>New Organization</span>
          </button>
        </div>
      </div>

      {/* ── Filters & Search ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, domain, or admin email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] self-start sm:self-auto">
          {(['ALL', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors',
                selectedStatus === st
                  ? 'bg-[var(--bg-surface)] text-[var(--accent)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {st === 'ALL'
                ? 'All Orgs'
                : st === 'PENDING_VERIFICATION'
                ? 'Pending'
                : st === 'ACTIVE'
                ? 'Active'
                : 'Suspended'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Organizations Table ─────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="text-[10px] font-bold uppercase tracking-wider border-b"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-tertiary)',
              }}
            >
              <tr>
                <th className="px-5 py-3.5">Organization / Domain</th>
                <th className="px-4 py-3.5">Admin Contact</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Domain Verification</th>
                <th className="px-4 py-3.5 text-center">Users</th>
                <th className="px-4 py-3.5 text-center">Depts</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading && orgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[var(--text-muted)]">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[var(--accent)]" />
                    <span>Loading organizations...</span>
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[var(--text-muted)]">
                    <Building2 className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-[14px]">No organizations found</p>
                    <p className="text-[12px] mt-0.5">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const isVerified = Boolean(org.domain_verified_at)
                  const isPending = org.status === 'PENDING_VERIFICATION'
                  const isSuspended = org.status === 'SUSPENDED'

                  return (
                    <tr key={org.id} className="hover:bg-[var(--bg-surface-2)]/60 transition-colors">
                      {/* Name & Domain */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)] font-bold text-xs">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-[13.5px] text-[var(--text-primary)]">
                              {org.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-[var(--text-muted)] font-mono">
                              <Globe2 size={12} />
                              <span>{org.domain || 'no domain'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Admin Email */}
                      <td className="px-4 py-4 text-[var(--text-secondary)] font-mono text-[12px]">
                        {org.admin_email}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider',
                            org.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          )}
                        >
                          <span className={clsx(
                            'size-1.5 rounded-full',
                            org.status === 'ACTIVE' ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                          )} />
                          {org.status === 'PENDING_VERIFICATION' ? 'Pending' : org.status}
                        </span>
                      </td>

                      {/* Domain Verification */}
                      <td className="px-4 py-4">
                        {isVerified ? (
                          <div className="flex items-center gap-1.5 text-emerald-500 text-[12px] font-semibold">
                            <CheckCircle2 size={15} />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-amber-500 text-[12px] font-semibold">
                              <AlertCircle size={15} />
                              <span>Unverified</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleManualVerify(org.id, org.name)}
                              disabled={actionInProgress === org.id}
                              className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                              title="Override and mark domain as verified"
                            >
                              Verify DNS
                            </button>
                          </div>
                        )}
                      </td>

                      {/* User Stats */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-[13px] text-[var(--text-primary)]">
                          {org.active_user_count}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] font-normal">
                          {' '}/ {org.user_count}
                        </span>
                      </td>

                      {/* Dept Stats */}
                      <td className="px-4 py-4 text-center font-bold text-[13px] text-[var(--text-secondary)]">
                        {org.department_count}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Suspend / Activate Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(org)}
                            disabled={actionInProgress === org.id}
                            className={clsx(
                              'p-1.5 rounded-lg border transition-colors',
                              isSuspended
                                ? 'text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10'
                                : 'text-amber-500 border-amber-500/30 hover:bg-amber-500/10'
                            )}
                            title={isSuspended ? 'Activate organization' : 'Suspend organization'}
                          >
                            {isSuspended ? <PlayCircle size={15} /> : <Ban size={15} />}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrg(org.id, org.name)}
                            disabled={actionInProgress === org.id}
                            className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete organization"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── New Organization Modal ───────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)] font-bold">
                  <Building2 size={17} />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Register Enterprise Organization
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-[var(--text-primary)] mb-1">
                  Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-[var(--text-primary)] mb-1">
                  Admin Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={newOrgEmail}
                  onChange={(e) => {
                    setNewOrgEmail(e.target.value)
                    if (!newOrgDomain && e.target.value.includes('@')) {
                      setNewOrgDomain(e.target.value.split('@')[1] || '')
                    }
                  }}
                  placeholder="admin@acme.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-[var(--text-primary)] mb-1">
                  Corporate Domain
                </label>
                <input
                  type="text"
                  value={newOrgDomain}
                  onChange={(e) => setNewOrgDomain(e.target.value.toLowerCase())}
                  placeholder="acme.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="pre_verify_checkbox"
                  checked={newOrgPreVerify}
                  onChange={(e) => setNewOrgPreVerify(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <label htmlFor="pre_verify_checkbox" className="text-[13px] text-[var(--text-secondary)] select-none">
                  Pre-verify domain ownership (Bypass DNS challenge)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-[13.5px] hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? <RefreshCw size={15} className="animate-spin" /> : null}
                  <span>Create Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

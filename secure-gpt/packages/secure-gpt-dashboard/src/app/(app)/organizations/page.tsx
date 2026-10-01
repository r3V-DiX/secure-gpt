'use client'

import { PageHeader, IconButton, Button } from '@/components/ui'
import React from 'react'
import { Building2, Plus, ShieldAlert, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/auth-context'
import { OrgTable } from './components/OrgTable'
import { CreateOrgModal } from './components/CreateOrgModal'
import { FreezeOrgModal } from './components/FreezeOrgModal'
import { OrgFilterBar } from './components/OrgFilterBar'
import { useAdminOrgs } from './hooks/useAdminOrgs'

export default function AdminOrganizationsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'platform_super_admin'

  const {
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
  } = useAdminOrgs(Boolean(isSuperAdmin))

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
      <PageHeader
        title={<><Building2 className="text-[var(--accent)] size-5 shrink-0" /> Enterprise Organizations</>}
        description="Manage enterprise tenants, manual domain verification overrides, and cross-tenant telemetry."
        actions={
          <div className="flex items-center gap-2.5">
            <IconButton
              aria-label="Refresh organizations list"
              variant="secondary"
              type="button"
              onClick={fetchOrgs}
              disabled={loading}
              title="Refresh organizations list"
            >
              <RefreshCw size={15} className={clsx(loading && 'animate-spin')} />
            </IconButton>
            <Button variant="primary" type="button" onClick={() => setCreateModalOpen(true)}>
              <Plus size={15} />
              <span>New Organization</span>
            </Button>
          </div>
        }
      />

      {/* ── Filters & Search ────────────────────────────────────── */}
      <OrgFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* ── Organizations Table ─────────────────────────────────── */}
      <OrgTable
        loading={loading}
        orgs={orgs}
        filteredOrgs={filteredOrgs}
        actionInProgress={actionInProgress}
        onManualVerify={handleManualVerify}
        onToggleStatus={handleToggleStatus}
        onDeleteOrg={handleDeleteOrg}
        onOpenFreezeModal={openFreezeModal}
        onImpersonate={handleImpersonate}
      />

      {/* ── Emergency Killswitch Freeze Modal ─────────────────────── */}
      <FreezeOrgModal
        isOpen={freezeModalOpen}
        org={targetOrgToFreeze}
        onClose={closeFreezeModal}
        onConfirmFreeze={handleConfirmFreeze}
      />

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

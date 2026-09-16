'use client'
// packages/secure-gpt-dashboard/src/app/(app)/team/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTeam } from '@/features/team/hooks/use-team'
import {
  Building2, FolderPlus, Plus, AlertCircle,
  Layers, SlidersHorizontal, UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import { useAuth } from '@/contexts/auth-context'
import { apiPost } from '@/lib/api/client'

import { OrgVerificationCard } from './components/OrgVerificationCard'
import { DepartmentModal } from './components/DepartmentModal'
import { MemberInviteModal } from './components/MemberInviteModal'
import { OrgRegisterModal } from './components/OrgRegisterModal'
import { TeamMemberTable } from './components/TeamMemberTable'
import { TeamBulkActionsBar } from './components/TeamBulkActionsBar'
import { TeamCsvImportModal } from './components/TeamCsvImportModal'

export default function TeamPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    users,
    departments,
    currentOrg,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    setPage,
    inviteMember,
    createDepartment,
    assignDepartment,
    changeUserRole,
    deleteUser,
    executeBulkAction,
    exportCsv,
    fetchTeamData,
  } = useTeam()

  // Modals
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deptOpen, setDeptOpen] = useState(false)
  const [orgRegisterOpen, setOrgRegisterOpen] = useState(false)
  const [csvImportOpen, setCsvImportOpen] = useState(false)

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelectUser = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    const pageIds = users.map((u) => u.id)
    const allPageSelected = pageIds.every((id) => selectedIds.includes(id))
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  // Dept state
  const [deptName, setDeptName] = useState('')
  const [deptDesc, setDeptDesc] = useState('')
  const [creatingDept, setCreatingDept] = useState(false)
  const [deptError, setDeptError] = useState<string | null>(null)

  // Org Register State
  const [orgName, setOrgName] = useState('')
  const [orgAdminEmail, setOrgAdminEmail] = useState(user?.email || '')
  const [registeringOrg, setRegisteringOrg] = useState(false)
  const [orgResult, setOrgResult] = useState<any>(null)
  const [orgError, setOrgError] = useState<string | null>(null)

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)
    const res = await inviteMember(inviteEmail.trim(), selectedDept || undefined)
    setInviting(false)
    if (res.success) {
      setInviteSuccess(`Successfully invited ${inviteEmail.trim()}!`)
      setInviteEmail('')
      setTimeout(() => {
        setInviteOpen(false)
        setInviteSuccess(null)
      }, 1500)
    } else {
      setInviteError(res.error || 'Failed to invite user.')
    }
  }

  const handleCreateDept = async () => {
    if (!deptName.trim()) return
    setCreatingDept(true)
    setDeptError(null)
    const res = await createDepartment(deptName.trim(), deptDesc.trim() || undefined)
    setCreatingDept(false)
    if (res.success) {
      setDeptOpen(false)
      setDeptName('')
      setDeptDesc('')
    } else {
      setDeptError(res.error || 'Failed to create department.')
    }
  }

  const handleRegisterOrg = async () => {
    if (!orgName.trim() || !orgAdminEmail.trim()) return
    setRegisteringOrg(true)
    setOrgError(null)
    try {
      const res = await apiPost<any>('/orgs/register', {
        name: orgName.trim(),
        admin_email: orgAdminEmail.trim(),
      })
      const orgData = res?.data || res
      setOrgResult(orgData)
      await fetchTeamData()
    } catch (err: any) {
      setOrgError(err.message || 'Failed to register organization')
    } finally {
      setRegisteringOrg(false)
    }
  }

  const userDomain = user?.email?.split('@')[1]
  const orgDomain = currentOrg?.domain || userDomain
  const rawStatus = String(currentOrg?.status || 'PENDING_VERIFICATION')
  const isOrgActive = rawStatus.toUpperCase().includes('ACTIVE')

  if (loading && !users.length) {
    return (
      <div className="space-y-6 animate-fade-in max-w-6xl">
        <div className="skeleton h-10 w-64 rounded-2xl" />
        <div className="skeleton h-44 rounded-3xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-32 animate-fade-in w-full">
      {/* ── 1. Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="text-[var(--accent)]" size={24} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {currentOrg ? currentOrg.name : 'Team & Organization Admin'}
            </h1>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Manage departmental policies, domain verification gating, and employee DLP roster.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!currentOrg && (
            <Button variant="primary" size="sm" onClick={() => setOrgRegisterOpen(true)}>
              <Building2 size={13} className="mr-1.5" /> Register Organization
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeptOpen(true)}
            disabled={!isOrgActive}
            title={!isOrgActive ? 'Verify domain to create departments' : undefined}
          >
            <FolderPlus size={13} className="mr-1.5" /> New Department
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold"
          style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
        >
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 2. Domain Verification Gating Status ────────────────────────── */}
      <OrgVerificationCard
        currentOrg={currentOrg}
        user={user}
        onVerified={fetchTeamData}
      />

      {/* ── 3. Department Categories Deck ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <Layers size={14} style={{ color: 'var(--accent)' }} /> Department DLP Profiles ({departments.length})
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Tier 3 policies customize masking & blocking rules per department (e.g. Engineering vs Finance).
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeptOpen(true)}
            disabled={!isOrgActive}
            title={!isOrgActive ? 'Verify domain to create employee categories' : undefined}
          >
            <Plus size={12} className="mr-1" /> Add Category
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departments.length === 0 ? (
            <div
              className="col-span-full p-8 text-center border border-dashed rounded-2xl"
              style={{ borderColor: 'var(--border-2)', background: 'var(--bg-surface)' }}
            >
              <div
                className="size-9 rounded-xl mx-auto flex items-center justify-center mb-2"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                <FolderPlus size={18} />
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                No custom departments created yet
              </p>
              <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
                Create categories like <b>Engineering</b>, <b>Finance</b>, or <b>HR</b> to apply specialized masking rules.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setDeptOpen(true)} className="mt-3">
                Create First Department
              </Button>
            </div>
          ) : (
            departments.map((dept) => {
              const memberCount = users.filter((u) => u.departmentId === dept.id).length
              return (
                <div
                  key={dept.id}
                  className="p-5 rounded-2xl border transition-all flex flex-col justify-between group hover:border-[var(--accent)] hover:shadow-md"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {dept.name}
                      </h4>
                      <span
                        className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                      >
                        {memberCount} members
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2 mb-4" style={{ color: 'var(--text-tertiary)' }}>
                      {dept.description || 'General organizational security policies apply.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/policy?department_id=${dept.id}`)}
                      className="flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-[var(--accent-light)] hover:text-[var(--accent)] hover:border-[var(--accent-border)]"
                      style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      <SlidersHorizontal size={12} /> Configure Policy
                    </button>
                    <button
                      type="button"
                      disabled={!isOrgActive}
                      onClick={() => {
                        if (!isOrgActive) return
                        setSelectedDept(dept.id)
                        setInviteOpen(true)
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer hover:bg-[var(--bg-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-secondary)' }}
                      title={!isOrgActive ? 'Verify domain to invite employees' : 'Invite colleague to this category'}
                    >
                      <UserPlus size={12} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── 4. Active Employees Table ─────────────────────────────────────── */}
      <TeamMemberTable
        users={users}
        departments={departments}
        currentUser={user}
        isOrgActive={isOrgActive}
        loading={loading}
        filters={filters}
        pagination={pagination}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectUser}
        onToggleSelectAll={toggleSelectAll}
        onOpenInvite={() => setInviteOpen(true)}
        onOpenCsvImport={() => setCsvImportOpen(true)}
        onExportCsv={exportCsv}
        onUpdateFilters={updateFilters}
        onPageChange={setPage}
        onChangeRole={changeUserRole}
        onAssignDepartment={assignDepartment}
        onDeleteUser={deleteUser}
      />

      {/* Floating Bulk Operations Toolbar */}
      <TeamBulkActionsBar
        selectedIds={selectedIds}
        totalCount={pagination.total}
        departments={departments}
        onClearSelection={() => setSelectedIds([])}
        onBulkAction={(action, extra) => executeBulkAction(selectedIds, action, extra)}
      />

      {/* CSV Import Modal */}
      <TeamCsvImportModal
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        onSuccess={() => void fetchTeamData()}
      />

      {/* ── 5. Modals ────────────────────────────────────────────────────── */}
      <MemberInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        orgDomain={orgDomain}
        isOrgActive={isOrgActive}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
        departments={departments}
        inviting={inviting}
        inviteError={inviteError}
        inviteSuccess={inviteSuccess}
        onInvite={handleInvite}
      />

      <DepartmentModal
        open={deptOpen}
        onClose={() => setDeptOpen(false)}
        isOrgActive={isOrgActive}
        deptName={deptName}
        setDeptName={setDeptName}
        deptDesc={deptDesc}
        setDeptDesc={setDeptDesc}
        deptError={deptError}
        creatingDept={creatingDept}
        onCreateDept={handleCreateDept}
      />

      <OrgRegisterModal
        open={orgRegisterOpen}
        onClose={() => {
          setOrgRegisterOpen(false)
          setOrgResult(null)
        }}
        orgName={orgName}
        setOrgName={setOrgName}
        orgAdminEmail={orgAdminEmail}
        setOrgAdminEmail={setOrgAdminEmail}
        orgError={orgError}
        orgResult={orgResult}
        registeringOrg={registeringOrg}
        onRegisterOrg={handleRegisterOrg}
        onCopyToken={(token) => {
          navigator.clipboard.writeText(token)
        }}
      />
    </div>
  )
}

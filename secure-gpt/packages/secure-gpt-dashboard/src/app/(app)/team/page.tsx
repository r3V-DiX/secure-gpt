'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTeam } from '@/features/team/hooks/use-team'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { apiPost } from '@/lib/api/client'

import { OrgVerificationCard } from './components/OrgVerificationCard'
import { TeamMemberTable } from './components/TeamMemberTable'
import { TeamBulkActionsBar } from './components/TeamBulkActionsBar'
import { TeamCsvImportModal } from './components/TeamCsvImportModal'
import { TeamPageHeader } from './components/TeamPageHeader'
import { DepartmentDeck } from './components/DepartmentDeck'
import { TeamPageModals } from './components/TeamPageModals'

export default function TeamPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (authLoading || !user) return
    const isOrgAdminOrSuper =
      ['super_admin', 'platform_super_admin', 'org_admin', 'security_admin', 'employer'].includes(user.role) ||
      Boolean(user.orgId)
    if (!isOrgAdminOrSuper) {
      toast.error('Team management is restricted to Organization Administrators. Complete Organization Onboarding to set up a team.')
      router.replace('/dashboard')
    }
  }, [user, authLoading, router, toast])
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
  const isAuthorized =
    ['super_admin', 'platform_super_admin', 'org_admin', 'security_admin', 'employer'].includes(user?.role || '') ||
    Boolean(user?.orgId)

  if (!authLoading && !isAuthorized) {
    return null
  }

  if (loading && !users.length) {
    return (
      <div className="space-y-6 animate-fade-in max-w-6xl">
        <div className="skeleton h-10 w-64 rounded-md" />
        <div className="skeleton h-44 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          <div className="skeleton h-32 rounded-md" />
          <div className="skeleton h-32 rounded-md" />
          <div className="skeleton h-32 rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8 pb-32 animate-fade-in w-full">
      {/* ── 1. Page Header ─────────────────────────────────────────────── */}
      <TeamPageHeader
        currentOrg={currentOrg}
        isOrgActive={isOrgActive}
        onRegisterOrgClick={() => setOrgRegisterOpen(true)}
        onNewDeptClick={() => setDeptOpen(true)}
      />

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
      <DepartmentDeck
        departments={departments}
        users={users}
        isOrgActive={isOrgActive}
        onOpenDeptModal={() => setDeptOpen(true)}
        onOpenInviteWithDept={(deptId) => {
          setSelectedDept(deptId)
          setInviteOpen(true)
        }}
      />

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
    </div>

      {/* Floating Bulk Operations Toolbar (Rendered outside animated/transformed parent) */}
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
      <TeamPageModals
        inviteOpen={inviteOpen}
        onCloseInvite={() => setInviteOpen(false)}
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
        deptOpen={deptOpen}
        onCloseDept={() => setDeptOpen(false)}
        deptName={deptName}
        setDeptName={setDeptName}
        deptDesc={deptDesc}
        setDeptDesc={setDeptDesc}
        deptError={deptError}
        creatingDept={creatingDept}
        onCreateDept={handleCreateDept}
        orgRegisterOpen={orgRegisterOpen}
        onCloseOrgRegister={() => {
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
      />
    </>
  )
}

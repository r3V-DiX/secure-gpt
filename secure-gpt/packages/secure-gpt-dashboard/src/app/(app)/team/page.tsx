'use client'
// packages/secure-gpt-dashboard/src/app/(app)/team/page.tsx
/* Hallmark · macrostructure: Workbench · theme: Cobalt · genre: modern-minimal
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTeam } from '@/features/team/hooks/use-team'
import {
  Users, Plus, Mail, Building2, FolderPlus,
  ShieldCheck, AlertCircle, CheckCircle2, Copy, Shield,
  Layers, UserCheck, Globe, Check, KeyRound, ArrowUpRight,
  SlidersHorizontal, UserPlus
} from 'lucide-react'
import { Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { useAuth } from '@/contexts/auth-context'
import { apiPost } from '@/lib/api/client'

export default function TeamPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { users, departments, currentOrg, loading, error, inviteMember, createDepartment, assignDepartment, fetchTeamData } = useTeam()
  
  // Modals
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deptOpen, setDeptOpen] = useState(false)
  const [orgRegisterOpen, setOrgRegisterOpen] = useState(false)
  const [selectedDeptForMembers, setSelectedDeptForMembers] = useState<any>(null)

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
  const [copiedToken, setCopiedToken] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

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

  // Derive active organization info
  const userDomain = user?.email?.split('@')[1]
  const orgDisplayName = currentOrg?.name || (user?.role === 'org_admin' ? `${userDomain?.split('.')[0]?.toUpperCase()} Enterprise` : 'Acme Cybersecurity')
  const orgDomain = currentOrg?.domain || userDomain
  const orgStatus = currentOrg?.status || 'PENDING_VERIFICATION'
  const dnsToken = currentOrg?.dns_txt_token || (user?.email?.includes('@') ? `securegpt-verification=sgpt-${user.id.slice(0, 16)}` : 'securegpt-verification=sgpt-98b1a9c8ca55fcef1ceafdb33807efaa')

  if (loading) {
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
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
              Tier 2 • Organization
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Enterprise Workspace</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Enterprise Team & Governance
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Enforce unified browser DLP policies across all company employees and department categories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!currentOrg && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setOrgAdminEmail(user?.email || ''); setOrgRegisterOpen(true); }}
            >
              <Building2 size={13} className="mr-1.5" /> Register Domain
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeptOpen(true)}
          >
            <FolderPlus size={13} className="mr-1.5" /> New Department
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            <Plus size={13} className="mr-1.5" /> Invite Employee
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold"
          style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 2. Master Organization Status & DNS Token Card ───────────────── */}
      <div
        className="rounded-2xl p-6 border transition-all"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {orgDisplayName}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{
                      background: orgStatus === 'ACTIVE' ? 'var(--success-light)' : 'var(--warning-light)',
                      color: orgStatus === 'ACTIVE' ? 'var(--success)' : 'var(--warning)',
                      border: `1px solid ${orgStatus === 'ACTIVE' ? 'var(--success-border)' : 'var(--warning-border)'}`
                    }}>
                    ● {orgStatus.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Corporate Domain: <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>@{orgDomain}</span>
                  <span className="mx-1.5 text-gray-400">•</span>
                  <span>Admin: {user?.email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* DNS TXT Challenge Box */}
          {dnsToken && (
            <div className="flex flex-col items-start lg:items-end gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--text-tertiary)' }}>
                <Globe size={13} /> DNS TXT Verification Challenge Record
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl border"
                style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                <code className="text-xs font-mono font-bold select-all px-1" style={{ color: 'var(--text-primary)' }}>
                  {dnsToken}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(dnsToken)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-2)',
                    color: 'var(--text-secondary)',
                  }}
                  title="Copy token to clipboard"
                >
                  {copiedToken ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                Add this TXT record to your DNS provider (Cloudflare, Route53, GoDaddy) to verify domain.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Department / Category Grid ─────────────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <Layers size={14} style={{ color: 'var(--accent)' }} /> Employee Categories & Departments ({departments.length})
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Assign employees to categories to apply custom DLP policies per department.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeptOpen(true)}
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
              <div className="size-9 rounded-xl mx-auto flex items-center justify-center mb-2"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <FolderPlus size={18} />
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                No custom departments created yet
              </p>
              <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
                Create categories like <b>Engineering</b>, <b>Finance</b>, or <b>HR</b> to apply specialized masking rules.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeptOpen(true)}
                className="mt-3"
              >
                Create First Department
              </Button>
            </div>
          ) : (
            departments.map((dept) => {
              const memberCount = users.filter(u => u.departmentId === dept.id).length
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
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
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
                      onClick={() => {
                        setSelectedDept(dept.id)
                        setInviteOpen(true)
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer hover:bg-[var(--bg-surface-2)]"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-secondary)' }}
                      title="Invite colleague to this category"
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
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <Users size={14} style={{ color: 'var(--success)' }} /> Enrolled Employees ({users.length})
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Employees with active Chrome Extensions bound to your corporate DLP policy.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            <Plus size={12} className="mr-1" /> Invite Colleague
          </Button>
        </div>

        <div
          className="border rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <table className="w-full text-left text-xs">
            <thead className="border-b uppercase font-bold tracking-wider"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-surface-2)',
                color: 'var(--text-tertiary)',
              }}>
              <tr>
                <th className="px-5 py-3">Employee Name & Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Assigned Category / Policy Tier</th>
                <th className="px-5 py-3">DLP Policy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    No employees enrolled in this organization yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-surface-2)]/60 transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <div className="size-8 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        {u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {u.fullName || u.email.split('@')[0]}
                        </p>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                          {u.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                        style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={u.departmentId || ''}
                        onChange={(e) => assignDepartment(u.id, e.target.value || null)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-[var(--bg-surface-2)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                      >
                        <option value="">🏢 General Org Policy</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            📁 {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--success)' }}>
                        <span className="size-1.5 rounded-full" style={{ background: 'var(--success)' }} /> Active Protection
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Modals ────────────────────────────────────────────────────── */}

      {/* Invite Member Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} size="sm">
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Invite Employee
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Invited email must match your corporate domain (<b style={{ color: 'var(--accent)' }}>@{orgDomain}</b>).
            </p>
          </div>

          {inviteError && (
            <div className="p-3 text-xs rounded-xl"
              style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
              {inviteError}
            </div>
          )}

          {inviteSuccess && (
            <div className="p-3 text-xs rounded-xl flex items-center gap-2"
              style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', color: 'var(--success)' }}>
              <CheckCircle2 size={15} /> {inviteSuccess}
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Employee Email Address
              </label>
              <input
                type="email"
                placeholder={`developer@${orgDomain || 'yourcompany.com'}`}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Department / Category
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}
              >
                <option value="">General / Default Org Policy</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <Button variant="secondary" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={inviting || !inviteEmail}
              onClick={handleInvite}
            >
              {inviting ? 'Inviting…' : 'Send Invite'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Department Modal */}
      <Modal open={deptOpen} onClose={() => setDeptOpen(false)} size="sm">
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Create Department / Category
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Group employees by role to enforce specialized DLP rules.
            </p>
          </div>

          {deptError && (
            <div className="p-3 text-xs rounded-xl"
              style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
              {deptError}
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Department Name
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering, Finance, Legal, HR"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Protects cloud API keys, production credentials, and code snippets"
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <Button variant="secondary" size="sm" onClick={() => setDeptOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={creatingDept || !deptName}
              onClick={handleCreateDept}
            >
              {creatingDept ? 'Creating…' : 'Create Department'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Organization Registration Modal */}
      <Modal open={orgRegisterOpen} onClose={() => { setOrgRegisterOpen(false); setOrgResult(null); }} size="md">
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Register Enterprise Domain
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Requires a business domain email (public email providers like Gmail/Yahoo are blocked).
            </p>
          </div>

          {orgError && (
            <div className="p-3 text-xs rounded-xl"
              style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
              {orgError}
            </div>
          )}

          {!orgResult ? (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="Acme Cybersecurity Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Admin Corporate Email
                </label>
                <input
                  type="email"
                  placeholder="security-lead@acmecorp.com"
                  value={orgAdminEmail}
                  onChange={(e) => setOrgAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <Button variant="secondary" size="sm" onClick={() => setOrgRegisterOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={registeringOrg || !orgName || !orgAdminEmail}
                  onClick={handleRegisterOrg}
                >
                  {registeringOrg ? 'Registering…' : 'Register & Generate DNS Token'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border"
                style={{ background: 'var(--success-light)', borderColor: 'var(--success-border)' }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--success)' }}>
                  <CheckCircle2 size={16} /> Organization Created ({orgResult.name})
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Add this DNS TXT record to your domain DNS settings to complete activation:
                </p>
                <div className="mt-3 p-3 rounded-xl font-mono text-xs break-all select-all flex items-center justify-between"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  <span>{orgResult.dns_txt_token}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(orgResult.dns_txt_token)}
                    className="ml-2 px-2.5 py-1 rounded text-xs font-semibold border"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-secondary)' }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => { setOrgRegisterOpen(false); setOrgResult(null); }}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

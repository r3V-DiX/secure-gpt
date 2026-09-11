'use client'

import { Users, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button/button'
import { useToast } from '@/contexts/toast-context'

interface TeamMemberTableProps {
  users: any[]
  departments: any[]
  currentUser: any
  onOpenInvite: () => void
  onChangeRole: (userId: string, role: string) => Promise<any>
  onAssignDepartment: (userId: string, deptId: string | null) => Promise<any>
  onDeleteUser: (userId: string) => Promise<any>
}

export function TeamMemberTable({
  users,
  departments,
  currentUser,
  onOpenInvite,
  onChangeRole,
  onAssignDepartment,
  onDeleteUser,
}: TeamMemberTableProps) {
  const { toast } = useToast()

  return (
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
        <Button variant="primary" size="sm" onClick={onOpenInvite}>
          <Plus size={12} className="mr-1" /> Invite Colleague
        </Button>
      </div>

      <div
        className="border rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <table className="w-full text-left text-xs">
          <thead
            className="border-b uppercase font-bold tracking-wider"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface-2)',
              color: 'var(--text-tertiary)',
            }}
          >
            <tr>
              <th className="px-5 py-3">Employee Name & Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Assigned Category / Policy Tier</th>
              <th className="px-5 py-3">DLP Policy Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  No employees enrolled in this organization yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--bg-surface-2)]/60 transition-colors">
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <div
                      className="size-8 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
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
                    {currentUser?.role === 'org_admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'platform_super_admin' ? (
                      <select
                        value={u.role}
                        onChange={(e) => onChangeRole(u.id, e.target.value)}
                        className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-lg border bg-[var(--bg-surface-2)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                      >
                        <option value="employee">EMPLOYEE</option>
                        <option value="org_admin">ORG_ADMIN</option>
                        <option value="user">USER</option>
                      </select>
                    ) : (
                      <span
                        className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                        style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      >
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.departmentId || ''}
                      onChange={(e) => onAssignDepartment(u.id, e.target.value || null)}
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
                  <td className="px-5 py-3.5 text-right">
                    {u.id !== currentUser?.id ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Instantly remove & terminate user ${u.email}? All active sessions and devices will be revoked immediately.`)) {
                            const res = await onDeleteUser(u.id)
                            if (res.success) {
                              toast.success(`User ${u.email} removed.`)
                            } else {
                              toast.error(res.error || 'Failed to remove user')
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg border hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-slate-400 hover:text-red-600 cursor-pointer inline-flex items-center justify-center"
                        style={{ borderColor: 'var(--border-2)' }}
                        title="Terminate / Remove User"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] italic">You</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

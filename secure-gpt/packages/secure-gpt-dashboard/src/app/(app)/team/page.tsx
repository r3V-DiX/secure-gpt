'use client'

import { useState } from 'react'
import { useTeam } from '@/features/team/hooks/use-team'
import { Users, Plus, Mail, ShieldCheck, Clock, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { useAuth } from '@/contexts/auth-context'

export default function TeamPage() {
  const { user } = useAuth()
  const { users, loading, error, inviteMember } = useTeam()
  const [addOpen, setAddOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    const res = await inviteMember(inviteEmail.trim())
    setInviting(false)
    if (res.success) {
      setAddOpen(false)
      setInviteEmail('')
    } else {
      setInviteError(res.error || 'Failed to add user.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-4xl">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-7 pb-28 animate-fade-in max-w-5xl">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Team Management</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Manage users and their roles within your organization
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1.5" /> Add Member
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* User List */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                  <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-(--bg-surface-2)">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full flex items-center justify-center font-bold text-xs"
                          style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                          {u.fullName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.fullName || 'No Name'}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {u.role === 'super_admin' || u.role === 'security_admin' ? (
                          <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
                        ) : (
                          <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
                        )}
                        <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                          <span className="size-1.5 rounded-full bg-current" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: 'var(--warning-light)', color: 'var(--warning-text)' }}>
                          <span className="size-1.5 rounded-full bg-current" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <Clock size={13} />
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      No members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} size="sm">
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Add Member</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Invite a new user to join your organization.
            </p>
          </div>

          {inviteError && (
            <div className="px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
              style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
              <AlertCircle size={14} className="shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input 
                autoFocus
                type="email"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border outline-none text-sm transition-colors focus:border-[var(--accent)]"
                style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                disabled={inviting}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setAddOpen(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1 flex items-center justify-center gap-1.5" onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}>
              {inviting && <span className="size-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {inviting ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

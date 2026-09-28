'use client'

import React from 'react'
import { Building2, UserCheck, User } from 'lucide-react'

interface RoleSelectorProps {
  roleType: 'employer' | 'employee' | 'user'
  setRoleType: (r: 'employer' | 'employee' | 'user') => void
  setDevPersona: (r: 'employer' | 'employee' | 'user') => void
  setDevEmail: (email: string) => void
}

export function RoleSelector({
  roleType,
  setRoleType,
  setDevPersona,
  setDevEmail,
}: RoleSelectorProps) {
  return (
    <div className="mb-5">
      <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
        I am signing in as:
      </label>
      <div className="grid grid-cols-3 gap-1 p-1 rounded-md border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => {
            setRoleType('employer')
            setDevPersona('employer')
            setDevEmail('admin@acmecorp.com')
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            roleType === 'employer'
              ? 'bg-[var(--accent)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Building2 size={13} /> Employer
        </button>

        <button
          type="button"
          onClick={() => {
            setRoleType('employee')
            setDevPersona('employee')
            setDevEmail('developer@acmecorp.com')
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            roleType === 'employee'
              ? 'bg-[var(--accent)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
          }`}
        >
          <UserCheck size={13} /> Employee
        </button>

        <button
          type="button"
          onClick={() => {
            setRoleType('user')
            setDevPersona('user')
            setDevEmail('john.doe@gmail.com')
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            roleType === 'user'
              ? 'bg-[var(--accent)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
          }`}
        >
          <User size={13} /> Personal
        </button>
      </div>
    </div>
  )
}

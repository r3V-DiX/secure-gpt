'use client'

import { RadioGroup } from '@/components/ui'
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
  return <div className="mb-5 space-y-2">
    <p className="text-xs font-medium text-[var(--text-primary)]">I am signing in as:</p>
    <RadioGroup label="Login role" value={roleType} onValueChange={role => {
      setRoleType(role)
      setDevPersona(role)
      setDevEmail({ employer: 'admin@acmecorp.com', employee: 'developer@acmecorp.com', user: 'john.doe@gmail.com' }[role])
    }} options={[
      { value: 'employer', label: 'Employer', icon: <Building2 size={13} /> },
      { value: 'employee', label: 'Employee', icon: <UserCheck size={13} /> },
      { value: 'user', label: 'Personal', icon: <User size={13} /> },
    ]} />
  </div>
}

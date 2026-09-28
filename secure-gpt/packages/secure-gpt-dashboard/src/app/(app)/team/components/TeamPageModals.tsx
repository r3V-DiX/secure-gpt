'use client'

import React from 'react'
import { MemberInviteModal } from './MemberInviteModal'
import { DepartmentModal } from './DepartmentModal'
import { OrgRegisterModal } from './OrgRegisterModal'
import type { Department } from '@/types'

interface TeamPageModalsProps {
  inviteOpen: boolean
  onCloseInvite: () => void
  orgDomain?: string
  isOrgActive: boolean
  inviteEmail: string
  setInviteEmail: (v: string) => void
  selectedDept: string
  setSelectedDept: (v: string) => void
  departments: Department[]
  inviting: boolean
  inviteError: string | null
  inviteSuccess: string | null
  onInvite: () => Promise<void>

  deptOpen: boolean
  onCloseDept: () => void
  deptName: string
  setDeptName: (v: string) => void
  deptDesc: string
  setDeptDesc: (v: string) => void
  deptError: string | null
  creatingDept: boolean
  onCreateDept: () => Promise<void>

  orgRegisterOpen: boolean
  onCloseOrgRegister: () => void
  orgName: string
  setOrgName: (v: string) => void
  orgAdminEmail: string
  setOrgAdminEmail: (v: string) => void
  orgError: string | null
  orgResult: any
  registeringOrg: boolean
  onRegisterOrg: () => Promise<void>
}

export function TeamPageModals({
  inviteOpen,
  onCloseInvite,
  orgDomain,
  isOrgActive,
  inviteEmail,
  setInviteEmail,
  selectedDept,
  setSelectedDept,
  departments,
  inviting,
  inviteError,
  inviteSuccess,
  onInvite,

  deptOpen,
  onCloseDept,
  deptName,
  setDeptName,
  deptDesc,
  setDeptDesc,
  deptError,
  creatingDept,
  onCreateDept,

  orgRegisterOpen,
  onCloseOrgRegister,
  orgName,
  setOrgName,
  orgAdminEmail,
  setOrgAdminEmail,
  orgError,
  orgResult,
  registeringOrg,
  onRegisterOrg,
}: TeamPageModalsProps) {
  return (
    <>
      <MemberInviteModal
        open={inviteOpen}
        onClose={onCloseInvite}
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
        onInvite={onInvite}
      />

      <DepartmentModal
        open={deptOpen}
        onClose={onCloseDept}
        isOrgActive={isOrgActive}
        deptName={deptName}
        setDeptName={setDeptName}
        deptDesc={deptDesc}
        setDeptDesc={setDeptDesc}
        deptError={deptError}
        creatingDept={creatingDept}
        onCreateDept={onCreateDept}
      />

      <OrgRegisterModal
        open={orgRegisterOpen}
        onClose={onCloseOrgRegister}
        orgName={orgName}
        setOrgName={setOrgName}
        orgAdminEmail={orgAdminEmail}
        setOrgAdminEmail={setOrgAdminEmail}
        orgError={orgError}
        orgResult={orgResult}
        registeringOrg={registeringOrg}
        onRegisterOrg={onRegisterOrg}
        onCopyToken={(token) => {
          navigator.clipboard.writeText(token)
        }}
      />
    </>
  )
}

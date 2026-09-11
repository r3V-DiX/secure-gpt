'use client'

import { Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { FolderPlus } from 'lucide-react'

interface DepartmentModalProps {
  open: boolean
  onClose: () => void
  deptName: string
  setDeptName: (val: string) => void
  deptDesc: string
  setDeptDesc: (val: string) => void
  deptError: string | null
  creatingDept: boolean
  onCreateDept: () => Promise<void>
}

export function DepartmentModal({
  open,
  onClose,
  deptName,
  setDeptName,
  deptDesc,
  setDeptDesc,
  deptError,
  creatingDept,
  onCreateDept,
}: DepartmentModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Create Employee Category / Department
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Group colleagues into categories (e.g. Finance, Engineering) to apply custom masking and blocking rules.
          </p>
        </div>

        {deptError && (
          <div
            className="p-3 text-xs rounded-xl"
            style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
          >
            {deptError}
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Engineering, Financial Analysts, Customer Support"
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
            <input
              type="text"
              placeholder="e.g. Strict masking for financial records and source code"
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!deptName.trim() || creatingDept}
            onClick={onCreateDept}
          >
            <FolderPlus size={13} className="mr-1.5" />
            {creatingDept ? 'Creating…' : 'Create Department'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

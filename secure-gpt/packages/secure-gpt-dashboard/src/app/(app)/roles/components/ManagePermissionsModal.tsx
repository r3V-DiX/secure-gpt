'use client'

import { Input, Select, Checkbox } from '@/components/ui'
import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { Settings, Search } from 'lucide-react'
import type { Role, Permission } from '@/types'

const MODULE_COLORS: Record<string, string> = {
  USER: 'var(--accent)',
  POLICY: 'var(--success)',
  SYSTEM: 'var(--text-secondary)',
  AUDIT: 'var(--warning)',
  ROLE: 'var(--accent)',
  ORGANISATION: 'var(--info)'
}

interface ManagePermissionsModalProps {
  manageTarget: Role | null
  onClose: () => void
  permissions: Permission[]
  selectedPermActions: Set<string>
  togglePermissionSelection: (action: string) => void
  setSelectedPermActions: (actions: Set<string>) => void
  permSearch: string
  setPermSearch: (search: string) => void
  permModule: string
  setPermModule: (mod: string) => void
  submitting: boolean
  onSave: () => Promise<void>
}

export function ManagePermissionsModal({
  manageTarget,
  onClose,
  permissions,
  selectedPermActions,
  togglePermissionSelection,
  setSelectedPermActions,
  permSearch,
  setPermSearch,
  permModule,
  setPermModule,
  submitting,
  onSave,
}: ManagePermissionsModalProps) {
  if (!manageTarget) return null

  const modules = Array.from(new Set(permissions.map(p => p.module)))
  const filteredPermissions = permissions.filter(p => {
    const matchesSearch =
      !permSearch ||
      p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.action.toLowerCase().includes(permSearch.toLowerCase())
    const matchesModule = permModule === 'all' || p.module === permModule
    return matchesSearch && matchesModule
  })

  return (
    <Modal open={!!manageTarget} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <Settings className="text-[var(--accent)] size-5 shrink-0" />
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Manage Permissions</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{manageTarget.name}</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4 max-h-[60vh] flex flex-col">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap pb-2">
            <div className="flex items-center gap-2 flex-1 bg-[var(--bg-surface-2)] rounded-xl px-3 border border-[var(--border-2)] focus-within:border-white/20 transition-all h-9">

              <Input aria-label="Search permissions..." icon={<Search size={15} />} wrapperClassName="w-auto min-w-0"
                type="text"
                value={permSearch}
                onChange={e => setPermSearch(e.target.value)}
                placeholder="Search permissions..."
                className="flex-1"
              />
            </div>
            <Select aria-label="All Modules" wrapperClassName="w-auto min-w-0"
              value={permModule}
              onChange={e => setPermModule(e.target.value)}

            >
              <option value="all">All Modules</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Button variant="secondary" size="sm" onClick={() => setSelectedPermActions(new Set(permissions.map(p => p.action)))}>
              Select All
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSelectedPermActions(new Set())}>
              Clear All
            </Button>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto divide-y divide-[var(--border-2)] flex-1 pr-1">
            {filteredPermissions.map(perm => {
              const isChecked = selectedPermActions.has(perm.action)
              const modColor = MODULE_COLORS[perm.module] ?? 'var(--accent)'
              return (
                <label
                  key={perm.id}
                  className="flex items-center gap-3 py-3 px-2 hover:bg-white/5 cursor-pointer transition-colors select-none rounded-lg"
                >
                  <Checkbox aria-label="Select item"

                    checked={isChecked}
                    onChange={() => togglePermissionSelection(perm.action)}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{perm.name}</span>
                      <code className="text-[10px] font-mono bg-[var(--bg-surface-3)] px-1.5 py-0.5 rounded" style={{ color: 'var(--text-tertiary)' }}>
                        {perm.action}
                      </code>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{perm.description || 'No description available.'}</p>
                  </div>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0"
                    style={{ background: `${modColor}15`, color: modColor }}
                  >
                    {perm.module}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {selectedPermActions.size} permissions selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" loading={submitting} onClick={onSave}>
              Save Permissions
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  )
}

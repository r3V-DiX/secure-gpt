'use client'

import { PageHeader } from '@/components/ui'
import { Input, Select, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui'
import React, { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { Shield, Search, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import type { Permission } from '@/types'

const MODULE_CONFIG: Record<string, { color: string; bg: string }> = {
  USER: { color: 'var(--accent)', bg: 'rgba(129, 140, 248, 0.1)' },
  POLICY: { color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' },
  SYSTEM: { color: 'var(--text-secondary)', bg: 'rgba(255, 255, 255, 0.05)' },
  AUDIT: { color: 'var(--warning)', bg: 'rgba(234, 179, 8, 0.1)' },
  ROLE: { color: 'var(--accent)', bg: 'rgba(129, 140, 248, 0.1)' },
  ORGANISATION: { color: 'var(--info)', bg: 'rgba(56, 189, 248, 0.1)' },
}

const RISK_FILTER_OPTIONS = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
]

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [riskFilter, setRisk] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  async function loadPermissions() {
    try {
      setLoading(true)
      const perms = await apiGet<Permission[]>('/admin/permissions')
      setPermissions(perms)
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch granular permissions list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPermissions()
  }, [])

  // Group by module
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  // Auto-expand all on first load
  useEffect(() => {
    if (permissions.length > 0 && expanded.size === 0) {
      setExpanded(new Set(Object.keys(grouped)))
    }
  }, [permissions])

  const toggleExpand = (mod: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(mod)) next.delete(mod)
      else next.add(mod)
      return next
    })
  }

  // Filter logic
  const filteredGrouped = Object.entries(grouped).reduce<Record<string, Permission[]>>((acc, [mod, perms]) => {
    const f = perms.filter(p => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.action.toLowerCase().includes(search.toLowerCase())
      const matchesRisk = riskFilter === 'all' || p.riskLevel === riskFilter
      return matchesSearch && matchesRisk
    })
    if (f.length > 0) acc[mod] = f
    return acc
  }, {})

  const getRiskVariant = (risk: string) => {
    const map: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'success',
    }
    return map[risk] ?? 'default'
  }

  return (
    <div className="flex-1 space-y-6 w-full animate-fade-in pb-8">
      {/* Header */}
      <PageHeader title={<>
            <Shield className="text-[var(--accent)] size-5 shrink-0" />
            Granular Permissions
          </>} description={<>
            Overview of the dynamic API action matrix across the SecureGPT platform (Read Only).
          </>}  />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[var(--bg-surface)] rounded-xl px-3 border border-[var(--border-2)] focus-within:border-[var(--accent)] transition-all h-9">

          <Input aria-label="Search permissions..." icon={<Search size={15} />} wrapperClassName="w-auto min-w-0"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search permissions..."
            className="flex-1"
          />
        </div>
        <Select aria-label="Select option" wrapperClassName="w-auto min-w-0"
          value={riskFilter}
          onChange={e => setRisk(e.target.value)}

        >
          {RISK_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setExpanded(new Set(Object.keys(grouped)))}
        >
          Expand All
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setExpanded(new Set())}
        >
          Collapse All
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[var(--accent)] size-8" />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading platform permissions...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredGrouped).map(([module, perms]) => {
            const mc = MODULE_CONFIG[module] ?? { color: 'var(--accent)', bg: 'rgba(129, 140, 248, 0.1)' }
            const isExpanded = expanded.has(module)
            const criticalCount = perms.filter(p => p.riskLevel === 'CRITICAL').length
            const highCount = perms.filter(p => p.riskLevel === 'HIGH').length

            return (
              <div key={module} className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-md overflow-hidden shadow-lg">
                <Button variant="ghost" type="button"
                  onClick={() => toggleExpand(module)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-center rounded-lg w-8 h-8 flex-shrink-0" style={{ background: mc.bg }}>
                    <Shield size={14} style={{ color: mc.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{module}</span>
                      <Badge variant="neutral" >
                        {perms.length} permissions
                      </Badge>
                      {criticalCount > 0 && (
                        <Badge variant="danger" >
                          {criticalCount} critical
                        </Badge>
                      )}
                      {highCount > 0 && (
                        <Badge variant="warning" >
                          {highCount} high
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
                  )}
                </Button>

                {isExpanded && (
                  <div className="border-t border-[var(--border-2)]">
                    <div className="overflow-x-auto">
                      <Table className="w-full text-left border-collapse">
                        <TableHead>
                          <TableRow className="bg-[var(--bg-surface-2)] border-b border-[var(--border-2)] text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                            <TableHeaderCell className="px-5 py-2.5">Permission Name</TableHeaderCell>
                            <TableHeaderCell className="px-3 py-2.5">Action Code</TableHeaderCell>
                            <TableHeaderCell className="px-3 py-2.5">Description</TableHeaderCell>
                            <TableHeaderCell className="px-3 py-2.5">Risk Level</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody className="divide-y divide-[var(--border-2)] text-[12px]">
                          {perms.map(perm => (
                            <TableRow key={perm.id} className="hover:bg-white/5 transition-colors">
                              <TableCell className="px-5 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {perm.name}
                              </TableCell>
                              <TableCell className="px-3 py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>
                                <code className="bg-[var(--bg-surface-3)] border border-[var(--border)] px-2 py-0.5 rounded text-[11px]">
                                  {perm.action}
                                </code>
                              </TableCell>
                              <TableCell className="px-3 py-3" style={{ color: 'var(--text-tertiary)' }}>
                                {perm.description || '—'}
                              </TableCell>
                              <TableCell className="px-3 py-3">
                                <Badge variant={getRiskVariant(perm.riskLevel)}>{perm.riskLevel}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {Object.keys(filteredGrouped).length === 0 && !loading && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-2)] rounded-md py-16 flex flex-col items-center gap-3">
          <Shield size={22} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>No permissions match your filters</p>
        </div>
      )}
    </div>
  )
}

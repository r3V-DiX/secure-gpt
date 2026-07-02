'use client'

import React, { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Badge } from '@/components/ui/badge/badge'
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
    <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="text-[var(--accent)] size-5 shrink-0" />
            Granular Permissions
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            Overview of the dynamic API action matrix across the SecureGPT platform (Read Only).
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[var(--bg-surface-2)] rounded-xl px-3 border border-[var(--border-2)] focus-within:border-white/20 transition-all h-10">
          <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search permissions..."
            className="flex-1 bg-transparent outline-none text-xs text-white placeholder:text-[var(--text-tertiary)]"
          />
        </div>
        <select
          value={riskFilter}
          onChange={e => setRisk(e.target.value)}
          className="h-10 px-3 bg-[var(--bg-surface-2)] rounded-xl border border-[var(--border-2)] text-xs text-white outline-none cursor-pointer"
        >
          {RISK_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          onClick={() => setExpanded(new Set(Object.keys(grouped)))}
          className="h-10 px-4 rounded-xl border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-xs font-semibold text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          Expand All
        </button>
        <button
          onClick={() => setExpanded(new Set())}
          className="h-10 px-4 rounded-xl border border-[var(--border-2)] bg-[var(--bg-surface-2)] text-xs font-semibold text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          Collapse All
        </button>
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
              <div key={module} className="border border-[var(--border-2)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-lg">
                <button
                  onClick={() => toggleExpand(module)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center justify-center rounded-lg w-8 h-8 flex-shrink-0" style={{ background: mc.bg }}>
                    <Shield size={14} style={{ color: mc.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{module}</span>
                      <span className="text-[10px] font-semibold bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                        {perms.length} permissions
                      </span>
                      {criticalCount > 0 && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                          {criticalCount} critical
                        </span>
                      )}
                      {highCount > 0 && (
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                          {highCount} high
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--border-2)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border-2)] text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                            <th className="px-5 py-2.5">Permission Name</th>
                            <th className="px-3 py-2.5">Action Code</th>
                            <th className="px-3 py-2.5">Description</th>
                            <th className="px-3 py-2.5">Risk Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-2)] text-[12px]">
                          {perms.map(perm => (
                            <tr key={perm.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-5 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {perm.name}
                              </td>
                              <td className="px-3 py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>
                                <code className="bg-[var(--bg-surface-3)] border border-[var(--border)] px-2 py-0.5 rounded text-[11px]">
                                  {perm.action}
                                </code>
                              </td>
                              <td className="px-3 py-3" style={{ color: 'var(--text-tertiary)' }}>
                                {perm.description || '—'}
                              </td>
                              <td className="px-3 py-3">
                                <Badge variant={getRiskVariant(perm.riskLevel)}>{perm.riskLevel}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {Object.keys(filteredGrouped).length === 0 && !loading && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-2)] rounded-2xl py-16 flex flex-col items-center gap-3">
          <Shield size={22} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>No permissions match your filters</p>
        </div>
      )}
    </main>
  )
}

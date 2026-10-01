'use client'

import { Card, Badge } from '@/components/ui'
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui'
import React from 'react'
import Link from 'next/link'
import { Building2, Users, Layers } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state/EmptyState'

interface OrgLeaderboardsProps {
  isSuperAdmin: boolean
  showTopEmployees: boolean
  showTopDepartments: boolean
  stats: any
  loading: boolean
}

export function OrgLeaderboards({
  isSuperAdmin,
  showTopEmployees,
  showTopDepartments,
  stats,
  loading,
}: OrgLeaderboardsProps) {
  return (
    <>
      {/* ── Super Admin: Top Organizations Section ──────────────────────── */}
      {(isSuperAdmin || (stats?.topOrganizations && stats.topOrganizations.length > 0)) && (
        <Card className="p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Building2 size={16} className="text-[var(--accent)]" />
                Top Organizations by Threat Interceptions
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Cross-tenant enterprise activity and policy interception volume
              </p>
            </div>
            <Link
              href="/organizations"
              className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              View Org Directory →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (    
                <div key={i} className="skeleton h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : !stats?.topOrganizations || stats.topOrganizations.length === 0 ? (
            <EmptyState compact title="No organization telemetry recorded yet" />
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-xs">
                <TableHead>
                  <TableRow className="border-b text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]" style={{ borderColor: 'var(--border)' }}>
                    <TableHeaderCell className="pb-3 pl-2">Organization</TableHeaderCell>
                    <TableHeaderCell className="pb-3">Domain</TableHeaderCell>
                    <TableHeaderCell className="pb-3">Interceptions</TableHeaderCell>
                    <TableHeaderCell className="pb-3 pr-2 w-1/3">Threat Distribution</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {stats.topOrganizations.map((org: any, i: number) => (
                    <TableRow key={org.id || i} className="hover:bg-[var(--bg-surface-2)] transition-colors">
                      <TableCell className="py-3.5 pl-2 font-bold text-[var(--text-primary)] flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] flex items-center justify-center font-bold text-xs">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{org.name}</span>
                      </TableCell>
                      <TableCell className="py-3.5 font-mono text-[var(--text-secondary)]">{org.domain || '—'}</TableCell>
                      <TableCell className="py-3.5 font-bold tabular-nums text-[var(--text-primary)]">
                        {org.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--bg-surface-3)]">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${org.percent}%`,
                                background: org.color || 'var(--accent)',
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)] w-8 text-right">
                            {org.percent}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* ── Organization Leaderboards (Top Users for Admins, Top Depts for All Members) ───────────────── */}
      {(showTopEmployees || showTopDepartments) && (
        <div className={`grid grid-cols-1 ${showTopEmployees && showTopDepartments ? 'lg:grid-cols-2' : ''} gap-4`}>
          {/* Top Employees */}
          {showTopEmployees && (
            <Card className="p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Users size={16} className="text-[var(--accent)]" />
                    Top Users by DLP Interceptions
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">Team members triggering DLP sensitivity policies</p>
                </div>
                <Link href="/team" className="text-xs font-semibold text-[var(--accent)] hover:underline">
                  Manage Team →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 w-full rounded-xl" />
                  ))}
                </div>
              ) : !stats?.topEmployees || stats.topEmployees.length === 0 ? (
                <EmptyState compact title="No user violations recorded yet" />
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {stats.topEmployees.map((emp: any, i: number) => (
                    <div key={emp.email || i} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-full flex items-center justify-center font-bold text-xs bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-[var(--text-primary)]">{emp.name}</p>
                          <p className="text-[11px] truncate text-[var(--text-tertiary)]">{emp.email} • {emp.dept}</p>
                        </div>
                      </div>
                      <Badge variant="danger" className="tabular-nums">
                        {emp.count} threats
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Top Departments */}
          {showTopDepartments && (
            <Card className="p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Layers size={16} className="text-[var(--accent)]" />
                    Top Departments
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">Interception density across organizational units</p>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 w-full rounded-xl" />
                  ))}
                </div>
              ) : !stats?.topDepartments || stats.topDepartments.length === 0 ? (
                <EmptyState compact title="No department activity recorded yet" />
              ) : (
                <div className="space-y-3">
                  {stats.topDepartments.map((dept: any, i: number) => (
                    <div key={dept.name || i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">{dept.name}</span>
                        <span className="font-bold tabular-nums text-[var(--text-secondary)]">{dept.count} events ({dept.percent}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-surface-3)]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${dept.percent}%`, background: dept.color || 'var(--accent)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </>
  )
}

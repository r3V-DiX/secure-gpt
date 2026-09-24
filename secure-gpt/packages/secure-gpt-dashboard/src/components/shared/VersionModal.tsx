'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import { CheckCircle2, RefreshCw, Server, Laptop, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react'
import apiClient from '@/lib/api/client'

interface VersionData {
  status: string
  app: string
  env: string
  version: string
  commit: string
  buildTime: string
  components: {
    backend: string
    extension: string
    dashboard: string
  }
}

interface VersionModalProps {
  open: boolean
  onClose: () => void
}

export function VersionModal({ open, onClose }: VersionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<VersionData | null>(null)

  const fetchVersion = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<VersionData>('/system/version')
      setData(res.data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to fetch version info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchVersion()
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">System Release Status</h3>
            <p className="text-xs text-[var(--text-muted)]">Live deployed build and component versions</p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {loading && !data ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
            <RefreshCw size={24} className="animate-spin text-emerald-500" />
            <span className="text-xs font-mono">Querying /api/v1/system/version...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Primary Status Card */}
            <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-muted)] font-medium">Active Release</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-bold font-mono text-[var(--text-primary)]">
                    v{data.version}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 capitalize">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {data.env}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[var(--text-muted)]">System Status</span>
                <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-emerald-400 mt-0.5">
                  <CheckCircle2 size={15} />
                  Operational
                </div>
              </div>
            </div>

            {/* Component Versions Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Components Matrix
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1">
                    <Server size={13} />
                    <span className="text-[11px]">Backend API</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
                    v{data.components?.backend ?? data.version}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1">
                    <Laptop size={13} />
                    <span className="text-[11px]">Dashboard</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
                    v{data.components?.dashboard ?? 'Not Available'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1">
                    <ShieldCheck size={13} />
                    <span className="text-[11px]">Extension</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
                    v{data.components?.extension ?? 'Not Available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Build metadata */}
            <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Git Commit:</span>
                <span className="text-[var(--text-primary)]">{data.commit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Build Time:</span>
                <span className="text-[var(--text-primary)]">{data.buildTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">API Spec:</span>
                <span className="text-emerald-400">/api/v1/system/version</span>
              </div>
            </div>
          </div>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <a
            href="/versions"
            onClick={onClose}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
          >
            <span>View Full Changelog & Release Notes</span>
            <ExternalLink size={12} />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchVersion}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  )
}

'use client'

import { IconButton } from '@/components/ui'
import { Button } from '@/components/ui'
import { useEffect, useState, useCallback } from "react"
import { Monitor, Smartphone, Tablet, Loader2, RefreshCw, LogOut, ShieldAlert, Clock, MapPin, Cpu } from "lucide-react"
import { apiGetPaginated, apiDelete } from "@/lib/api/client"
import { Device } from "@/types"
import { useToast } from "@/contexts/toast-context"
import { useDangerConfirm } from "@/components/ui/modal/modal"

// ── Helpers ───────────────────────────────────────────────────────────────────

function DeviceIcon({ type, className }: { type?: string | null; className?: string }) {
  const cls = className ?? "w-5 h-5"
  const t = type?.toLowerCase() || ''
  if (t.includes('mobile') || t.includes('android') || t.includes('ios')) return <Smartphone className={cls} />
  if (t.includes('tablet') || t.includes('ipad')) return <Tablet className={cls} />
  return <Monitor className={cls} />
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ── Main component ────────────────────────────────────────────────────────────

export function RegisteredDevicesPanel() {
  const { toast } = useToast()
  const confirmDanger = useDangerConfirm()

  const [devices, setDevices] = useState<Device[]>([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true)
    try {
      const res = await apiGetPaginated<Device>("/devices", { page: 1, page_size: 50 })
      setDevices(res.data)
    } catch (e: any) {
      toast.error(e.message || "Could not load devices")
    } finally {
      setLoadingDevices(false)
    }
  }, [toast])

  useEffect(() => { loadDevices() }, [loadDevices])

  async function revokeDevice(d: Device) {
    const isConfirmed = await confirmDanger({
      title: "Sign out this device?",
      description: `${d.name} · ${d.osPlatform || 'Unknown OS'}`,
      confirmLabel: "Sign out",
    })

    if (!isConfirmed) return

    setRevokingId(d.id)
    try {
      await apiDelete(`/devices/${d.id}`)
      toast.success("Device signed out")
      setDevices((prev) => prev.filter((x) => x.id !== d.id))
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out device")
    } finally {
      setRevokingId(null)
    }
  }

  async function revokeAllOthers() {
    const others = devices.filter((d) => !d.isActive)
    if (others.length === 0) return

    const isConfirmed = await confirmDanger({
      title: "Sign out all other devices?",
      description: "You will remain signed in on this device only.",
      confirmLabel: "Sign out others",
    })

    if (!isConfirmed) return

    setRevokingAll(true)
    let hasError = false
    try {
      // The backend doesn't have a bulk delete route, so we delete them one by one
      for (const d of others) {
        try {
          await apiDelete(`/devices/${d.id}`)
        } catch (e) {
          console.error(`Failed to delete device ${d.id}`, e)
          hasError = true
        }
      }

      if (hasError) {
        toast.error("Some devices could not be signed out")
      } else {
        toast.success("Signed out of all other devices")
      }
      loadDevices()
    } finally {
      setRevokingAll(false)
    }
  }

  const otherCount = devices.filter((s) => !s.isActive).length

  return (
    <div className="space-y-6">
      {/* ── Active sessions ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Active Sessions</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Devices currently signed in to your account.</p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton aria-label="Refresh" variant="ghost" type="button"
              onClick={loadDevices}


              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent' }}
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </IconButton>
            {otherCount > 0 && (
              <Button variant="danger" type="button"
                onClick={revokeAllOthers}
                disabled={revokingAll}


                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-light)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {revokingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                Sign out {otherCount} other{otherCount > 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>

        {loadingDevices ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-6 text-xs" style={{ color: 'var(--text-tertiary)' }}>No active sessions found.</div>
        ) : (
          <div className="space-y-2">
            {devices.map((s) => (
              <div
                key={s.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                  s.isActive
                    ? "" // we apply styles below
                    : ""
                }`}
                style={{
                  borderColor: s.isActive ? 'var(--accent-border)' : 'var(--border-2)',
                  backgroundColor: s.isActive ? 'var(--accent-light)' : 'var(--bg-surface)',
                }}
              >
                {/* Device icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border`}
                  style={{
                    backgroundColor: s.isActive ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                    borderColor: s.isActive ? 'var(--accent-border)' : 'var(--border)',
                    color: s.isActive ? 'var(--accent)' : 'var(--text-secondary)'
                  }}
                >
                  <DeviceIcon type={s.osPlatform} className="w-4 h-4" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                    {s.isActive && (
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 border"
                        style={{ color: 'var(--accent)', backgroundColor: 'var(--bg-surface)', borderColor: 'var(--accent-border)' }}
                      >
                        This device
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {s.osPlatform && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        <Cpu className="w-3 h-3 shrink-0" />
                        {s.osPlatform}
                      </span>
                    )}
                    {s.lastSeenAt && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        <Clock className="w-3 h-3 shrink-0" />
                        {timeAgo(s.lastSeenAt)}
                      </span>
                    )}
                  </div>
                  {s.browser && (
                    <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--text-tertiary)' }}>{s.browser}</p>
                  )}
                </div>

                {/* Action */}
                {!s.isActive && (
                  <Button variant="danger" type="button"
                    onClick={() => revokeDevice(s)}
                    disabled={revokingId === s.id}
                    className="shrink-0"

                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--danger)'}
                  >
                    {revokingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sign out"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Login history link ───────────────────────────────────── */}
      <a
        href="/events"
        className="flex items-center gap-3 p-3.5 rounded-xl border transition-all group"
        style={{ borderColor: 'var(--border-2)', backgroundColor: 'var(--bg-surface)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.backgroundColor = 'var(--accent-light)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.backgroundColor = 'var(--bg-surface)' }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
          <ShieldAlert className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>View Activity Log</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>See all extension activity and event logs</p>
        </div>
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Open →</span>
      </a>
    </div>
  )
}

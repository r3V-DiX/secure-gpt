'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Monitor, RefreshCw, Smartphone, Tablet, Trash2 } from 'lucide-react'
import { Badge, Button, EmptyState, IconButton, LinkButton } from '@/components/ui'
import { useDangerConfirm } from '@/components/ui/modal/modal'
import { useToast } from '@/contexts/toast-context'
import { apiDelete, apiGetPaginated } from '@/lib/api/client'
import type { Device } from '@/types'

function DeviceIcon({ platform }: { platform?: string | null }) {
  const name = platform?.toLowerCase() ?? ''
  if (name.includes('mobile') || name.includes('android') || name.includes('ios')) return <Smartphone size={18} />
  if (name.includes('tablet') || name.includes('ipad')) return <Tablet size={18} />
  return <Monitor size={18} />
}

export function RegisteredDevicesPanel() {
  const { toast } = useToast()
  const confirmDanger = useDangerConfirm()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadDevices = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiGetPaginated<Device>('/devices', { page: 1, page_size: 50 })
      setDevices(response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load registered devices.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void Promise.resolve().then(loadDevices) }, [loadDevices])

  async function removeDevice(device: Device) {
    const confirmed = await confirmDanger({
      title: `Remove "${device.name}"?`,
      description: 'The selected device will no longer be registered with SecureGPT.',
      confirmLabel: 'Remove device',
    })
    if (!confirmed) return

    setRemovingId(device.id)
    try {
      await apiDelete(`/devices/${device.id}`)
      setDevices(current => current.filter(item => item.id !== device.id))
      toast.success('Device removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove device')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-6 py-4">
        <p className="text-sm text-[var(--text-secondary)]">
          {loading ? 'Loading devices…' : `${devices.length} registered ${devices.length === 1 ? 'device' : 'devices'}`}
        </p>
        <Button variant="ghost" size="sm" type="button" onClick={() => void loadDevices()} disabled={loading} icon={<RefreshCw size={15} />}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3 px-6 py-6" aria-busy="true" aria-label="Loading registered devices">
          <div className="skeleton h-16 rounded-xl" />
          <div className="skeleton h-16 rounded-xl" />
        </div>
      ) : error ? (
        <div className="px-6 py-8">
          <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>
          <Button variant="secondary" size="sm" type="button" className="mt-3" onClick={() => void loadDevices()}>Try again</Button>
        </div>
      ) : devices.length === 0 ? (
        <div className="px-6 py-6">
          <EmptyState
            compact
            icon={Monitor}
            title="No devices registered"
            description="Connect the SecureGPT browser extension to register a device."
          />
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {devices.map(device => (
            <li key={device.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
                  <DeviceIcon platform={device.osPlatform} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-semibold text-[var(--text-primary)]">{device.name}</p>
                    <Badge variant={device.isActive ? 'success' : 'neutral'} dot>{device.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {[device.browser, device.osPlatform].filter(Boolean).join(' · ') || 'Device details unavailable'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Last seen: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
              <IconButton
                aria-label={`Remove ${device.name}`}
                title={`Remove ${device.name}`}
                variant="danger"
                type="button"
                className="self-end sm:self-auto"
                loading={removingId === device.id}
                onClick={() => void removeDevice(device)}
              >
                <Trash2 size={15} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-[var(--border)] px-6 py-4">
        <LinkButton href="/event-logs" variant="ghost" size="md" className="gap-1">
          View activity log <ArrowUpRight size={15} aria-hidden="true" />
        </LinkButton>
      </div>
    </div>
  )
}

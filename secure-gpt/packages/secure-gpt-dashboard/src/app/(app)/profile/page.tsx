'use client'
// src/app/(app)/profile/page.tsx
import { PageHeader } from '@/components/ui'
import { Badge } from '@/components/ui'
import { IconButton } from '@/components/ui'
import { Button } from '@/components/ui'
import { useState } from 'react'
import { Monitor, Cpu, Globe, Calendar, Clock, Hash, Trash2 } from 'lucide-react'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { Avatar } from '@/components/shared/Avatar'
import { apiDelete } from '@/lib/api/client'
import { useToast } from '@/contexts/toast-context'
import { Modal, useDangerConfirm } from '@/components/ui/modal/modal'
import { EmptyState } from '@/components/ui/empty-state/EmptyState'
import { AlertIcon } from '@/components/icons'

export default function ProfilePage() {
    const { user, devices, loading, removeDevice } = useProfile()
    const confirmDanger = useDangerConfirm()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const { toast } = useToast()

    const handleDeleteAccount = async () => {
        try {
            setDeleting(true)
            await apiDelete('/auth/me')
            toast.success('Account successfully deleted.')
            window.location.href = '/login?msg=account_deleted'
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete account')
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-[720px] space-y-4 animate-fade-in">
                <div className="skeleton h-36 rounded-md" />
                <div className="skeleton h-52 rounded-md" />
                <div className="skeleton h-40 rounded-md" />
            </div>
        )
    }

    if (!user) return null

    return (
        <PageHeader title={<>
                    Profile
                </>} description={<>
                    Your account information and registered devices
                </>} actions={<><div className="rounded-md border p-6 flex items-center gap-5"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
                <Avatar src={user.avatarUrl} name={user.fullName} email={user.email} size="lg" />
                <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {user.fullName ?? '—'}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant="info"
                            >
                            {user.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </Badge>
                        <Badge variant="success"
                            style={{
                                background: user.isActive ? 'var(--success-light)' : 'var(--danger-light)',
                                borderColor: user.isActive ? 'var(--success-border)' : 'var(--danger-border)',
                                color: user.isActive ? 'var(--success)' : 'var(--danger)',
                            }}>
                            {user.isActive ? '● Active' : '● Inactive'}
                        </Badge>
                    </div>
                </div>
            </div>
<div className="rounded-md border overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
                <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                        Account Details
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x"
                    style={{ borderColor: 'var(--border)' }}>
                    {[
                        { label: 'User ID', value: user.id, icon: <Hash size={12} /> },
                        { label: 'Org ID', value: user.orgId ?? '—', icon: <Globe size={12} /> },
                        { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), icon: <Calendar size={12} /> },
                        { label: 'Last Login', value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never', icon: <Clock size={12} /> },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="px-5 py-4"
                            style={{ borderBottom: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                {icon}
                                <p className="text-[11px] font-semibold uppercase tracking-widest">{label}</p>
                            </div>
                            <p className="text-sm font-mono font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
<div className="rounded-md border overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
                <div className="px-5 py-3 border-b flex items-center justify-between"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                        Registered Devices
                    </p>
                    <Badge variant="info"
                        >
                        {devices.length}
                    </Badge>
                </div>

                {devices.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            icon={Monitor}
                            title="No Devices Registered"
                            description="Install the SecureGPT browser extension and connect your account to register this device."
                        />
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {devices.map((d, i) => (
                            <div key={d.id}
                                className="flex items-center justify-between px-5 py-4 gap-3 transition-colors animate-fade-in"
                                style={{ animationDelay: `${i * 50}ms` }}
                                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface-2)'}
                                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ''}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="size-9 rounded-xl border flex items-center justify-center shrink-0"
                                        style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-tertiary)' }}>
                                        <Monitor size={15} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                            {d.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {d.browser && (
                                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{d.browser}</span>
                                            )}
                                            {d.osPlatform && (
                                                <>
                                                    <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                                                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                                                        <Cpu size={10} />
                                                        {d.osPlatform}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right space-y-1">
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleDateString() : 'Never'}
                                        </p>
                                        <span className="text-[10px] font-semibold"
                                            style={{ color: d.isActive ? 'var(--success)' : 'var(--text-tertiary)' }}>
                                            {d.isActive ? '● Active' : '○ Inactive'}
                                        </span>
                                    </div>
                                    <IconButton aria-label="Remove device" variant="danger"
                                        type="button"
                                        onClick={async () => {
                                            const confirmed = await confirmDanger({
                                                title: `Remove device "${d.name}"?`,
                                                description: `Unlinking ${d.name} (${d.osPlatform || 'Unknown OS'}) will terminate its connection to SecureGPT.`,
                                                confirmLabel: 'Remove Device',
                                            })
                                            if (confirmed) {
                                                await removeDevice(d.id)
                                                toast.success('Device removed')
                                            }
                                        }}


                                        title="Remove device"
                                    >
                                        <Trash2 size={14} />
                                    </IconButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
<div className="rounded-md border overflow-hidden mt-6"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--danger-border)', boxShadow: 'var(--shadow-card)' }}>
                <div className="px-5 py-3 border-b animate-fade-in" style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-light)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--danger)' }}>
                        Danger Zone
                    </p>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Delete Account</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Permanently delete your account and all associated data.
                            <strong> Note:</strong> Under compliance guidelines, your account data will be retained for 3 years,
                            and security logs will be permanently deleted after 30 days. This action cannot be undone.
                        </p>
                    </div>
                    <div>
                        <Button variant="danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            type="button"


                        >
                            Delete Account
                        </Button>
                    </div>
                </div>
            </div>
<Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="md">
                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Are you absolutely sure?</h3>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            This will permanently delete your user profile, active sessions, and registered devices.
                        </p>
                        <div className="p-3.5 rounded-xl border text-[11px] space-y-1.5"
                            style={{ background: 'var(--danger-light)', borderColor: 'var(--danger-border)', color: 'var(--danger)' }}>
                            <p className="font-semibold flex items-center gap-1.5">
                                <AlertIcon size={14} className="shrink-0 text-[var(--danger)]" />
                                Data Retention & Deletion Policy:
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>Account and telemetry data will be retained for 3 years for compliance audits.</li>
                                <li>Associated security and access logs will be permanently deleted after 30 days.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="secondary"
                            onClick={() => setShowDeleteConfirm(false)}
                            type="button"


                        >
                            Cancel
                        </Button>
                        <Button variant="danger"
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            type="button"


                        >
                            {deleting ? 'Deleting...' : 'Yes, Delete Account'}
                        </Button>
                    </div>
                </div>
            </Modal></>} />
    )
}

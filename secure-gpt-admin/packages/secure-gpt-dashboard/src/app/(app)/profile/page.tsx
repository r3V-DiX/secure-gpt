'use client'
// src/app/(app)/profile/page.tsx
import { Monitor, Cpu, Globe, Calendar, Clock, Hash } from 'lucide-react'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { Avatar } from '@/components/shared/Avatar'

export default function ProfilePage() {
    const { user, devices, loading } = useProfile()

    if (loading) {
        return (
            <div className="max-w-[720px] space-y-4 animate-fade-in">
                <div className="skeleton h-36 rounded-2xl" />
                <div className="skeleton h-52 rounded-2xl" />
                <div className="skeleton h-40 rounded-2xl" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="max-w-[720px] space-y-5 animate-fade-in pb-8">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Profile
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Your account information and registered devices
                </p>
            </div>

            {/* User card */}
            <div className="rounded-2xl border p-6 flex items-center gap-5"
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
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                            style={{
                                background: 'var(--accent-light)',
                                borderColor: 'var(--accent-border)',
                                color: 'var(--accent-text)',
                            }}>
                            {user.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                            style={{
                                background: user.isActive ? 'var(--success-light)' : 'var(--danger-light)',
                                borderColor: user.isActive ? 'var(--success-border)' : 'var(--danger-border)',
                                color: user.isActive ? 'var(--success)' : 'var(--danger)',
                            }}>
                            {user.isActive ? '● Active' : '● Inactive'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Account details */}
            <div className="rounded-2xl border overflow-hidden"
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

            {/* Devices */}
            <div className="rounded-2xl border overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
                <div className="px-5 py-3 border-b flex items-center justify-between"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                        Registered Devices
                    </p>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' }}>
                        {devices.length}
                    </span>
                </div>

                {devices.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12">
                        <span className="text-3xl opacity-30">💻</span>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            No devices registered yet
                        </p>
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

                                <div className="text-right shrink-0 space-y-1">
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleDateString() : 'Never'}
                                    </p>
                                    <span className="text-[10px] font-semibold"
                                        style={{ color: d.isActive ? 'var(--success)' : 'var(--text-tertiary)' }}>
                                        {d.isActive ? '● Active' : '○ Inactive'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
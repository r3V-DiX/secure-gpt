'use client'

import { ArrowUpRight, CalendarDays, Clock3, Fingerprint, Building2, Settings2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Badge, Card, CardContent, CardHeader, LinkButton, PageHeader } from '@/components/ui'
import { useAuth } from '@/contexts/auth-context'

function formatDate(value: string | null, withTime = false) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unavailable'
  return withTime
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString(undefined, { dateStyle: 'long' })
}

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null

  const role = user.role.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase())
  const details = [
    { label: 'User ID', value: user.id, icon: Fingerprint },
    { label: 'Organization ID', value: user.orgId ?? 'Not assigned', icon: Building2 },
    { label: 'Member since', value: formatDate(user.createdAt), icon: CalendarDays },
    { label: 'Last login', value: formatDate(user.lastLoginAt, true), icon: Clock3 },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Profile" description="View your identity and account details." />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="profile-identity">
          <Card className="overflow-hidden">
            <CardHeader className="px-6 py-5">
              <h2 id="profile-identity" className="text-sm font-semibold text-[var(--text-primary)]">Identity</h2>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4 px-6 py-6 sm:flex-row sm:items-center">
              <Avatar src={user.avatarUrl} name={user.fullName} email={user.email} size="lg" />
              <div className="min-w-0">
                <p className="text-lg font-semibold text-[var(--text-primary)]">{user.fullName || 'Unnamed account'}</p>
                <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="info">{role}</Badge>
                  <Badge variant={user.isActive ? 'success' : 'danger'} dot>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="profile-details">
          <Card className="overflow-hidden">
            <CardHeader className="block px-6 py-5">
              <h2 id="profile-details" className="text-sm font-semibold text-[var(--text-primary)]">Account details</h2>
              <p className="mt-1 text-sm text-[var(--text-tertiary)]">Information associated with your account.</p>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="grid sm:grid-cols-2">
                {details.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="min-w-0 border-b border-[var(--border)] px-6 py-5 sm:odd:border-r">
                    <dt className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)]">
                      <Icon size={15} aria-hidden="true" />
                      {label}
                    </dt>
                    <dd className="mt-2 break-all text-sm font-medium text-[var(--text-primary)]" title={value}>{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="profile-settings">
        <Card>
          <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
                <Settings2 size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 id="profile-settings" className="text-sm font-semibold text-[var(--text-primary)]">Manage your account</h2>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">Review registered devices, export data, or manage account access.</p>
              </div>
            </div>
            <LinkButton href="/settings" variant="secondary" size="lg" className="shrink-0 gap-2">
              Open settings <ArrowUpRight size={15} aria-hidden="true" />
            </LinkButton>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

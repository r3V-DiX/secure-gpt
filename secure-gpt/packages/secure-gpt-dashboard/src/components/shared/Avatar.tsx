'use client'
// src/components/shared/Avatar.tsx
import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  name?: string | null
  email?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap: Record<NonNullable<AvatarProps['size']>, { cls: string; text: string }> = {
  sm: { cls: 'size-7',  text: 'text-[10px]' },
  md: { cls: 'size-9',  text: 'text-sm' },
  lg: { cls: 'size-14', text: 'text-lg' },
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = name ?? email ?? '?'
  const parts = source.trim().split(/\s+/)
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? ''
    const last = parts[parts.length - 1]?.[0] ?? ''
    return (first + last).toUpperCase()
  }
  return source.charAt(0).toUpperCase()
}

export function Avatar({ src, name, email, size = 'md', className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const { cls, text } = sizeMap[size]
  const initials = getInitials(name, email)

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ?? email ?? 'User avatar'}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${cls} rounded-full object-cover shrink-0 ${className}`}
        style={{ border: '2px solid var(--border-2)' }}
      />
    )
  }

  return (
    <div
      className={`${cls} ${text} rounded-full shrink-0 flex items-center justify-center font-bold select-none ${className}`}
      style={{
        background: 'var(--accent-light)',
        border: '2px solid var(--accent-border)',
        color: 'var(--accent-text)',
      }}
      aria-label={name ?? email ?? 'User avatar'}
      title={name ?? email ?? undefined}
    >
      {initials}
    </div>
  )
}

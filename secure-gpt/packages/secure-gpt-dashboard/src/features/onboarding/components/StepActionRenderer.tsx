import { Download, ExternalLink, Activity, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

export const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/securegpt-%E2%80%94-llm-data-prot/cbhlhbhhlcfilggkmcmodmfaeongmbmo'

export function renderStepAction(id: string) {
  switch (id) {
    case 'install':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
          >
            <Download size={13} />
            Open Chrome Web Store
            <ExternalLink size={11} style={{ opacity: 0.7 }} />
          </a>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Tip: right-click the puzzle icon →{' '}
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Pin
            </span>{' '}
            to keep SecureGPT on your toolbar.
          </p>
        </div>
      )

    case 'connect':
      return (
        <div className="space-y-3">
          <ol className="space-y-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <li>
              <span className="font-bold mr-1" style={{ color: 'var(--text-tertiary)' }}>
                1.
              </span>
              Click the SecureGPT icon in your browser toolbar.
            </li>
            <li>
              <span className="font-bold mr-1" style={{ color: 'var(--text-tertiary)' }}>
                2.
              </span>
              Click{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Sign in with Google
              </span>{' '}
              — use the same account as this dashboard.
            </li>
            <li>
              <span className="font-bold mr-1" style={{ color: 'var(--text-tertiary)' }}>
                3.
              </span>
              The popup shows{' '}
              <span className="font-semibold" style={{ color: 'var(--success)' }}>
                Active
              </span>{' '}
              and your account name once connected.
            </li>
          </ol>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-105"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border-2)',
              color: 'var(--text-primary)',
            }}
          >
            Check registered devices
          </Link>
        </div>
      )

    case 'verify':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/event-logs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
          >
            <Activity size={13} />
            Open Event Log
          </Link>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Try sending{' '}
            <span className="font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
              “my email is john.doe@acme.com”
            </span>{' '}
            to a supported AI platform.
          </p>
        </div>
      )

    case 'policy':
      return (
        <Link
          href="/policy"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
        >
          <SlidersHorizontal size={13} />
          Review your policy
        </Link>
      )

    case 'track':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/event-logs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-105"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border-2)',
              color: 'var(--text-primary)',
            }}
          >
            <Activity size={13} />
            View Event Log
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-105"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border-2)',
              color: 'var(--text-primary)',
            }}
          >
            <SlidersHorizontal size={13} />
            Settings & devices
          </Link>
        </div>
      )

    default:
      return null
  }
}

'use client'

import { usePolicy } from '@/features/policy/hooks/use-policy'
import { Button } from '@/components/ui/button/button'
import { Badge } from '@/components/ui/badge/badge'
import {
  PII_CATEGORIES, PII_CATEGORY_LABELS, PII_CATEGORY_DESCRIPTIONS,
  POLICY_ACTIONS, POLICY_ACTION_LABELS, DEFAULT_CATEGORY_ACTIONS,
} from '@securegpt/shared/constants'
import type { PIICategory, PolicyAction } from '@securegpt/shared/constants'
import { clsx } from 'clsx'

const ACTION_COLORS: Record<PolicyAction, string> = {
  BLOCK: 'border-red-300 bg-red-50 text-red-700',
  MASK: 'border-amber-300 bg-amber-50 text-amber-700',
  WARN_ALLOW: 'border-orange-300 bg-orange-50 text-orange-700',
  ALLOW: 'border-blue-300 bg-blue-50 text-blue-700',
}

export default function PolicyPage() {
  const { config, version, loading, saving, savedAt, error, save, toggleCategory, setCategoryAction } = usePolicy()

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sg-card h-40 bg-gray-50" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="sg-page-title">Policy Manager</h1>
          <p className="sg-page-subtitle">Configure detection rules and enforcement actions for your organisation</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {saving && <span className="text-xs text-gray-400 flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Saving...</span>}
          {savedAt && !saving && <span className="text-xs text-green-600">✓ Published to all devices</span>}
          <Badge variant="neutral">v{version}</Badge>
          <Button variant="primary" size="sm" loading={saving} onClick={() => save(config)}>
            Publish to devices
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4">
        {(Object.keys(PII_CATEGORIES) as PIICategory[]).map((cat) => {
          const catConfig = config.categories[cat]
          const enabled = catConfig?.enabled ?? true
          const action = (catConfig?.action ?? DEFAULT_CATEGORY_ACTIONS[cat]) as PolicyAction

          return (
            <div key={cat} className={clsx('sg-card p-5', !enabled && 'opacity-60')}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-gray-900">{PII_CATEGORY_LABELS[cat]}</h3>
                    <Badge variant={enabled ? 'success' : 'neutral'} dot>{enabled ? 'Active' : 'Disabled'}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{PII_CATEGORY_DESCRIPTIONS[cat]}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                  <span className="text-xs text-gray-500">{enabled ? 'Enabled' : 'Disabled'}</span>
                  <div
                    onClick={() => toggleCategory(cat, !enabled)}
                    className={clsx(
                      'w-10 h-5 rounded-full cursor-pointer relative transition-colors',
                      enabled ? 'bg-blue-600' : 'bg-gray-200'
                    )}
                  >
                    <span className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform', enabled ? 'translate-x-5' : 'translate-x-0.5')} />
                  </div>
                </label>
              </div>

              {enabled && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(POLICY_ACTIONS) as PolicyAction[]).map((a) => (
                    <button
                      key={a}
                      onClick={() => setCategoryAction(cat, a)}
                      className={clsx(
                        'p-2.5 rounded-lg border-2 text-left text-xs font-medium transition-all',
                        ACTION_COLORS[a],
                        action === a ? 'ring-2 ring-offset-1 ring-current opacity-100' : 'opacity-50 hover:opacity-75'
                      )}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {action === a && <span>✓</span>}
                        {POLICY_ACTION_LABELS[a]}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="sg-card p-4 flex items-center justify-between bg-blue-50 border-blue-100">
        <div>
          <p className="text-sm font-medium text-blue-800">Ready to publish?</p>
          <p className="text-xs text-blue-600 mt-0.5">Changes will be pushed to all enrolled devices within 15 minutes.</p>
        </div>
        <Button variant="primary" size="md" loading={saving} onClick={() => save(config)}>
          Publish to all devices
        </Button>
      </div>
    </div>
  )
}

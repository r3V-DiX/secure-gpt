// ─────────────────────────────────────────────
// Settings Page
// Full-page settings for SecureGPT extension
// ─────────────────────────────────────────────

import React, { useState } from 'react'
import { useSettings } from '../hooks/use-settings'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { CategoriesSection } from './CategoriesSection'
import { ActionsSection } from './ActionsSection'
import { PlatformsSection } from './PlatformsSection'
import { KeywordsSection } from './KeywordsSection'
import { AccountSection } from './AccountSection'
import { Button } from '@/components/ui/button/button'
import { Badge } from '@/components/ui/badge/badge'
import { clsx } from 'clsx'

type Tab = 'categories' | 'actions' | 'platforms' | 'keywords' | 'account'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'categories', label: 'Data Categories', icon: '🔍' },
  { id: 'actions', label: 'Actions', icon: '⚡' },
  { id: 'platforms', label: 'Platforms', icon: '🌐' },
  { id: 'keywords', label: 'Custom Keywords', icon: '🏷️' },
  { id: 'account', label: 'Account', icon: '👤' },
]

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('categories')
  const { config, loading, saving, savedAt, ...actions } = useSettings()
  const { user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'var(--sg-font)' }}>
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">SecureGPT Settings</h1>
              <p className="text-xs text-gray-500">Configure your data protection preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            )}
            {savedAt && !saving && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <span>✓</span> Saved
              </span>
            )}
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full" />
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar nav */}
        <aside className="w-52 flex-shrink-0">
          <nav className="space-y-1 sticky top-24">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 text-left',
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                )}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 animate-fade-in">
          {activeTab === 'categories' && (
            <CategoriesSection config={config} onToggle={actions.toggleCategory} />
          )}
          {activeTab === 'actions' && (
            <ActionsSection config={config} onSetAction={actions.setCategoryAction} />
          )}
          {activeTab === 'platforms' && (
            <PlatformsSection config={config} onToggle={actions.togglePlatform} />
          )}
          {activeTab === 'keywords' && (
            <KeywordsSection config={config} onAdd={actions.addKeyword} onRemove={actions.removeKeyword} />
          )}
          {activeTab === 'account' && (
            <AccountSection user={user} config={config} />
          )}
        </main>
      </div>
    </div>
  )
}

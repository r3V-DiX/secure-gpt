// ─────────────────────────────────────────────
// Platforms Section
// Toggle monitored LLM platforms
// ─────────────────────────────────────────────

import React from 'react'
import { Card } from '@/components/ui/card/card'
import { Toggle } from '@/components/ui/toggle/toggle'
import { Badge } from '@/components/ui/badge/badge'
import { ALL_PLATFORMS, PLATFORM_LABELS, PLATFORM_DOMAINS } from '@securegpt/shared/constants'
import type { PIIConfig } from '@securegpt/shared/types'
import type { LLMPlatform } from '@securegpt/shared/constants'

interface PlatformsSectionProps {
  config: PIIConfig
  onToggle: (platform: string, enabled: boolean) => void
}

const platformIcons: Record<LLMPlatform, string> = {
  chatgpt: '🤖',
  gemini: '✨',
  copilot: '🪟',
  claude: '🧠',
  perplexity: '🔍',
  'meta-ai': '🦙',
}

export function PlatformsSection({ config, onToggle }: PlatformsSectionProps) {
  const monitoredSet = new Set(config.monitoredPlatforms)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Monitored Platforms</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          SecureGPT will scan inputs on the following LLM platforms.
        </p>
      </div>

      <Card padding="none">
        <div className="divide-y divide-gray-100">
          {ALL_PLATFORMS.map((platform, idx) => {
            const isMonitored = monitoredSet.has(platform)
            return (
              <div
                key={platform}
                className={`flex items-center justify-between px-4 py-3 ${idx === 0 ? 'rounded-t-xl' : ''} ${idx === ALL_PLATFORMS.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{platformIcons[platform]}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{PLATFORM_LABELS[platform]}</p>
                    <p className="text-xs text-gray-400">{PLATFORM_DOMAINS[platform]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isMonitored && (
                    <Badge variant="success" dot>Monitored</Badge>
                  )}
                  <Toggle
                    checked={isMonitored}
                    onChange={(val) => onToggle(platform, val)}
                    size="sm"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Custom domains */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Custom domains</h3>
        <p className="text-xs text-gray-500 mb-3">
          Add additional AI tool domains to monitor (e.g. internal AI deployments).
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. ai.mycompany.com"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            Add
          </button>
        </div>
        {config.customDomains && config.customDomains.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {config.customDomains.map((domain) => (
              <span key={domain} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {domain}
                <button className="hover:text-blue-900 font-medium">×</button>
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

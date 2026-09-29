import type { DetectionRule } from '../schema'
import type { PIICategory } from '@securegpt/shared/constants'

export const allIPRules: DetectionRule[] = [
  {
    id: 'ip.roadmap_keywords',
    category: 'IP' as PIICategory,
    type: 'proprietary',
    label: 'Roadmap & Strategy',
    pattern: /\b(?:q[1-4]\s*20[2-9][0-9]|roadmap|launch\s*plan)\b/gi,
    requireContext: true,
    triggers: ['confidential', 'internal', 'draft'],
    severity: 'medium',
    enabled: true,
    description: 'Product roadmaps, launch schedules, and GTM plans.'
  },
  {
    id: 'ip.ma_keywords',
    category: 'IP' as PIICategory,
    type: 'proprietary',
    label: 'M&A Keywords',
    pattern: /\b(?:merger|acquisition|due\s*diligence)\b/gi,
    requireContext: true,
    triggers: ['project', 'target', 'deal', 'company', 'corp', 'acquire', 'startup', 'valuation'],
    severity: 'high',
    enabled: true,
    description: 'Mergers, acquisitions, due diligence, and deal values.'
  },
  {
    id: 'ip.ipv4',
    category: 'IP' as PIICategory,
    type: 'ip_address',
    label: 'IPv4 Address',
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    requireContext: true,
    triggers: ['ip', 'address', 'server'],
    severity: 'low',
    enabled: true,
    description: 'IPv4 network addresses.'
  }
]

// ─────────────────────────────────────────────
// Intellectual Property Rules
// ─────────────────────────────────────────────

import type { DetectionRule } from '../schema'

export const ipRules: DetectionRule[] = [
  {
    id: 'ip.roadmap_keywords',
    category: 'IP',
    type: 'proprietary',
    label: 'Product Roadmap Data',
    pattern: /\b(?:product\s+roadmap|launch\s+date|feature\s+plan|release\s+schedule|go[\s-]to[\s-]market|q[1-4]\s+launch|upcoming\s+feature|milestone\s+plan)\b/gi,
    severity: 'high',
    enabled: true,
    description: 'Product roadmap and launch schedule keywords',
  },
  {
    id: 'ip.patent_keywords',
    category: 'IP',
    type: 'proprietary',
    label: 'Patent / Invention Data',
    pattern: /\b(?:patent[\s-]pending|provisional\s+application|patent\s+application|invention\s+disclosure|patentable|prior\s+art|claims?\s+of\s+patent)\b/gi,
    severity: 'high',
    enabled: true,
    description: 'Patent and invention-related keywords',
  },
  {
    id: 'ip.ma_keywords',
    category: 'IP',
    type: 'proprietary',
    label: 'M&A / Deal Information',
    pattern: /\b(?:merger|acquisition|letter\s+of\s+intent|loi|term\s+sheet|due\s+diligence|target\s+company|deal\s+value|non[\s-]disclosure)\b/gi,
    severity: 'critical',
    enabled: true,
    description: 'Merger and acquisition sensitive keywords',
  },
  {
    id: 'ip.legal_keywords',
    category: 'IP',
    type: 'proprietary',
    label: 'Legal Document Keywords',
    pattern: /\b(?:nda|non[\s-]disclosure\s+agreement|arbitration\s+clause|indemnification|intellectual\s+property\s+rights|trade\s+secret|confidentiality\s+agreement)\b/gi,
    severity: 'high',
    enabled: true,
    description: 'Legal and NDA related sensitive terms',
  },
]

// ─────────────────────────────────────────────
// Demo Detection
// Lightweight regex-only detection for demo/testing.
// Returns the EXACT same DetectionResult shape as the real
// @securegpt/detection package — just swap the import.
//
// Usage in interceptor.ts:
//   import { detectPIIDemo as detectPII } from '@/lib/detection/demo-detection'
//   (replace the @securegpt/detection import for demo mode)
// ─────────────────────────────────────────────

import { v4 as uuidv4 } from 'uuid'
import type { DetectionResult, PIIEntity, PIIConfig } from '@securegpt/shared/types'

// ── Demo rules — covers the most common PII patterns ─────────────────────────
interface DemoRule {
  id: string
  type: string
  category: 'FINANCIAL' | 'PII' | 'CONFIDENTIAL' | 'IP'
  label: string
  pattern: RegExp
  severity: 'low' | 'medium' | 'high' | 'critical'
  maskedValue: string
}

const DEMO_RULES: DemoRule[] = [
  // ── Financial ────────────────────────────────────────────────────────────
  {
    id: 'demo.credit_card',
    type: 'credit_card',
    category: 'FINANCIAL',
    label: 'Credit Card Number',
    pattern: /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4})\b/g,
    severity: 'critical',
    maskedValue: '[CARD-REDACTED]',
  },
  {
    id: 'demo.pan_card',
    type: 'pan_card',
    category: 'FINANCIAL',
    label: 'Indian PAN Card',
    pattern: /\b([A-Z]{3}[PCHFATBLJG][A-Z]\s*[0-9OIS]{4}\s*[A-Z])\b/gi,
    severity: 'critical',
    maskedValue: '[PAN-REDACTED]',
  },
  {
    id: 'demo.gstin',
    type: 'gst_number',
    category: 'FINANCIAL',
    label: 'GSTIN',
    pattern: /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b/gi,
    severity: 'high',
    maskedValue: '[GST-REDACTED]',
  },

  // ── PII ──────────────────────────────────────────────────────────────────
  {
    id: 'demo.email',
    type: 'email',
    category: 'PII',
    label: 'Email Address',
    pattern: /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,
    severity: 'medium',
    maskedValue: '[EMAIL-REDACTED]',
  },
  {
    id: 'demo.phone_in',
    type: 'phone',
    category: 'PII',
    label: 'Indian Mobile Number',
    pattern: /\b(\+91[\s-]?)?([6-9]\d{9})\b/g,
    severity: 'medium',
    maskedValue: '[PHONE-REDACTED]',
  },
  {
    id: 'demo.aadhaar',
    type: 'aadhaar',
    category: 'PII',
    label: 'Aadhaar Number',
    pattern: /\b([2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4})\b/g,
    severity: 'critical',
    maskedValue: '[AADHAAR-REDACTED]',
  },
  {
    id: 'demo.us_ssn',
    type: 'ssn',
    category: 'PII',
    label: 'US SSN',
    pattern: /\b(\d{3}-\d{2}-\d{4})\b/g,
    severity: 'high',
    maskedValue: '[SSN-REDACTED]',
  },
  {
    id: 'demo.passport_mrz_l1',
    type: 'passport',
    category: 'PII',
    label: 'Passport MRZ (Line 1)',
    pattern: /(P[<{({[\]]?[A-Z<{({[\]]{40,44})/gi,
    severity: 'critical',
    maskedValue: '[PASSPORT-REDACTED]',
  },

  // ── Confidential ─────────────────────────────────────────────────────────
  {
    id: 'demo.aws_key',
    type: 'aws_key',
    category: 'CONFIDENTIAL',
    label: 'AWS Access Key',
    pattern: /\b(AKIA[0-9A-Z]{16})\b/g,
    severity: 'critical',
    maskedValue: '[AWS-KEY-REDACTED]',
  },
  {
    id: 'demo.github_pat',
    type: 'github_pat',
    category: 'CONFIDENTIAL',
    label: 'GitHub Personal Access Token',
    pattern: /\b(ghp_[A-Za-z0-9]{36})\b/g,
    severity: 'critical',
    maskedValue: '[GITHUB-PAT-REDACTED]',
  },
  {
    id: 'demo.jwt',
    type: 'jwt_token',
    category: 'CONFIDENTIAL',
    label: 'JWT Token',
    pattern: /\b(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+)\b/g,
    severity: 'high',
    maskedValue: '[TOKEN-REDACTED]',
  },
  {
    id: 'demo.generic_api_key',
    type: 'api_key',
    category: 'CONFIDENTIAL',
    label: 'API Key / Token',
    pattern: /(?:api[_-]?key|api[_-]?token|auth[_-]?token|access[_-]?token)\s*[=:]\s*(['"]?)([A-Za-z0-9_\-.]{16,})\1/gi,
    severity: 'high',
    maskedValue: '[API-KEY-REDACTED]',
  },

  // ── IP / Intellectual Property ────────────────────────────────────────────
  {
    id: 'demo.roadmap',
    type: 'proprietary',
    category: 'IP',
    label: 'Product Roadmap Keywords',
    pattern: /\b(product roadmap|launch date|go-to-market|gtm strategy|q[1-4] launch|release schedule)\b/gi,
    severity: 'high',
    maskedValue: '[PROPRIETARY-DATA-REDACTED]',
  },
  {
    id: 'demo.ma',
    type: 'proprietary',
    category: 'IP',
    label: 'M&A Keywords',
    pattern: /\b(merger|acquisition|term sheet|letter of intent|due diligence|non-disclosure)\b/gi,
    severity: 'critical',
    maskedValue: '[PROPRIETARY-DATA-REDACTED]',
  },
]

// ── Main export — drop-in replacement for detectPII ───────────────────────────
export async function detectPIIDemo(
  text: string,
  config: PIIConfig
): Promise<DetectionResult> {
  const startTime = performance.now()

  if (!text || text.trim().length === 0) {
    return buildResult([], startTime, text)
  }

  const entities: PIIEntity[] = []

  for (const rule of DEMO_RULES) {
    // Check if category is enabled in policy
    const categoryConfig = config.categories[rule.category]
    if (!categoryConfig?.enabled) continue

    // Reset regex state
    rule.pattern.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = rule.pattern.exec(text)) !== null) {
      // Use first capture group if present, else full match
      const value = match[1] ?? match[0]
      if (!value || value.trim().length === 0) continue

      // Check allowlist
      const allowlist = categoryConfig.allowlist ?? []
      if (allowlist.some((a) => value.toLowerCase().includes(a.toLowerCase()))) {
        continue
      }

      const start = match.index + match[0].indexOf(value)

      entities.push({
        id: uuidv4(),
        ruleId: `demo.${rule.category.toLowerCase()}.${rule.type}`,
        type: rule.type,
        label: rule.label,
        category: rule.category,
        value,
        maskedValue: rule.maskedValue,
        startIndex: start,
        endIndex: start + value.length,
        confidence: 0.9,
        severity: rule.severity,
        tier: 'regex',
      })
    }

    rule.pattern.lastIndex = 0
  }

  // Deduplicate overlapping matches — keep highest confidence
  const deduped = deduplicateEntities(entities)

  return buildResult(deduped, startTime, text)
}

function deduplicateEntities(entities: PIIEntity[]): PIIEntity[] {
  if (entities.length === 0) return []
  const sorted = [...entities].sort((a, b) => a.startIndex - b.startIndex)
  const result: PIIEntity[] = []

  for (const entity of sorted) {
    const last = result[result.length - 1]
    if (last && entity.startIndex < last.endIndex) {
      if (entity.confidence > last.confidence) {
        result[result.length - 1] = entity
      }
    } else {
      result.push(entity)
    }
  }
  return result
}

function buildResult(
  entities: PIIEntity[],
  startTime: number,
  inputText: string
): DetectionResult {
  return {
    hasFindings: entities.length > 0,
    entities,
    tier: 'regex',
    processingTimeMs: Math.round(performance.now() - startTime),
    inputLength: inputText.length,
  }
}
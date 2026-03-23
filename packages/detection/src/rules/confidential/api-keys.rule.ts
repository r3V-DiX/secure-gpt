// ─────────────────────────────────────────────
// Confidential / Business Data Rules
// Enhanced with MVP patterns
// ─────────────────────────────────────────────

import type { DetectionRule } from '../schema'

export const confidentialRules: DetectionRule[] = [
  {
    id: 'confidential.aws_access_key',
    category: 'CONFIDENTIAL',
    type: 'aws_key',
    label: 'AWS Access Key ID',
    pattern: /\b(AKIA[0-9A-Z]{16})\b/g,
    severity: 'critical',
    enabled: true,
    description: 'Amazon Web Services IAM access key',
  },
  {
    id: 'confidential.aws_secret_key',
    category: 'CONFIDENTIAL',
    type: 'aws_key',
    label: 'AWS Secret Access Key',
    // 40-char base64 string only matched in context for fewer false positives
    pattern: /(?:aws_secret_access_key|secret_key)\s*[=:]\s*(['"]?)([A-Za-z0-9/+]{40})\1/gi,
    severity: 'critical',
    enabled: true,
    description: 'Amazon Web Services IAM secret access key',
  },
  {
    id: 'confidential.stripe_secret_key',
    category: 'CONFIDENTIAL',
    type: 'api_key',
    label: 'Stripe Secret API Key (Live)',
    pattern: /\b(sk_live_[a-zA-Z0-9]{24,})\b/g,
    severity: 'critical',
    enabled: true,
    description: 'Stripe live environment secret key',
  },
  {
    id: 'confidential.stripe_restricted_key',
    category: 'CONFIDENTIAL',
    type: 'api_key',
    label: 'Stripe Restricted API Key (Live)',
    pattern: /\b(rk_live_[a-zA-Z0-9]{24,})\b/g,
    severity: 'critical',
    enabled: true,
    description: 'Stripe live environment restricted key',
  },
  {
    id: 'confidential.generic_api_key',
    category: 'CONFIDENTIAL',
    type: 'api_key',
    label: 'Generic API Key / Auth Token',
    pattern: /(?:api[_-]?key|auth[_-]?token|bearer)\s*[=:]\s*(['"]?)([A-Za-z0-9_\-.]{20,})\1/gi,
    severity: 'high',
    enabled: true,
    description: 'Generic pattern for keys/tokens in code or configs',
  },
  {
    id: 'confidential.private_key_pem',
    category: 'CONFIDENTIAL',
    type: 'credentials',
    label: 'Private Key (PEM)',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'critical',
    enabled: true,
    description: 'Unencrypted PEM private key header',
  },
  {
    id: 'confidential.github_pat',
    category: 'CONFIDENTIAL',
    type: 'github_pat',
    label: 'GitHub Personal Access Token',
    pattern: /\bghp_[A-Za-z0-9]{36}\b|\bgho_[A-Za-z0-9]{36}\b|\bghr_[A-Za-z0-9]{36}\b/g,
    severity: 'critical',
    enabled: true,
    description: 'GitHub personal, OAuth, or refresh tokens',
  },
  {
    id: 'confidential.jwt_token',
    category: 'CONFIDENTIAL',
    type: 'jwt_token',
    label: 'JSON Web Token (JWT)',
    pattern: /\b(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+)\b/g,
    severity: 'high',
    enabled: true,
    description: 'Standard JWT pattern',
  },
]

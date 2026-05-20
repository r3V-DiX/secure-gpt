import type { DetectionRule } from '../schema'
import type { PIICategory } from '@securegpt/shared/constants'

export const allConfidentialRules: DetectionRule[] = [
  {
    id: 'confidential.aws_access_key',
    category: 'CONFIDENTIAL' as PIICategory,
    type: 'aws_key',
    label: 'AWS Access Key',
    pattern: /\b(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\b/gi,
    requireContext: false,
    severity: 'critical',
    enabled: true,
    description: 'Amazon Web Services IAM Access Key ID.'
  },
  {
    id: 'confidential.aws_secret_key',
    category: 'CONFIDENTIAL' as PIICategory,
    type: 'aws_key',
    label: 'AWS Secret Key',
    pattern: /(?:aws_secret_access_key|aws_secret_key).*?['"]?[a-zA-Z0-9/+=]{40}['"]?/gi,
    requireContext: true,
    triggers: ['secret', 'aws'],
    severity: 'critical',
    enabled: true,
    description: 'AWS Secret Access Key.'
  },
  {
    id: 'confidential.stripe',
    category: 'CONFIDENTIAL' as PIICategory,
    type: 'api_key',
    label: 'Stripe API Key',
    pattern: /\b(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,99}\b/gi,
    requireContext: false,
    severity: 'critical',
    enabled: true,
    description: 'Stripe API Keys'
  },
  {
    id: 'confidential.github_pat',
    category: 'CONFIDENTIAL' as PIICategory,
    type: 'github_pat',
    label: 'GitHub PAT',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b/gi,
    requireContext: false,
    severity: 'critical',
    enabled: true,
    description: 'GitHub Personal Access Tokens'
  },
  {
    id: 'confidential.jwt_token',
    category: 'CONFIDENTIAL' as PIICategory,
    type: 'jwt_token',
    label: 'JWT Token',
    pattern: /\beyJ[a-zA-Z0-9_=]+?\.[a-zA-Z0-9_=]+?\.[a-zA-Z0-9_+/=-]*\b/g,
    validatorId: 'jwt_parser',
    requireContext: true,
    triggers: ['token', 'auth', 'bearer'],
    severity: 'high',
    enabled: true,
    description: 'Standard JSON Web Token (JWT) base64 pattern.'
  },
  {
    id: 'confidential.generic_api_key',
    category: 'CONFIDENTIAL' as PIICategory,
    type: 'api_key',
    label: 'Generic API Key',
    pattern: /(?:api_key|token|secret|password).*?['"][a-zA-Z0-9\-_]{16,64}['"]/gi,
    validatorId: 'entropy',
    requireContext: false,
    severity: 'medium',
    enabled: true,
    description: 'Generic pattern for keys/tokens in code or configs.'
  },
  {
    id: 'confidential.private_key',
    category: 'CONFIDENTIAL' as PIICategory,
    type: 'credentials',
    label: 'Private Key',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/gi,
    requireContext: false,
    severity: 'critical',
    enabled: true,
    description: 'Unencrypted PEM private key headers.'
  }
]

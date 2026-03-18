import { financialRules as cardRules } from './credit-card.rule'
import { financialRules as keywordRules } from './financial-keywords.rule'
import type { DetectionRule } from '../schema'

export const allFinancialRules: DetectionRule[] = [
  ...cardRules,
  ...keywordRules,
]

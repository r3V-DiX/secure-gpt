// ─────────────────────────────────────────────
// Financial Keyword Rules
// Keyword + context proximity detection
// ─────────────────────────────────────────────

import type { DetectionRule } from '../schema'

export const financialKeywordRules: DetectionRule[] = [
  {
    id: 'financial.salary_data',
    category: 'FINANCIAL',
    type: 'salary',
    label: 'Salary / Payroll Data',
    // keyword near a numeric value (currency pattern)
    pattern: /\b(?:salary|ctc|payroll|compensation\s+band|annual\s+package|fixed\s+pay|take[\s-]?home)[\s:=\-]*(?:(?:rs|inr|usd|\$|£|€)[\s]?)?[0-9,]+(?:\.[0-9]{1,2})?\b/gi,
    severity: 'high',
    enabled: true,
    description: 'Salary and payroll information with numeric values',
  },
  {
    id: 'financial.budget_data',
    category: 'FINANCIAL',
    type: 'financial_data',
    label: 'Budget / Forecast Data',
    pattern: /\b(?:q[1-4]\s+(?:forecast|budget|target)|annual\s+budget|capex|opex|revenue\s+target|ebitda|net\s+profit|p&l|balance\s+sheet)[\s:=\-]*(?:(?:rs|inr|usd|\$|£|€)[\s]?)?[0-9,]+(?:\.[0-9]{1,2})?\b/gi,
    severity: 'high',
    enabled: true,
    description: 'Budget, forecast, and financial statement data',
  },
]

export const financialRules = [
  ...financialKeywordRules,
]

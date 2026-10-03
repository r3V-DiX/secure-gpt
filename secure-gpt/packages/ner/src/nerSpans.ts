// packages/ner/src/nerSpans.ts
import type { PIIEntity, PIIConfig } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'

export const LABEL_MAP: Record<number, string> = {
  0: 'B-BOD', 1: 'B-BUILDING', 2: 'B-CITY', 3: 'B-COUNTRY', 4: 'B-DATE',
  5: 'B-DRIVERLICENSE', 6: 'B-EMAIL', 7: 'B-GEOCOORD', 8: 'B-GIVENNAME1',
  9: 'B-GIVENNAME2', 10: 'B-IDCARD', 11: 'B-IP', 12: 'B-LASTNAME1',
  13: 'B-LASTNAME2', 14: 'B-LASTNAME3', 15: 'B-PASS', 16: 'B-PASSPORT',
  17: 'B-POSTCODE', 18: 'B-SECADDRESS', 19: 'B-SEX', 20: 'B-SOCIALNUMBER',
  21: 'B-STATE', 22: 'B-STREET', 23: 'B-TEL', 24: 'B-TIME', 25: 'B-TITLE',
  26: 'B-USERNAME', 27: 'I-BOD', 28: 'I-BUILDING', 29: 'I-CITY', 30: 'I-COUNTRY',
  31: 'I-DATE', 32: 'I-DRIVERLICENSE', 33: 'I-EMAIL', 34: 'I-GEOCOORD',
  35: 'I-GIVENNAME1', 36: 'I-GIVENNAME2', 37: 'I-IDCARD', 38: 'I-IP',
  39: 'I-LASTNAME1', 40: 'I-LASTNAME2', 41: 'I-LASTNAME3', 42: 'I-PASS',
  43: 'I-PASSPORT', 44: 'I-POSTCODE', 45: 'I-SECADDRESS', 46: 'I-SEX',
  47: 'I-SOCIALNUMBER', 48: 'I-STATE', 49: 'I-STREET', 50: 'I-TEL',
  51: 'I-TIME', 52: 'I-TITLE', 53: 'I-USERNAME', 54: 'O',
}

export const HIGH_PRIORITY_LABELS = new Set([
  'B-EMAIL', 'I-EMAIL', 'B-IDCARD', 'I-IDCARD', 'B-PASSPORT', 'I-PASSPORT',
  'B-SOCIALNUMBER', 'I-SOCIALNUMBER', 'B-DRIVERLICENSE', 'I-DRIVERLICENSE',
])

export const MEDIUM_PRIORITY_LABELS = new Set([
  'B-TEL', 'I-TEL', 'B-STREET', 'I-STREET', 'B-GIVENNAME1', 'B-LASTNAME1', 'B-DATE',
])

export function spansFromLabels(
  tokens: string[],
  offsets: Array<[number, number]>,
  predictions: number[],
  originalText: string
): Array<{ type: string; value: string; start: number; end: number }> {
  const spans: Array<{ type: string; value: string; start: number; end: number }> = []
  let currentType: string | null = null
  let start = 0
  let end = 0

  const flush = () => {
    const cutsStart = start > 0 && /[\p{L}\p{N}]/u.test(originalText[start - 1]!) &&
      (/[\p{L}\p{N}]/u.test(originalText[start]!) || (/[-/.]/.test(originalText[start]!) && /[\p{L}\p{N}]/u.test(originalText[start + 1] ?? '')))
    const cutsEnd = end < originalText.length && /[\p{L}\p{N}]/u.test(originalText[end - 1]!) && /[\p{L}\p{N}]/u.test(originalText[end]!)
    if (currentType && end > start && !cutsStart && !cutsEnd && originalText.slice(start, end).trim().length > 1) {
      spans.push({
        type: `B-${currentType}`,
        value: originalText.slice(start, end),
        start,
        end,
      })
    }
    currentType = null
  }

  for (let i = 0; i < tokens.length; i++) {
    const label = LABEL_MAP[predictions[i]!] ?? 'O'
    const token = tokens[i]!
    const offset = offsets[i]
    if (label === 'O' || token === '[PAD]' || token === '[CLS]' || token === '[SEP]' || !offset || offset[1] <= offset[0]) {
      flush()
    } else {
      const type = label.slice(2)
      if (currentType && (currentType !== type || label.startsWith('B-'))) flush()
      if (!currentType) start = offset[0]
      currentType = type
      end = offset[1]
    }
  }
  flush()
  return spans
}

export function mapLabelToCategory(label: string): PIICategory {
  const piiIdentity = [
    'B-IDCARD', 'I-IDCARD', 'B-PASSPORT', 'I-PASSPORT',
    'B-SOCIALNUMBER', 'I-SOCIALNUMBER', 'B-DRIVERLICENSE', 'I-DRIVERLICENSE',
  ]
  if (piiIdentity.includes(label)) return 'PII'
  const confidential = ['B-PASS', 'I-PASS', 'B-SECADDRESS', 'I-SECADDRESS']
  if (confidential.includes(label)) return 'CONFIDENTIAL'
  return 'PII'
}

export function formatLabel(type: string): string {
  return type
    .replace(/^[BI]-/, '')
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// packages/secure-gpt-dashboard/src/config/versions.types.ts

export type TabKey = 'baseline' | 'admin' | 'extension'

export interface VersionItem {
  id?: string
  version: string
  date: string
  status: string
  tag: string
  commit: string
  summary: string
  info: string
  whatsNew: string[]
  changedFunctionality: string[]
  improvements: string[]
  problemsSolved: string[]
}

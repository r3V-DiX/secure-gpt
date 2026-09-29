'use client'

import { Input, Select } from '@/components/ui'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button/button'
import type { CustomRule } from '@/types'
import { Switch } from '@/components/ui/input/selection'

export interface AddEditRuleModalProps {
  category: string
  initialRule?: CustomRule
  onSave: (rule: Omit<CustomRule, 'id' | 'type'>) => void
  onClose: () => void
}

export function AddEditRuleModal({
  category,
  initialRule,
  onSave,
  onClose,
}: AddEditRuleModalProps) {
  const [label, setLabel] = useState(initialRule?.label ?? '')
  const [pattern, setPattern] = useState(initialRule?.pattern ?? '')
  const [severity, setSeverity] = useState<CustomRule['severity']>(initialRule?.severity ?? 'medium')
  const [caseSensitive, setCaseSensitive] = useState(initialRule?.caseSensitive ?? false)
  const [maskingLabel, setMaskingLabel] = useState(initialRule?.maskingLabel ?? '')
  const [patternError, setPatternError] = useState<string | null>(null)

  const inp = {
    background: 'var(--bg-surface-2)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  }

  const canAdd = label.trim() && pattern.trim() && !patternError

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {initialRule ? 'Edit Custom Rule' : 'New Custom Rule'}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {initialRule ? 'Modify this custom rule' : `Detect custom patterns in the ${category} category`}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Rule name</label>
          <Input aria-label="e.g. Employee Badge ID"
            autoFocus
            className="w-full"
            style={inp}
            placeholder="e.g. Employee Badge ID"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Regex pattern</label>
            <a
              href="https://quickref.me/regex"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] hover:underline transition-colors"
              style={{ color: 'var(--accent-text)' }}
            >
              Regex Reference
            </a>
          </div>
          <Input aria-label="e.g. EMP-[0-9]{5}"
            className="w-full font-mono"
            style={{ borderColor: patternError ? 'var(--danger)' : 'var(--border)' }}
            placeholder="e.g. EMP-[0-9]{5}"
            value={pattern}
            onChange={e => {
              setPattern(e.target.value)
              try {
                new RegExp(e.target.value)
                setPatternError(null)
              } catch (err: any) {
                setPatternError(err.message)
              }
            }}
          />
          {patternError && <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{patternError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Severity</label>
            <Select aria-label="Low"
              className="w-full"
              style={inp}
              value={severity}
              onChange={e => setSeverity(e.target.value as any)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Masking label <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <Input aria-label="e.g. EMP_ID"
              className="w-full"
              style={inp}
              placeholder="e.g. EMP_ID"
              value={maskingLabel}
              onChange={e => setMaskingLabel(e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <Switch aria-label="Case sensitive matching" checked={caseSensitive} onCheckedChange={setCaseSensitive} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Case sensitive</span>
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          disabled={!canAdd}
          onClick={() =>
            onSave({
              label,
              pattern,
              severity,
              caseSensitive,
              enabled: true,
              description: '',
              maskingLabel: maskingLabel.trim() || undefined,
              requireContext: false,
              triggers: [],
            })
          }
        >
          {initialRule ? 'Save Changes' : 'Add Rule'}
        </Button>
      </div>
    </div>
  )
}

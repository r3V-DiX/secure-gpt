'use client'

import { Button } from '@/components/ui'
import React from 'react'
import { Undo2, Save } from 'lucide-react'
import { FloatingActionBar } from '@/components/shared/FloatingActionBar'

export function SaveBar({
  isDirty,
  saving,
  onSave,
  onDiscard,
}: {
  isDirty: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <FloatingActionBar
      visible={isDirty}
      indicatorColor="var(--warning)"
      label={saving ? 'Publishing policy…' : 'You have unsaved changes'}
    >
      <Button variant="secondary"
        type="button"
        onClick={onDiscard}
        disabled={saving}


      >
        <Undo2 size={11} /> Discard
      </Button>
      <Button variant="primary"
        type="button"
        onClick={onSave}
        loading={saving}
        icon={<Save size={11} />}
        disabled={saving}


      >
        {saving ? 'Saving…' : 'Save & Publish'}
      </Button>
    </FloatingActionBar>
  )
}

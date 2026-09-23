'use client'

import React, { useState, useRef } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { Upload, FileText, CheckCircle2, Loader2, Download } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'

interface UserCsvImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UserCsvImportModal({ open, onClose, onSuccess }: UserCsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDownloadTemplate = () => {
    const csvContent = "Email,Full Name,Organization,Role\nadmin.sec@company.com,Alex Doe,rivedix,super_admin\nauditor.smith@company.com,Sam Smith,rivedix,auditor\nstaff.user@company.com,Jordan Lee,rivedix,user\n"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'admin_user_roster_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (!selected.name.endsWith('.csv')) {
        toast.error('Please upload a valid .csv file.')
        return
      }
      setFile(selected)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/v1/admin/users/import-csv', {
        method: 'POST',
        body: formData,
      })

      const json = await response.json()
      if (json.success) {
        setResult(json.data)
        toast.success(json.message || 'Users imported successfully!')
        onSuccess()
      } else {
        toast.error(json.error?.message || 'Failed to import roster.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing CSV file.')
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setFile(null)
    setResult(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={resetState} size="md">
      <ModalHeader onClose={resetState}>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[var(--accent-light)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)]">
            <Upload size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Bulk Admin User Import</h3>
            <p className="text-xs text-[var(--text-muted)]">Upload a CSV file to enroll or configure multiple user accounts</p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border bg-[var(--bg-surface-2)] border-[var(--border)] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Need a CSV template?</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Columns: Email, Full Name, Organization, Role (e.g. super_admin, auditor, user)</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleDownloadTemplate} className="gap-1 text-xs">
              <Download size={13} />
              Template
            </Button>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all hover:bg-[var(--bg-surface-2)] flex flex-col items-center justify-center gap-2"
            style={{ borderColor: file ? 'var(--accent)' : 'var(--border-2)' }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <div className="size-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]">
              <FileText size={20} className={file ? 'text-[var(--accent)]' : ''} />
            </div>
            {file ? (
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{file.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB — Click to change file</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Click or drop CSV file here</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Supports standard CSV format with headers</p>
              </div>
            )}
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 size={16} />
                <span>Import Completed</span>
              </div>
              <div className="flex items-center gap-4 text-[var(--text-secondary)] font-mono text-[11px]">
                <span>✓ Added: {result.created}</span>
                <span>↻ Updated: {result.updated}</span>
                {result.errors.length > 0 && <span className="text-rose-400">✗ Errors: {result.errors.length}</span>}
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-24 overflow-y-auto mt-2 p-2 bg-black/20 rounded text-[10px] text-rose-300 font-mono space-y-1">
                  {result.errors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" onClick={resetState} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || loading}
            className="gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {loading ? 'Processing...' : 'Import Users'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

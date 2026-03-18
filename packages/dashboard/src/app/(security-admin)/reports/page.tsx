'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button/button'
import apiClient from '@/lib/api/client'

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null)

  async function download(format: 'csv' | 'pdf') {
    setDownloading(format)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const res = await apiClient.get(`/reports/export/${format}?${params}`, {
        responseType: 'blob',
      })

      const blob = new Blob([res.data as BlobPart])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `securegpt-report-${new Date().toISOString().slice(0, 10)}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="sg-page-title">Reports & Export</h1>
        <p className="sg-page-subtitle">Generate compliance reports and export audit data</p>
      </div>

      {/* Date range */}
      <div className="sg-card p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Date range (optional)</h2>
        <div className="flex items-center gap-3">
          <div>
            <label className="sg-label">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="sg-input w-44" />
          </div>
          <div>
            <label className="sg-label">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="sg-input w-44" />
          </div>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate('') }} className="text-sm text-gray-400 hover:text-gray-600 mt-5">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sg-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📊</div>
            <div>
              <h3 className="font-semibold text-gray-800">CSV Export</h3>
              <p className="text-sm text-gray-500 mt-0.5">Full audit log as spreadsheet. Contains all event metadata. Ideal for compliance tools and SIEM integration.</p>
            </div>
          </div>
          <ul className="text-xs text-gray-400 space-y-1 mb-4 ml-16">
            <li>✓ All event fields</li>
            <li>✓ Filterable by date range</li>
            <li>✓ Compatible with Excel, Google Sheets</li>
          </ul>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            loading={downloading === 'csv'}
            onClick={() => download('csv')}
          >
            Download CSV
          </Button>
        </div>

        <div className="sg-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📄</div>
            <div>
              <h3 className="font-semibold text-gray-800">PDF Summary Report</h3>
              <p className="text-sm text-gray-500 mt-0.5">Executive summary with charts and KPI breakdown. Ideal for management reporting and audits.</p>
            </div>
          </div>
          <ul className="text-xs text-gray-400 space-y-1 mb-4 ml-16">
            <li>✓ KPI summary table</li>
            <li>✓ Category breakdown</li>
            <li>✓ Ready for compliance audits</li>
          </ul>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            loading={downloading === 'pdf'}
            onClick={() => download('pdf')}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Info note */}
      <div className="sg-card p-4 bg-blue-50 border-blue-100">
        <p className="text-xs text-blue-700">
          <strong>Privacy note:</strong> Reports contain only metadata — entity types, action taken, timestamps, and hashed snippets.
          Raw prompt text is never stored or exported.
        </p>
      </div>
    </div>
  )
}

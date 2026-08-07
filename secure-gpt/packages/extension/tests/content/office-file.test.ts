import { describe, it, expect } from 'vitest'
import { isOfficeFile } from '../../src/content/interceptor'

describe('isOfficeFile', () => {
  const file = (name: string, type: string) => new File(['x'], name, { type })

  it('accepts common office extensions regardless of MIME', () => {
    // docx/xlsx often report application/octet-stream — must match by extension.
    for (const ext of ['doc', 'docx', 'docm', 'ppt', 'pptx', 'pptm', 'ppsx', 'xls', 'xlsx', 'xlsm', 'odt', 'ods', 'odp', 'rtf', 'epub', 'csv']) {
      expect(isOfficeFile(file(`report.${ext}`, 'application/octet-stream')), ext).toBe(true)
    }
  })

  it('accepts office MIME prefixes even with unusual extensions', () => {
    expect(isOfficeFile(file('data.bin', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toBe(true)
    expect(isOfficeFile(file('data.bin', 'application/vnd.ms-excel'))).toBe(true)
  })

  it('is case-insensitive on the extension', () => {
    expect(isOfficeFile(file('REPORT.DOCX', 'application/octet-stream'))).toBe(true)
  })

  it('rejects images, PDFs, and unknown files', () => {
    expect(isOfficeFile(file('photo.png', 'image/png'))).toBe(false)
    expect(isOfficeFile(file('scan.pdf', 'application/pdf'))).toBe(false)
    expect(isOfficeFile(file('notes.txt', 'text/plain'))).toBe(false)
    expect(isOfficeFile(file('archive.zip', 'application/zip'))).toBe(false)
    expect(isOfficeFile(file('noext', ''))).toBe(false)
  })
})

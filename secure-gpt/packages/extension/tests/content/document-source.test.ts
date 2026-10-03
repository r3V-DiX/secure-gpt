import { describe, expect, it } from 'vitest'
import { validateImageSource, validateOfficeSource } from '../../src/offscreen/document-source'

function archive(name: string): Uint8Array {
  const encoded = new TextEncoder().encode(name)
  const bytes = new Uint8Array(46 + encoded.length + 22)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, 0x02014b50, true)
  view.setUint16(28, encoded.length, true)
  bytes.set(encoded, 46)
  const end = 46 + encoded.length
  view.setUint32(end, 0x06054b50, true)
  view.setUint16(end + 10, 1, true)
  return bytes
}
describe('complete container coverage', () => {
  it('rejects embedded Office images, documents, and macros before extraction', () => {
    for (const name of ['word/media/image1.png', 'word/embeddings/object.bin', 'word/vbaProject.bin']) {
      expect(() => validateOfficeSource(archive(name), 'report.docx')).toThrow('DOCUMENT_INCOMPLETE_EXTRACTION')
    }
    expect(() => validateOfficeSource(archive('word/document.xml'), 'report.docx')).not.toThrow()
  })
  it('rejects corrupt and legacy Office containers', () => {
    expect(() => validateOfficeSource(new Uint8Array(5), 'report.docx')).toThrow('DOCUMENT_EXTRACTION_FAILED')
    expect(() => validateOfficeSource(new Uint8Array(5), 'report.doc')).toThrow('DOCUMENT_UNSUPPORTED_EXTRACTION')
  })
  it('rejects images with unscanned frames or pages', () => {
    expect(() => validateImageSource(new TextEncoder().encode('GIF89a'))).toThrow('DOCUMENT_UNSUPPORTED_IMAGE')
    const webp = new Uint8Array(24)
    webp.set(new TextEncoder().encode('RIFF'), 0)
    webp.set(new TextEncoder().encode('WEBPVP8X'), 8)
    webp[20] = 2
    expect(() => validateImageSource(webp)).toThrow('DOCUMENT_UNSUPPORTED_ANIMATION')
  })
  it('accepts plain CSV and blocks RTF embedded objects', () => {
    expect(() => validateOfficeSource(new TextEncoder().encode('email,test@example.test'), 'report.csv')).not.toThrow()
    expect(() => validateOfficeSource(new TextEncoder().encode('{\\rtf1 \\object data}'), 'report.rtf')).toThrow('DOCUMENT_INCOMPLETE_EXTRACTION')
  })
})

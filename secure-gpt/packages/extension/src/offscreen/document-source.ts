/** Reject containers whose additional content the local extractor cannot scan. */
export function validateImageSource(bytes: Uint8Array): void {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return
  if (text(0, 2) === 'BM') return
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') {
    if (text(12, 16) === 'VP8X' && (bytes[20]! & 2)) throw new Error('DOCUMENT_UNSUPPORTED_ANIMATION')
    return
  }
  if (text(1, 4) === 'PNG') {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = view.getUint32(offset)
      const kind = text(offset + 4, offset + 8)
      if (kind === 'acTL') throw new Error('DOCUMENT_UNSUPPORTED_ANIMATION')
      if (offset + 12 + length > bytes.length) throw new Error('DOCUMENT_EXTRACTION_FAILED')
      if (kind === 'IEND') return
      offset += 12 + length
    }
    throw new Error('DOCUMENT_EXTRACTION_FAILED')
  }
  // GIF/TIFF/HEIC/SVG can carry unscanned frames, pages, or external content.
  throw new Error('DOCUMENT_UNSUPPORTED_IMAGE')
}

export function validateOfficeSource(bytes: Uint8Array, fileName: string): void {
  const extension = fileName.toLowerCase().split('.').pop()
  if (extension === 'csv') {
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      if (text.includes('\0') || text.startsWith('PK')) throw new Error()
    } catch { throw new Error('DOCUMENT_UNSUPPORTED_EXTRACTION') }
    return
  }
  if (extension === 'rtf') {
    if (/\\(?:pict|object|objdata|bin)\b/i.test(new TextDecoder().decode(bytes))) throw new Error('DOCUMENT_INCOMPLETE_EXTRACTION')
    return
  }
  if (!['docx', 'docm', 'xlsx', 'xlsm', 'pptx', 'pptm', 'ppsx', 'ppsm', 'odt', 'ods', 'odp', 'epub'].includes(extension ?? '')) {
    throw new Error('DOCUMENT_UNSUPPORTED_EXTRACTION')
  }
  // Read ZIP central-directory names without decompressing untrusted entries.
  // Embedded images, OLE documents and macros are not covered by AnyDoc text.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let end = bytes.length - 22
  while (end >= Math.max(0, bytes.length - 65_557) && view.getUint32(end, true) !== 0x06054b50) end--
  if (end < Math.max(0, bytes.length - 65_557)) throw new Error('DOCUMENT_EXTRACTION_FAILED')
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error('DOCUMENT_UNSUPPORTED_EXTRACTION')
  const count = view.getUint16(end + 10, true)
  let offset = view.getUint32(end + 16, true)
  if (!count || count === 0xffff || offset === 0xffffffff) throw new Error('DOCUMENT_UNSUPPORTED_EXTRACTION')
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw new Error('DOCUMENT_EXTRACTION_FAILED')
    const nameLength = view.getUint16(offset + 28, true)
    const length = 46 + nameLength + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true)
    if (offset + length > end || (view.getUint16(offset + 8, true) & 1)) throw new Error('DOCUMENT_EXTRACTION_FAILED')
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength))
    if (/\.(?:png|jpe?g|gif|bmp|tiff?|webp|svg|emf|wmf|bin|pdf)$/i.test(name) || /(?:media|embeddings)\//i.test(name)) {
      throw new Error('DOCUMENT_INCOMPLETE_EXTRACTION')
    }
    offset += length
  }
}

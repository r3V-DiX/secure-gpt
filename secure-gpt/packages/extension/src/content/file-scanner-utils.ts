export const OFFICE_EXTENSIONS = new Set([
  'doc', 'docx', 'docm',
  'ppt', 'pps', 'pot', 'pptx', 'pptm', 'ppsx', 'ppsm',
  'xls', 'xlsx', 'xlsm', 'xlsb',
  'odt', 'ods', 'odp',
  'rtf', 'epub', 'csv'
])

export function isOfficeFile(file: File): boolean {
  if (file.type.startsWith('application/vnd.ms-')) return true
  if (file.type.startsWith('application/vnd.openxmlformats-officedocument.')) return true
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  return OFFICE_EXTENSIONS.has(ext)
}

const LEGACY_BINARY_EXTENSIONS = new Set(['doc', 'ppt', 'pps', 'pot', 'xls', 'xlsb'])

export function isMaskableOffice(file: File): boolean {
  if (!isOfficeFile(file)) return false
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  return !LEGACY_BINARY_EXTENSIONS.has(ext)
}

export const MAX_OFFICE_SCAN_BYTES = 20 * 1024 * 1024

export function sendMsgWithTimeout<T>(message: any, timeoutMs = 6000): Promise<T | null> {
  return new Promise<T | null>((resolve) => {
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        console.warn(`[SecureGPT] Message ${message.type || message.action} timed out after ${timeoutMs}ms`)
        resolve(null)
      }
    }, timeoutMs)

    try {
      chrome.runtime.sendMessage(message, (res) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timer)
          if (chrome.runtime.lastError) {
            console.warn('[SecureGPT] Runtime message error:', chrome.runtime.lastError.message)
            resolve(null)
          } else {
            resolve(res as T)
          }
        }
      })
    } catch (e) {
      if (!resolved) {
        resolved = true
        clearTimeout(timer)
        resolve(null)
      }
    }
  })
}

// JWT structural validator
// A real JWT is exactly three base64url segments separated by dots,
// and the header decodes to a JSON object with a 'typ' or 'alg' field.

export function jwtParserCheck(value: string): boolean {
  const parts = value.split('.')
  if (parts.length !== 3) return false

  try {
    // Decode header (first segment) — pad to multiple of 4
    const header = parts[0]!
    const padded = header + '='.repeat((4 - (header.length % 4)) % 4)
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    const obj = JSON.parse(decoded)
    // Must have alg or typ — these are required JOSE header parameters
    return typeof obj === 'object' && obj !== null && ('alg' in obj || 'typ' in obj)
  } catch {
    return false
  }
}

// IBAN validator — ISO 13616 mod-97 checksum
// Moves first 4 chars to end, replaces letters with digits, checks % 97 === 1

export function ibanCheck(value: string): boolean {
  const clean = value.replace(/\s/g, '').toUpperCase()
  if (clean.length < 15 || clean.length > 34) return false
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) return false

  // Rearrange: move first 4 chars to end
  const rearranged = clean.slice(4) + clean.slice(0, 4)

  // Replace each letter with its numeric equivalent (A=10, B=11, …)
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55))

  // Compute mod 97 on the big integer string in chunks to avoid precision loss
  let remainder = 0
  for (const ch of numeric) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97
  }

  return remainder === 1
}

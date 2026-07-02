// Shannon entropy validator for API keys / secrets
// Rejects low-entropy strings (dictionary words, repeated chars) that
// match the generic api_key pattern but are unlikely to be real secrets.

export function entropyCheck(value: string): boolean {
  if (!value || value.length < 16) return false

  // Extract just the key portion — strip surrounding quotes/whitespace
  const key = value.replace(/^['"\s]+|['"\s]+$/g, '')
  if (key.length < 16) return false

  // Shannon entropy: H = -Σ p(x) * log2(p(x))
  const freq: Record<string, number> = {}
  for (const ch of key) freq[ch] = (freq[ch] ?? 0) + 1

  let entropy = 0
  for (const count of Object.values(freq)) {
    const p = count / key.length
    entropy -= p * Math.log2(p)
  }

  // Real secrets typically have entropy ≥ 3.5 bits/char
  return entropy >= 3.5
}

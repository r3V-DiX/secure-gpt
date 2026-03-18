// ─────────────────────────────────────────────
// Luhn Algorithm — Credit Card Validation
// ─────────────────────────────────────────────

export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/[\s\-]/g, '')

  if (!/^\d+$/.test(digits)) return false
  if (digits.length < 13 || digits.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]!, 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

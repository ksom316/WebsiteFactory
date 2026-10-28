/** A small, best-effort symbol lookup for common currency codes — unrecognized codes
 * (or none at all) just render as "<code> <amount>" instead of guessing a symbol. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CAD: '$',
  AUD: '$',
  NZD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
}

export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()]
  const value = amount.toFixed(2).replace(/\.00$/, '')
  return symbol ? `${symbol}${value}` : `${value} ${currency.toUpperCase()}`
}

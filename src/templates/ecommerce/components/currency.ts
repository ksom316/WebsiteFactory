/**
 * All cart/checkout arithmetic (line totals, subtotal, shipping, grand total) is done
 * in integer minor currency units (cents) rather than floating-point dollars, so
 * `0.1 + 0.2` style rounding errors can never creep into a displayed total — see
 * cart.ts for where these are used. `toMinorUnits`/`fromMinorUnits` are the only
 * conversion points between the schema's decimal `price` fields and that integer math.
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

export function fromMinorUnits(minor: number): number {
  return minor / 100
}

/** A small, best-effort symbol lookup for common currency codes — unrecognized codes
 * (or none at all) just render as "<amount> <code>" instead of guessing a symbol.
 * Mirrors src/templates/catalog/components/currency.ts. */
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

export function formatMoney(minorUnits: number, currency: string): string {
  const amount = fromMinorUnits(minorUnits)
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()]
  const value = amount.toFixed(2).replace(/\.00$/, '')
  return symbol ? `${symbol}${value}` : `${value} ${currency.toUpperCase()}`
}

export function formatPrice(amount: number, currency: string): string {
  return formatMoney(toMinorUnits(amount), currency)
}

/**
 * Duplicated from src/templates/corporate/components/links.ts rather than imported —
 * see that file's header comment for the shared reasoning, and README.md's "Template
 * families" section for why each family keeps its own tiny copy of this helper instead
 * of sharing one module across families.
 */
export function isRenderableHref(href: string | undefined): href is string {
  if (!href) return false
  if (href.startsWith('#')) return href.length > 1
  if (href.startsWith('/')) return true
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return true
  return href.startsWith('https://')
}

export function isExternalHref(href: string): boolean {
  return href.startsWith('https://')
}

/**
 * Normalizes a schema-validated phone-like string (see schema.ts's `phone` field,
 * which already restricts input to digits/spaces/parentheses/+/-) into a `wa.me` deep
 * link by stripping everything but digits. Accepted input: any common human-written
 * phone format, ideally with a country code (e.g. "+1 (503) 555-0148" → wa.me/15035550148).
 * Returns undefined for an empty/unusable number rather than a link to a bare domain.
 */
export function buildWhatsAppHref(rawNumber: string | undefined): string | undefined {
  if (!rawNumber) return undefined
  const digits = rawNumber.replace(/[^0-9]/g, '')
  if (digits.length < 7) return undefined
  return `https://wa.me/${digits}`
}

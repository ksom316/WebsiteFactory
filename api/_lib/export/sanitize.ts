/** Escapes text for safe use inside HTML text content or a double-quoted attribute value. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Reduces arbitrary text to a safe filename/package-name segment: lowercase
 * `[a-z0-9-]` only, no leading/trailing hyphens, never empty. Project slugs are already
 * constrained to this exact shape at creation time (see api/_lib/projectValidation.ts),
 * but this is run again here regardless — an export filename is a second, independent
 * place that must never trust upstream validation alone.
 */
export function sanitizeFilenameSegment(input: string, fallback = 'website'): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')

  return cleaned.length > 0 ? cleaned : fallback
}

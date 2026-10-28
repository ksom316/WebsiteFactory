/**
 * Href values reaching these helpers have already passed through
 * `corporateConfigSchema`'s `href` validator (mailto:/tel:/https:/internal paths only —
 * see schema.ts#isSafeHref), so this is defense in depth, not the primary guard.
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

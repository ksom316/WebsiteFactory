/**
 * Duplicated from src/templates/corporate/components/links.ts rather than imported —
 * see that file's header comment for the shared reasoning, and the Phase 9.1 README
 * section for why each family keeps its own tiny copy of this helper instead of the
 * two families sharing a module.
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

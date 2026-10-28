import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { isExternalHref, isRenderableHref } from './links'

interface SafeLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string | undefined
  children: ReactNode
}

/**
 * Renders an anchor only for hrefs that pass {@link isRenderableHref} (internal
 * anchors/paths, mailto:, tel:, or https:// — the same allow-list enforced server-side
 * by the config schema). Anything else renders nothing rather than guessing.
 */
export function SafeLink({ href, children, ...rest }: SafeLinkProps) {
  if (!isRenderableHref(href)) return null

  const external = isExternalHref(href)

  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      {children}
    </a>
  )
}

import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { isExternalHref, isRenderableHref } from './links'

interface SafeLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string | undefined
  children: ReactNode
}

/** Mirrors src/templates/corporate/components/SafeLink.tsx — see links.ts header comment. */
export function SafeLink({ href, children, ...rest }: SafeLinkProps) {
  if (!isRenderableHref(href)) return null

  const external = isExternalHref(href)

  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      {children}
    </a>
  )
}

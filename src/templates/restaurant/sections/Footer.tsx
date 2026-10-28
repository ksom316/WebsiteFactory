import type { RestaurantConfig } from '../schema'
import { SafeLink } from '../components/SafeLink'

export function RestaurantFooter({ config }: { config: RestaurantConfig }) {
  const { footer, restaurant, contact } = config

  return (
    <footer className="border-t border-[var(--site-border)] text-[var(--site-text-faint)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">{footer.text || `© ${restaurant.name}`}</p>
        <div className="flex flex-wrap gap-6 text-sm">
          {footer.links.map((link) => (
            <SafeLink key={`${link.label}-${link.href}`} href={link.href} className="hover:text-[var(--site-text-muted)]">
              {link.label}
            </SafeLink>
          ))}
          {contact.social.map((social) => (
            <SafeLink key={`${social.label}-${social.href}`} href={social.href} className="hover:text-[var(--site-text-muted)]">
              {social.label}
            </SafeLink>
          ))}
        </div>
      </div>
    </footer>
  )
}

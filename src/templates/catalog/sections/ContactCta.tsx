import type { CatalogConfig } from '../schema'
import { SafeLink } from '../components/SafeLink'
import { buildWhatsAppHref } from '../components/links'

/**
 * Deliberately link-only — no `<form>` here, and no claim that an enquiry was
 * delivered or an order placed. mailto/tel/WhatsApp open the visitor's own email or
 * messaging app; this factory has no backend to receive or confirm anything.
 */
export function CatalogContactCta({ config }: { config: CatalogConfig }) {
  const { contact, business, sections } = config
  if (!sections.contactCta) return null

  const whatsappHref = buildWhatsAppHref(contact.whatsapp)
  if (!contact.email && !contact.phone && !whatsappHref && !contact.website && contact.social.length === 0) return null

  return (
    <section id="contact" className="px-6 py-20 text-center" aria-label="Contact">
      <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
        Have a question about an item?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[var(--site-text-muted)]">
        {contact.ctaText || `Reach out to ${business.name} directly — we're happy to help.`}
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
        {contact.email && (
          <SafeLink
            href={`mailto:${contact.email}`}
            className="rounded-full bg-[var(--site-accent)] px-6 py-3 text-sm font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
          >
            Email us
          </SafeLink>
        )}
        {whatsappHref && (
          <SafeLink
            href={whatsappHref}
            className="rounded-full border border-[var(--site-border)] px-6 py-3 text-sm font-medium text-[var(--site-text)] transition-colors hover:border-[var(--site-accent)]"
          >
            WhatsApp us
          </SafeLink>
        )}
        {contact.phone && (
          <SafeLink
            href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
            className="rounded-full border border-[var(--site-border)] px-6 py-3 text-sm font-medium text-[var(--site-text)] transition-colors hover:border-[var(--site-accent)]"
          >
            Call us
          </SafeLink>
        )}
        {contact.website && (
          <SafeLink href={contact.website} className="text-sm font-medium text-[var(--site-accent-strong)] hover:underline">
            Visit our website
          </SafeLink>
        )}
      </div>

      {contact.social.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm">
          {contact.social.map((social) => (
            <SafeLink key={`${social.label}-${social.href}`} href={social.href} className="text-[var(--site-text-muted)] hover:text-[var(--site-text)]">
              {social.label}
            </SafeLink>
          ))}
        </div>
      )}
    </section>
  )
}

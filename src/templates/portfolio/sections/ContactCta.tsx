import type { PortfolioConfig } from '../schema'
import { SafeLink } from '../components/SafeLink'

/**
 * Deliberately link-only — no `<form>` here. A form that posts nowhere would silently
 * imply a message was submitted to a backend this factory doesn't run; mailto/tel and
 * an optional external booking link (e.g. Calendly) are honest about where contact
 * actually goes, mirroring the restaurant family's reservationUrl and the real-estate
 * family's inquiryUrl.
 */
export function PortfolioContactCta({ config }: { config: PortfolioConfig }) {
  const { contact, person, sections } = config
  if (!sections.contactCta) return null
  if (!contact.email && !contact.bookingUrl && contact.social.length === 0) return null

  return (
    <section id="contact" className="px-6 py-20 text-center" aria-label="Contact">
      <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
        Let's work together
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[var(--site-text-muted)]">
        {contact.ctaText || `Reach out to ${person.name} directly — no forms, no middleman.`}
      </p>
      {contact.availability && <p className="mt-2 text-sm text-[var(--site-text-faint)]">{contact.availability}</p>}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
        {contact.email && (
          <SafeLink
            href={`mailto:${contact.email}`}
            className="rounded-full bg-[var(--site-accent)] px-6 py-3 text-sm font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
          >
            Email {person.name.split(' ')[0]}
          </SafeLink>
        )}
        {contact.bookingUrl && (
          <SafeLink
            href={contact.bookingUrl}
            className="rounded-full border border-[var(--site-border)] px-6 py-3 text-sm font-medium text-[var(--site-text)] transition-colors hover:border-[var(--site-accent)]"
          >
            Book a call
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

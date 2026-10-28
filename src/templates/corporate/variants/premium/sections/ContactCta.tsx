import type { CorporateConfig } from '../../../schema'
import { SafeLink } from '../../../components/SafeLink'

export function PremiumContactCta({ config }: { config: CorporateConfig }) {
  const { contactCta, contact } = config
  if (!contactCta.heading && !contactCta.body && !contactCta.cta) return null

  return (
    <section id="contact" className="border-b border-[var(--site-border)] bg-[var(--site-surface)]" aria-label="Contact">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          {contactCta.heading && (
            <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              {contactCta.heading}
            </h2>
          )}
          {contactCta.body && (
            <p className="mt-4 text-lg leading-relaxed text-[var(--site-text-muted)]">{contactCta.body}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-6">
            {contactCta.cta && (
              <SafeLink
                href={contactCta.cta.href}
                className="rounded-sm bg-[var(--site-accent)] px-5 py-3 text-sm font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
              >
                {contactCta.cta.label}
              </SafeLink>
            )}
            {contact.phone && (
              <SafeLink href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="text-sm text-[var(--site-text-muted)] hover:text-[var(--site-text)]">
                {contact.phone}
              </SafeLink>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

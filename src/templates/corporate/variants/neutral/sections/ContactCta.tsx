import type { CorporateConfig } from '../../../schema'
import { SafeLink } from '../../../components/SafeLink'

export function NeutralContactCta({ config }: { config: CorporateConfig }) {
  const { contactCta, contact } = config
  const hasCta = contactCta.heading || contactCta.body || contactCta.cta
  const hasInfo = contact.email || contact.phone || contact.address || contact.hours.length > 0
  if (!hasCta && !hasInfo) return null

  return (
    <section id="contact" className="bg-[var(--site-surface)] py-16 sm:py-20" aria-label="Contact">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-2">
        <div className="rounded-2xl bg-[var(--site-accent)] p-8 text-[var(--site-accent-contrast)]">
          {contactCta.heading && <h2 className="text-2xl font-bold">{contactCta.heading}</h2>}
          {contactCta.body && <p className="mt-3 leading-relaxed opacity-90">{contactCta.body}</p>}
          {contactCta.cta && (
            <SafeLink
              href={contactCta.cta.href}
              className="mt-6 inline-block rounded-full bg-[var(--site-accent-contrast)] px-6 py-3 text-sm font-semibold text-[var(--site-accent)] transition-opacity hover:opacity-90"
            >
              {contactCta.cta.label}
            </SafeLink>
          )}
        </div>

        {hasInfo && (
          <div className="rounded-2xl bg-[var(--site-bg)] p-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--site-text-muted)]">
              Visit or reach us
            </h3>
            <dl className="mt-4 space-y-3 text-[15px] text-[var(--site-text)]">
              {contact.address && (
                <div>
                  <dt className="sr-only">Address</dt>
                  <dd>{contact.address}</dd>
                </div>
              )}
              {contact.phone && (
                <div>
                  <dt className="sr-only">Phone</dt>
                  <dd>
                    <SafeLink href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="text-[var(--site-accent)] hover:underline">
                      {contact.phone}
                    </SafeLink>
                  </dd>
                </div>
              )}
              {contact.email && (
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd>
                    <SafeLink href={`mailto:${contact.email}`} className="text-[var(--site-accent)] hover:underline">
                      {contact.email}
                    </SafeLink>
                  </dd>
                </div>
              )}
              {contact.hours.length > 0 && (
                <div>
                  <dt className="font-semibold text-[var(--site-text-muted)]">Hours</dt>
                  <dd className="mt-1 space-y-0.5">
                    {contact.hours.map((entry) => (
                      <div key={entry.days} className="flex justify-between gap-4 text-sm">
                        <span className="text-[var(--site-text-muted)]">{entry.days}</span>
                        <span>{entry.hours}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </section>
  )
}

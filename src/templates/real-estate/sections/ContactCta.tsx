import type { RealEstateConfig } from '../schema'
import { SafeLink } from '../components/SafeLink'

export function RealEstateContactCta({ config }: { config: RealEstateConfig }) {
  const { contact, agency, sections } = config
  if (!sections.inquiry || !contact.inquiryUrl) return null

  return (
    <section
      id="inquire"
      className="bg-[var(--site-accent)] px-6 py-16 text-center text-[var(--site-accent-contrast)]"
      aria-label="Enquiries"
    >
      <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
        Talk to {agency.name} about your next move
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[var(--site-accent-contrast)]/90">
        Submitted through our enquiry partner — no account needed.
      </p>
      <div className="mt-7">
        <SafeLink
          href={contact.inquiryUrl}
          className="inline-block rounded-full bg-[var(--site-accent-contrast)] px-7 py-3 text-sm font-semibold text-[var(--site-accent-strong)] transition-opacity hover:opacity-90"
        >
          Make an enquiry
        </SafeLink>
      </div>
    </section>
  )
}

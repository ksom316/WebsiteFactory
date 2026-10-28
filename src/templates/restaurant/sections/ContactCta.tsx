import type { RestaurantConfig } from '../schema'
import { SafeLink } from '../components/SafeLink'

export function RestaurantContactCta({ config }: { config: RestaurantConfig }) {
  const { contact, restaurant, sections } = config
  if (!sections.reservation || !contact.reservationUrl) return null

  return (
    <section
      id="reserve"
      className="bg-[var(--site-accent)] px-6 py-16 text-center text-[var(--site-accent-contrast)]"
      aria-label="Reservations"
    >
      <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
        Reserve your table at {restaurant.name}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[var(--site-accent-contrast)]/90">
        Booked through our reservation partner — no account needed.
      </p>
      <div className="mt-7">
        <SafeLink
          href={contact.reservationUrl}
          className="inline-block rounded-full bg-[var(--site-accent-contrast)] px-7 py-3 text-sm font-semibold text-[var(--site-accent-strong)] transition-opacity hover:opacity-90"
        >
          Book a reservation
        </SafeLink>
      </div>
    </section>
  )
}

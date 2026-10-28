import type { RestaurantConfig } from '../schema'
import { SafeLink } from '../components/SafeLink'

export function RestaurantHours({ config }: { config: RestaurantConfig }) {
  const { hours, contact, restaurant } = config
  if (hours.length === 0 && !contact.address) return null

  return (
    <section id="hours" className="mx-auto max-w-4xl px-6 py-20" aria-label="Hours and location">
      <div className="grid gap-10 sm:grid-cols-2">
        {hours.length > 0 && (
          <div>
            <h2 className="font-[family-name:var(--site-font-display)] mb-5 text-2xl font-semibold">Hours</h2>
            <dl className="space-y-2">
              {hours.map((entry) => (
                <div key={entry.days} className="flex justify-between gap-4 text-sm">
                  <dt className="text-[var(--site-text-muted)]">{entry.days}</dt>
                  <dd className="font-medium">{entry.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {(contact.address || contact.phone || contact.email) && (
          <div>
            <h2 className="font-[family-name:var(--site-font-display)] mb-5 text-2xl font-semibold">Find us</h2>
            <address className="space-y-2 text-sm not-italic text-[var(--site-text-muted)]">
              {contact.address && <p>{contact.address}</p>}
              {contact.phone && (
                <p>
                  <SafeLink href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-[var(--site-text)]">
                    {contact.phone}
                  </SafeLink>
                </p>
              )}
              {contact.email && (
                <p>
                  <SafeLink href={`mailto:${contact.email}`} className="hover:text-[var(--site-text)]">
                    {contact.email}
                  </SafeLink>
                </p>
              )}
            </address>
          </div>
        )}
      </div>
      {!contact.address && !contact.phone && !contact.email && hours.length === 0 && (
        <p className="sr-only">{restaurant.name}</p>
      )}
    </section>
  )
}

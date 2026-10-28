import type { RealEstateConfig, Property } from '../schema'
import { SafeImage } from '../components/SafeImage'

const PROPERTY_TYPE_LABELS: Record<Property['propertyType'], string> = {
  house: 'House',
  apartment: 'Apartment',
  condo: 'Condo',
  townhouse: 'Townhouse',
  land: 'Land',
  commercial: 'Commercial',
}

/**
 * One full detail block per configured property, each anchored by `listing-<slug>` —
 * rendered unconditionally alongside the listings grid (see Listings.tsx) so every
 * "View details" card link always lands on a real section with real content, never a
 * dead anchor. There is no separate routed detail page; an in-page anchor keeps this a
 * maintainable static design with no backend or router dependency.
 */
export function RealEstatePropertyDetails({ config }: { config: RealEstateConfig }) {
  const { listings } = config
  if (listings.properties.length === 0) return null

  return (
    <section aria-label="Property details" className="bg-[var(--site-surface-raised)] py-20">
      <div className="mx-auto max-w-4xl space-y-16 px-6">
        {listings.properties.map((property) => (
          <article key={property.slug} id={`listing-${property.slug}`} className="scroll-mt-20">
            {property.images.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {property.images.map((imageUrl, index) => (
                  <SafeImage
                    key={`${property.slug}-${index}`}
                    src={imageUrl}
                    alt={`${property.title} photo ${index + 1}`}
                    fallbackLabel={property.title}
                    className={`aspect-[4/3] w-full rounded-lg object-cover ${index === 0 ? 'col-span-2 sm:col-span-2 sm:row-span-2' : ''}`}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-[family-name:var(--site-font-display)] text-2xl font-semibold">{property.title}</h3>
              {property.price && <p className="font-[family-name:var(--site-font-display)] text-xl">{property.price}</p>}
            </div>
            <p className="mt-1 text-sm uppercase tracking-wide text-[var(--site-text-faint)]">
              {PROPERTY_TYPE_LABELS[property.propertyType]}
              {property.location ? ` · ${property.location}` : ''}
            </p>

            {(property.bedrooms !== undefined || property.bathrooms !== undefined || property.area) && (
              <dl className="mt-4 flex flex-wrap gap-6 text-sm">
                {property.bedrooms !== undefined && (
                  <div>
                    <dt className="text-[var(--site-text-faint)]">Bedrooms</dt>
                    <dd className="font-medium">{property.bedrooms}</dd>
                  </div>
                )}
                {property.bathrooms !== undefined && (
                  <div>
                    <dt className="text-[var(--site-text-faint)]">Bathrooms</dt>
                    <dd className="font-medium">{property.bathrooms}</dd>
                  </div>
                )}
                {property.area && (
                  <div>
                    <dt className="text-[var(--site-text-faint)]">Area</dt>
                    <dd className="font-medium">{property.area}</dd>
                  </div>
                )}
              </dl>
            )}

            {property.description && <p className="mt-4 leading-relaxed text-[var(--site-text-muted)]">{property.description}</p>}

            {property.features.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-1.5 text-sm text-[var(--site-text-muted)] sm:grid-cols-3">
                {property.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-[var(--site-accent)]" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

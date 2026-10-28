import { useMemo, useState } from 'react'
import type { RealEstateConfig, Property } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { SafeLink } from '../components/SafeLink'

const TRANSACTION_LABELS: Record<Property['transactionType'], string> = {
  sale: 'For sale',
  rent: 'For rent',
}

const PROPERTY_TYPE_LABELS: Record<Property['propertyType'], string> = {
  house: 'House',
  apartment: 'Apartment',
  condo: 'Condo',
  townhouse: 'Townhouse',
  land: 'Land',
  commercial: 'Commercial',
}

function factsLine(property: Property): string {
  const facts: string[] = []
  if (property.bedrooms !== undefined) facts.push(`${property.bedrooms} bd`)
  if (property.bathrooms !== undefined) facts.push(`${property.bathrooms} ba`)
  if (property.area) facts.push(property.area)
  return facts.join(' · ')
}

function PropertyCard({ property }: { property: Property }) {
  const facts = factsLine(property)

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)]">
      <SafeImage
        src={property.images[0]}
        alt={property.title}
        fallbackLabel={property.title}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--site-text-faint)]">
          <span>{TRANSACTION_LABELS[property.transactionType]}</span>
          <span aria-hidden="true">·</span>
          <span>{PROPERTY_TYPE_LABELS[property.propertyType]}</span>
        </div>
        <h3 className="font-[family-name:var(--site-font-display)] text-xl font-semibold">{property.title}</h3>
        {property.location && <p className="text-sm text-[var(--site-text-muted)]">{property.location}</p>}
        <div className="mt-auto flex items-baseline justify-between gap-3 pt-2">
          <div>
            {property.price && <p className="font-[family-name:var(--site-font-display)] text-lg">{property.price}</p>}
            {facts && <p className="text-sm text-[var(--site-text-faint)]">{facts}</p>}
          </div>
          <SafeLink
            href={`#listing-${property.slug}`}
            className="shrink-0 text-sm font-medium text-[var(--site-accent-strong)] hover:underline"
          >
            View details
          </SafeLink>
        </div>
      </div>
    </article>
  )
}

/**
 * Featured listings with a client-side transaction/property-type filter — a plain
 * array filter over the already-configured data, no backend search. Filter options are
 * derived from what's actually present in `properties`, so a project with only
 * for-sale houses never shows an unusable "For rent" filter that empties the grid.
 */
export function RealEstateListings({ config }: { config: RealEstateConfig }) {
  const { listings } = config
  const [transactionFilter, setTransactionFilter] = useState<Property['transactionType'] | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<Property['propertyType'] | 'all'>('all')

  const availableTransactionTypes = useMemo(
    () => Array.from(new Set(listings.properties.map((p) => p.transactionType))),
    [listings.properties],
  )
  const availablePropertyTypes = useMemo(
    () => Array.from(new Set(listings.properties.map((p) => p.propertyType))),
    [listings.properties],
  )

  const filtered = listings.properties.filter(
    (property) =>
      (transactionFilter === 'all' || property.transactionType === transactionFilter) &&
      (typeFilter === 'all' || property.propertyType === typeFilter),
  )

  if (listings.properties.length === 0) return null

  return (
    <section id="listings" className="mx-auto max-w-6xl px-6 py-20" aria-label="Featured listings">
      <div className="mb-10 text-center">
        <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
          {listings.heading || 'Featured listings'}
        </h2>
        {listings.intro && <p className="mx-auto mt-4 max-w-xl text-[var(--site-text-muted)]">{listings.intro}</p>}
      </div>

      {(availableTransactionTypes.length > 1 || availablePropertyTypes.length > 1) && (
        <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {availableTransactionTypes.length > 1 && (
            <div role="group" aria-label="Filter by transaction type" className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={transactionFilter === 'all'}
                onClick={() => setTransactionFilter('all')}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${transactionFilter === 'all' ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/10 text-[var(--site-accent-strong)]' : 'border-[var(--site-border)] text-[var(--site-text-muted)]'}`}
              >
                All
              </button>
              {availableTransactionTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={transactionFilter === type}
                  onClick={() => setTransactionFilter(type)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${transactionFilter === type ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/10 text-[var(--site-accent-strong)]' : 'border-[var(--site-border)] text-[var(--site-text-muted)]'}`}
                >
                  {TRANSACTION_LABELS[type]}
                </button>
              ))}
            </div>
          )}

          {availablePropertyTypes.length > 1 && (
            <div role="group" aria-label="Filter by property type" className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={typeFilter === 'all'}
                onClick={() => setTypeFilter('all')}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${typeFilter === 'all' ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/10 text-[var(--site-accent-strong)]' : 'border-[var(--site-border)] text-[var(--site-text-muted)]'}`}
              >
                All types
              </button>
              {availablePropertyTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={typeFilter === type}
                  onClick={() => setTypeFilter(type)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${typeFilter === type ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/10 text-[var(--site-accent-strong)]' : 'border-[var(--site-border)] text-[var(--site-text-muted)]'}`}
                >
                  {PROPERTY_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard key={property.slug} property={property} />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-[var(--site-text-muted)]">No listings match these filters right now.</p>
      )}
    </section>
  )
}

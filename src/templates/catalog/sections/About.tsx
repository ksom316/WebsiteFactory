import type { CatalogConfig } from '../schema'
import { SafeImage } from '../components/SafeImage'

export function CatalogAbout({ config }: { config: CatalogConfig }) {
  const { about, business } = config
  if (!about.body && !about.imageUrl && !about.hours && !about.location) return null

  return (
    <section id="about" className="mx-auto max-w-5xl px-6 py-20" aria-label="About">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className={about.imageUrl ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
            {about.heading || 'Our story'}
          </h2>
          {about.body && <p className="mt-5 max-w-2xl leading-relaxed text-[var(--site-text-muted)]">{about.body}</p>}
          {(about.location || about.hours) && (
            <dl className="mt-6 space-y-2 text-sm">
              {about.location && (
                <div className="flex gap-2">
                  <dt className="font-medium text-[var(--site-text)]">Location</dt>
                  <dd className="text-[var(--site-text-muted)]">{about.location}</dd>
                </div>
              )}
              {about.hours && (
                <div className="flex gap-2">
                  <dt className="font-medium text-[var(--site-text)]">Hours</dt>
                  <dd className="text-[var(--site-text-muted)]">{about.hours}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
        {about.imageUrl && (
          <div className="lg:col-span-5">
            <SafeImage
              src={about.imageUrl}
              alt={business.name}
              fallbackLabel={business.name}
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />
          </div>
        )}
      </div>
    </section>
  )
}

import type { CatalogConfig } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { SafeLink } from '../components/SafeLink'

export function CatalogHero({ config }: { config: CatalogConfig }) {
  const { hero, business } = config

  return (
    <section className="relative" aria-label="Introduction">
      <div className="relative h-[65vh] min-h-[420px] w-full overflow-hidden">
        <SafeImage
          src={hero.imageUrl}
          alt=""
          fallbackLabel={business.name}
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/5" aria-hidden="true" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col items-start justify-end px-6 pb-14 text-white">
          {hero.promoMessage && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              {hero.promoMessage}
            </p>
          )}
          {business.location && <p className="mb-3 text-sm uppercase tracking-[0.2em] text-white/80">{business.location}</p>}
          <h1 className="font-[family-name:var(--site-font-display)] max-w-2xl text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">
            {hero.heading}
          </h1>
          {hero.subheading && <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">{hero.subheading}</p>}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            {hero.primaryCta && (
              <SafeLink
                href={hero.primaryCta.href}
                className="rounded-full bg-[var(--site-accent)] px-6 py-3 text-sm font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
              >
                {hero.primaryCta.label}
              </SafeLink>
            )}
            {hero.secondaryCta && (
              <SafeLink
                href={hero.secondaryCta.href}
                className="rounded-full border border-white/70 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                {hero.secondaryCta.label}
              </SafeLink>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

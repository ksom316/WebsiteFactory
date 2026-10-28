import type { PortfolioConfig } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { SafeLink } from '../components/SafeLink'

export function PortfolioHero({ config }: { config: PortfolioConfig }) {
  const { hero, person } = config

  return (
    <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28" aria-label="Introduction">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-7">
          {person.availability && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] px-3 py-1 text-xs font-medium text-[var(--site-text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--site-accent)]" aria-hidden="true" />
              {person.availability}
            </p>
          )}
          {person.role && <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[var(--site-text-faint)]">{person.role}</p>}
          <h1 className="font-[family-name:var(--site-font-display)] text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">
            {hero.heading}
          </h1>
          {hero.subheading && (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--site-text-muted)]">{hero.subheading}</p>
          )}
          <div className="mt-9 flex flex-wrap items-center gap-4">
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
                className="text-sm font-medium text-[var(--site-text)] underline decoration-[var(--site-border)] underline-offset-4 transition-colors hover:decoration-[var(--site-accent)]"
              >
                {hero.secondaryCta.label}
              </SafeLink>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <SafeImage
            src={person.photoUrl}
            alt={person.name}
            fallbackLabel={person.name}
            loading="eager"
            className="aspect-square w-full rounded-2xl object-cover"
          />
        </div>
      </div>
    </section>
  )
}

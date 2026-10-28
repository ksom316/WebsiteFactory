import type { CorporateConfig } from '../../../schema'
import { SafeImage } from '../../../components/SafeImage'
import { SafeLink } from '../../../components/SafeLink'

export function NeutralHero({ config }: { config: CorporateConfig }) {
  const { hero, business } = config

  return (
    <section className="bg-[var(--site-bg)] py-16 sm:py-20" aria-label="Introduction">
      <div className="mx-auto max-w-3xl px-6 text-center">
        {business.location && (
          <p className="text-sm font-medium text-[var(--site-accent)]">{business.location}</p>
        )}
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-[var(--site-text)] sm:text-5xl">
          {hero.heading}
        </h1>
        {hero.subheading && (
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--site-text-muted)]">
            {hero.subheading}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {hero.primaryCta && (
            <SafeLink
              href={hero.primaryCta.href}
              className="rounded-full bg-[var(--site-accent)] px-6 py-3 text-sm font-semibold text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
            >
              {hero.primaryCta.label}
            </SafeLink>
          )}
          {hero.secondaryCta && (
            <SafeLink
              href={hero.secondaryCta.href}
              className="rounded-full border border-[var(--site-border)] px-6 py-3 text-sm font-semibold text-[var(--site-text)] transition-colors hover:border-[var(--site-accent)]"
            >
              {hero.secondaryCta.label}
            </SafeLink>
          )}
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-4xl px-6">
        <SafeImage
          src={hero.imageUrl}
          alt=""
          fallbackLabel={business.name.slice(0, 2).toUpperCase()}
          className="aspect-[16/7] w-full rounded-2xl object-cover"
          loading="eager"
        />
      </div>
    </section>
  )
}

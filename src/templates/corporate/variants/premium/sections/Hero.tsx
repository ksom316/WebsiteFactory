import type { CorporateConfig } from '../../../schema'
import { SafeLink } from '../../../components/SafeLink'

export function PremiumHero({ config }: { config: CorporateConfig }) {
  const { hero, business, trust } = config
  const facts = trust.items.slice(0, 3)

  return (
    <section
      className="relative overflow-hidden border-b border-[var(--site-border)] bg-[repeating-linear-gradient(to_bottom,transparent,transparent_47px,var(--site-border)_48px)] bg-[length:100%_48px]"
      aria-label="Introduction"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:py-28 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <div className="flex gap-5">
            <span className="mt-2 h-auto w-[3px] shrink-0 bg-[var(--site-accent)]" aria-hidden="true" />
            <div>
              {business.industry && (
                <p className="mb-4 text-sm text-[var(--site-text-muted)]">{business.industry}</p>
              )}
              <h1 className="font-[family-name:var(--site-font-display)] text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                {hero.heading}
              </h1>
              {hero.subheading && (
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--site-text-muted)]">
                  {hero.subheading}
                </p>
              )}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                {hero.primaryCta && (
                  <SafeLink
                    href={hero.primaryCta.href}
                    className="rounded-sm bg-[var(--site-accent)] px-5 py-3 text-sm font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
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
          </div>
        </div>

        {facts.length > 0 && (
          <div className="lg:col-span-5 lg:flex lg:items-end lg:justify-end">
            <dl className="w-full max-w-xs divide-y divide-[var(--site-border)] self-end border-t border-[var(--site-border)]">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="text-sm text-[var(--site-text-muted)]">{fact.label}</dt>
                  {fact.value && (
                    <dd className="font-[family-name:var(--site-font-display)] text-xl">{fact.value}</dd>
                  )}
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  )
}

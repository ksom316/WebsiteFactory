import type { CorporateConfig } from '../../../schema'
import { SafeLink } from '../../../components/SafeLink'

export function NeutralNav({ config }: { config: CorporateConfig }) {
  const { logo, business, nav, hero } = config
  const label = logo.text || business.name

  return (
    <header className="bg-[var(--site-surface)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#" className="text-lg font-bold text-[var(--site-accent)]">
          {label}
        </a>

        {nav.length > 0 && (
          <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium md:flex">
            {nav.map((item) => (
              <SafeLink
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="text-[var(--site-text-muted)] transition-colors hover:text-[var(--site-text)]"
              >
                {item.label}
              </SafeLink>
            ))}
            {hero.primaryCta && (
              <SafeLink
                href={hero.primaryCta.href}
                className="rounded-full bg-[var(--site-accent)] px-5 py-2 font-semibold text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
              >
                {hero.primaryCta.label}
              </SafeLink>
            )}
          </nav>
        )}

        {nav.length > 0 && (
          <details className="md:hidden">
            <summary
              className="cursor-pointer list-none rounded-full border border-[var(--site-border)] px-4 py-1.5 text-sm font-medium"
              aria-label="Open menu"
            >
              Menu
            </summary>
            <nav aria-label="Primary" className="mt-3 flex flex-col gap-3 text-sm font-medium">
              {nav.map((item) => (
                <SafeLink key={`${item.label}-${item.href}`} href={item.href} className="text-[var(--site-text-muted)]">
                  {item.label}
                </SafeLink>
              ))}
            </nav>
          </details>
        )}
      </div>
    </header>
  )
}

import type { CorporateConfig } from '../../../schema'
import { SafeLink } from '../../../components/SafeLink'

export function PremiumNav({ config }: { config: CorporateConfig }) {
  const { logo, business, nav, hero } = config
  const label = logo.text || business.name

  return (
    <header className="border-b border-[var(--site-border)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="#" className="font-[family-name:var(--site-font-display)] text-lg font-semibold tracking-tight">
          {label}
        </a>

        {nav.length > 0 && (
          <nav aria-label="Primary" className="hidden items-center gap-8 text-sm md:flex">
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
                className="rounded-sm border border-[var(--site-accent)] px-4 py-2 font-medium text-[var(--site-accent-strong)] transition-colors hover:bg-[var(--site-accent)] hover:text-[var(--site-accent-contrast)]"
              >
                {hero.primaryCta.label}
              </SafeLink>
            )}
          </nav>
        )}

        {nav.length > 0 && (
          <details className="md:hidden">
            <summary
              className="cursor-pointer list-none rounded-sm border border-[var(--site-border)] px-3 py-1.5 text-sm"
              aria-label="Open menu"
            >
              Menu
            </summary>
            <nav aria-label="Primary" className="mt-3 flex flex-col gap-3 text-sm">
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

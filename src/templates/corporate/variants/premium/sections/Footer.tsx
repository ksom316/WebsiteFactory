import type { CorporateConfig } from '../../../schema'
import { SafeLink } from '../../../components/SafeLink'

export function PremiumFooter({ config }: { config: CorporateConfig }) {
  const { footer, business } = config

  return (
    <footer className="text-[var(--site-text-faint)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">{footer.text || `© ${business.name}`}</p>
        {footer.links.length > 0 && (
          <nav aria-label="Footer" className="flex gap-6 text-sm">
            {footer.links.map((link) => (
              <SafeLink key={`${link.label}-${link.href}`} href={link.href} className="hover:text-[var(--site-text-muted)]">
                {link.label}
              </SafeLink>
            ))}
          </nav>
        )}
      </div>
    </footer>
  )
}

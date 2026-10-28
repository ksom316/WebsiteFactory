import type { CorporateConfig } from '../../../schema'
import { SafeLink } from '../../../components/SafeLink'

export function NeutralFooter({ config }: { config: CorporateConfig }) {
  const { footer, business } = config

  return (
    <footer className="bg-[var(--site-bg)] py-8 text-center text-[var(--site-text-faint)]">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-sm">{footer.text || `© ${business.name}`}</p>
        {footer.links.length > 0 && (
          <nav aria-label="Footer" className="mt-3 flex flex-wrap justify-center gap-4 text-sm">
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

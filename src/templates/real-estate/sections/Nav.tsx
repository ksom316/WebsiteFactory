import { useState } from 'react'
import type { RealEstateConfig } from '../schema'
import { SafeLink } from '../components/SafeLink'

/** Plain inline SVGs rather than an icon library import — see
 * src/templates/restaurant/sections/Nav.tsx's header comment for why: the exported
 * standalone site's package.json only ships react/react-dom/zod as runtime
 * dependencies (see api/_lib/export/generateFiles.ts). */
function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}

export function RealEstateNav({ config }: { config: RealEstateConfig }) {
  const { logo, agency, nav, contact, sections } = config
  const label = logo.text || agency.name
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--site-border)] bg-[var(--site-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="font-[family-name:var(--site-font-display)] text-2xl font-semibold tracking-tight">
          {label}
        </a>

        {nav.length > 0 && (
          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm md:flex">
            {nav.map((item) => (
              <SafeLink
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="text-[var(--site-text-muted)] transition-colors hover:text-[var(--site-text)]"
              >
                {item.label}
              </SafeLink>
            ))}
            {sections.inquiry && contact.inquiryUrl && (
              <SafeLink
                href={contact.inquiryUrl}
                className="rounded-full bg-[var(--site-accent)] px-5 py-2 font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
              >
                Enquire now
              </SafeLink>
            )}
          </nav>
        )}

        {nav.length > 0 && (
          <button
            type="button"
            className="rounded-md border border-[var(--site-border)] p-2 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        )}
      </div>

      {open && nav.length > 0 && (
        <nav aria-label="Primary" className="flex flex-col gap-4 border-t border-[var(--site-border)] px-6 py-5 text-sm md:hidden">
          {nav.map((item) => (
            <SafeLink
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="text-[var(--site-text-muted)]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </SafeLink>
          ))}
          {sections.inquiry && contact.inquiryUrl && (
            <SafeLink
              href={contact.inquiryUrl}
              className="w-fit rounded-full bg-[var(--site-accent)] px-5 py-2 font-medium text-[var(--site-accent-contrast)]"
              onClick={() => setOpen(false)}
            >
              Enquire now
            </SafeLink>
          )}
        </nav>
      )}
    </header>
  )
}

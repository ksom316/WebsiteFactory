import { useState } from 'react'
import type { EcommerceConfig } from '../schema'
import { SafeLink } from '../components/SafeLink'
import { useCart } from '../components/useCart'

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

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  )
}

export function EcommerceNav({ config, onOpenCart }: { config: EcommerceConfig; onOpenCart: () => void }) {
  const { logo, store, nav } = config
  const label = logo.text || store.name
  const [open, setOpen] = useState(false)
  const { totals } = useCart()

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--site-border)] bg-[var(--site-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="font-[family-name:var(--site-font-display)] text-xl font-semibold tracking-tight">
          {label}
        </a>

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
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCart}
            className="relative rounded-md border border-[var(--site-border)] p-2"
            aria-label={`Open cart, ${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'}`}
          >
            <CartIcon />
            {totals.itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--site-accent)] px-1 text-xs font-medium text-[var(--site-accent-contrast)]">
                {totals.itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="rounded-md border border-[var(--site-border)] p-2 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Primary" className="flex flex-col gap-4 border-t border-[var(--site-border)] px-6 py-5 text-sm md:hidden">
          {nav.map((item) => (
            <SafeLink key={`${item.label}-${item.href}`} href={item.href} className="text-[var(--site-text-muted)]" onClick={() => setOpen(false)}>
              {item.label}
            </SafeLink>
          ))}
        </nav>
      )}
    </header>
  )
}

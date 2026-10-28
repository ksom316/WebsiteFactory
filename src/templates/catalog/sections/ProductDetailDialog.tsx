import { useEffect, useRef } from 'react'
import type { CatalogConfig, CatalogProduct } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { SafeLink } from '../components/SafeLink'
import { buildProductInquiryHref } from '../components/inquiry'
import { formatPrice } from '../components/currency'

interface Props {
  product: CatalogProduct
  currency: string
  noPriceLabel: string
  contact: CatalogConfig['contact']
  onClose: () => void
}

/**
 * An accessible product-detail dialog rather than a routed detail page — the simplest
 * robust option that works identically in the factory preview and a static export,
 * with no router dependency. Keyboard behavior: Escape closes it, the close button
 * receives focus on open, and focus returns to whatever triggered it on close (handled
 * by the caller — see Shop.tsx, which remembers and restores focus to the product
 * card button).
 */
export function ProductDetailDialog({ product, currency, noPriceLabel, contact, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      // A minimal focus trap: Tab wrapping stays inside the dialog without needing a
      // full focus-trap dependency for what is, at most, a handful of focusable items.
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const hasSale = product.salePrice !== undefined && product.price !== undefined
  const inquiryHref = buildProductInquiryHref(product, contact)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-product-dialog-title"
        className="wf-catalog max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[var(--site-surface)] p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="catalog-product-dialog-title" className="font-[family-name:var(--site-font-display)] text-2xl font-semibold">
            {product.name}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="shrink-0 rounded-md border border-[var(--site-border)] px-2.5 py-1.5 text-sm text-[var(--site-text-muted)] hover:text-[var(--site-text)]"
          >
            Close
          </button>
        </div>

        {product.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {product.images.map((imageUrl, index) => (
              <SafeImage
                key={`${product.slug}-${index}`}
                src={imageUrl}
                alt={`${product.name} photo ${index + 1}`}
                fallbackLabel={product.name}
                className={`aspect-square w-full rounded-md object-cover ${index === 0 ? 'col-span-3' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {product.price !== undefined ? (
            <div className="flex items-baseline gap-2">
              {hasSale && <span className="text-sm text-[var(--site-text-faint)] line-through">{formatPrice(product.price!, currency)}</span>}
              <span className="font-[family-name:var(--site-font-display)] text-xl">
                {formatPrice(hasSale ? product.salePrice! : product.price, currency)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-[var(--site-text-faint)]">{noPriceLabel}</p>
          )}
          {product.availability && (
            <span className="rounded-full border border-[var(--site-border)] px-2.5 py-0.5 text-xs text-[var(--site-text-muted)]">
              {product.availability}
            </span>
          )}
          {product.sku && <span className="text-xs text-[var(--site-text-faint)]">SKU: {product.sku}</span>}
        </div>

        {product.description && <p className="mt-4 leading-relaxed text-[var(--site-text-muted)]">{product.description}</p>}

        {product.attributes.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {product.attributes.map((attribute) => (
              <div key={attribute.label}>
                <dt className="text-[var(--site-text-faint)]">{attribute.label}</dt>
                <dd className="font-medium">{attribute.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {inquiryHref && (
          <div className="mt-6">
            <SafeLink
              href={inquiryHref}
              className="inline-block rounded-full bg-[var(--site-accent)] px-6 py-3 text-sm font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
            >
              Enquire about this item
            </SafeLink>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { EcommerceConfig } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { formatMoney } from '../components/currency'
import { getLineId, getMaxQuantity } from '../components/cart'
import { useCart } from '../components/useCart'

interface Props {
  config: EcommerceConfig
  onClose: () => void
  onCheckout: () => void
}

/**
 * An accessible cart panel — same dialog pattern as ProductDetailDialog.tsx (focus
 * the close button on open, Escape closes it, focus returns to whatever opened it).
 * All prices/totals come from `useCart().totals`, computed in integer minor units
 * (see components/currency.ts) — nothing here is authoritative for a real
 * transaction; see README.md's "E-commerce storefront template family" section.
 */
export function CartDrawer({ config, onClose, onCheckout }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { totals, updateQuantity, remove, clear } = useCart()
  const [confirmingClear, setConfirmingClear] = useState(false)

  useEffect(() => {
    closeButtonRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ecommerce-cart-title"
        className="wf-ecommerce flex h-full w-full max-w-md flex-col bg-[var(--site-surface)] p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="ecommerce-cart-title" className="font-[family-name:var(--site-font-display)] text-xl font-semibold">
            Your cart
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-md border border-[var(--site-border)] px-2.5 py-1.5 text-sm text-[var(--site-text-muted)] hover:text-[var(--site-text)]"
          >
            Close
          </button>
        </div>

        {totals.items.length === 0 ? (
          <p className="mt-10 text-sm text-[var(--site-text-muted)]">Your cart is empty.</p>
        ) : (
          <>
            <ul className="mt-6 flex-1 space-y-4 overflow-y-auto">
              {totals.items.map(({ line, product, lineTotalMinor }) => {
                const lineId = getLineId(line.productSlug, line.variantSelection)
                const max = getMaxQuantity(product)
                const variantText = Object.entries(line.variantSelection)
                  .map(([name, value]) => `${name}: ${value}`)
                  .join(', ')
                return (
                  <li key={lineId} className="flex gap-3 border-b border-[var(--site-border)] pb-4">
                    <SafeImage
                      src={product.images[0]}
                      alt={product.imageAlt || product.name}
                      fallbackLabel={product.name}
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[var(--site-text)]">{product.name}</p>
                      {variantText && <p className="text-xs text-[var(--site-text-faint)]">{variantText}</p>}
                      <div className="mt-1.5 flex items-center gap-2">
                        <label className="flex items-center gap-1.5">
                          <span className="sr-only">Quantity for {product.name}</span>
                          <input
                            type="number"
                            min={1}
                            max={max}
                            value={line.quantity}
                            onChange={(e) => updateQuantity(lineId, Math.max(1, Number(e.target.value) || 1))}
                            className="w-16 rounded-md border border-[var(--site-border)] px-2 py-1 text-sm"
                          />
                        </label>
                        <button type="button" onClick={() => remove(lineId)} className="text-xs font-medium text-[var(--site-danger)] hover:underline">
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-medium">{formatMoney(lineTotalMinor, config.shop.currency)}</p>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 space-y-3 border-t border-[var(--site-border)] pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--site-text-muted)]">Subtotal</span>
                <span className="font-medium">{formatMoney(totals.subtotalMinor, config.shop.currency)}</span>
              </div>
              <p className="text-xs text-[var(--site-text-faint)]">Shipping and total calculated at checkout.</p>
              <button
                type="button"
                onClick={onCheckout}
                className="w-full rounded-full bg-[var(--site-accent)] px-5 py-3 text-sm font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
              >
                Checkout
              </button>
              {confirmingClear ? (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-[var(--site-text-muted)]">Clear your whole cart?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        clear()
                        setConfirmingClear(false)
                      }}
                      className="font-medium text-[var(--site-danger)] hover:underline"
                    >
                      Yes, clear
                    </button>
                    <button type="button" onClick={() => setConfirmingClear(false)} className="text-[var(--site-text-muted)] hover:underline">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmingClear(true)} className="w-full text-sm text-[var(--site-text-muted)] hover:underline">
                  Clear cart
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

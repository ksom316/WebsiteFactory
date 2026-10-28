import { useEffect, useRef, useState } from 'react'
import type { EcommerceProduct } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { formatPrice } from '../components/currency'
import { canAddToCart, getMaxQuantity } from '../components/cart'
import { useCart } from '../components/useCart'
import { createRadioGroupController } from '../components/radioGroup'

const STOCK_LABELS: Record<EcommerceProduct['stock']['status'], string> = {
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'made-to-order': 'Made to order',
  'out-of-stock': 'Out of stock',
}

interface Props {
  product: EcommerceProduct
  currency: string
  noPriceLabel: string
  onClose: () => void
}

/**
 * An accessible product-detail dialog rather than a routed detail page — mirrors
 * src/templates/catalog/sections/ProductDetailDialog.tsx's approach and keyboard
 * behavior exactly (Escape closes it, the close button receives focus on open, a
 * minimal Tab-wrapping focus trap, focus returns to the triggering card on close —
 * handled by the caller, see Shop.tsx), extended with variant selection, an image
 * gallery, and the Add to Cart action this family needs that catalog doesn't.
 */
export function ProductDetailDialog({ product, currency, noPriceLabel, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart()

  const [activeImage, setActiveImage] = useState(0)
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.variants.map((variant) => [variant.name, variant.options[0]])),
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [variantRefs] = useState(() => new Map<string, Map<string, HTMLButtonElement>>())

  function getVariantGroup(variantName: string, options: readonly string[]) {
    if (!variantRefs.has(variantName)) variantRefs.set(variantName, new Map())
    return createRadioGroupController({
      value: selection[variantName],
      onChange: (option) => setSelection((prev) => ({ ...prev, [variantName]: option })),
      values: options,
      itemRefs: variantRefs.get(variantName)!,
    })
  }

  useEffect(() => {
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')
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
  const addable = canAddToCart(product)
  const maxQuantity = getMaxQuantity(product)

  function handleAddToCart() {
    addToCart(product, selection, quantity)
    setAdded(true)
  }

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
        aria-labelledby="ecommerce-product-dialog-title"
        className="wf-ecommerce max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[var(--site-surface)] p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="ecommerce-product-dialog-title" className="font-[family-name:var(--site-font-display)] text-2xl font-semibold">
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

        <SafeImage
          src={product.images[activeImage] ?? product.images[0]}
          alt={product.imageAlt || product.name}
          fallbackLabel={product.name}
          className="mt-4 aspect-square w-full rounded-md object-cover"
        />
        {product.images.length > 1 && (
          <div role="group" aria-label="Product images" className="mt-2 flex gap-2">
            {product.images.map((imageUrl, index) => (
              <button
                key={`${product.slug}-${index}`}
                type="button"
                aria-label={`Show image ${index + 1}`}
                aria-pressed={activeImage === index}
                onClick={() => setActiveImage(index)}
                className={`h-14 w-14 overflow-hidden rounded-md border ${activeImage === index ? 'border-[var(--site-accent)]' : 'border-[var(--site-border)]'}`}
              >
                <SafeImage src={imageUrl} alt="" fallbackLabel={product.name} className="h-full w-full object-cover" />
              </button>
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
          <span className="rounded-full border border-[var(--site-border)] px-2.5 py-0.5 text-xs text-[var(--site-text-muted)]">
            {STOCK_LABELS[product.stock.status]}
          </span>
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

        {product.variants.map((variant) => {
          const group = getVariantGroup(variant.name, variant.options)
          return (
            <div key={variant.name} className="mt-4">
              <span className="text-sm font-medium text-[var(--site-text)]">{variant.name}</span>
              <div {...group.groupProps} aria-label={variant.name} className="mt-1.5 flex flex-wrap gap-2">
                {variant.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    {...group.getItemProps(option)}
                    onClick={() => setSelection((prev) => ({ ...prev, [variant.name]: option }))}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${selection[variant.name] === option ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/10 text-[var(--site-accent-strong)]' : 'border-[var(--site-border)] text-[var(--site-text-muted)]'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {addable && (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--site-text)]">Quantity</span>
              <input
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-md border border-[var(--site-border)] px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={handleAddToCart}
              className="rounded-full bg-[var(--site-accent)] px-6 py-3 text-sm font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
            >
              Add to cart
            </button>
            {added && (
              <span role="status" className="text-sm text-[var(--site-accent-strong)]">
                Added to cart.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

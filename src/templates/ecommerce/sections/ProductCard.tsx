import type { EcommerceProduct } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { formatPrice } from '../components/currency'
import { canAddToCart } from '../components/cart'
import { useCart } from '../components/useCart'

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
  onSelect: (product: EcommerceProduct) => void
}

export function ProductCard({ product, currency, noPriceLabel, onSelect }: Props) {
  const { addToCart } = useCart()
  const hasSale = product.salePrice !== undefined && product.price !== undefined
  const quickAddable = canAddToCart(product) && product.variants.length === 0

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)]">
      <button type="button" onClick={() => onSelect(product)} className="group block text-left">
        <div className="relative">
          <SafeImage
            src={product.images[0]}
            alt={product.imageAlt || product.name}
            fallbackLabel={product.name}
            className="aspect-square w-full object-cover"
          />
          {product.featured && (
            <span className="absolute left-2 top-2 rounded-full bg-[var(--site-accent)] px-2 py-0.5 text-xs font-medium text-[var(--site-accent-contrast)]">
              Featured
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4 pb-2">
          {product.category && <p className="text-xs uppercase tracking-wide text-[var(--site-text-faint)]">{product.category}</p>}
          <h3 className="font-[family-name:var(--site-font-display)] text-base font-semibold">{product.name}</h3>
          <p className="text-xs text-[var(--site-text-faint)]">{STOCK_LABELS[product.stock.status]}</p>
          {product.price !== undefined ? (
            <div className="flex items-baseline gap-2">
              {hasSale && <span className="text-sm text-[var(--site-text-faint)] line-through">{formatPrice(product.price!, currency)}</span>}
              <span className="font-[family-name:var(--site-font-display)] text-lg">
                {formatPrice(hasSale ? product.salePrice! : product.price, currency)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-[var(--site-text-faint)]">{noPriceLabel}</p>
          )}
        </div>
      </button>

      <div className="px-4 pb-4">
        {quickAddable ? (
          <button
            type="button"
            onClick={() => addToCart(product, {}, 1)}
            className="w-full rounded-full bg-[var(--site-accent)] px-4 py-2 text-sm font-medium text-[var(--site-accent-contrast)] transition-colors hover:bg-[var(--site-accent-strong)]"
          >
            Add to cart
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelect(product)}
            className="w-full rounded-full border border-[var(--site-border)] px-4 py-2 text-sm font-medium text-[var(--site-text)] transition-colors hover:border-[var(--site-accent)]"
          >
            {product.variants.length > 0 ? 'Choose options' : 'View details'}
          </button>
        )}
      </div>
    </div>
  )
}

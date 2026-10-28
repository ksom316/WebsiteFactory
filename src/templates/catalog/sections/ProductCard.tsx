import type { CatalogProduct } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { formatPrice } from '../components/currency'

interface Props {
  product: CatalogProduct
  currency: string
  noPriceLabel: string
  onSelect: (product: CatalogProduct) => void
}

export function ProductCard({ product, currency, noPriceLabel, onSelect }: Props) {
  const hasSale = product.salePrice !== undefined && product.price !== undefined
  const priceLine =
    product.price !== undefined ? (
      <div className="flex items-baseline gap-2">
        {hasSale && <span className="text-sm text-[var(--site-text-faint)] line-through">{formatPrice(product.price!, currency)}</span>}
        <span className="font-[family-name:var(--site-font-display)] text-lg">
          {formatPrice(hasSale ? product.salePrice! : product.price, currency)}
        </span>
      </div>
    ) : (
      <p className="text-sm text-[var(--site-text-faint)]">{noPriceLabel}</p>
    )

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group flex flex-col overflow-hidden rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)] text-left transition-shadow hover:shadow-md"
    >
      <div className="relative">
        <SafeImage
          src={product.images[0]}
          alt={product.name}
          fallbackLabel={product.name}
          className="aspect-square w-full object-cover"
        />
        {product.badges.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.badges.map((badge) => (
              <span key={badge} className="rounded-full bg-[var(--site-accent)] px-2 py-0.5 text-xs font-medium text-[var(--site-accent-contrast)]">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category && <p className="text-xs uppercase tracking-wide text-[var(--site-text-faint)]">{product.category}</p>}
        <h3 className="font-[family-name:var(--site-font-display)] text-base font-semibold">{product.name}</h3>
        {product.shortDescription && <p className="text-sm text-[var(--site-text-muted)]">{product.shortDescription}</p>}
        <div className="mt-auto pt-2">{priceLine}</div>
      </div>
    </button>
  )
}

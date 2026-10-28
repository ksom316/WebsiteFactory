import { useRef, useState } from 'react'
import type { CatalogConfig, CatalogProduct } from '../schema'
import { ProductCard } from './ProductCard'
import { ProductDetailDialog } from './ProductDetailDialog'

/**
 * A featured-products rail — restricted to `featured.productSlugs`, which
 * `parseCatalogConfig` has already filtered down to slugs that match a real product
 * (see schema.ts), so this section can never reference a phantom item. Deliberately
 * not just "the first N products" — it's an explicit, curated subset.
 */
export function CatalogFeatured({ config }: { config: CatalogConfig }) {
  const { featured, shop, contact } = config
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  const products = featured.productSlugs
    .map((slug) => shop.products.find((p) => p.slug === slug))
    .filter((p): p is CatalogProduct => Boolean(p))

  if (products.length === 0) return null

  function handleSelect(product: CatalogProduct) {
    lastTriggerRef.current = document.activeElement as HTMLElement | null
    setSelectedProduct(product)
  }

  function handleClose() {
    setSelectedProduct(null)
    lastTriggerRef.current?.focus()
  }

  return (
    <section className="bg-[var(--site-surface-raised)] py-20" aria-label="Featured">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8">
          <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
            {featured.heading || 'Featured'}
          </h2>
          {featured.intro && <p className="mt-4 max-w-xl text-[var(--site-text-muted)]">{featured.intro}</p>}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              currency={shop.currency}
              noPriceLabel={shop.noPriceLabel}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          currency={shop.currency}
          noPriceLabel={shop.noPriceLabel}
          contact={contact}
          onClose={handleClose}
        />
      )}
    </section>
  )
}

import { useRef, useState } from 'react'
import type { EcommerceConfig, EcommerceProduct } from '../schema'
import { ProductCard } from './ProductCard'
import { ProductDetailDialog } from './ProductDetailDialog'

/** Shows products explicitly marked `featured: true` on the product itself —
 * mirroring the catalog family's curated-subset intent, but keyed by a per-product
 * flag (set in the editor) rather than a separate slug list, since every product
 * already carries its own featured status in this family's schema. */
export function EcommerceFeatured({ config }: { config: EcommerceConfig }) {
  const { featured, shop } = config
  const [selectedProduct, setSelectedProduct] = useState<EcommerceProduct | null>(null)
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  const products = shop.products.filter((p) => p.featured)
  if (products.length === 0) return null

  function handleSelect(product: EcommerceProduct) {
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
            <ProductCard key={product.slug} product={product} currency={shop.currency} noPriceLabel={shop.noPriceLabel} onSelect={handleSelect} />
          ))}
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailDialog product={selectedProduct} currency={shop.currency} noPriceLabel={shop.noPriceLabel} onClose={handleClose} />
      )}
    </section>
  )
}

import { useMemo, useRef, useState } from 'react'
import type { EcommerceConfig, EcommerceProduct } from '../schema'
import { ProductCard } from './ProductCard'
import { ProductDetailDialog } from './ProductDetailDialog'

function matchesSearch(product: EcommerceProduct, query: string): boolean {
  const haystack = `${product.name} ${product.description ?? ''} ${product.category ?? ''}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

/**
 * The storefront's product grid: client-side search (name/description/category) and
 * category filtering over the already-configured `products` — a plain array filter,
 * no backend search or external service, mirroring the catalog family's shop section.
 */
export function EcommerceShop({ config }: { config: EcommerceConfig }) {
  const { shop } = config
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all')
  const [selectedProduct, setSelectedProduct] = useState<EcommerceProduct | null>(null)
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(shop.products.map((p) => p.category).filter((c): c is string => Boolean(c)))),
    [shop.products],
  )

  const filtered = shop.products.filter(
    (product) =>
      (categoryFilter === 'all' || product.category === categoryFilter) && (query.trim() === '' || matchesSearch(product, query)),
  )

  const hasActiveFilters = query.trim() !== '' || categoryFilter !== 'all'

  function resetFilters() {
    setQuery('')
    setCategoryFilter('all')
  }

  function handleSelect(product: EcommerceProduct) {
    lastTriggerRef.current = document.activeElement as HTMLElement | null
    setSelectedProduct(product)
  }

  function handleClose() {
    setSelectedProduct(null)
    lastTriggerRef.current?.focus()
  }

  if (shop.products.length === 0) {
    return (
      <section id="shop" className="mx-auto max-w-6xl px-6 py-20" aria-label="Shop">
        <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
          {shop.heading || 'Shop'}
        </h2>
        <p className="mt-4 text-sm text-[var(--site-text-muted)]">New products are on their way — check back soon.</p>
      </section>
    )
  }

  return (
    <section id="shop" className="mx-auto max-w-6xl px-6 py-20" aria-label="Shop">
      <div className="mb-8">
        <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
          {shop.heading || 'Shop'}
        </h2>
        {shop.intro && <p className="mt-4 max-w-xl text-[var(--site-text-muted)]">{shop.intro}</p>}
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex-1 sm:max-w-sm">
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-sm text-[var(--site-text)] outline-none focus-visible:border-[var(--site-accent)]"
          />
        </label>

        {categories.length > 1 && (
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${categoryFilter === 'all' ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/10 text-[var(--site-accent-strong)]' : 'border-[var(--site-border)] text-[var(--site-text-muted)]'}`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${categoryFilter === category ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/10 text-[var(--site-accent-strong)]' : 'border-[var(--site-border)] text-[var(--site-text-muted)]'}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between text-sm text-[var(--site-text-faint)]">
        <p>
          {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
        </p>
        {hasActiveFilters && (
          <button type="button" onClick={resetFilters} className="font-medium text-[var(--site-accent-strong)] hover:underline">
            Reset filters
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.slug} product={product} currency={shop.currency} noPriceLabel={shop.noPriceLabel} onSelect={handleSelect} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--site-text-muted)]">No products match your search or filters right now.</p>
      )}

      {selectedProduct && (
        <ProductDetailDialog product={selectedProduct} currency={shop.currency} noPriceLabel={shop.noPriceLabel} onClose={handleClose} />
      )}
    </section>
  )
}

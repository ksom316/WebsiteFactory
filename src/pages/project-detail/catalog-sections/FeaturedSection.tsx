import type { CatalogConfig } from '../../../templates/catalog'
import { fieldsetClass, helpTextClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: CatalogConfig
  onChange: (next: CatalogConfig) => void
  disabled?: boolean
}

export function FeaturedSection({ config, onChange, disabled }: Props) {
  const { featured, shop } = config

  function toggleProduct(slug: string) {
    const productSlugs = featured.productSlugs.includes(slug)
      ? featured.productSlugs.filter((s) => s !== slug)
      : [...featured.productSlugs, slug]
    onChange({ ...config, featured: { ...featured, productSlugs } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Featured collection</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Section heading</span>
        <input
          className={inputClass}
          value={featured.heading ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, featured: { ...featured, heading: e.target.value } })}
        />
      </label>

      {shop.products.length === 0 ? (
        <p className={helpTextClass}>Add products above before choosing which ones to feature.</p>
      ) : (
        <div className="space-y-2">
          <span className={labelClass}>Products to feature</span>
          {shop.products.map((product) => (
            <label key={product.slug} className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={featured.productSlugs.includes(product.slug!)}
                disabled={disabled}
                onChange={() => toggleProduct(product.slug!)}
              />
              {product.name}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}

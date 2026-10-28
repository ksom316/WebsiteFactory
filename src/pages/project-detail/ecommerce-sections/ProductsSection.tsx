import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { EcommerceConfig } from '../../../templates/ecommerce'
import { STOCK_STATUSES } from '../../../templates/ecommerce'
import { fieldsetClass, helpTextClass, inputClass, labelClass, legendClass } from '../formStyles'
import { AttributeListField } from '../shared/AttributeListField'
import { StringListField } from '../shared/StringListField'
import { VariantListField } from '../shared/VariantListField'

interface Props {
  config: EcommerceConfig
  onChange: (next: EcommerceConfig) => void
  disabled?: boolean
}

export function ProductsSection({ config, onChange, disabled }: Props) {
  const { shop } = config
  const products = shop.products

  function updateProduct(index: number, patch: Partial<(typeof products)[number]>) {
    onChange({ ...config, shop: { ...shop, products: products.map((p, i) => (i === index ? { ...p, ...patch } : p)) } })
  }

  function removeProduct(index: number) {
    onChange({ ...config, shop: { ...shop, products: products.filter((_, i) => i !== index) } })
  }

  function moveProduct(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= products.length) return
    const next = [...products]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange({ ...config, shop: { ...shop, products: next } })
  }

  function addProduct() {
    if (products.length >= 60) return
    onChange({
      ...config,
      shop: { ...shop, products: [...products, { name: 'New product', images: [], variants: [], attributes: [], featured: false, stock: { status: 'in-stock' } }] },
    })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Products</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Section heading</span>
          <input
            className={inputClass}
            value={shop.heading ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, shop: { ...shop, heading: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Currency code</span>
          <input
            className={inputClass}
            placeholder="USD"
            value={shop.currency}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, shop: { ...shop, currency: e.target.value } })}
          />
        </label>
      </div>

      <label className="space-y-1.5 block">
        <span className={labelClass}>"No price" message</span>
        <input
          className={inputClass}
          value={shop.noPriceLabel}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, shop: { ...shop, noPriceLabel: e.target.value } })}
        />
      </label>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="rounded-md border border-border-strong p-3">
            <div className="flex items-start gap-2">
              <input
                className={`${inputClass} flex-1 font-semibold`}
                aria-label={`Product ${index + 1} name`}
                value={product.name}
                disabled={disabled}
                onChange={(e) => updateProduct(index, { name: e.target.value })}
              />
              <div className="flex gap-1">
                <button type="button" disabled={disabled || index === 0} onClick={() => moveProduct(index, -1)} aria-label={`Move product ${index + 1} up`} className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40">
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button type="button" disabled={disabled || index === products.length - 1} onClick={() => moveProduct(index, 1)} aria-label={`Move product ${index + 1} down`} className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40">
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button type="button" disabled={disabled} onClick={() => removeProduct(index)} aria-label={`Remove product ${index + 1}`} className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60">
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className={inputClass} placeholder="Category" aria-label={`Product ${index + 1} category`} value={product.category ?? ''} disabled={disabled} onChange={(e) => updateProduct(index, { category: e.target.value })} />
              <input className={inputClass} placeholder="SKU (optional)" aria-label={`Product ${index + 1} SKU`} value={product.sku ?? ''} disabled={disabled} onChange={(e) => updateProduct(index, { sku: e.target.value })} />
              <input type="number" min={0} step="0.01" className={inputClass} placeholder="Price" aria-label={`Product ${index + 1} price`} value={product.price ?? ''} disabled={disabled} onChange={(e) => updateProduct(index, { price: e.target.value === '' ? undefined : Number(e.target.value) })} />
              <input type="number" min={0} step="0.01" className={inputClass} placeholder="Sale price (optional, must be lower)" aria-label={`Product ${index + 1} sale price`} value={product.salePrice ?? ''} disabled={disabled} onChange={(e) => updateProduct(index, { salePrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs text-text-muted">Stock status</span>
                <select
                  className={inputClass}
                  aria-label={`Product ${index + 1} stock status`}
                  value={product.stock.status}
                  disabled={disabled}
                  onChange={(e) => updateProduct(index, { stock: { ...product.stock, status: e.target.value as (typeof STOCK_STATUSES)[number] } })}
                >
                  {STOCK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-text-muted">Demo stock quantity (optional limit)</span>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  aria-label={`Product ${index + 1} stock quantity`}
                  value={product.stock.quantity ?? ''}
                  disabled={disabled}
                  onChange={(e) => updateProduct(index, { stock: { ...product.stock, quantity: e.target.value === '' ? undefined : Number(e.target.value) } })}
                />
              </label>
            </div>

            <label className="mt-2 flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={product.featured} disabled={disabled} onChange={(e) => updateProduct(index, { featured: e.target.checked })} />
              Featured product
            </label>

            <textarea className={`${inputClass} mt-2 min-h-16`} placeholder="Description" aria-label={`Product ${index + 1} description`} value={product.description ?? ''} disabled={disabled} onChange={(e) => updateProduct(index, { description: e.target.value })} />

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <StringListField
                  label="Image URLs"
                  items={product.images}
                  onChange={(images) => updateProduct(index, { images })}
                  placeholder="https://…"
                  itemAriaLabel={(imgIndex) => `Product ${index + 1} image ${imgIndex + 1} URL`}
                  addLabel="Add image"
                  disabled={disabled}
                />
              </div>
              <input className={inputClass} placeholder="Image alt text" aria-label={`Product ${index + 1} image alt text`} value={product.imageAlt ?? ''} disabled={disabled} onChange={(e) => updateProduct(index, { imageAlt: e.target.value })} />
            </div>

            <div className="mt-2">
              <VariantListField
                items={product.variants}
                onChange={(variants) => updateProduct(index, { variants })}
                itemAriaLabel={(varIndex) => `Product ${index + 1} variant ${varIndex + 1}`}
                disabled={disabled}
              />
            </div>

            <div className="mt-2">
              <AttributeListField
                label="Attributes"
                items={product.attributes}
                onChange={(attributes) => updateProduct(index, { attributes })}
                itemGroupAriaLabel={(attrIndex) => `Product ${index + 1} attribute ${attrIndex + 1}`}
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>

      {products.length < 60 && (
        <button type="button" disabled={disabled} onClick={addProduct} className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60">
          Add product
        </button>
      )}
      <p className={helpTextClass}>{products.length} / 60 products</p>
    </fieldset>
  )
}

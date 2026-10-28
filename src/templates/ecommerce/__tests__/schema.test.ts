import { describe, expect, it } from 'vitest'
import { ecommerceConfigSchema, parseEcommerceConfig, DEFAULT_ECOMMERCE_CONFIG } from '../schema'

describe('parseEcommerceConfig', () => {
  it('never throws and fills in every default for an empty object', () => {
    const config = parseEcommerceConfig({})
    expect(config.family).toBe('ecommerce')
    expect(config.store.name).toBe('Your Store')
    expect(config.sections.shop).toBe(true)
    expect(config.shop.products).toEqual([])
    expect(config.shop.currency).toBe('USD')
    expect(config.checkout.shippingOptions).toHaveLength(1)
    expect(config.checkout.demoNotice).toMatch(/demo/i)
  })

  it('never throws for completely unparseable input (wrong top-level type)', () => {
    expect(parseEcommerceConfig('not an object')).toEqual(DEFAULT_ECOMMERCE_CONFIG)
    expect(parseEcommerceConfig(null)).toEqual(DEFAULT_ECOMMERCE_CONFIG)
    expect(parseEcommerceConfig([1, 2, 3])).toEqual(DEFAULT_ECOMMERCE_CONFIG)
  })

  it('is backward compatible: a config missing fields added in a later version still parses', () => {
    const legacy = { store: { name: 'Legacy Store' }, hero: { heading: 'Hello' } }
    const config = parseEcommerceConfig(legacy)
    expect(config.store.name).toBe('Legacy Store')
    expect(config.hero.heading).toBe('Hello')
    expect(config.sections.about).toBe(true)
  })

  it('generates a stable slug per product from its name when none is supplied', () => {
    const config = parseEcommerceConfig({ shop: { products: [{ name: 'Trailhead Daypack' }, { name: 'Ridge Wool Sweater' }] } })
    expect(config.shop.products[0].slug).toBe('trailhead-daypack')
    expect(config.shop.products[1].slug).toBe('ridge-wool-sweater')
  })

  it('de-duplicates duplicate product slugs/ids so two products never collide', () => {
    const config = parseEcommerceConfig({
      shop: { products: [{ name: 'Same Name' }, { name: 'Same Name' }, { slug: 'same-name', name: 'Explicit Dup' }] },
    })
    const slugs = config.shop.products.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(3)
  })

  it('rejects a negative price, falling back to no price rather than a negative one', () => {
    const config = parseEcommerceConfig({ shop: { products: [{ name: 'A product', price: -5 }] } })
    expect(config.shop.products[0].price).toBeUndefined()
  })

  it('rejects a non-finite price', () => {
    const config = parseEcommerceConfig({ shop: { products: [{ name: 'A product', price: Infinity }] } })
    expect(config.shop.products[0].price).toBeUndefined()
  })

  it('drops a sale price that is not strictly lower than the regular price', () => {
    const equal = parseEcommerceConfig({ shop: { products: [{ name: 'A product', price: 50, salePrice: 50 }] } })
    expect(equal.shop.products[0].salePrice).toBeUndefined()

    const higher = parseEcommerceConfig({ shop: { products: [{ name: 'A product', price: 50, salePrice: 60 }] } })
    expect(higher.shop.products[0].salePrice).toBeUndefined()
  })

  it('keeps a valid sale price that is strictly lower than the regular price', () => {
    const config = parseEcommerceConfig({ shop: { products: [{ name: 'A product', price: 50, salePrice: 40 }] } })
    expect(config.shop.products[0].salePrice).toBe(40)
  })

  it('allows a product with neither price nor salePrice to publish with no price at all', () => {
    const config = parseEcommerceConfig({ shop: { products: [{ name: 'Custom piece' }] } })
    expect(config.shop.products[0].price).toBeUndefined()
  })

  it('accepts configured product variants', () => {
    const config = parseEcommerceConfig({
      shop: { products: [{ name: 'Sweater', variants: [{ name: 'Size', options: ['S', 'M', 'L'] }] }] },
    })
    expect(config.shop.products[0].variants[0].options).toEqual(['S', 'M', 'L'])
  })

  it('drops an invalid variant (no options) to an empty variants list rather than rejecting the product', () => {
    const parsed = ecommerceConfigSchema.safeParse({
      shop: { products: [{ name: 'Sweater', variants: [{ name: 'Size', options: [] }] }] },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.shop.products).toHaveLength(1)
      expect(parsed.data.shop.products[0].variants).toEqual([])
    }
  })

  it('defaults an invalid stock status rather than rejecting the product', () => {
    const parsed = ecommerceConfigSchema.safeParse({
      shop: { products: [{ name: 'A product', stock: { status: 'flying-off-the-shelves' } }] },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.shop.products[0].stock.status).toBe('in-stock')
    }
  })

  it('accepts configured shipping options with valid prices', () => {
    const config = parseEcommerceConfig({
      checkout: { shippingOptions: [{ label: 'Standard', price: 5 }, { label: 'Express', price: 15 }] },
    })
    expect(config.checkout.shippingOptions).toHaveLength(2)
    expect(config.checkout.shippingOptions[1].price).toBe(15)
  })

  it('rejects a negative shipping price, falling back to no price', () => {
    const config = parseEcommerceConfig({ checkout: { shippingOptions: [{ label: 'Standard', price: -5 }] } })
    expect(config.checkout.shippingOptions[0].price).toBeUndefined()
  })

  it('respects section visibility flags', () => {
    const config = parseEcommerceConfig({ sections: { testimonials: false, featured: false } })
    expect(config.sections.testimonials).toBe(false)
    expect(config.sections.featured).toBe(false)
    expect(config.sections.shop).toBe(true)
  })

  it('falls back to an empty list when a products array exceeds its schema maximum', () => {
    const parsed = ecommerceConfigSchema.safeParse({
      shop: { products: Array.from({ length: 61 }, (_, i) => ({ name: `Product ${i}` })) },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.shop.products).toEqual([])
    }
  })

  it('preserves raw text content without interpreting markup', () => {
    const config = parseEcommerceConfig({ hero: { heading: '<img src=x onerror=alert(1)>' } })
    expect(config.hero.heading).toBe('<img src=x onerror=alert(1)>')
  })

  it('is a self-describing family tag — unrelated fields from another family still default correctly', () => {
    const config = parseEcommerceConfig({ variant: 'premium', business: { name: 'Acme' } })
    expect(config.family).toBe('ecommerce')
    expect(config.store.name).toBe('Your Store')
  })
})

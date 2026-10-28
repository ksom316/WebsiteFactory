import { describe, expect, it } from 'vitest'
import { catalogConfigSchema, parseCatalogConfig, DEFAULT_CATALOG_CONFIG } from '../schema'

describe('parseCatalogConfig', () => {
  it('never throws and fills in every default for an empty object', () => {
    const config = parseCatalogConfig({})
    expect(config.family).toBe('catalog')
    expect(config.business.name).toBe('Your Shop')
    expect(config.sections.shop).toBe(true)
    expect(config.shop.products).toEqual([])
    expect(config.shop.currency).toBe('USD')
    expect(config.shop.noPriceLabel).toBe('Contact for price')
    expect(config.featured.productSlugs).toEqual([])
  })

  it('never throws for completely unparseable input (wrong top-level type)', () => {
    expect(parseCatalogConfig('not an object')).toEqual(DEFAULT_CATALOG_CONFIG)
    expect(parseCatalogConfig(null)).toEqual(DEFAULT_CATALOG_CONFIG)
    expect(parseCatalogConfig([1, 2, 3])).toEqual(DEFAULT_CATALOG_CONFIG)
  })

  it('is backward compatible: a config missing fields added in a later version still parses', () => {
    const legacy = { business: { name: 'Legacy Shop' }, hero: { heading: 'Hello' } }
    const config = parseCatalogConfig(legacy)
    expect(config.business.name).toBe('Legacy Shop')
    expect(config.hero.heading).toBe('Hello')
    expect(config.sections.about).toBe(true)
    expect(config.seo).toEqual({})
  })

  it('accepts a fully customized business and product configuration', () => {
    const config = parseCatalogConfig({
      business: { name: 'Acme Goods', tagline: 'Good stuff', location: 'Portland, OR' },
      shop: {
        currency: 'EUR',
        products: [
          { name: 'Ceramic mug', category: 'Ceramics', price: 24, badges: ['New'], images: ['https://example.com/mug.jpg'] },
        ],
      },
    })
    expect(config.business.name).toBe('Acme Goods')
    expect(config.shop.currency).toBe('EUR')
    expect(config.shop.products[0].category).toBe('Ceramics')
    expect(config.shop.products[0].badges).toEqual(['New'])
  })

  it('rejects a missing required product name but keeps the config intact via the array-level catch', () => {
    const parsed = catalogConfigSchema.safeParse({ shop: { products: [{ name: '' }] } })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.shop.products).toEqual([])
    }
  })

  it('generates a stable slug per product from its name when none is supplied', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'Hand-thrown Bowl' }, { name: 'Linen Runner' }] } })
    expect(config.shop.products[0].slug).toBe('hand-thrown-bowl')
    expect(config.shop.products[1].slug).toBe('linen-runner')
  })

  it('de-duplicates duplicate product slugs so two products never collide', () => {
    const config = parseCatalogConfig({
      shop: { products: [{ name: 'Same Name' }, { name: 'Same Name' }, { slug: 'same-name', name: 'Explicit Dup' }] },
    })
    const slugs = config.shop.products.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(3)
  })

  it('rejects a non-https product image URL', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'A product', images: ['http://example.com/a.png'] }] } })
    expect(config.shop.products[0].images).toEqual([''])
  })

  it('accepts a valid https product image URL', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'A product', images: ['https://example.com/a.png'] }] } })
    expect(config.shop.products[0].images).toEqual(['https://example.com/a.png'])
  })

  it('normalizes an unsafe product inquiry link to "#" instead of dropping the product', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'A product', inquiryHref: 'javascript:alert(1)' }] } })
    expect(config.shop.products[0].inquiryHref).toBe('#')
  })

  it('rejects a negative price, falling back to no price rather than a negative one', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'A product', price: -5 }] } })
    expect(config.shop.products[0].price).toBeUndefined()
  })

  it('rejects a non-finite price', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'A product', price: Infinity }] } })
    expect(config.shop.products[0].price).toBeUndefined()
  })

  it('accepts a valid non-negative price, including zero', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'A product', price: 0 }] } })
    expect(config.shop.products[0].price).toBe(0)
  })

  it('drops a sale price that is not strictly lower than the regular price', () => {
    const equal = parseCatalogConfig({ shop: { products: [{ name: 'A product', price: 50, salePrice: 50 }] } })
    expect(equal.shop.products[0].salePrice).toBeUndefined()

    const higher = parseCatalogConfig({ shop: { products: [{ name: 'A product', price: 50, salePrice: 60 }] } })
    expect(higher.shop.products[0].salePrice).toBeUndefined()
  })

  it('keeps a valid sale price that is strictly lower than the regular price', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'A product', price: 50, salePrice: 40 }] } })
    expect(config.shop.products[0].salePrice).toBe(40)
  })

  it('allows a product with neither price nor salePrice to publish with no price at all', () => {
    const config = parseCatalogConfig({ shop: { products: [{ name: 'Custom piece' }] } })
    expect(config.shop.products[0].price).toBeUndefined()
    expect(config.shop.products[0].salePrice).toBeUndefined()
  })

  it('drops a featured product slug that does not match any configured product', () => {
    const config = parseCatalogConfig({
      shop: { products: [{ name: 'Real product' }] },
      featured: { productSlugs: ['real-product', 'a-product-that-does-not-exist'] },
    })
    expect(config.featured.productSlugs).toEqual(['real-product'])
  })

  it('keeps every featured product slug that does match a configured product', () => {
    const config = parseCatalogConfig({
      shop: { products: [{ name: 'Product A' }, { name: 'Product B' }] },
      featured: { productSlugs: ['product-a', 'product-b'] },
    })
    expect(config.featured.productSlugs).toEqual(['product-a', 'product-b'])
  })

  it('rejects an invalid email and falls back to empty', () => {
    const config = parseCatalogConfig({ contact: { email: 'not-an-email' } })
    expect(config.contact.email).toBe('')
  })

  it('rejects a malformed WhatsApp/phone value and falls back to empty', () => {
    const config = parseCatalogConfig({ contact: { whatsapp: 'not a phone number at all!!', phone: 'also not a phone' } })
    expect(config.contact.whatsapp).toBe('')
    expect(config.contact.phone).toBe('')
  })

  it('accepts a valid phone/WhatsApp value', () => {
    const config = parseCatalogConfig({ contact: { whatsapp: '+1 503 555 0148', phone: '+1 (503) 555-0148' } })
    expect(config.contact.whatsapp).toBe('+1 503 555 0148')
    expect(config.contact.phone).toBe('+1 (503) 555-0148')
  })

  it('omits optional content safely when not provided', () => {
    const config = parseCatalogConfig({ business: { name: 'Acme' } })
    expect(config.shop.products).toEqual([])
    expect(config.featured.productSlugs).toEqual([])
    expect(config.contact.social).toEqual([])
  })

  it('respects section visibility flags', () => {
    const config = parseCatalogConfig({ sections: { featured: false, about: false } })
    expect(config.sections.featured).toBe(false)
    expect(config.sections.about).toBe(false)
    expect(config.sections.shop).toBe(true)
  })

  it('falls back to an empty list when a products array exceeds its schema maximum', () => {
    const parsed = catalogConfigSchema.safeParse({
      shop: { products: Array.from({ length: 61 }, (_, i) => ({ name: `Product ${i}` })) },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.shop.products).toEqual([])
    }
  })

  it('accepts a product list within the schema maximum', () => {
    const config = parseCatalogConfig({
      shop: { products: Array.from({ length: 60 }, (_, i) => ({ name: `Product ${i}` })) },
    })
    expect(config.shop.products).toHaveLength(60)
  })

  it('preserves raw text content without interpreting markup', () => {
    const config = parseCatalogConfig({ hero: { heading: '<img src=x onerror=alert(1)>' } })
    expect(config.hero.heading).toBe('<img src=x onerror=alert(1)>')
  })

  it('is a self-describing family tag — unrelated fields from another family still default correctly', () => {
    const config = parseCatalogConfig({ variant: 'premium', agency: { name: 'Acme' } })
    expect(config.family).toBe('catalog')
    expect(config.business.name).toBe('Your Shop')
  })
})

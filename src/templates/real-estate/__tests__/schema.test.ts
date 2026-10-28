import { describe, expect, it } from 'vitest'
import { realEstateConfigSchema, parseRealEstateConfig, DEFAULT_REAL_ESTATE_CONFIG } from '../schema'

describe('parseRealEstateConfig', () => {
  it('never throws and fills in every default for an empty object', () => {
    const config = parseRealEstateConfig({})
    expect(config.family).toBe('real-estate')
    expect(config.agency.name).toBe('Your Agency')
    expect(config.sections.listings).toBe(true)
    expect(config.listings.properties).toEqual([])
    expect(config.agents.team).toEqual([])
  })

  it('never throws for completely unparseable input (wrong top-level type)', () => {
    expect(parseRealEstateConfig('not an object')).toEqual(DEFAULT_REAL_ESTATE_CONFIG)
    expect(parseRealEstateConfig(null)).toEqual(DEFAULT_REAL_ESTATE_CONFIG)
    expect(parseRealEstateConfig([1, 2, 3])).toEqual(DEFAULT_REAL_ESTATE_CONFIG)
  })

  it('is backward compatible: a config missing fields added in a later version still parses', () => {
    const legacy = { agency: { name: 'Legacy Realty' }, hero: { heading: 'Hello' } }
    const config = parseRealEstateConfig(legacy)
    expect(config.agency.name).toBe('Legacy Realty')
    expect(config.hero.heading).toBe('Hello')
    expect(config.sections.agents).toBe(true)
    expect(config.seo).toEqual({})
  })

  it('rejects a non-https property image URL', () => {
    const config = parseRealEstateConfig({
      listings: { properties: [{ title: 'House', images: ['http://example.com/a.png'] }] },
    })
    expect(config.listings.properties[0].images).toEqual([''])
  })

  it('accepts valid https property image URLs', () => {
    const config = parseRealEstateConfig({
      listings: { properties: [{ title: 'House', images: ['https://example.com/a.png'] }] },
    })
    expect(config.listings.properties[0].images).toEqual(['https://example.com/a.png'])
  })

  it('normalizes an unsafe CTA href to "#" instead of dropping the whole CTA', () => {
    const config = parseRealEstateConfig({
      hero: { heading: 'Hi', primaryCta: { label: 'Go', href: 'javascript:alert(1)' } },
    })
    expect(config.hero.primaryCta?.href).toBe('#')
  })

  it('rejects an unsafe inquiry URL instead of keeping it', () => {
    const config = parseRealEstateConfig({ contact: { inquiryUrl: 'javascript:alert(1)' } })
    expect(config.contact.inquiryUrl).toBeUndefined()
  })

  it('accepts a valid https inquiry URL', () => {
    const config = parseRealEstateConfig({ contact: { inquiryUrl: 'https://inquiries.example.com/x' } })
    expect(config.contact.inquiryUrl).toBe('https://inquiries.example.com/x')
  })

  it('defaults an invalid property type and transaction type rather than rejecting the listing', () => {
    const parsed = realEstateConfigSchema.safeParse({
      listings: { properties: [{ title: 'Mystery property', propertyType: 'castle', transactionType: 'lease' }] },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.listings.properties[0].propertyType).toBe('house')
      expect(parsed.data.listings.properties[0].transactionType).toBe('sale')
    }
  })

  it('coerces malformed bedroom/bathroom counts to undefined rather than failing the listing', () => {
    const config = parseRealEstateConfig({
      listings: { properties: [{ title: 'House', bedrooms: 'lots', bathrooms: -5 }] },
    })
    expect(config.listings.properties[0].bedrooms).toBeUndefined()
    // -5 fails the min(0) constraint, so it falls back via .catch(undefined).
    expect(config.listings.properties[0].bathrooms).toBeUndefined()
  })

  it('generates a stable slug per listing from its title when none is supplied', () => {
    const config = parseRealEstateConfig({
      listings: { properties: [{ title: 'The Birchwood House' }, { title: 'Harbor Row, Unit 4B' }] },
    })
    expect(config.listings.properties[0].slug).toBe('the-birchwood-house')
    expect(config.listings.properties[1].slug).toBe('harbor-row-unit-4b')
  })

  it('de-duplicates generated slugs so two listings never collide', () => {
    const config = parseRealEstateConfig({
      listings: { properties: [{ title: 'Same Title' }, { title: 'Same Title' }] },
    })
    const slugs = config.listings.properties.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(2)
  })

  it('omits optional content safely when not provided', () => {
    const config = parseRealEstateConfig({ agency: { name: 'Acme' } })
    expect(config.listings.properties).toEqual([])
    expect(config.agents.team).toEqual([])
    expect(config.contact.social).toEqual([])
  })

  it('respects section visibility flags', () => {
    const config = parseRealEstateConfig({ sections: { agents: false, inquiry: false } })
    expect(config.sections.agents).toBe(false)
    expect(config.sections.inquiry).toBe(false)
    expect(config.sections.listings).toBe(true)
  })

  it('falls back to an empty list when a listings array exceeds its schema maximum', () => {
    const parsed = realEstateConfigSchema.safeParse({
      listings: { properties: Array.from({ length: 25 }, (_, i) => ({ title: `Property ${i}` })) },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.listings.properties).toEqual([])
    }
  })

  it('preserves raw text content without interpreting markup', () => {
    const config = parseRealEstateConfig({ hero: { heading: '<img src=x onerror=alert(1)>' } })
    expect(config.hero.heading).toBe('<img src=x onerror=alert(1)>')
  })

  it('is a self-describing family tag — unrelated fields from another family still default correctly', () => {
    const config = parseRealEstateConfig({ variant: 'premium', business: { name: 'Acme' } })
    expect(config.family).toBe('real-estate')
    expect(config.agency.name).toBe('Your Agency')
  })
})

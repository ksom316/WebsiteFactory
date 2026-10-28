import { describe, expect, it } from 'vitest'
import { corporateConfigSchema, parseCorporateConfig, DEFAULT_CORPORATE_CONFIG } from '../schema'

describe('parseCorporateConfig', () => {
  it('never throws and fills in every default for an empty object', () => {
    const config = parseCorporateConfig({})
    expect(config.variant).toBe('neutral')
    expect(config.business.name).toBe('Your Business')
    expect(config.sections.services).toBe(true)
    expect(config.nav).toEqual([])
    expect(config.services).toEqual([])
  })

  it('never throws for completely unparseable input (wrong top-level type)', () => {
    expect(parseCorporateConfig('not an object')).toEqual(DEFAULT_CORPORATE_CONFIG)
    expect(parseCorporateConfig(null)).toEqual(DEFAULT_CORPORATE_CONFIG)
    expect(parseCorporateConfig([1, 2, 3])).toEqual(DEFAULT_CORPORATE_CONFIG)
  })

  it('is backward compatible: a config missing fields added in a later version still parses', () => {
    // Simulates a config saved before `sections` or `seo` existed.
    const legacy = {
      variant: 'premium',
      business: { name: 'Legacy Co' },
      hero: { heading: 'Hello' },
    }
    const config = parseCorporateConfig(legacy)
    expect(config.business.name).toBe('Legacy Co')
    expect(config.hero.heading).toBe('Hello')
    expect(config.sections.about).toBe(true)
    expect(config.seo).toEqual({})
  })

  it('normalizes an invalid hex color to the default instead of failing the whole config', () => {
    const config = parseCorporateConfig({
      business: { name: 'Acme' },
      brand: { primaryColor: 'not-a-color', secondaryColor: '#123' },
    })
    expect(config.brand.primaryColor).toBe('#1F3B4D')
    expect(config.brand.secondaryColor).toBe('#123')
    expect(config.business.name).toBe('Acme')
  })

  it('normalizes an invalid image URL to empty rather than rejecting the config', () => {
    const config = parseCorporateConfig({
      business: { name: 'Acme' },
      hero: { heading: 'Hi', imageUrl: 'javascript:alert(1)' },
    })
    expect(config.hero.imageUrl).toBe('')
  })

  it('rejects a non-https image URL', () => {
    const config = parseCorporateConfig({ hero: { heading: 'Hi', imageUrl: 'http://example.com/a.png' } })
    expect(config.hero.imageUrl).toBe('')
  })

  it('accepts a valid https image URL', () => {
    const config = parseCorporateConfig({ hero: { heading: 'Hi', imageUrl: 'https://example.com/a.png' } })
    expect(config.hero.imageUrl).toBe('https://example.com/a.png')
  })

  it('normalizes an unsafe CTA href to "#" instead of dropping the whole CTA', () => {
    const config = parseCorporateConfig({
      hero: { heading: 'Hi', primaryCta: { label: 'Go', href: 'javascript:alert(1)' } },
    })
    expect(config.hero.primaryCta?.href).toBe('#')
  })

  it('accepts internal anchors, mailto:, tel:, and https hrefs', () => {
    const config = parseCorporateConfig({
      nav: [
        { label: 'A', href: '#about' },
        { label: 'B', href: '/pricing' },
        { label: 'C', href: 'mailto:hi@example.com' },
        { label: 'D', href: 'tel:+15555550123' },
        { label: 'E', href: 'https://example.com' },
      ],
    })
    expect(config.nav.map((item) => item.href)).toEqual([
      '#about',
      '/pricing',
      'mailto:hi@example.com',
      'tel:+15555550123',
      'https://example.com',
    ])
  })

  it('rejects a malformed mailto href', () => {
    const config = parseCorporateConfig({ nav: [{ label: 'A', href: 'mailto:not-an-email' }] })
    expect(config.nav[0].href).toBe('#')
  })

  it('omits optional sections safely when not provided', () => {
    const config = parseCorporateConfig({ business: { name: 'Acme' } })
    expect(config.testimonials).toEqual([])
    expect(config.highlights).toEqual([])
    expect(config.trust.items).toEqual([])
    expect(config.about.highlights).toEqual([])
  })

  it('respects section visibility flags', () => {
    const config = parseCorporateConfig({ sections: { testimonials: false, highlights: false } })
    expect(config.sections.testimonials).toBe(false)
    expect(config.sections.highlights).toBe(false)
    expect(config.sections.about).toBe(true)
  })

  it('rejects an invalid email and falls back to empty', () => {
    const config = parseCorporateConfig({ contact: { email: 'not-an-email' } })
    expect(config.contact.email).toBe('')
  })

  it('falls back to an empty list when an array exceeds its schema maximum, rather than crashing', () => {
    const parsed = corporateConfigSchema.safeParse({
      services: Array.from({ length: 9 }, (_, i) => ({ title: `Service ${i}` })),
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.services).toEqual([])
    }
  })

  it('accepts a service list within the schema maximum', () => {
    const config = parseCorporateConfig({
      services: Array.from({ length: 8 }, (_, i) => ({ title: `Service ${i}` })),
    })
    expect(config.services).toHaveLength(8)
  })

  it('preserves raw text content without interpreting markup', () => {
    const config = parseCorporateConfig({
      hero: { heading: '<img src=x onerror=alert(1)>' },
    })
    expect(config.hero.heading).toBe('<img src=x onerror=alert(1)>')
  })
})

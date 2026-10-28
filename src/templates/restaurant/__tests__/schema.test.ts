import { describe, expect, it } from 'vitest'
import { restaurantConfigSchema, parseRestaurantConfig, DEFAULT_RESTAURANT_CONFIG } from '../schema'

describe('parseRestaurantConfig', () => {
  it('never throws and fills in every default for an empty object', () => {
    const config = parseRestaurantConfig({})
    expect(config.family).toBe('restaurant')
    expect(config.restaurant.name).toBe('Your Restaurant')
    expect(config.sections.menu).toBe(true)
    expect(config.menu.categories).toEqual([])
    expect(config.hours).toEqual([])
    expect(config.gallery.images).toEqual([])
  })

  it('never throws for completely unparseable input (wrong top-level type)', () => {
    expect(parseRestaurantConfig('not an object')).toEqual(DEFAULT_RESTAURANT_CONFIG)
    expect(parseRestaurantConfig(null)).toEqual(DEFAULT_RESTAURANT_CONFIG)
    expect(parseRestaurantConfig([1, 2, 3])).toEqual(DEFAULT_RESTAURANT_CONFIG)
  })

  it('is backward compatible: a config missing fields added in a later version still parses', () => {
    const legacy = { restaurant: { name: 'Legacy Bistro' }, hero: { heading: 'Hello' } }
    const config = parseRestaurantConfig(legacy)
    expect(config.restaurant.name).toBe('Legacy Bistro')
    expect(config.hero.heading).toBe('Hello')
    expect(config.sections.gallery).toBe(true)
    expect(config.seo).toEqual({})
  })

  it('rejects a non-https image URL', () => {
    const config = parseRestaurantConfig({ hero: { heading: 'Hi', imageUrl: 'http://example.com/a.png' } })
    expect(config.hero.imageUrl).toBe('')
  })

  it('accepts a valid https image URL', () => {
    const config = parseRestaurantConfig({ hero: { heading: 'Hi', imageUrl: 'https://example.com/a.png' } })
    expect(config.hero.imageUrl).toBe('https://example.com/a.png')
  })

  it('normalizes an unsafe CTA href to "#" instead of dropping the whole CTA', () => {
    const config = parseRestaurantConfig({
      hero: { heading: 'Hi', primaryCta: { label: 'Go', href: 'javascript:alert(1)' } },
    })
    expect(config.hero.primaryCta?.href).toBe('#')
  })

  it('accepts internal anchors, mailto:, tel:, and https hrefs', () => {
    const config = parseRestaurantConfig({
      nav: [
        { label: 'A', href: '#menu' },
        { label: 'B', href: '/pricing' },
        { label: 'C', href: 'mailto:hi@example.com' },
        { label: 'D', href: 'tel:+15555550123' },
        { label: 'E', href: 'https://example.com' },
      ],
    })
    expect(config.nav.map((item) => item.href)).toEqual([
      '#menu',
      '/pricing',
      'mailto:hi@example.com',
      'tel:+15555550123',
      'https://example.com',
    ])
  })

  it('rejects an unsafe reservation URL instead of keeping it', () => {
    const config = parseRestaurantConfig({ contact: { reservationUrl: 'javascript:alert(1)' } })
    expect(config.contact.reservationUrl).toBeUndefined()
  })

  it('accepts a valid https reservation URL', () => {
    const config = parseRestaurantConfig({ contact: { reservationUrl: 'https://booking.example.com/x' } })
    expect(config.contact.reservationUrl).toBe('https://booking.example.com/x')
  })

  it('omits optional content safely when not provided', () => {
    const config = parseRestaurantConfig({ restaurant: { name: 'Acme' } })
    expect(config.menu.categories).toEqual([])
    expect(config.gallery.images).toEqual([])
    expect(config.hours).toEqual([])
    expect(config.contact.social).toEqual([])
  })

  it('respects section visibility flags', () => {
    const config = parseRestaurantConfig({ sections: { gallery: false, reservation: false } })
    expect(config.sections.gallery).toBe(false)
    expect(config.sections.reservation).toBe(false)
    expect(config.sections.menu).toBe(true)
  })

  it('falls back to an empty list when a menu category list exceeds its schema maximum', () => {
    const parsed = restaurantConfigSchema.safeParse({
      menu: { categories: Array.from({ length: 11 }, (_, i) => ({ name: `Category ${i}`, items: [] })) },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.menu.categories).toEqual([])
    }
  })

  it('accepts a menu within the schema maximum, including nested items', () => {
    const config = parseRestaurantConfig({
      menu: {
        categories: [{ name: 'Mains', items: [{ name: 'Branzino', description: 'Lemon, capers', price: '$32' }] }],
      },
    })
    expect(config.menu.categories).toHaveLength(1)
    expect(config.menu.categories[0].items[0].price).toBe('$32')
  })

  it('preserves raw text content without interpreting markup', () => {
    const config = parseRestaurantConfig({ hero: { heading: '<img src=x onerror=alert(1)>' } })
    expect(config.hero.heading).toBe('<img src=x onerror=alert(1)>')
  })

  it('is a self-describing family tag — a corporate-shaped object still parses as restaurant defaults', () => {
    // family is a literal, not inferred from shape, so unrelated fields from another
    // family's config don't leak through; everything restaurant-specific just defaults.
    const config = parseRestaurantConfig({ variant: 'premium', business: { name: 'Acme' } })
    expect(config.family).toBe('restaurant')
    expect(config.restaurant.name).toBe('Your Restaurant')
  })
})

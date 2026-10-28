import { describe, expect, it } from 'vitest'
import { portfolioConfigSchema, parsePortfolioConfig, DEFAULT_PORTFOLIO_CONFIG } from '../schema'

describe('parsePortfolioConfig', () => {
  it('never throws and fills in every default for an empty object', () => {
    const config = parsePortfolioConfig({})
    expect(config.family).toBe('portfolio')
    expect(config.person.name).toBe('Your Name')
    expect(config.sections.work).toBe(true)
    expect(config.work.projects).toEqual([])
    expect(config.skills.groups).toEqual([])
    expect(config.experience.entries).toEqual([])
    expect(config.testimonials).toEqual([])
  })

  it('never throws for completely unparseable input (wrong top-level type)', () => {
    expect(parsePortfolioConfig('not an object')).toEqual(DEFAULT_PORTFOLIO_CONFIG)
    expect(parsePortfolioConfig(null)).toEqual(DEFAULT_PORTFOLIO_CONFIG)
    expect(parsePortfolioConfig([1, 2, 3])).toEqual(DEFAULT_PORTFOLIO_CONFIG)
  })

  it('is backward compatible: a config missing fields added in a later version still parses', () => {
    const legacy = { person: { name: 'Legacy Person' }, hero: { heading: 'Hello' } }
    const config = parsePortfolioConfig(legacy)
    expect(config.person.name).toBe('Legacy Person')
    expect(config.hero.heading).toBe('Hello')
    expect(config.sections.experience).toBe(true)
    expect(config.seo).toEqual({})
  })

  it('accepts a fully customized configuration', () => {
    const config = parsePortfolioConfig({
      person: { name: 'Jamie Oak', role: 'Photographer', availability: 'Booking for spring' },
      work: { projects: [{ title: 'Coastline series', category: 'Editorial', tools: ['Film', 'Darkroom'] }] },
      skills: { groups: [{ name: 'Craft', items: ['Film', 'Lighting'] }], services: [{ title: 'Editorial shoots' }] },
      experience: { entries: [{ title: 'Staff Photographer', organization: 'Coastal Weekly', period: '2020 — Present' }] },
      testimonials: [{ quote: 'Wonderful to work with.', author: 'A. Client' }],
    })
    expect(config.person.role).toBe('Photographer')
    expect(config.work.projects[0].tools).toEqual(['Film', 'Darkroom'])
    expect(config.skills.groups[0].items).toEqual(['Film', 'Lighting'])
    expect(config.experience.entries[0].organization).toBe('Coastal Weekly')
    expect(config.testimonials[0].author).toBe('A. Client')
  })

  it('rejects a missing required project title but keeps the rest of the config intact', () => {
    const parsed = portfolioConfigSchema.safeParse({
      work: { projects: [{ title: '' }] },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      // A single invalid element fails the whole array's validation, which the
      // array-level `.catch([])` (see schema.ts) replaces with an empty list rather
      // than failing the entire config — matching the other families' convention.
      expect(parsed.data.work.projects).toEqual([])
    }
  })

  it('rejects a non-https project image URL', () => {
    const config = parsePortfolioConfig({ work: { projects: [{ title: 'A project', imageUrl: 'http://example.com/a.png' }] } })
    expect(config.work.projects[0].imageUrl).toBe('')
  })

  it('accepts a valid https project image URL', () => {
    const config = parsePortfolioConfig({ work: { projects: [{ title: 'A project', imageUrl: 'https://example.com/a.png' }] } })
    expect(config.work.projects[0].imageUrl).toBe('https://example.com/a.png')
  })

  it('normalizes an unsafe CTA href to "#" instead of dropping the whole CTA', () => {
    const config = parsePortfolioConfig({
      hero: { heading: 'Hi', primaryCta: { label: 'Go', href: 'javascript:alert(1)' } },
    })
    expect(config.hero.primaryCta?.href).toBe('#')
  })

  it('normalizes an unsafe project link to "#" instead of dropping the project', () => {
    const config = parsePortfolioConfig({ work: { projects: [{ title: 'A project', href: 'javascript:alert(1)' }] } })
    expect(config.work.projects[0].href).toBe('#')
  })

  it('accepts internal anchors, mailto:, tel:, and https hrefs', () => {
    const config = parsePortfolioConfig({
      nav: [
        { label: 'A', href: '#work' },
        { label: 'B', href: '/pricing' },
        { label: 'C', href: 'mailto:hi@example.com' },
        { label: 'D', href: 'tel:+15555550123' },
        { label: 'E', href: 'https://example.com' },
      ],
    })
    expect(config.nav.map((item) => item.href)).toEqual([
      '#work',
      '/pricing',
      'mailto:hi@example.com',
      'tel:+15555550123',
      'https://example.com',
    ])
  })

  it('rejects an invalid email and falls back to empty', () => {
    const config = parsePortfolioConfig({ contact: { email: 'not-an-email' } })
    expect(config.contact.email).toBe('')
  })

  it('accepts a valid email', () => {
    const config = parsePortfolioConfig({ contact: { email: 'hello@example.com' } })
    expect(config.contact.email).toBe('hello@example.com')
  })

  it('rejects an unsafe booking URL instead of keeping it', () => {
    const config = parsePortfolioConfig({ contact: { bookingUrl: 'javascript:alert(1)' } })
    expect(config.contact.bookingUrl).toBeUndefined()
  })

  it('accepts a valid https booking URL', () => {
    const config = parsePortfolioConfig({ contact: { bookingUrl: 'https://cal.example.com/x' } })
    expect(config.contact.bookingUrl).toBe('https://cal.example.com/x')
  })

  it('omits optional content safely when not provided', () => {
    const config = parsePortfolioConfig({ person: { name: 'Acme' } })
    expect(config.work.projects).toEqual([])
    expect(config.skills.groups).toEqual([])
    expect(config.skills.services).toEqual([])
    expect(config.experience.entries).toEqual([])
    expect(config.testimonials).toEqual([])
    expect(config.contact.social).toEqual([])
  })

  it('respects section visibility flags', () => {
    const config = parsePortfolioConfig({ sections: { testimonials: false, experience: false } })
    expect(config.sections.testimonials).toBe(false)
    expect(config.sections.experience).toBe(false)
    expect(config.sections.about).toBe(true)
  })

  it('falls back to an empty list when a projects array exceeds its schema maximum', () => {
    const parsed = portfolioConfigSchema.safeParse({
      work: { projects: Array.from({ length: 25 }, (_, i) => ({ title: `Project ${i}` })) },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.work.projects).toEqual([])
    }
  })

  it('accepts a project list within the schema maximum', () => {
    const config = parsePortfolioConfig({
      work: { projects: Array.from({ length: 24 }, (_, i) => ({ title: `Project ${i}` })) },
    })
    expect(config.work.projects).toHaveLength(24)
  })

  it('preserves raw text content without interpreting markup', () => {
    const config = parsePortfolioConfig({ hero: { heading: '<img src=x onerror=alert(1)>' } })
    expect(config.hero.heading).toBe('<img src=x onerror=alert(1)>')
  })

  it('is a self-describing family tag — unrelated fields from another family still default correctly', () => {
    const config = parsePortfolioConfig({ variant: 'premium', business: { name: 'Acme' } })
    expect(config.family).toBe('portfolio')
    expect(config.person.name).toBe('Your Name')
  })
})

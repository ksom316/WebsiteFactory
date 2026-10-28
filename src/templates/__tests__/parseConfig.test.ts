import { describe, expect, it } from 'vitest'
import { parseTemplateConfig, resolveFamily, getTemplateLabel, TEMPLATE_FAMILIES, UnknownTemplateFamilyError } from '../parseConfig'
import { DEFAULT_CORPORATE_CONFIG } from '../corporate/schema'
import { DEFAULT_RESTAURANT_CONFIG } from '../restaurant/schema'
import { DEFAULT_REAL_ESTATE_CONFIG } from '../real-estate/schema'
import { DEFAULT_PORTFOLIO_CONFIG } from '../portfolio/schema'
import { DEFAULT_CATALOG_CONFIG } from '../catalog/schema'
import { DEFAULT_ECOMMERCE_CONFIG } from '../ecommerce/schema'

describe('resolveFamily', () => {
  it('defaults to corporate for input with no family tag at all', () => {
    expect(resolveFamily({})).toBe('corporate')
    expect(resolveFamily(null)).toBe('corporate')
    expect(resolveFamily(undefined)).toBe('corporate')
    expect(resolveFamily('not an object')).toBe('corporate')
  })

  it('defaults to corporate for a config saved before the family field existed', () => {
    // Exactly what an old project_config_versions.config row looks like.
    expect(resolveFamily({ variant: 'premium', business: { name: 'Acme' } })).toBe('corporate')
  })

  it('resolves to each known family when its tag is present', () => {
    expect(resolveFamily({ family: 'corporate' })).toBe('corporate')
    expect(resolveFamily({ family: 'restaurant' })).toBe('restaurant')
    expect(resolveFamily({ family: 'real-estate' })).toBe('real-estate')
    expect(resolveFamily({ family: 'portfolio' })).toBe('portfolio')
    expect(resolveFamily({ family: 'catalog' })).toBe('catalog')
    expect(resolveFamily({ family: 'ecommerce' })).toBe('ecommerce')
  })

  it('fails safely (throws) for an explicit but unrecognized family tag, rather than silently defaulting to corporate', () => {
    expect(() => resolveFamily({ family: 'something-else' })).toThrow(UnknownTemplateFamilyError)
    expect(() => resolveFamily({ family: 'beauty' })).toThrow(/Unknown template family/)
  })
})

describe('parseTemplateConfig', () => {
  it('dispatches untagged input to the corporate parser (backward compatible)', () => {
    const config = parseTemplateConfig({ business: { name: 'Acme' } })
    expect(config.family).toBe('corporate')
    if (config.family === 'corporate') expect(config.business.name).toBe('Acme')
  })

  it('dispatches family: "restaurant" input to the restaurant parser', () => {
    const config = parseTemplateConfig({ family: 'restaurant', restaurant: { name: 'Acme Bistro' } })
    expect(config.family).toBe('restaurant')
    if (config.family === 'restaurant') expect(config.restaurant.name).toBe('Acme Bistro')
  })

  it('dispatches family: "real-estate" input to the real-estate parser', () => {
    const config = parseTemplateConfig({ family: 'real-estate', agency: { name: 'Acme Realty' } })
    expect(config.family).toBe('real-estate')
    if (config.family === 'real-estate') expect(config.agency.name).toBe('Acme Realty')
  })

  it('dispatches family: "portfolio" input to the portfolio parser', () => {
    const config = parseTemplateConfig({ family: 'portfolio', person: { name: 'Jamie Oak' } })
    expect(config.family).toBe('portfolio')
    if (config.family === 'portfolio') expect(config.person.name).toBe('Jamie Oak')
  })

  it('dispatches family: "catalog" input to the catalog parser', () => {
    const config = parseTemplateConfig({ family: 'catalog', business: { name: 'Acme Goods' } })
    expect(config.family).toBe('catalog')
    if (config.family === 'catalog') expect(config.business.name).toBe('Acme Goods')
  })

  it('dispatches family: "ecommerce" input to the ecommerce parser', () => {
    const config = parseTemplateConfig({ family: 'ecommerce', store: { name: 'Acme Goods' } })
    expect(config.family).toBe('ecommerce')
    if (config.family === 'ecommerce') expect(config.store.name).toBe('Acme Goods')
  })

  it('never throws for untagged or validly-tagged-but-malformed input', () => {
    expect(parseTemplateConfig('garbage')).toEqual(DEFAULT_CORPORATE_CONFIG)
    expect(parseTemplateConfig({ family: 'restaurant', menu: 'garbage' })).toEqual(
      expect.objectContaining({ family: 'restaurant' }),
    )
    expect(parseTemplateConfig({ family: 'real-estate', listings: 'garbage' })).toEqual(
      expect.objectContaining({ family: 'real-estate' }),
    )
    expect(parseTemplateConfig({ family: 'portfolio', work: 'garbage' })).toEqual(
      expect.objectContaining({ family: 'portfolio' }),
    )
    expect(parseTemplateConfig({ family: 'catalog', shop: 'garbage' })).toEqual(
      expect.objectContaining({ family: 'catalog' }),
    )
    expect(parseTemplateConfig({ family: 'ecommerce', shop: 'garbage' })).toEqual(
      expect.objectContaining({ family: 'ecommerce' }),
    )
  })

  it('throws for an explicit but unrecognized family tag, instead of silently rendering it as corporate', () => {
    expect(() => parseTemplateConfig({ family: 'beauty', business: { name: 'Acme' } })).toThrow(UnknownTemplateFamilyError)
  })

  it('never reinterprets an existing project as a different family', () => {
    const corporate = parseTemplateConfig({ variant: 'premium' })
    const restaurant = parseTemplateConfig({ family: 'restaurant' })
    const realEstate = parseTemplateConfig({ family: 'real-estate' })
    const portfolio = parseTemplateConfig({ family: 'portfolio' })
    const catalog = parseTemplateConfig({ family: 'catalog' })
    const ecommerce = parseTemplateConfig({ family: 'ecommerce' })
    expect(corporate).toEqual({ ...DEFAULT_CORPORATE_CONFIG, variant: 'premium' })
    expect(restaurant).toEqual(DEFAULT_RESTAURANT_CONFIG)
    expect(realEstate).toEqual(DEFAULT_REAL_ESTATE_CONFIG)
    expect(portfolio).toEqual(DEFAULT_PORTFOLIO_CONFIG)
    expect(catalog).toEqual(DEFAULT_CATALOG_CONFIG)
    expect(ecommerce).toEqual(DEFAULT_ECOMMERCE_CONFIG)
  })
})

describe('getTemplateLabel', () => {
  it('labels corporate configs by variant', () => {
    expect(getTemplateLabel(DEFAULT_CORPORATE_CONFIG)).toBe('Neutral Business')
    expect(getTemplateLabel({ ...DEFAULT_CORPORATE_CONFIG, variant: 'premium' })).toBe('Premium Agency / Technology')
  })

  it('labels restaurant configs as Restaurant regardless of content', () => {
    expect(getTemplateLabel(DEFAULT_RESTAURANT_CONFIG)).toBe('Restaurant')
  })

  it('labels real-estate configs as Real Estate regardless of content', () => {
    expect(getTemplateLabel(DEFAULT_REAL_ESTATE_CONFIG)).toBe('Real Estate')
  })

  it('labels portfolio configs as Portfolio regardless of content', () => {
    expect(getTemplateLabel(DEFAULT_PORTFOLIO_CONFIG)).toBe('Portfolio')
  })

  it('labels catalog configs as Catalog regardless of content', () => {
    expect(getTemplateLabel(DEFAULT_CATALOG_CONFIG)).toBe('Catalog')
  })

  it('labels ecommerce configs as E-commerce regardless of content', () => {
    expect(getTemplateLabel(DEFAULT_ECOMMERCE_CONFIG)).toBe('E-commerce')
  })
})

describe('TEMPLATE_FAMILIES', () => {
  it('lists exactly the corporate, restaurant, real-estate, portfolio, catalog, and ecommerce families', () => {
    expect(TEMPLATE_FAMILIES.map((f) => f.id).sort()).toEqual([
      'catalog',
      'corporate',
      'ecommerce',
      'portfolio',
      'real-estate',
      'restaurant',
    ])
  })
})

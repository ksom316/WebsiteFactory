import { describe, expect, it } from 'vitest'
import { fathomConfig } from '../corporate/sample-data/fathom'
import { willowCreekConfig } from '../corporate/sample-data/willowCreek'
import { gildedFigConfig } from '../restaurant/sample-data/gildedFig'
import { meridianRealtyConfig } from '../real-estate/sample-data/meridianRealty'
import { lenaAshfordConfig } from '../portfolio/sample-data/lenaAshford'
import { marlowAndFinchConfig } from '../catalog/sample-data/marlowAndFinch'
import { northfieldSupplyCoConfig } from '../ecommerce/sample-data/northfieldSupplyCo'

const SAMPLES: Record<string, unknown> = {
  fathom: fathomConfig,
  willowCreek: willowCreekConfig,
  gildedFig: gildedFigConfig,
  meridianRealty: meridianRealtyConfig,
  lenaAshford: lenaAshfordConfig,
  marlowAndFinch: marlowAndFinchConfig,
  northfieldSupplyCo: northfieldSupplyCoConfig,
}

/**
 * Any `https://` or `http://` URL whose host is an invented subdomain of a reserved
 * documentation domain (e.g. `booking.example.com`, `cal.example.com`) or that uses the
 * reserved `.example`/`.test`/`.invalid`/`.localhost` TLD directly as if it were a real
 * domain (e.g. `https://marlowandfinch.example`). None of these resolve over DNS — a
 * real browser clicking one gets a connection failure, not a page. The bare reserved
 * domains themselves (`example.com`, `example.net`, `example.org`) are excluded: they
 * are guaranteed by IANA to always resolve and are the one domain actually suitable for
 * "this placeholder link genuinely works" sample content.
 */
const NON_RESOLVING_PLACEHOLDER_URL =
  /^https?:\/\/(?:[a-z0-9-]+\.)+(?:example\.(?:com|net|org)|example|test|invalid|localhost)(?::\d+)?(?:\/|$)/i

/** Recursively collects every string value found anywhere in a sample config. */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out)
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out)
  }
  return out
}

describe('sample-data links are never dead-on-arrival placeholders', () => {
  for (const [name, config] of Object.entries(SAMPLES)) {
    it(`${name}: no href/url field points at a non-resolving placeholder domain`, () => {
      const offenders = collectStrings(config).filter((value) => NON_RESOLVING_PLACEHOLDER_URL.test(value))
      expect(offenders).toEqual([])
    })
  }
})

describe('NON_RESOLVING_PLACEHOLDER_URL', () => {
  it('flags the exact pattern this bug was built from', () => {
    expect(NON_RESOLVING_PLACEHOLDER_URL.test('https://instagram.example.com/thegildedfig')).toBe(true)
    expect(NON_RESOLVING_PLACEHOLDER_URL.test('https://booking.example.com/the-gilded-fig')).toBe(true)
    expect(NON_RESOLVING_PLACEHOLDER_URL.test('https://marlowandfinch.example')).toBe(true)
    expect(NON_RESOLVING_PLACEHOLDER_URL.test('https://foo.test/bar')).toBe(true)
  })

  it('does not flag the bare, genuinely-resolving example.com placeholder', () => {
    expect(NON_RESOLVING_PLACEHOLDER_URL.test('https://example.com')).toBe(false)
    expect(NON_RESOLVING_PLACEHOLDER_URL.test('https://example.com/some/path')).toBe(false)
  })

  it('does not flag real external domains', () => {
    expect(NON_RESOLVING_PLACEHOLDER_URL.test('https://linkedin.com/in/example')).toBe(false)
    expect(NON_RESOLVING_PLACEHOLDER_URL.test('https://images.unsplash.com/photo-123')).toBe(false)
  })
})

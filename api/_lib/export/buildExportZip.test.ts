// @vitest-environment node
import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { buildExportZip } from './buildExportZip'
import { parseCorporateConfig } from '../../../src/templates/corporate/schema'
import { parseRestaurantConfig } from '../../../src/templates/restaurant/schema'
import { parseRealEstateConfig } from '../../../src/templates/real-estate/schema'
import { parsePortfolioConfig } from '../../../src/templates/portfolio/schema'
import { parseCatalogConfig } from '../../../src/templates/catalog/schema'
import { parseEcommerceConfig } from '../../../src/templates/ecommerce/schema'
import type { Project } from '../db/queries/projects'

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Riverside Landscaping',
    slug: 'riverside-landscaping',
    businessName: 'Riverside Landscaping Co',
    templateId: 'corporate',
    status: 'draft',
    vercelProjectId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function unzipToStrings(bytes: Uint8Array): Record<string, string> {
  const unzipped = unzipSync(bytes)
  const result: Record<string, string> = {}
  for (const [path, data] of Object.entries(unzipped)) {
    result[path] = strFromU8(data)
  }
  return result
}

describe('buildExportZip', () => {
  it('exports a premium-variant project with the expected standalone project files', () => {
    const config = parseCorporateConfig({ variant: 'premium', business: { name: 'Fathom' }, hero: { heading: 'Systems that hold' } })
    const { bytes, filename } = buildExportZip({ project: project(), config, versionNumber: 3 })
    expect(filename).toBe('riverside-landscaping.zip')

    const files = unzipToStrings(bytes)
    for (const expectedPath of [
      'package.json',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      '.gitignore',
      'README.md',
      'src/main.tsx',
      'src/App.tsx',
      'src/styles.css',
      'src/site-config.ts',
      'src/templates/corporate/schema.ts',
      'src/templates/corporate/CorporateTemplate.tsx',
      'src/templates/corporate/components/SafeLink.tsx',
      'src/templates/corporate/components/SafeImage.tsx',
      'src/templates/corporate/variants/premium/Site.tsx',
      'src/templates/corporate/variants/premium/tokens.css',
      'src/templates/corporate/variants/neutral/Site.tsx',
      'src/templates/corporate/variants/neutral/tokens.css',
    ]) {
      expect(files[expectedPath], `missing ${expectedPath}`).toBeDefined()
    }

    expect(files['src/site-config.ts']).toContain('Fathom')
    expect(files['src/site-config.ts']).toContain('Systems that hold')
  })

  it('exports a neutral-variant project equally well', () => {
    const config = parseCorporateConfig({ variant: 'neutral', business: { name: 'Willow Creek Dental' } })
    const { bytes } = buildExportZip({ project: project(), config, versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/site-config.ts']).toContain('"variant": "neutral"')
    expect(files['README.md']).toContain('Neutral Business')
  })

  it('never contains a path-traversal or absolute-path entry, regardless of project content', () => {
    const config = parseCorporateConfig({
      business: { name: '../../../etc/passwd' },
      hero: { heading: '/absolute/path/attempt' },
    })
    const { bytes } = buildExportZip({
      project: project({ name: '../evil', slug: 'riverside-landscaping' }),
      config,
      versionNumber: 1,
    })
    const files = unzipToStrings(bytes)
    for (const entryPath of Object.keys(files)) {
      expect(entryPath.startsWith('/')).toBe(false)
      expect(entryPath).not.toContain('..')
    }
  })

  it('sanitizes the zip filename for an unusual project slug', () => {
    // Slugs are already constrained at creation time, but the export path re-sanitizes
    // independently rather than assuming that always held.
    const config = parseCorporateConfig({})
    const { filename } = buildExportZip({
      project: project({ slug: 'Not A Valid Slug! 😀 / ../' as never }),
      config,
      versionNumber: 1,
    })
    expect(filename).toMatch(/^[a-z0-9-]+\.zip$/)
  })

  it('falls back to a safe default filename when the slug sanitizes to nothing', () => {
    const config = parseCorporateConfig({})
    const { filename } = buildExportZip({ project: project({ slug: '😀😀😀' as never }), config, versionNumber: 1 })
    expect(filename).toBe('website.zip')
  })

  it('escapes HTML-sensitive content in index.html instead of injecting it raw', () => {
    // seo.title/description win over business.name in the <title> fallback chain (see
    // generateFiles.ts#buildIndexHtml), so that's what should show up, escaped.
    const config = parseCorporateConfig({
      business: { name: '<script>alert(1)</script>' },
      seo: { title: '<img src=x onerror=alert(1)>', description: 'Safe "quoted" & ampersand' },
    })
    const { bytes } = buildExportZip({ project: project(), config, versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['index.html']).not.toContain('<script>alert(1)</script>')
    expect(files['index.html']).not.toContain('<img src=x onerror=alert(1)>')
    expect(files['index.html']).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(files['index.html']).toContain('Safe &quot;quoted&quot; &amp; ampersand')
  })

  it('round-trips quotes, unicode, and script-looking strings through site-config.ts safely', () => {
    const trickyName = `"hello" ünïcödé <script>alert(1)</script>` // within business.name's 80-char limit
    const trickyBody = `He said "hello" — ünïcödé — <script>alert(1)</script> — \`backtick\` — \${injection}`
    const config = parseCorporateConfig({ business: { name: trickyName }, about: { body: trickyBody } })
    const { bytes } = buildExportZip({ project: project(), config, versionNumber: 1 })
    const files = unzipToStrings(bytes)
    const moduleSource = files['src/site-config.ts']

    // Extract the embedded JSON object literal and confirm it parses back to the exact
    // original value — this is the "does it round-trip without executing" check,
    // without needing to actually execute the generated module.
    const match = /const savedConfig: unknown = (\{[\s\S]*\})\n\nexport/.exec(moduleSource)
    expect(match).not.toBeNull()
    const parsedBack = JSON.parse(match![1])
    expect(parsedBack.business.name).toBe(trickyName)
    expect(parsedBack.about.body).toBe(trickyBody)
  })

  it('normalizes an unsafe URL scheme instead of embedding it', () => {
    const config = parseCorporateConfig({
      hero: { heading: 'Hi', primaryCta: { label: 'Go', href: 'javascript:alert(1)' } },
    })
    const { bytes } = buildExportZip({ project: project(), config, versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/site-config.ts']).not.toContain('javascript:alert')
    expect(files['src/site-config.ts']).toContain('"href": "#"')
  })

  it('handles a malformed/invalid stored configuration safely instead of throwing', () => {
    expect(() => buildExportZip({ project: project(), config: 'not-an-object' as never, versionNumber: 1 })).not.toThrow()
    const { bytes } = buildExportZip({ project: project(), config: 'not-an-object' as never, versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/site-config.ts']).toContain('Your Business')
  })

  it('produces a valid, decodable archive (ZIP integrity)', () => {
    const { bytes } = buildExportZip({ project: project(), config: parseCorporateConfig({}), versionNumber: 1 })
    expect(() => unzipSync(bytes)).not.toThrow()
    expect(bytes.byteLength).toBeGreaterThan(1000)
  })

  it('exports a restaurant-family project with that family\'s own files, not corporate\'s', () => {
    const config = parseRestaurantConfig({
      restaurant: { name: 'The Gilded Fig' },
      hero: { heading: 'A table worth the trip' },
      contact: { reservationUrl: 'https://booking.example.com/the-gilded-fig' },
    })
    const { bytes, filename } = buildExportZip({ project: project(), config, versionNumber: 2 })
    expect(filename).toBe('riverside-landscaping.zip')

    const files = unzipToStrings(bytes)
    for (const expectedPath of [
      'package.json',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      '.gitignore',
      'README.md',
      'src/main.tsx',
      'src/App.tsx',
      'src/styles.css',
      'src/site-config.ts',
      'src/templates/restaurant/schema.ts',
      'src/templates/restaurant/RestaurantTemplate.tsx',
      'src/templates/restaurant/components/SafeLink.tsx',
      'src/templates/restaurant/components/SafeImage.tsx',
      'src/templates/restaurant/sections/Menu.tsx',
      'src/templates/restaurant/tokens.css',
    ]) {
      expect(files[expectedPath], `missing ${expectedPath}`).toBeDefined()
    }

    expect(files['src/templates/corporate/schema.ts']).toBeUndefined()
    expect(files['src/App.tsx']).toContain('RestaurantTemplate')
    expect(files['src/App.tsx']).not.toContain('CorporateTemplate')
    expect(files['src/site-config.ts']).toContain('The Gilded Fig')
    expect(files['src/site-config.ts']).toContain('parseRestaurantConfig')
    expect(files['README.md']).toContain('Restaurant')
    expect(files['README.md']).toContain('src/templates/restaurant/')
  })

  it('never includes the other family\'s files in a corporate export either', () => {
    const { bytes } = buildExportZip({ project: project(), config: parseCorporateConfig({}), versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/templates/restaurant/schema.ts']).toBeUndefined()
    expect(files['src/templates/real-estate/schema.ts']).toBeUndefined()
  })

  it('exports a real-estate-family project with that family\'s own files, not corporate\'s or restaurant\'s', () => {
    const config = parseRealEstateConfig({
      agency: { name: 'Meridian & Co' },
      hero: { heading: 'Find a place that feels like home' },
      listings: { properties: [{ title: 'The Birchwood House', price: '$1,245,000' }] },
      contact: { inquiryUrl: 'https://inquiries.example.com/meridian-co' },
    })
    const { bytes, filename } = buildExportZip({ project: project(), config, versionNumber: 3 })
    expect(filename).toBe('riverside-landscaping.zip')

    const files = unzipToStrings(bytes)
    for (const expectedPath of [
      'package.json',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      '.gitignore',
      'README.md',
      'src/main.tsx',
      'src/App.tsx',
      'src/styles.css',
      'src/site-config.ts',
      'src/templates/real-estate/schema.ts',
      'src/templates/real-estate/RealEstateTemplate.tsx',
      'src/templates/real-estate/components/SafeLink.tsx',
      'src/templates/real-estate/components/SafeImage.tsx',
      'src/templates/real-estate/sections/Listings.tsx',
      'src/templates/real-estate/sections/PropertyDetails.tsx',
      'src/templates/real-estate/tokens.css',
    ]) {
      expect(files[expectedPath], `missing ${expectedPath}`).toBeDefined()
    }

    expect(files['src/templates/corporate/schema.ts']).toBeUndefined()
    expect(files['src/templates/restaurant/schema.ts']).toBeUndefined()
    expect(files['src/App.tsx']).toContain('RealEstateTemplate')
    expect(files['src/App.tsx']).not.toContain('CorporateTemplate')
    expect(files['src/App.tsx']).not.toContain('RestaurantTemplate')
    expect(files['src/site-config.ts']).toContain('Meridian & Co')
    expect(files['src/site-config.ts']).toContain('The Birchwood House')
    expect(files['src/site-config.ts']).toContain('parseRealEstateConfig')
    expect(files['README.md']).toContain('Real Estate')
    expect(files['README.md']).toContain('src/templates/real-estate/')
  })

  it('never includes the other families\' files in a real-estate export either', () => {
    const { bytes } = buildExportZip({ project: project(), config: parseRealEstateConfig({}), versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/templates/corporate/schema.ts']).toBeUndefined()
    expect(files['src/templates/restaurant/schema.ts']).toBeUndefined()
  })

  it('normalizes an unsafe URL scheme in a real-estate listing image instead of embedding it', () => {
    const config = parseRealEstateConfig({
      listings: { properties: [{ title: 'Sketchy House', images: ['javascript:alert(1)'] }] },
    })
    const { bytes } = buildExportZip({ project: project(), config, versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/site-config.ts']).not.toContain('javascript:alert')
  })

  it('exports a portfolio-family project with that family\'s own files, not the other families\'', () => {
    const config = parsePortfolioConfig({
      person: { name: 'Jamie Oak' },
      hero: { heading: 'Hello, I build things worth using' },
      work: { projects: [{ title: 'Coastline series' }] },
    })
    const { bytes, filename } = buildExportZip({ project: project(), config, versionNumber: 2 })
    expect(filename).toBe('riverside-landscaping.zip')

    const files = unzipToStrings(bytes)
    for (const expectedPath of [
      'package.json',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      '.gitignore',
      'README.md',
      'src/main.tsx',
      'src/App.tsx',
      'src/styles.css',
      'src/site-config.ts',
      'src/templates/portfolio/schema.ts',
      'src/templates/portfolio/PortfolioTemplate.tsx',
      'src/templates/portfolio/components/SafeLink.tsx',
      'src/templates/portfolio/components/SafeImage.tsx',
      'src/templates/portfolio/sections/Work.tsx',
      'src/templates/portfolio/tokens.css',
    ]) {
      expect(files[expectedPath], `missing ${expectedPath}`).toBeDefined()
    }

    expect(files['src/templates/corporate/schema.ts']).toBeUndefined()
    expect(files['src/templates/restaurant/schema.ts']).toBeUndefined()
    expect(files['src/templates/real-estate/schema.ts']).toBeUndefined()
    expect(files['src/App.tsx']).toContain('PortfolioTemplate')
    expect(files['src/App.tsx']).not.toContain('CorporateTemplate')
    expect(files['src/site-config.ts']).toContain('Jamie Oak')
    expect(files['src/site-config.ts']).toContain('Coastline series')
    expect(files['src/site-config.ts']).toContain('parsePortfolioConfig')
    expect(files['README.md']).toContain('Portfolio')
    expect(files['README.md']).toContain('src/templates/portfolio/')
  })

  it('never includes the other families\' files in a portfolio export either', () => {
    const { bytes } = buildExportZip({ project: project(), config: parsePortfolioConfig({}), versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/templates/corporate/schema.ts']).toBeUndefined()
    expect(files['src/templates/restaurant/schema.ts']).toBeUndefined()
    expect(files['src/templates/real-estate/schema.ts']).toBeUndefined()
  })

  it('normalizes an unsafe URL scheme in a portfolio project link instead of embedding it', () => {
    const config = parsePortfolioConfig({
      work: { projects: [{ title: 'Sketchy project', href: 'javascript:alert(1)' }] },
    })
    const { bytes } = buildExportZip({ project: project(), config, versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/site-config.ts']).not.toContain('javascript:alert')
  })

  it('exports a catalog-family project with that family\'s own files, not the other families\'', () => {
    const config = parseCatalogConfig({
      business: { name: 'Marlow & Finch' },
      hero: { heading: 'Thoughtfully made, carefully chosen' },
      shop: { products: [{ name: 'Hand-thrown bowl', price: 48 }] },
    })
    const { bytes, filename } = buildExportZip({ project: project(), config, versionNumber: 2 })
    expect(filename).toBe('riverside-landscaping.zip')

    const files = unzipToStrings(bytes)
    for (const expectedPath of [
      'package.json',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      '.gitignore',
      'README.md',
      'src/main.tsx',
      'src/App.tsx',
      'src/styles.css',
      'src/site-config.ts',
      'src/templates/catalog/schema.ts',
      'src/templates/catalog/CatalogTemplate.tsx',
      'src/templates/catalog/components/SafeLink.tsx',
      'src/templates/catalog/components/SafeImage.tsx',
      'src/templates/catalog/sections/Shop.tsx',
      'src/templates/catalog/sections/ProductDetailDialog.tsx',
      'src/templates/catalog/tokens.css',
    ]) {
      expect(files[expectedPath], `missing ${expectedPath}`).toBeDefined()
    }

    expect(files['src/templates/corporate/schema.ts']).toBeUndefined()
    expect(files['src/templates/restaurant/schema.ts']).toBeUndefined()
    expect(files['src/templates/real-estate/schema.ts']).toBeUndefined()
    expect(files['src/templates/portfolio/schema.ts']).toBeUndefined()
    expect(files['src/App.tsx']).toContain('CatalogTemplate')
    expect(files['src/App.tsx']).not.toContain('CorporateTemplate')
    expect(files['src/site-config.ts']).toContain('Marlow & Finch')
    expect(files['src/site-config.ts']).toContain('Hand-thrown bowl')
    expect(files['src/site-config.ts']).toContain('parseCatalogConfig')
    expect(files['README.md']).toContain('Catalog')
    expect(files['README.md']).toContain('src/templates/catalog/')
  })

  it('never includes the other families\' files in a catalog export either', () => {
    const { bytes } = buildExportZip({ project: project(), config: parseCatalogConfig({}), versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/templates/corporate/schema.ts']).toBeUndefined()
    expect(files['src/templates/restaurant/schema.ts']).toBeUndefined()
    expect(files['src/templates/real-estate/schema.ts']).toBeUndefined()
    expect(files['src/templates/portfolio/schema.ts']).toBeUndefined()
  })

  it('normalizes an unsafe URL scheme in a catalog product inquiry link instead of embedding it', () => {
    const config = parseCatalogConfig({
      shop: { products: [{ name: 'Sketchy product', inquiryHref: 'javascript:alert(1)' }] },
    })
    const { bytes } = buildExportZip({ project: project(), config, versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/site-config.ts']).not.toContain('javascript:alert')
  })

  it('exports an ecommerce-family project with that family\'s own files, not the other families\'', () => {
    const config = parseEcommerceConfig({
      store: { name: 'Northfield Supply Co.' },
      hero: { heading: 'New season, thoughtfully made' },
      shop: { products: [{ name: 'Trailhead Daypack', price: 128 }] },
    })
    const { bytes, filename } = buildExportZip({ project: project(), config, versionNumber: 2 })
    expect(filename).toBe('riverside-landscaping.zip')

    const files = unzipToStrings(bytes)
    for (const expectedPath of [
      'package.json',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      '.gitignore',
      'README.md',
      'src/main.tsx',
      'src/App.tsx',
      'src/styles.css',
      'src/site-config.ts',
      'src/templates/ecommerce/schema.ts',
      'src/templates/ecommerce/EcommerceTemplate.tsx',
      'src/templates/ecommerce/components/SafeLink.tsx',
      'src/templates/ecommerce/components/SafeImage.tsx',
      'src/templates/ecommerce/components/cart.ts',
      'src/templates/ecommerce/components/CartContext.tsx',
      'src/templates/ecommerce/components/useCart.ts',
      'src/templates/ecommerce/sections/Shop.tsx',
      'src/templates/ecommerce/sections/CartDrawer.tsx',
      'src/templates/ecommerce/checkout/CheckoutDialog.tsx',
      'src/templates/ecommerce/tokens.css',
    ]) {
      expect(files[expectedPath], `missing ${expectedPath}`).toBeDefined()
    }

    expect(files['src/templates/corporate/schema.ts']).toBeUndefined()
    expect(files['src/templates/catalog/schema.ts']).toBeUndefined()
    expect(files['src/App.tsx']).toContain('EcommerceTemplate')
    expect(files['src/App.tsx']).not.toContain('CorporateTemplate')
    expect(files['src/site-config.ts']).toContain('Northfield Supply Co.')
    expect(files['src/site-config.ts']).toContain('Trailhead Daypack')
    expect(files['src/site-config.ts']).toContain('parseEcommerceConfig')
    expect(files['README.md']).toContain('demo storefront')
    expect(files['README.md']).toContain('Paystack')
    expect(files['README.md']).toContain('Stripe')
    expect(files['README.md']).toContain('src/templates/ecommerce/')
  })

  it('never includes the other families\' files, or an actual payment SDK dependency/import, in an ecommerce export', () => {
    const { bytes } = buildExportZip({ project: project(), config: parseEcommerceConfig({}), versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/templates/corporate/schema.ts']).toBeUndefined()
    expect(files['src/templates/catalog/schema.ts']).toBeUndefined()

    // package.json must not depend on either provider's SDK.
    const pkg = JSON.parse(files['package.json'])
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(Object.keys(allDeps).some((name) => /stripe|paystack/i.test(name))).toBe(false)

    // Paystack/Stripe are allowed to be MENTIONED in prose (comments, README, the
    // disabled payment-method labels) — that's the whole point of representing them
    // as a reserved future option — but no source file may actually import an SDK
    // package or call out to either provider's API.
    for (const [path, content] of Object.entries(files)) {
      if (!path.endsWith('.ts') && !path.endsWith('.tsx')) continue
      expect(content, `${path} should not import a Stripe/Paystack SDK`).not.toMatch(/from ['"].*\b(stripe|paystack)\b/i)
      expect(content, `${path} should not call out to a Stripe/Paystack API`).not.toMatch(/https?:\/\/[^\s'"]*\b(stripe|paystack)\b/i)
    }
  })

  it('normalizes an unsafe URL scheme in an ecommerce product inquiry/CTA link instead of embedding it', () => {
    const config = parseEcommerceConfig({
      hero: { primaryCta: { label: 'Shop', href: 'javascript:alert(1)' } },
    })
    const { bytes } = buildExportZip({ project: project(), config, versionNumber: 1 })
    const files = unzipToStrings(bytes)
    expect(files['src/site-config.ts']).not.toContain('javascript:alert')
  })
})

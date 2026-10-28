import { z } from 'zod'

/**
 * The product-catalog template's configuration contract — a fifth family alongside
 * corporate, restaurant, real-estate, and portfolio (see src/templates/parseConfig.ts),
 * not a reuse of any of them: a retailer's content (products, categories, a featured
 * collection) doesn't map onto any other family's shape. This is a discovery/inquiry
 * catalog, not a storefront — there is no cart, checkout, payment, or live inventory
 * anywhere in this schema or its renderer, by design.
 *
 * Follows the same never-throws defaulting pattern as the other four families: every
 * field is optional or has a `.default(...)`, risky leaf values `.catch(...)` a safe
 * fallback instead of failing the whole parse, and `family` is a self-describing
 * literal tag so a stored config can be parsed correctly without separately tracking
 * which project it came from.
 */

const httpsUrl = z.string().url().refine((url) => url.startsWith('https://'), 'Must be an https:// URL')
const safeImageUrl = httpsUrl.catch('')
const email = z.string().email().catch('')

/** Digits, spaces, parentheses, +, - only — enough to build a `tel:` link safely, and
 * the basis for the WhatsApp number below. Accepted input format: a phone number in
 * any common human-written form (e.g. "+1 (503) 555-0148"); it is normalized for the
 * `wa.me` link by stripping everything except digits at render time (see
 * RealEstateHours.tsx/Nav.tsx pattern in the real-estate family for the `tel:` analog,
 * and components/links.ts in this family for the WhatsApp normalizer). */
const phone = z
  .string()
  .regex(/^[0-9+().\-\s]{5,24}$/, 'Must look like a phone number')
  .catch('')

/** Same allow-list as the other families' `isSafeHref` — internal anchors/paths,
 * mailto:/tel:, and https:// URLs only. Kept as a separate copy (not a shared import)
 * so this family never depends on another's module — see README.md's "Template
 * families" section for why each family duplicates this instead of sharing one copy. */
function isSafeHref(href: string): boolean {
  if (href === '#' || href.startsWith('#')) return true
  if (href.startsWith('/')) return true
  if (href.startsWith('mailto:')) return /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(href)
  if (href.startsWith('tel:')) return href.length > 4
  if (href.startsWith('https://')) return true
  return false
}

const href = z.string().refine(isSafeHref, 'Unsafe or invalid link').catch('#')

const ctaSchema = z
  .object({
    label: z.string().min(1).max(32),
    href,
  })
  .optional()
  .catch(undefined)

const navLinkSchema = z.object({
  label: z.string().min(1).max(32),
  href,
})

const socialLinkSchema = z.object({
  label: z.string().min(1).max(24),
  href,
})

/** A URL-safe id generated from the product name at parse time if one wasn't
 * supplied, then de-duplicated across the whole catalog — see `parseCatalogConfig`.
 * Used as the product's stable identity for the detail dialog and featured-collection
 * references, mirroring the real-estate family's listing slugs. */
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be lowercase letters, numbers, and single hyphens')
  .max(80)
  .optional()

/** Finite, non-negative — never a live/computed price, just whatever the business
 * configured. `.catch(undefined)` so a malformed price degrades to "no price" (which
 * the renderer shows as a configurable "Contact for price" message) rather than
 * failing the whole product. */
const price = z.coerce.number().finite().nonnegative().optional().catch(undefined)

const attributeSchema = z.object({
  label: z.string().min(1).max(40),
  value: z.string().min(1).max(120),
})

const productSchema = z.object({
  slug,
  name: z.string().min(1).max(100),
  shortDescription: z.string().max(160).optional(),
  description: z.string().max(800).optional(),
  category: z.string().max(60).optional(),
  price,
  salePrice: price,
  images: z.array(safeImageUrl).max(8).default([]).catch([]),
  /** Free-text, not an enum — "New"/"Featured"/"Limited" or whatever the business
   * wants to call out, since no fixed taxonomy fits every retailer. */
  badges: z.array(z.string().max(20)).max(3).default([]).catch([]),
  sku: z.string().max(40).optional(),
  /** Manually configured, never computed — e.g. "In stock", "Made to order",
   * "Only 2 left" — this is illustrative text the business controls, not live
   * inventory this app tracks or infers. */
  availability: z.string().max(60).optional(),
  /** Overrides the catalog's own contact channel for this one product, if set. */
  inquiryHref: href.optional(),
  attributes: z.array(attributeSchema).max(8).default([]).catch([]),
})

export const catalogConfigSchema = z.object({
  family: z.literal('catalog').default('catalog'),

  business: z
    .object({
      name: z.string().min(1).max(80).default('Your Shop'),
      tagline: z.string().max(140).optional(),
      description: z.string().max(400).optional(),
      location: z.string().max(120).optional(),
    })
    .default({ name: 'Your Shop' }),

  logo: z
    .object({
      text: z.string().max(40).optional(),
      imageUrl: safeImageUrl.optional(),
    })
    .default({}),

  nav: z.array(navLinkSchema).max(8).default([]).catch([]),

  hero: z
    .object({
      heading: z.string().min(1).max(140).default('Thoughtfully made, carefully chosen'),
      subheading: z.string().max(320).optional(),
      imageUrl: safeImageUrl.optional(),
      primaryCta: ctaSchema,
      secondaryCta: ctaSchema,
      /** Configurable, e.g. "Free local pickup this week" — never hardcoded, and
       * never a claim this app verifies. */
      promoMessage: z.string().max(140).optional(),
    })
    .default({ heading: 'Thoughtfully made, carefully chosen' }),

  shop: z
    .object({
      heading: z.string().max(100).optional(),
      intro: z.string().max(320).optional(),
      /** ISO 4217-ish code used to look up a display symbol (see getCurrencySymbol in
       * the renderer); unrecognized codes just display as-is followed by the amount. */
      currency: z.string().max(8).default('USD').catch('USD'),
      products: z.array(productSchema).max(60).default([]).catch([]),
      /** Shown when a product has neither `price` nor `salePrice` — configurable so a
       * business can say "Contact for price", "Price on request", etc. */
      noPriceLabel: z.string().max(40).default('Contact for price'),
    })
    .default({ products: [], currency: 'USD', noPriceLabel: 'Contact for price' }),

  featured: z
    .object({
      heading: z.string().max(100).optional(),
      intro: z.string().max(320).optional(),
      /** Slugs referencing `shop.products` — any slug that doesn't match an actual
       * product is dropped at parse time (see `parseCatalogConfig`), so this section
       * can never show a phantom "featured" item. */
      productSlugs: z.array(z.string().max(80)).max(12).default([]).catch([]),
    })
    .default({ productSlugs: [] }),

  about: z
    .object({
      heading: z.string().max(100).optional(),
      body: z.string().max(1200).optional(),
      imageUrl: safeImageUrl.optional(),
      location: z.string().max(120).optional(),
      hours: z.string().max(200).optional(),
    })
    .default({}),

  contact: z
    .object({
      email: email.optional(),
      phone: phone.optional(),
      /** Validated the same as `phone` above; normalized into a `wa.me` link by the
       * renderer (components/links.ts#buildWhatsAppHref), which strips everything but
       * digits. Accepted input: any common human-written phone format, ideally
       * including the country code (e.g. "+1 503 555 0148"). */
      whatsapp: phone.optional(),
      website: href.optional(),
      ctaText: z.string().max(240).optional(),
      social: z.array(socialLinkSchema).max(6).default([]).catch([]),
    })
    .default({ social: [] }),

  sections: z
    .object({
      shop: z.boolean().default(true),
      featured: z.boolean().default(true),
      about: z.boolean().default(true),
      contactCta: z.boolean().default(true),
    })
    .default({ shop: true, featured: true, about: true, contactCta: true }),

  footer: z
    .object({
      text: z.string().max(200).optional(),
      links: z.array(navLinkSchema).max(6).default([]).catch([]),
    })
    .default({ links: [] }),

  seo: z
    .object({
      title: z.string().max(70).optional(),
      description: z.string().max(200).optional(),
      socialImageUrl: safeImageUrl.optional(),
    })
    .default({}),
})

export type CatalogConfig = z.infer<typeof catalogConfigSchema>
export type CatalogProduct = CatalogConfig['shop']['products'][number]

/** A fully-defaulted config, used as the safe fallback when input can't be parsed at all. */
export const DEFAULT_CATALOG_CONFIG: CatalogConfig = catalogConfigSchema.parse({})

function suggestSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}

/**
 * Never throws — mirrors the other four families' parsers. Also applies two
 * cross-field normalizations the schema itself can't express with a single field's
 * `.catch(...)`:
 *   1. Fills in a stable, de-duplicated `slug` for every product (derived from its
 *      name when one isn't supplied), exactly like the real-estate family's listing
 *      slugs — this is what lets the product-detail dialog and inquiry links address
 *      a product reliably.
 *   2. Drops a `salePrice` that isn't strictly lower than `price`, and drops any
 *      `featured.productSlugs` entry that doesn't match an actual product — both
 *      silently normalized to the safe/absent state rather than rejecting the whole
 *      config over one bad cross-field combination.
 */
export function parseCatalogConfig(input: unknown): CatalogConfig {
  const result = catalogConfigSchema.safeParse(input)
  if (!result.success) return DEFAULT_CATALOG_CONFIG

  const seenSlugs = new Set<string>()
  const products = result.data.shop.products.map((product, index) => {
    let candidate = product.slug || suggestSlug(product.name) || `product-${index + 1}`
    while (seenSlugs.has(candidate)) candidate = `${candidate}-${index + 1}`
    seenSlugs.add(candidate)

    const salePrice =
      product.salePrice !== undefined && product.price !== undefined && product.salePrice >= product.price
        ? undefined
        : product.salePrice

    return { ...product, slug: candidate, salePrice }
  })

  const validSlugs = new Set(products.map((p) => p.slug))
  const featuredSlugs = result.data.featured.productSlugs.filter((s) => validSlugs.has(s))

  return {
    ...result.data,
    shop: { ...result.data.shop, products },
    featured: { ...result.data.featured, productSlugs: featuredSlugs },
  }
}
